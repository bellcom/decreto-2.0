<?php

namespace Drupal\decreto_pdf_conversion_manager\Plugin\QueueWorker;

use Drupal\Core\File\FileSystemInterface;
use Drupal\Core\Queue\QueueWorkerBase;
use Drupal\decreto_content_modify\Entity\DecretoBulletPointAttachment;
use Drupal\decreto_content_modify\Entity\DecretoMeeting;
use Drupal\decreto_pdf_conversion_manager\lib\PDFConverter;
use Drupal\decreto_pdf_conversion_manager\Services\PdfConversionManagerService;
use Drupal\file\Entity\File;
use Drupal\file\FileInterface;
use Drupal\node\Entity\Node;
use Exception;

/**
 * Converts the file to PDF using various libs.
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
    // Check if the node still exists.
    $node = Node::load($item->did);
    if (!isset($node)) {
      \Drupal::service('decreto_pdf_conversion_manager.pdfConversionManagerService')->deleteScheduledFile($item->fid, $item->did);
      return;
    }

    // Check if file still exists.
    $file = File::load($item->fid);
    if (!$file) {
      \Drupal::service('decreto_pdf_conversion_manager.pdfConversionManagerService')->updateFileStatus($item->fid, PdfConversionManagerService::STATUS_FILE_NOT_FOUND);
      return;
    }

    // Check if file is already converted.
    $path = self::isFileConverted($file);
    if (!$path) {
      $path = self::convertFile($file);
    }

    // Do have have path to a converted file?
    if (!file_exists($path)) {
      \Drupal::service('decreto_pdf_conversion_manager.pdfConversionManagerService')->updateFileStatus($item->fid, PdfConversionManagerService::STATUS_FAILED_CONVERSION);
      return;
    }

    // Getting file data.
    $data = file_get_contents($path);

    // Changing realpath to drupal relative path.
    if (strpos($path, \Drupal::service('file_system')->realpath('private://')) === FALSE) {
      $uri = str_replace(\Drupal::service('file_system')->realpath('public://') . '/', 'public://', $path);
    }
    else {
      $uri = str_replace(\Drupal::service('file_system')->realpath('private://') . '/', 'private://', $path);
    }

    $pdfFile = file_save_data($data, $uri, FileSystemInterface::EXISTS_REPLACE);

    if ($pdfFile) {
      // Updating database entry.
      \Drupal::database()->update('decreto_pdf_conversion_manager_files')
        ->fields(array(
          'filename' => $file->getFilename(),
          'created_filepath' => $path,
          'status' => PdfConversionManagerService::STATUS_CONVERTED,
        ))
        ->condition('fid', $item->fid, '=')
        ->condition('did', $item->did, '=')
        ->execute();

      // Setting the file to a node.
      $decretoBPA = new DecretoBulletPointAttachment($node);
      $decretoBPA->setFile($pdfFile->id());

      // Update status.
      \Drupal::service('decreto_pdf_conversion_manager.pdfConversionManagerService')->updateFileStatus($item->fid, PdfConversionManagerService::STATUS_COMPLETED);

      // Schedule HTML conversion.
      if ($item->convert_to_html) {
        \Drupal::service('decreto_pdf2htmlex.pdf2htmlex')->scheduleFile($pdfFile->id(), $node->id());
      }
    }
  }

  /**
   * Tells if the file is already has a PDF version.
   *
   * @param \Drupal\file\FileInterface $file
   *   File to check.
   *
   * @return null|string
   *   Path to converted file or NULL is not found.
   *
   * @throws \Exception
   */
  private function isFileConverted(FileInterface $file) {
    $file_path_real = \Drupal::service('file_system')->realpath($file->getFileUri());
    $pdfConverterFile = new PDFConverter($file_path_real);

    if (file_exists($pdfConverterFile->getPdfPath())) {
      return $pdfConverterFile->getPdfPath();
    }
    return NULL;
  }

  /**
   * Does the actual conversion of the file.
   *
   * Calls right library to do the work.
   *
   * @param \Drupal\file\FileInterface $file
   *   File to be converted.
   *
   * @return string
   *   The path of the converted file.
   *
   * @throws \Exception
   */
  private function convertFile(FileInterface $file) {
    $file_path_real = \Drupal::service('file_system')->realpath($file->getFileUri());
    $pdfConverterFile = new PDFConverter($file_path_real);

    try {
      if ($pdfConverterFile->convert()) {
        return $pdfConverterFile->getPdfPath();
      }
      else {
        return NULL;
      }
    }
    catch (Exception $e) {
      \Drupal::logger('decreto_pdf_conversion_manager')->error($e->getMessage());
      \Drupal::service('decreto_pdf_conversion_manager.pdfConversionManagerService')->updateFileMessage($file->id(), $e->getMessage());
    }
  }

}
