<?php

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