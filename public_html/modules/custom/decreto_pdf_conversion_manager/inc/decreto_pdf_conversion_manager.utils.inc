<?php

/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
define('$pdf_conversion_dir', 'public://pdf2convert');
module_load_include('inc', 'decreto_pdf2htmlex', '/inc/decreto_pdf2htmlex.utils');

function decreto_pdf_conversion_manager_schedulePdfConversion($file, $sheduleToHTMLConversion = 0) {
  $config = \Drupal::service('config.factory')->getEditable('decreto_pdf_conversion_manager.settings');
  $pdf_conversion_dir = $config->get('decreto_pdf_conversion_dir');
  $convertion_dir_path = \Drupal::service('file_system')->realpath($pdf_conversion_dir);
  $filename = $file->getFileUri();
  $filename_parts = pathinfo($filename);
  // Tmp_file name is needed to avoid rewriting the files from different meetings, which might have the same name.
  $tmp_filename = md5(md5_file(\Drupal::service('file_system')->realpath($filename))) . '.' . $filename_parts['extension'];
  //$type_arr = explode(',', variable_get('os2web_copied_filetype',OS2WEB_COPIED_FILETYPE));
  $pdf_path = $filename_parts['dirname'] . '/' . $filename_parts['filename'] . '.PDF';

  file_unmanaged_copy(\Drupal::service('file_system')->realpath($filename), $convertion_dir_path . '/' . $tmp_filename, FILE_EXISTS_REPLACE);

  $query = \Drupal::database()->select('decreto_pdf_conversion_manager_pdf_files', 'files');
  $query->fields('files', ['fid']);
  $query->condition('fid', (int) $file->id(), '=');
  $file_exists = $query->execute()->fetchField();

  if ($file_exists) {
    $query = \Drupal::database()->update('decreto_pdf_conversion_manager_pdf_files')
      ->fields(array(
        'filename' => $filename_parts['basename'],
        'tmp_fileaname' => $tmp_filename,
        'html_convert' => $sheduleToHTMLConversion
      ))
      ->condition('fid', (int) $file->id(), '=')
      ->execute();
  } else {
    $query = \Drupal::database()->insert('decreto_pdf_conversion_manager_pdf_files')
      ->fields(array(
        'fid' => (int) $file->id(),
        'filename' => $filename_parts['basename'],
        'tmp_filename' => $tmp_filename,
        'status' => 'Scheduled',
        'attempt' => 0,
        'html_convert' => $sheduleToHTMLConversion))
      ->execute();
  }
  return TRUE;
}

function decreto_pdf_conversion_manager_manage_pdf() {
  $config = \Drupal::service('config.factory')->getEditable('decreto_pdf_conversion_manager.settings');
  $pdf_conversion_dir = $config->get('decreto_pdf_conversion_dir');
  $converted_files = Array();
  $convertion_dir_path = \Drupal::service('file_system')->realpath($pdf_conversion_dir);
  if ($pdf_files = glob($convertion_dir_path . '/*.{pdf, PDF}', GLOB_BRACE)) {
    foreach ($pdf_files as $file) {
      $pdf_path_parts = pathinfo($file);
      foreach (glob($convertion_dir_path . '/' . $pdf_path_parts['filename'] . '.*') as $original_file) {
        if ($original_file == $file)
          continue;
        $original_file_parts = pathinfo($original_file);
        $converted_files[] = array('pdf' => $pdf_path_parts['basename'], 'original' => $original_file_parts['basename']);
      }
    }
  }

  foreach ($converted_files as $file_arr) {
    $original_filename = $file_arr['original'];
    $pdf_filename = $file_arr['pdf'];
    $query = \Drupal::database()->select('decreto_pdf_conversion_manager_pdf_files', 'files');
    $query->join('file_managed', 'fm', 'fm.fid=files.fid');
    $query->fields('fm', ['fid', 'uri']);
    $query->fields('files', ['html_convert']);
    $query->condition('tmp_filename', $original_filename, '=');
    $result = $query->execute();

    while ($d_file = $result->fetchAssoc()) {
      $original_path_parts = pathinfo($d_file['uri']);
      $dest = drupal_realpath($original_path_parts['dirname']) . '/' . $original_path_parts['filename'] . '.pdf';
      $uri = $original_path_parts['dirname'] . '/' . $original_path_parts['filename'] . '.pdf';

      if (decreto_pdf_conversion_update_managed_file($d_file['fid'], $d_file['uri'], $convertion_dir_path . "/" . $file_arr['pdf'])) {
        if (\Drupal::moduleHandler()->moduleExists('decreto_pdf2htmlex') && $d_file['html_convert'] == 1) {
          decreto_pdf2htmlex_schedule_if_bpa($d_file['fid']);
        }
        $query = \Drupal::database()->delete('decreto_pdf_conversion_manager_pdf_files')
          ->condition('fid', $d_file['fid'], '=')
          ->execute();

        $file_usage = \Drupal::database()->select('decreto_pdf_conversion_manager_pdf_files', 'files')
          ->fields('files', ['fid'])
          ->condition('tmp_filename', $original_filename, '=')
          ->execute()
          ->fetchField();

        if (!$file_usage) {
          unlink($convertion_dir_path . "/" . $file_arr['pdf']);
          unlink($convertion_dir_path . "/" . $file_arr['original']);
        }
      } else {

        $query = \Drupal::database()->update('decreto_pdf_conversion_manager_pdf_files')
          ->fields(array(
            'status' => 'Outdated',
            'message' => 'Could not copy file to destination directory'))
          ->condition('fid', $d_file['fid'])
          ->execute();
      }
    }
  }
}

function decreto_pdf_conversion_update_managed_file($fid, $original_file, $pdf_file) {
  $original_path_parts = pathinfo($original_file);
  $dest = \Drupal::service('file_system')->realpath($original_path_parts['dirname']) . '/' . $original_path_parts['filename'] . '.pdf';
  $uri = $original_path_parts['dirname'] . '/' . $original_path_parts['filename'] . '.pdf';

  if ($file_path = file_unmanaged_copy($pdf_file, $dest, FILE_EXISTS_RENAME)) { //copy PDF file
    if ($file_path != $dest)
      $uri = $original_path_parts['dirname'] . '/' . basename($file_path);

    $file_storage = \Drupal::entityManager()->getStorage('file');

// Load file
    $file = $file_storage->load($fid);

    $file->setFilename(basename($uri));
    $file->setFileuri($uri);
    $file->setFilemome = mime_content_type($dest);
    $file->save();

    return TRUE;
  }
  // watchdog('os2web pdf conversion_manager:', 'Can\'t copy  to %uri.', array('%uri' => $dest), WATCHDOG_WARNING);
  return FALSE;
}

/*
 * Delete all the .lock files what are older than 1 hour
 */

function decreto_pdf_conversion_delete_lock_files() {
  $config = \Drupal::service('config.factory')->getEditable('decreto_pdf_conversion_manager.settings');
  $pdf_conversion_dir = $config->get('decreto_pdf_conversion_dir');
  $convertion_dir_path = \Drupal::service('file_system')->realpath($pdf_conversion_dir);
  foreach (glob($convertion_dir_path . '/.~lock*.{pdf#, PDF#}', GLOB_BRACE) as $lock_file) {
    if (filemtime($lock_file) <= time() - 3600) {
      unlink($lock_file);
    }
  }
}
