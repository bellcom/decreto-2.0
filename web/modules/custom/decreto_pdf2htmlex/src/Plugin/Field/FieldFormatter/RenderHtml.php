<?php

/**
 * @file
 * Contains \Drupal\decreto_pdf2htmlex\Plugin\Field\FieldFormatter\RenderHtml
 */

namespace Drupal\decreto_pdf2htmlex\Plugin\Field\FieldFormatter;

use Drupal\Core\Field\FieldItemListInterface;
use Drupal\file\Plugin\Field\FieldFormatter\GenericFileFormatter;

/**
 * Plugin implementation of the 'decreto_pdf2htmlex_rendered_html' formatter.
 *
 * @FieldFormatter(
 *   id = "decreto_pdf2htmlex_rendered_html",
 *   label = @Translation("Rendered HTML"),
 *   field_types = {
 *     "file"
 *   }
 * )
 */
class RenderHtml extends GenericFileFormatter {

  /**
   * {@inheritdoc}
   */
  public function viewElements(FieldItemListInterface $items, $langcode) {
    $elements = parent::viewElements($items, $langcode);
    foreach ($elements as &$element) {
      $element['#theme'] = 'decreto_pdf2htmlex_rendered_html_formatter';
    }

    return $elements;
  }
}
