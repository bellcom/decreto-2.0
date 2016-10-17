<?php
namespace Drupal\decreto_bpa_files_conversion_manager\Controller;
/**
 * @file
 * Contains \Drupal\decreto_dashboard\Controller\DashboardController.
 */


use Drupal\Core\Controller\ControllerBase;
use Drupal\file\Entity\File;
use Drupal\decreto_bpa_files_conversion_manager\DecretoPdfConversionScheduler\PdfScheduler;


class DecretoController extends ControllerBase {

  /**
   * Implementation create note endpoint.
   * Creates a note, saves it in the database and redirects to the read endpoint in order to update a note with generated ID.
   *
   * @return none.
   */
  public function cronTest() {
    echo 'hi';
    \Drupal\decreto_bpa_files_conversion_manager\DecretoPdfConversionScheduler\PdfScheduler::managePdfConversion();
    return 'hi';
  }
  

  

}
