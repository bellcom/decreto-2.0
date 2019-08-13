<?php

namespace Drupal\decreto_pdf2htmlex\Plugin\QueueWorker;

use Drupal\Core\File\FileSystemInterface;
use Drupal\Core\Queue\QueueWorkerBase;
use Drupal\decreto_content_modify\Entity\DecretoBulletPointAttachment;
use Drupal\decreto_pdf2htmlex\Services\Pdf2htmlexService;
use Drupal\file\Entity\File;
use Drupal\file\FileInterface;
use Drupal\node\Entity\Node;

/**
 * Converts the file to HTML using pdf2htmlEX.
 *
 * @QueueWorker(
 *   id = "decreto_pdf2htmlex_queue",
 *   title = @Translation("Decreto pdf2htmlEX worker: decreto_pdf2htmlex_queue"),
 *   cron = {"time" = 180}
 * )
 */
class Pdf2htmlexQueueWorker extends QueueWorkerBase {

  /**
   * {@inheritdoc}
   */
  public function processItem($item) {
    // Check if the node still exists.
    $node = Node::load($item->did);
    if (!$node) {
      \Drupal::service('decreto_pdf2htmlex.pdf2htmlex')->deleteScheduledFile($item->fid, $item->did);
      return;
    }

    // Check if file still exists.
    $file = File::load($item->fid);
    if (!$file) {
      \Drupal::service('decreto_pdf2htmlex.pdf2htmlex')->updateFileStatus($item->fid, Pdf2htmlexService::STATUS_FILE_NOT_FOUND);
      return;
    }

    // Check if file is already converted.
    $path = self::isFileConverted($file);
    if (!$path) {
      $path = self::convertFile($file);
    }

    // Do have have path to a converted file?
    if (!file_exists($path)) {
      \Drupal::service('decreto_pdf2htmlex.pdf2htmlex')->updateFileStatus($item->fid, Pdf2htmlexService::STATUS_FAILED_CONVERSION);
      return;
    }

    // Getting file data and improving HTML.
    $data = file_get_contents($path);
    $data = self::improveHtml($data);

    // Changing realpath to drupal relative path.
    if (strpos($path, \Drupal::service('file_system')->realpath('private://')) === FALSE) {
      $uri = str_replace(\Drupal::service('file_system')->realpath('public://'), 'public://', $path);
    }
    else {
      $uri = str_replace(\Drupal::service('file_system')->realpath('private://'), 'private://', $path);
    }

    $htmlFile = file_save_data($data, $uri, FileSystemInterface::EXISTS_REPLACE);

    if ($htmlFile) {
      // Updating database entry.
      \Drupal::database()->update('decreto_pdf2htmlex_files')
        ->fields(array(
          'filename' => $file->getFilename(),
          'created_filepath' => $path,
          'status' => Pdf2htmlexService::STATUS_CONVERTED,
        ))
        ->condition('fid', $item->fid)
        ->condition('did', $item->did)
        ->execute();

      // Setting the file to a node.
      $decretoBPA = new DecretoBulletPointAttachment($node);
      $decretoBPA->setHtmlFile($htmlFile->id());

      // Update status.
      \Drupal::service('decreto_pdf2htmlex.pdf2htmlex')->updateFileStatus($item->fid, Pdf2htmlexService::STATUS_COMPLETED);
    }
  }

  /**
   * Tells if the file is already has a HTML version.
   *
   * @param \Drupal\file\FileInterface $file
   *   File to check.
   *
   * @return null|string
   *   Path to converted file or NULL is not found.
   */
  private function isFileConverted(FileInterface $file) {
    $file_path_real = \Drupal::service('file_system')->realpath($file->getFileUri());
    $dest_dir_real = pathinfo($file_path_real, PATHINFO_DIRNAME);
    $file_name = pathinfo($file_path_real, PATHINFO_FILENAME);

    // Filename.html.
    $path = $dest_dir_real . '/' . $file_name . '.html';

    if (file_exists($path)) {
      return $path;
    }
    return NULL;
  }

  /**
   * Does the actual conversion of the file.
   *
   * Calls pdf2htmlEX to do the work.
   *
   * @param \Drupal\file\FileInterface $file
   *   File to be converted.
   *
   * @return string
   *   The path of the converted file.
   */
  private function convertFile(FileInterface $file) {
    $config = \Drupal::service('config.factory')->getEditable('decreto_pdf2htmlex.settings');
    $pdf_html_zoom = $config->get('decreto_pdf2htmlex_zoom');

    if (empty($pdf_html_zoom)) {
      $pdf_html_zoom = 1.25;
    }

    $pdf_html_path = \Drupal::service('decreto_pdf2htmlex.pdf2htmlex')->getPath();

    $file_path_real = \Drupal::service('file_system')->realpath($file->getFileUri());
    $dest_dir_real = pathinfo($file_path_real, PATHINFO_DIRNAME);
    $file_name = pathinfo($file_path_real, PATHINFO_FILENAME);

    //setlocale(LC_CTYPE, "en_DK.UTF-8"); //TODO: one has to know the exact locale of the system, otherwise uncomment the lines
    $shell_file_path_real = escapeshellarg($file_path_real);
    $shell_dest_dir_real = escapeshellarg($dest_dir_real);

    shell_exec($pdf_html_path . ' ' . $shell_file_path_real . '  --dest-dir ' . $shell_dest_dir_real . ' --zoom ' . $pdf_html_zoom . ' 2>&1');

    return $dest_dir_real . '/' . $file_name . '.html';
  }

  /**
   * Modifies the HTML created by pdf2htmlEX program.
   *
   * Removes excessive HTML and JS bulkiness.
   *
   * @param string $data
   *   Initial HTML.
   *
   * @return string
   *   Improved HTML.
   */
  private function improveHtml($data) {
    // Removing unneeded paragraphs.
    $data = str_replace("<p>&nbsp;</p>", "", $data);
    // Removing scripts tags.
    $data = preg_replace('#<script(.*?)>(.*?)</script>#is', '', $data);
    // Removing ::selection css specification.
    $data = preg_replace('#::selection{(.*?)}#is', '', $data);
    // Removing ::-moz-selection css specification.
    $data = preg_replace('#::-moz-selection{(.*?)}#is', '', $data);
    // Removing #sidebar.
    $data = preg_replace('#<div id="sidebar">(.*?)</div>#is', '', $data);
    // Removing .loading-indicator.
    $data = preg_replace('#<div class="loading-indicator">(.*?)</div>#is', '', $data);

    return $data;
  }

}
