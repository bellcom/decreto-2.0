<?php

/**
 * @file
 * Contains \Drupal\decreto_pdf2htmlex\Plugin\Field\FieldFormatter\RenderFirstHtmlPage
 */

namespace Drupal\decreto_pdf2htmlex\Plugin\Field\FieldFormatter;

use Drupal\Core\Field\FieldItemListInterface;
use Drupal\file\Plugin\Field\FieldFormatter\GenericFileFormatter;

/**
 * Plugin implementation of the 'decreto_pdf2htmlex_rendered_html_first_page' formatter.
 *
 * @FieldFormatter(
 *   id = "decreto_pdf2htmlex_rendered_html_first_page",
 *   label = @Translation("Rendered HTML (first page)"),
 *   field_types = {
 *     "file"
 *   }
 * )
 */
class RenderFirstHtmlPage extends GenericFileFormatter {

  /**
   * {@inheritdoc}
   */
  public function viewElements(FieldItemListInterface $items, $langcode) {
    $elements = parent::viewElements($items, $langcode);
    foreach ($elements as &$element) {
      $element['#theme'] = 'decreto_pdf2htmlex_rendered_html_first_page_formatter';
    }

    return $elements;
  }

}
