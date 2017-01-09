<?php

namespace Drupal\decreto_pdf2htmlex\Utils;

use Drupal\file\Entity\File;
use Drupal\node\Entity\Node;

class DecretoPdf2htmlexUtils {

  /**
   * Returns the html code.
   *
   * Is used in the places where only preview of the document is shown.
   *
   * @param object $file file object
   *
   * @return html with all pages
   */
  public static function getAllPages(File $file) {
    $doc = new \DOMDocument();
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
  public static function getFirstPage(File $file) {
    $doc = new \DOMDocument();
    libxml_use_internal_errors(TRUE);
    $doc->loadHTML('<?xml encoding="UTF-8">' . file_get_contents($file->getFileUri()));
    libxml_clear_errors();

    $finder = new \DomXPath($doc);

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
      {
        $node->parentNode->removeChild($node);
      }
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

  /**
   * Schedules a file for conversion, if the file was not scheduled already.
   *
   * @param File $file
   * @param Node $destination
   */
  public static function scheduleConversion(File $file, Node $destination) {
    try {
      if (!self::isScheduled($file, $destination)) {
        $query = \Drupal::database()->insert('decreto_pdf2htmlex_files')
          ->fields(array(
            'fid' => (int) $file->id(),
            'did' => $destination->id(),
          ))
          ->execute();
      }
    } catch (Exception $e) {
      watchdog('pdf2htmlEX', 'Cannot schedule a file: fid: %fid, did: %did, e: %e', array(
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
  public static function isScheduled(File $file, Node $destination) {
    $result = \Drupal::database()->select('decreto_pdf2htmlex_files', 'd')
      ->fields('d')
      ->condition('fid', $file->id())
      ->condition('did', $destination->id())
      ->countQuery()
      ->execute();
    return $result->fetchField();
  }

  /**
   * Shortcut function to update a status on a single conversion job.
   *
   * @param $fid
   * @param $status
   */
  public static function updateStatus($fid, $status) {
    \Drupal::database()->update('decreto_pdf2htmlex_files')
      ->fields(array(
        'status' => $status,
      ))
      ->condition('fid', $fid, '=')
      ->execute();
  }
}