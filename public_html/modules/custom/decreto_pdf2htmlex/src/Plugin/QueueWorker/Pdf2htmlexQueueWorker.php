<?php
namespace Drupal\decreto_pdf2htmlex\Plugin\QueueWorker;

use Drupal\decreto_pdf2htmlex\Utils\DecretoPdf2htmlexUtils as DecretoHTMLUtils;
use Drupal\Core\Queue\QueueWorkerBase;
use Drupal\file\Entity\File;
use Drupal\node\Entity\Node;

/**
 * Converts the file to PDF using pdf2htmlEX.
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
    //check if the node still exist
    $node = Node::load($item->did);
    if (!isset($node)) {
      $query = \Drupal::database()->delete('decreto_pdf2htmlex_files')
        ->condition('did', $item->did, '=')
        ->execute();
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
        $data = self::improveHtml($data);

        if (strpos($path, \Drupal::service('file_system')->realpath('private://')) === FALSE) {
          $uri = str_replace(\Drupal::service('file_system')->realpath('public://'), 'public://', $path);
        } else {
          $uri = str_replace(\Drupal::service('file_system')->realpath('private://'), 'private://', $path);
        }

        $htmlFile = file_save_data($data, $uri, FILE_EXISTS_REPLACE);
        dpm($htmlFile);
      } else {
        //still cannot be converted
        DecretoHTMLUtils::updateStatus($item->fid, 'Cannot be converted');
      }

      if ($htmlFile) {
        dpm($htmlFile);
        //updating database entry
        \Drupal::database()->update('decreto_pdf2htmlex_files')
          ->fields(array(
            'filename' => $file->getFilename(),
            'created_filepath' => $path,
            'status' => 'Converted',
          ))
          ->condition('fid', $item->fid, '=')
          ->condition('did', $item->did, '=')
          ->execute();

        self::updateDestinationNode($node, $htmlFile);
        DecretoHTMLUtils::updateStatus($item->fid, 'Completed');
      }
    } else {
      DecretoHTMLUtils::updateStatus($item->fid, 'PDF file is not found');
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

    $path = $dest_dir_real . '/' . $file_name . '.html'; //filename.html

    if (file_exists($path)) {
      return $path;
    }
    return null;
  }

  /**
   * Does the actual conversion of the file by calling pdf2htmlEX as shell command.
   *
   * @param File $file
   */
  private function convertFile(File $file) {
    $config = \Drupal::service('config.factory')->getEditable('decreto_pdf2htmlex.settings');
    $pdf_html_zoom = $config->get('decreto_pdf2htmlex_zoom');
    $pdf_html_path = $config->get('decreto_pdf2htmlex_path');

    $file_path_real = \Drupal::service('file_system')->realpath($file->getFileUri());
    $dest_dir_real = pathinfo($file_path_real, PATHINFO_DIRNAME);

    //setlocale(LC_CTYPE, "en_DK.UTF-8"); //TODO: one has to know the exact locale of the system, otherwise uncomment the lines
    $shell_file_path_real = escapeshellarg($file_path_real);
    $shell_dest_dir_real = escapeshellarg($dest_dir_real);

    shell_exec($pdf_html_path . ' ' . $shell_file_path_real . '  --dest-dir ' . $shell_dest_dir_real . ' --zoom ' . $pdf_html_zoom . ' 2>&1');
  }

  /**
   * Updates the field in destination node to reference the newly converted file.
   *
   * @param Node $node
   * @param File $file
   */
  private function updateDestinationNode(Node $node, File $file) {
    if ($node->getType() == 'decreto_bullet_point_attachment') {
      $node->field_decreto_bpa_html->setValue(['target_id' => $file->id()]);
      $node->save();
    }
  }

  /**
   * Modifies the HTML created by pdf2htmlEX program. Removes some of the HTML and JS complexity which is not needed for our application.
   *
   * @param $data
   * @return mixed
   */
  private function improveHtml($data) {
    $data = str_replace("<p>&nbsp;</p>", "", $data); //removing unneeded paragraphs
    $data = preg_replace('#<script(.*?)>(.*?)</script>#is', '', $data); //removing scripts tags
    $data = preg_replace('#::selection{(.*?)}#is', '', $data); //removing ::selection css specification
    $data = preg_replace('#::-moz-selection{(.*?)}#is', '', $data); //removing ::-moz-selection css specification
    $data = preg_replace('#<div id="sidebar">(.*?)</div>#is', '', $data); //removing #sidebar
    $data = preg_replace('#<div class="loading-indicator">(.*?)</div>#is', '', $data); //removing .loading-indicator
    return $data;
  }
}
 