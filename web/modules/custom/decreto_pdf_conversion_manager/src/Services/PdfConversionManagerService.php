<?php

namespace Drupal\decreto_pdf_conversion_manager\Services;

/**
 * Decreto PDF conversion manager service.
 */
class PdfConversionManagerService {

  const STATUS_FILE_NOT_FOUND = 'File not found';
  const STATUS_FAILED_CONVERSION = 'Conversion failed';
  const STATUS_CONVERTED = 'Converted';
  const STATUS_COMPLETED = 'Completed';

  /**
   * Gets the version of the requested utility.
   *
   * @param string $utility
   *   Available options are:
   *    unoconv
   *    imagemagick
   *    iconv.
   *
   * @return string|null
   *   Version number as string or NULL if not found.
   */
  public function getVersion($utility) {
    $version = NULL;
    $path = $this->getPath($utility);

    if ($path) {
      switch ($utility) {
        case 'unoconv':
          exec($path . ' --version 2>&1', $output);
          if (!empty($output)) {
            preg_match('/^unoconv ([\d.]*.\d*)$/i', $output[0], $matches);
          }
          break;

        case 'imagemagick':
          exec($path . ' --version 2>&1', $output);
          if (!empty($output)) {
            preg_match('/^Version: ImageMagick ([\d.]*.\d*-\d*)/i', $output[0], $matches);
          }
          break;

        case 'iconv':
          exec($path . ' --version 2>&1', $output);
          if (!empty($output)) {
            preg_match('/^iconv \(.*\) ([\d.]*.\d*)$/i', $output[0], $matches);
          }
          break;
      }
      if (isset($matches[1])) {
        $version = $matches[1];
      }
    }

    return $version;
  }

  /**
   * Gets the executable path of the requested utility.
   *
   * @param string $utility
   *   Available options are:
   *    unoconv
   *    imagemagick
   *    iconv.
   *
   * @return string|null
   *   Executable path of the utility. NULL if the provided utility is not from
   *   a list of available options.
   */
  public function getPath($utility) {
    $config = \Drupal::service('config.factory')->getEditable('decreto_pdf_conversion_manager.settings');
    $path = NULL;

    switch ($utility) {
      case 'unoconv':
        $path = $config->get('decreto_pdf_conversion_manager_unoconv');
        if (empty($path)) {
          $path = 'unoconv';
        }
        break;

      case 'imagemagick':
        $path = $config->get('decreto_pdf_conversion_manager_imagemagick');
        if (empty($path)) {
          $path = 'convert';
        }
        break;

      case 'iconv':
        $path = $config->get('decreto_pdf_conversion_manager_iconv');
        if (empty($path)) {
          $path = 'iconv';
        }
        break;
    }

    return $path;
  }

  /**
   * Schedules a file for conversion, if the file was not scheduled already.
   *
   * @param int $fid
   *   Fid of the file.
   * @param int $did
   *   Nid of the destination node.
   * @param bool $convertToHtml
   *   If the file needs to be scheduled for HTML conversion.
   *
   * @throws \Exception
   */
  public function scheduleFile($fid, $did, $convertToHtml = FALSE) {
    try {
      if (!$this->isFileScheduled($fid, $did)) {
        \Drupal::database()->insert('decreto_pdf_conversion_manager_files')
          ->fields(array(
            'fid' => $fid,
            'did' => $did,
            'convert_to_html' => $convertToHtml,
          ))
          ->execute();
      }
    }
    catch (Exception $e) {
      watchdog('PDF conversion manager', 'Cannot schedule a file: fid: %fid, did: %did, e: %e', array(
        '%fid' => fid,
        '%did' => $did,
        '%e' => $e->getMessage()
      ), WATCHDOG_ERROR);

    }
  }

  /**
   * Checks if this file is already scheduled for conversion.
   *
   * @param int $fid
   *   Fid of the file.
   * @param int $did
   *   Nid of the destination node. Can be NULL.
   *
   * @return bool
   *   True or false.
   */
  public function isFileScheduled($fid, $did = NULL) {
    $query = \Drupal::database()->select('decreto_pdf_conversion_manager_files', 'd')
      ->fields('d')
      ->condition('fid', $fid);

    if ($did) {
      $query->condition('did', $did);
    }

    $count = $query->countQuery()->execute()->fetchField();
    return $count > 1;
  }

  /**
   * Update a status of a single conversion job.
   *
   * @param int $fid
   *   Fid of the file.
   * @param string $status
   *   New conversion status.
   */
  public function updateFileStatus($fid, $status) {
    \Drupal::database()->update('decreto_pdf_conversion_manager_files')
      ->fields(array(
        'status' => $status,
      ))
      ->condition('fid', $fid, '=')
      ->execute();
  }

  /**
   * Update a message of a single conversion job.
   *
   * @param int $fid
   *   Fid of the file.
   * @param string $message
   *   New conversion message.
   */
  public static function updateFileMessage($fid, $message) {
    \Drupal::database()->update('decreto_pdf_conversion_manager_files')
      ->fields(array(
        'message' => $message,
      ))
      ->condition('fid', $fid, '=')
      ->execute();
  }

  /**
   * Deletes scheduled file from the queue list.
   *
   * @param int $fid
   *   Fid of the file.
   * @param int $did
   *   Nid of the destination node.
   */
  public static function deleteScheduledFile($fid = NULL, $did = NULL) {
    $query = \Drupal::database()->delete('decreto_pdf_conversion_manager_files');

    if ($fid) {
      $query->condition('fid', $fid);
    }
    if ($did) {
      $query->condition('did', $did);
    }

    if ($fid || $did) {
      $query->execute();
    }
  }

  /**
   * Returns a list of files that are scheduled for conversion.
   *
   * @return array
   *   Array of entries as stdClass from decreto_pdf_conversion_manager.
   */
  public static function getScheduledFiles() {
    $config = \Drupal::service('config.factory')->getEditable('decreto_pdf_conversion_manager.settings');
    $max_attempts = $config->get('decreto_pdf_conversion_manager_max_attempts');

    $query = \Drupal::database()->select('decreto_pdf_conversion_manager_files', 'f')
      ->fields('f')
      ->condition('f.attempt', $max_attempts, '<')
      ->isNull('f.status');
    $result = $query->execute();

    return $result->fetchAll();
  }

}
