<?php

namespace Drupal\decreto_pdf_conversion_manager\Utils;

use Drupal\file\Entity\File;
use Drupal\node\Entity\Node;

class DecretoPdfConversionManagerUtils {

  /**
   * Schedules a file for conversion, if the file was not scheduled already.
   *
   * @param File $file
   * @param Node $destination
   * @param boolean $convertToHtml
   */
  public static function scheduleConversion(File $file, Node $destination, $convertToHtml = FALSE) {
    try {
      if (!self::isScheduled($file, $destination)) {
        $query = \Drupal::database()->insert('decreto_pdf_conversion_manager_files')
          ->fields(array(
            'fid' => (int) $file->id(),
            'did' => $destination->id(),
            'convert_to_html' => $convertToHtml,
          ))
          ->execute();
      }
    } catch (Exception $e) {
      watchdog('PDF conversion manager', 'Cannot schedule a file: fid: %fid, did: %did, e: %e', array(
        '%fid' => (int) $file->id(),
        '%did' => $destination->id(),
        '%e' => $e->getMessage()
      ), WATCHDOG_ERROR);

    }
  }

  /**
   * Checks if this file is already scheduled for conversion.
   *
   * @param File $file
   * @param Node $destination
   * @return mixed
   */
  public static function isScheduled(File $file, Node $destination = NULL) {
    $query = \Drupal::database()->select('decreto_pdf_conversion_manager_files', 'd')
      ->fields('d')
      ->condition('fid', $file->id());

    if ($destination) {
      $query->condition('did', $destination->id());
    }

    $result = $query->countQuery()->execute();
    return $result->fetchField();
  }

  /**
   * Shortcut function to update a status on a single conversion job.
   *
   * @param $fid
   * @param $status
   */
  public static function updateStatus($fid, $status) {
    \Drupal::database()->update('decreto_pdf_conversion_manager_files')
      ->fields(array(
        'status' => $status,
      ))
      ->condition('fid', $fid, '=')
      ->execute();
  }

  /**
   * Shortcut function to update an error message on a single conversion job.
   *
   * @param $fid
   * @param $status
   */
  public static function updateMessage($fid, $status) {
    \Drupal::database()->update('decreto_pdf_conversion_manager_files')
      ->fields(array(
        'message' => $status,
      ))
      ->condition('fid', $fid, '=')
      ->execute();
  }

  /**
   * Deletes a scheduled job from a list
   *
   * @param null $fid
   * @param null $did
   */
  public static function deleteScheduledJob($fid = NULL, $did = NULL) {
    $query = \Drupal::database()->delete('decreto_pdf_conversion_manager_files');

    if ($fid) {
      $query->condition('fid', $fid, '=');
    }
    if ($did) {
      $query->condition('did', $did, '=');
    }

    if ($fid || $did) {
      $query->execute();
    }
  }

  /**
   * Returns the list of files that must are scheduled for conversion
   *
   * @return mixed
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