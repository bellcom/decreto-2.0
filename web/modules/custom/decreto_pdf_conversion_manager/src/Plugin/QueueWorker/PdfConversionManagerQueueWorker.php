<?php
namespace Drupal\decreto_pdf_conversion_manager\Plugin\QueueWorker;

use Drupal\Core\Queue\QueueWorkerBase;
use Drupal\decreto_pdf_conversion_manager\lib\PDFConverter;
use Drupal\decreto_pdf_conversion_manager\Utils\DecretoPdfConversionManagerUtils as DecretoPDFUtils;
use Drupal\file\Entity\File;
use Drupal\node\Entity\Node;
use Exception;

/**
 * Converts the file to PDF using pdf2htmlEX.
 *
 * @QueueWorker(
 *   id = "decreto_pdf_conversion_manager_queue",
 *   title = @Translation("Decreto PDF conversion manager worker: decreto_pdf_conversion_manager_queue"),
 *   cron = {"time" = 180}
 * )
 */
class PdfConversionManagerQueueWorker extends QueueWorkerBase {
  /**
   * {@inheritdoc}
   */
  public function processItem($item) {
    //check if the node still exist
    $node = Node::load($item->did);
    if (!isset($node)) {
      DecretoPDFUtils::deleteScheduledJob($item->fid, $item->did);
      return;
    }

    $file = File::load($item->fid);
    if (isset($file)) {
      $path = self::isFileConverted($file);

      //not converted, attempt a new conversion
      if (!$path) {
        $path = self::convertFile($file);
      }

      if (file_exists($path)) {
        $data = file_get_contents($path);

        if (strpos($path, \Drupal::service('file_system')->realpath('private://')) === FALSE) {
          $uri = str_replace(\Drupal::service('file_system')->realpath('public://'), 'public://', $path);
        }
        else {
          $uri = str_replace(\Drupal::service('file_system')->realpath('private://'), 'private://', $path);
        }

        $pdfFile = file_save_data($data, $uri, FILE_EXISTS_REPLACE);
      }
      else {
        //still cannot be converted
        DecretoPDFUtils::updateStatus($item->fid, 'Cannot be converted');
      }

      if ($pdfFile) {
        //updating database entry
        \Drupal::database()->update('decreto_pdf_conversion_manager_files')
          ->fields(array(
            'filename' => $file->getFilename(),
            'created_filepath' => $path,
            'status' => 'Converted',
          ))
          ->condition('fid', $item->fid, '=')
          ->condition('did', $item->did, '=')
          ->execute();

        self::updateDestinationNode($node, $file, $pdfFile);
        DecretoPDFUtils::updateStatus($item->fid, 'Completed');

        if ($item->convert_to_html) {
          \Drupal::service('decreto_pdf2htmlex.pdf2htmlex')->scheduleFile($pdfFile->id(), $node->id());
        }
      }
    }
    else {
      DecretoPDFUtils::updateStatus($item->fid, 'Source file is not found');
    }
  }

  /**
   * Tells if the file is already has an HTMl version.
   *
   * @param File $file
   * @return null|string
   */
  private function isFileConverted(File $file) {
    $file_path_real = \Drupal::service('file_system')->realpath($file->getFileUri());
    $dest_dir_real = pathinfo($file_path_real, PATHINFO_DIRNAME);
    $file_name = pathinfo($file_path_real, PATHINFO_FILENAME);

    $path = $dest_dir_real . '/' . $file_name . '.pdf'; //filename.pdf

    if (file_exists($path)) {
      return $path;
    }
    return NULL;
  }

  /**
   * Does the actual conversion of the file by calling pdf2htmlEX as shell command.
   *
   * @param File $file
   */
  private function convertFile(File $file) {
    $pdfConverterFile = new PDFConverter(\Drupal::service('file_system')->realpath($file->getFileUri()));

    try {
      if ($pdfConverterFile->convert()) {
        return pathinfo($pdfConverterFile, PATHINFO_DIRNAME) . '/' . pathinfo($pdfConverterFile, PATHINFO_FILENAME) . '.pdf'; //filename.pdf
      }
      else {
        return NULL;
      }
    } catch (Exception $e) {
      \Drupal::logger('decreto_pdf_conversion_manager')->error($e->getMessage());
      DecretoPDFUtils::updateMessage($file->id(), 'Error: ' . $e->getMessage());
    }
  }

  /**
   * Updates the field in destination node to reference the newly converted file.
   *
   * @param Node $node
   * @param File $originalFile
   * * @param File $convertedFile
   */
  private function updateDestinationNode(Node $node, File $originalFile, File $convertedFile) {
    foreach (file_get_file_references($originalFile) as $field_name => $reference) {
      $refNode = reset($reference['node']);
      if ($refNode->id() == $node->id()) {
        $node->{$field_name}->setValue(['target_id' => $convertedFile->id()]);
        $node->save();
        break;
      }
    }
  }
}
