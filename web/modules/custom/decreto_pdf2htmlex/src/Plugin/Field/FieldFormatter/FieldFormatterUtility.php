<?php

namespace Drupal\decreto_pdf2htmlex\Plugin\Field\FieldFormatter;

use Drupal\file\Entity\File;

/**
 * Class FieldFormatterUtility contains functions useful for fields rendering.
 */
class FieldFormatterUtility {

  /**
   * Returns the html code of the file.
   *
   * Is used in the places where only preview of the document is shown.
   *
   * @param \Drupal\file\Entity\File $file
   *   Source file.
   *
   * @return string
   *   HTML code.
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
   * @param \Drupal\file\Entity\File $file
   *   Source file.
   *
   * @return string
   *   HTML code.
   */
  public static function getFirstPage(File $file) {
    $doc = new \DOMDocument();
    libxml_use_internal_errors(TRUE);
    $doc->loadHTML('<?xml encoding="UTF-8">' . file_get_contents($file->getFileUri()));
    libxml_clear_errors();

    $finder = new \DomXPath($doc);

    $nodes = $finder->query('//div[@id="page-container"]/div');

    $i = 1;
    foreach ($nodes as $node) {
      // Keeping the first page only.
      if ($i > 1) {
        $node->parentNode->removeChild($node);
      }
      $i++;
    }
    $html = $doc->saveHTML();

    return $html;
  }

}
