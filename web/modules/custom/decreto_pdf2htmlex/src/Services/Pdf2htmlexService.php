<?php

namespace Drupal\decreto_pdf2htmlex\Services;

/**
 * Decreto pdf2htmlEX service.
 */
class Pdf2htmlexService {

  const STATUS_FILE_NOT_FOUND = 'File not found';
  const STATUS_FAILED_CONVERSION = 'Conversion failed';
  const STATUS_CONVERTED = 'Converted';
  const STATUS_COMPLETED = 'Completed';

  /**
   * Gets the version of pdf2htmlEX utility.
   *
   * @return string|null
   *   Version number as string or NULL is not found.
   */
  public function getVersion() {
    $version = NULL;
    $pdf_html_path = $this->getPath();

    exec($pdf_html_path . ' -v 2>&1', $output);
    if (!empty($output)) {
      preg_match('/^pdf2htmlEX version ([\d.]*.\d*)$/i', $output[0], $matches);

      if (isset($matches[1])) {
        $version = $matches[1];
      }
    }

    return $version;
  }

  /**
   * Gets the executable path of pdf2htmlEX utility.
   *
   * @return string
   *   Executable path of the utility.
   */
  public function getPath() {
    $config = \Drupal::service('config.factory')->getEditable('decreto_pdf2htmlex.settings');
    $pdf_html_path = $config->get('decreto_pdf2htmlex_path');

    if (empty($pdf_html_path)) {
      $pdf_html_path = 'pdf2htmlEX';
    }

    return $pdf_html_path;
  }

  /**
   * Schedules a file for conversion, if the file was not scheduled already.
   *
   * @param int $fid
   *   Fid of the file.
   * @param int $did
   *   Nid of the destination node.
   *
   * @throws \Exception
   */
  public function scheduleFile($fid, $did) {
    try {
      if (!$this->isFileScheduled($fid, $did)) {
        \Drupal::database()->insert('decreto_pdf2htmlex_files')
          ->fields([
            'fid' => $fid,
            'did' => $did,
          ])
          ->execute();
      }
    }
    catch (Exception $e) {
      watchdog('pdf2htmlEX', 'Cannot schedule a file: fid: %fid, did: %did, e: %e', array(
        '%fid' => $fid,
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
    $query = \Drupal::database()->select('decreto_pdf2htmlex_files', 'd')
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
    \Drupal::database()->update('decreto_pdf2htmlex_files')
      ->fields(array(
        'status' => $status,
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
    $query = \Drupal::database()->delete('decreto_pdf2htmlex_files');

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
   *   Array of entries as stdClass from decreto_pdf2htmlex_files.
   */
  public static function getScheduledFiles() {
    $query = \Drupal::database()->select('decreto_pdf2htmlex_files', 'f')
      ->fields('f')
      ->isNull('f.status');
    $result = $query->execute();

    return $result->fetchAll();
  }

}
