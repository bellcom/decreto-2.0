<?php

namespace Drupal\decreto_pdf_conversion_manager\lib;

/**
 * Class PDFConverter.
 *
 * Converts a file to PDF using the various libs via shell command.
 */
class PDFConverter {

  const FAMILY_TEXT = "Text";
  const FAMILY_SPREADSHEET = "Spreadsheet";
  const FAMILY_PRESENTATION = "Presentation";
  const FAMILY_DRAWING = "Drawing";
  const FAMILY_MULTIPAGETIFF = "Multipage";

  /**
   * Array of families' extensions.
   *
   * @var array
   */
  public static $familyExtensions = array(
    self::FAMILY_TEXT => array('txt', 'doc', 'docx', 'odt', 'html'),
    self::FAMILY_SPREADSHEET => array(
      'ods',
      'ots',
      'rdf',
      'xls',
      'xlsx',
      'xlsb',
    ),
    self::FAMILY_PRESENTATION => array('ppt', 'pptx', 'odp'),
    self::FAMILY_DRAWING => array('odg'),
    self::FAMILY_MULTIPAGETIFF => array('tiff', 'tif'),
  );

  /**
   * Array which defines the correct filter format to be used in the conversion.
   *
   * @var array
   */
  public static $exportFilterMap = array(
    "pdf" => array(
      self::FAMILY_TEXT => array('unoconv' => 'document'),
      self::FAMILY_SPREADSHEET => array('unoconv' => 'spreadsheet'),
      self::FAMILY_PRESENTATION => array('unoconv' => 'presentation'),
      self::FAMILY_DRAWING => array('unoconv' => 'graphics'),
    ),
  );

  private $filepath;
  private $fileExtension;
  private $fileFamily;
  private $fileName;

  /**
   * PDF path of the file to write to.
   *
   * @var string|string[]|null
   */
  private $pdfPath;

  /**
   * Creates PDF convert.
   *
   * @param string $filepath
   *   Path of file.
   *
   * @throws \Exception
   */
  public function __construct($filepath) {
    if (file_exists($filepath)) {
      $this->filepath = $filepath;
      $this->pdfPath = preg_replace('/\.(' . implode('|', self::getAllowedExtensions()) . ')$/i', '.pdf', $filepath);
      $this->fileExtension = strtolower(pathinfo($this->filepath, PATHINFO_EXTENSION));
      $this->fileName = strtolower(pathinfo($this->filepath, PATHINFO_FILENAME));
      $this->fileFamily = $this->getFamily();
    }
    else {
      throw new \Exception($filepath . ' does not exists.');
    }
  }

  /**
   * Get the family of the file. Text, Drawing etc.
   *
   * @return string
   *   The file family.
   */
  protected function getFamily() {
    if (!$this->fileFamily) {
      // Find which 'Family' the file is in.
      foreach (self::$familyExtensions as $family => $extensions) {
        if (in_array($this->fileExtension, $extensions)) {
          $this->fileFamily = $family;
          break;
        }
      }
    }
    return $this->fileFamily;
  }

  /**
   * Converts a document to PDF.
   *
   * @param string $output_dir
   *   The path to put the converted file. If not provided they are saved in
   *   same directory.
   *
   * @return bool
   *   If conversion was successful or not.
   *
   * @throws \Exception
   */
  public function convert($output_dir = NULL) {
    if (!$output_dir) {
      $output_dir = pathinfo($this->filepath, PATHINFO_DIRNAME);
    }
    $pdfConversionManager = \Drupal::service('decreto_pdf_conversion_manager.pdfConversionManagerService');


    // Switch on what type of conversion.
    switch (key(self::$exportFilterMap['pdf'][$this->fileFamily])) {
      // Convert by using unoconv command.
      case 'unoconv':
        // Get the correct filter name. If couldnt be found it uses regular
        // writer as filter.
        if ($this->fileExtension == 'html') {
          // Change HTML encoding to UTF 8.
          $this->toggleHtmlInlineImg($output_dir, FALSE);
          $tmp_filename = $output_dir . '/' . $this->fileName . '_tmp.' . $this->fileExtension;
          $encoding = str_replace("\n", '', array_pop(explode(':', shell_exec('file --mime-encoding ' . $this->filepath))));
          if (strpos($encoding, 'unknown')) {
            $encoding = 'iso-8859-1';
          }
          $iconv_path = $pdfConversionManager->getPath('iconv');
          exec($iconv_path . ' -f ' . $encoding . ' -t utf8 ' . $this->filepath . ' > ' . $tmp_filename . ' 2>&1', $errors);
          if ($errors) {
            throw new \Exception('Conversion of ' . $this->filepath . ' failed: ' . PHP_EOL . implode(PHP_EOL, $errors));
          }
          shell_exec('mv ' . $tmp_filename . ' ' . $this->filepath);

        }
        $filter_name = isset(self::$exportFilterMap['pdf'][$this->fileFamily]['unoconv']) ? self::$exportFilterMap['pdf'][$this->fileFamily]['unoconv'] : self::$exportFilterMap['pdf'][self::FAMILY_TEXT]['unoconv'];
        $unoconv_path = $pdfConversionManager->getPath('unoconv');
        exec($unoconv_path . ' -f pdf -eSelectPdfVersion=1 --doctype=' . $filter_name . ' "' . $this->filepath . '" 2>&1', $errors);
        if ($errors) {
          throw new \Exception('Conversion of ' . $this->filepath . ' failed: ' . PHP_EOL . implode(PHP_EOL, $errors));
        }
        $this->toggleHtmlInlineImg($output_dir, TRUE);
        return TRUE;

      // Convert using th ImageMagick php extension. This is good to convert any
      // multipage .tiff files to pdf.
      case 'ImageMagick':
        $convert_path = $pdfConversionManager->getPath('imagemagick');
        exec($convert_path . ' -quiet "' . $this->filepath . '" -density 300x300 -compress jpeg "' . $this->pdfPath . '" 2>&1', $errors);
        if ($errors) {
          throw new \Exception('Conversion of ' . $this->filepath . ' failed: ' . PHP_EOL . implode(PHP_EOL, $errors));
        }
        return TRUE;

      default:
        return FALSE;
    }
  }

  /**
   * Get all allowed extensions.
   *
   * @return array
   *   All allowed extensions.
   */
  public static function getAllowedExtensions() {
    $allowed_extensions = array();
    foreach (self::$familyExtensions as $extensions_array) {
      $allowed_extensions = array_merge($allowed_extensions, $extensions_array);
    }
    return $allowed_extensions;
  }

  /**
   * Toggles the inline images in the HTML.
   *
   * Toggles all images from file reference to base64 images.
   *
   * @param string $output_dir
   *   The directory of the file.
   * @param bool $inline_img
   *   Render as inline images or as file references.
   *
   * @return bool
   *   FALSE if document has no images, TRUE otherwise.
   */
  private function toggleHtmlInlineImg($output_dir, $inline_img = TRUE) {
    $html = file_get_contents($this->filepath);

    $doc = new \DOMDocument();
    @$doc->loadHTML($html);
    $tags = $doc->getElementsByTagName('img');
    if ($tags->length == 0) {
      return FALSE;
    }
    foreach ($tags as $tag) {
      if ($tag->getAttribute('src') != "") {
        preg_match("#\w*?.(jpg|png|gif)#is", $tag->getAttribute('src'), $filename);
        if (file_exists($output_dir . '/' . $filename[0])) {
          if ($inline_img) {
            $imgData = base64_encode(file_get_contents($output_dir . '/' . $filename[0]));
            $src = 'data: ' . mime_content_type($output_dir . '/' . $filename[0]) . ';base64,' . $imgData;
          }
          else {
            $src = $filename[0];
          }

          $tag->setAttribute('src', $src);
        }
      }
    }
    $doc->saveHTMLFile($this->filepath);

    return TRUE;
  }

  /**
   * Returns the expected PDF path of the file to be converted.
   *
   * @return string|string[]|null
   *   Expected path to PDF file.
   */
  public function getPdfPath() {
    return $this->pdfPath;
  }

}
