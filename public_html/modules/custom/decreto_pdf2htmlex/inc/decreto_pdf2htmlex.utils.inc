<?php

use Drupal\node\Entity\Node;
use Drupal\node\NodeInterface;
use Drupal\file\Entity\File;

/**
 * Returns the html code.
 *
 * Is used in the places where only preview of the document is shown.
 *
 * @param object $file file object
 *
 * @return html with all pages
 */
function decreto_pdf2htmlex_get_all_pages($file) {
  $doc = new DOMDocument();
  libxml_use_internal_errors(TRUE);
  $doc->loadHTML('<?xml encoding="UTF-8">' . file_get_contents($file->getFileUri()));
  libxml_clear_errors();

  $html = $doc->saveHTML();
  return $html;
}

/**
 * Returns the html code with only first page remaining.
 *
 * Is used in the places where only preview of the document is shown.
 *
 * @param object $file file object
 *
 * @return html with selected pages left
 */
function decreto_pdf2htmlex_get_first_page($file) {
  $doc = new DOMDocument();
  libxml_use_internal_errors(TRUE);
  $doc->loadHTML('<?xml encoding="UTF-8">' . file_get_contents($file->getFileUri()));
  libxml_clear_errors();

  $finder = new DomXPath($doc);

  //TODO: add pdf2html version as a meta data into html file
  //pdf2html older version (~ v0.6)
  $nodes = $finder->query('//div[@id="pdf-main"]/div');
  //pdf2html newer version (~ v0.10)
  if ($nodes->length == 0) {
    $nodes = $finder->query('//div[@id="page-container"]/div');
  }

  $i = 1;
  foreach ($nodes as $node) {
    if ($i > 1) //keeping the first page
      $node->parentNode->removeChild($node);
    $i++;
  }
  $html = $doc->saveHTML();

//  $start = strrpos($html, '<style type="text/css">'); //last style - document specific
//  $end = strrpos($html, '</style>'); //last style - document specific
//  $style_cut = substr($html, $start, $end + count('<style>') - $start);
//
//  $styles_specific = explode(PHP_EOL, $style_cut);
//  for ($i = 0; $i < count($styles_specific); $i++) {
//    if (substr($styles_specific[$i], 0, 1) === '.' || substr($styles_specific[$i], 0, 1) === '#') //id or class
//      $styles_specific[$i] = '.bpa-' . $meeting_id . '-' . $bullet_point_id . '-' . $bilag_id . ' ' . $styles_specific[$i];
//  }
//  $style_specific = implode(PHP_EOL, $styles_specific);
//  $html = substr_replace($html, $style_specific, $start, $end + count('<style>') - $start); //replacing the last style with updated

  return $html;
}

function decreto_pdf2htmlex_schedule_if_bpa($fid) {
  $query = \Drupal::entityQuery('node');
  $query->condition('type', 'decreto_bullet_point_attachment');
  $query->condition('field_decreto_bpa_file', $fid, '=');
  $entity_ids = $query->execute();
  if (!empty($entity_ids)) {
    foreach (array_keys($entity_ids) as $nid)
      $query = \Drupal::database()->insert('decreto_pdf2htmlex_files')
        ->fields(array(
          'fid' => (int) $fid,
          'did' => $nid,
        ))
        ->execute();
  }
}

function decreto_pdf2htmlex_convert($fid, $nid) {
  $config = \Drupal::service('config.factory')->getEditable('decreto_pdf2htmlex.settings');
  $pdf_html_zoom = $config->get('decreto_pdf2htmlex_zoom');
  $pdf_html_path = $config->get('decreto_pdf2htmlex_path');

  $node = Node::Load($nid);
  if (!isset($node)) {
    $query = \Drupal::database()->delete('decreto_pdf2htmlex_files')
      ->condition('fid', fid, '=')
      ->condition('did', $nid, '=')
      ->execute();
    return;
  }
  $file = File::load($fid);
  if (isset($file)) {
    $file_path_real = \Drupal::service('file_system')->realpath($file->getFileUri());
    $file_pathinfo = pathinfo($file_path_real);
    $dest_dir_real = $file_pathinfo['dirname'];
    $path = $dest_dir_real . '/' . $file_pathinfo['filename'] . '.html'; //filename.html

    $success = FALSE;

    //check if already convered
    if (!file_exists($path)) {
      setlocale(LC_CTYPE, "en_DK.UTF-8"); //TODO: one has to know the exact locale of the system, otherwise uncomment the lines
      $shell_file_path_real = escapeshellarg($file_path_real);
      $shell_dest_dir_real = escapeshellarg($dest_dir_real);

      shell_exec($pdf_html_path . ' ' . $shell_file_path_real . '  --dest-dir ' . $shell_dest_dir_real . ' --zoom ' . $pdf_html_zoom . ' 2>&1');
      //drupal_set_message(variable_get('os2dagsorden_pdf2htmlex_path') . ' ' . $shell_file_path_real . '  --dest-dir ' . $shell_dest_dir_real . ' --zoom ' . DEFAULT_PDF_HTML_ZOOM . ' 2>&1');
      //successful conversion?
      if (file_exists($path)) {
        $data = file_get_contents($path);
        fwrite($fh, _os2dagsorden_pdf2htmlex_improve_html($data));
        fclose($fh);

        $success = TRUE;
      } else {
        \Drupal::database()->update('decreto_pdf2htmlex_files')
          ->fields(array(
            'progress' => 'Not converted',
          ))
          ->condition('fid', $fid, '=')
          ->condition('did', $nid, '=')
          ->execute();
      }
    } else
      $success = TRUE;
    var_dump($success);
    if ($success) {
      //updating database entry
      \Drupal::database()->update('decreto_pdf2htmlex_files')
        ->fields(array(
          'filename' => $file->getFilename(),
          'created_filepath' => $path,
          'progress' => 'Converted',
        ))
        ->condition('fid', $fid, '=')
        ->condition('did', $nid, '=')
        ->execute();
    }
  } else {
    \Drupal::database()->update('decreto_pdf2htmlex_files')
      ->fields(array(
        'progress' => 'Not found',
      ))
      ->condition('fid', $fid, '=')
      ->condition('did', $nid, '=')
      ->execute();
  }
}

function _decreto_pdf2htmlex_improve_html($data) {
  $data = str_replace("<p>&nbsp;</p>", "", $data); //removing unneeded paragraphs
  $data = preg_replace('#<script(.*?)>(.*?)</script>#is', '', $data); //removing scripts tags
  $data = preg_replace('#::selection{(.*?)}#is', '', $data); //removing ::selection css specification
  $data = preg_replace('#::-moz-selection{(.*?)}#is', '', $data); //removing ::-moz-selection css specification

  return $data;
}
