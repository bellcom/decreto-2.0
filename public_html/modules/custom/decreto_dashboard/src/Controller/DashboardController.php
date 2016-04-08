<?php

/**
 * @file
 * Contains \Drupal\decreto_dashboard\Controller\DashboardController.
 */

namespace Drupal\decreto_dashboard\Controller;

use Drupal\Core\Controller\ControllerBase;

class DashboardController extends ControllerBase {

  public function meetingsBlock() {
    global $base_url;

    $args = array(implode('+', decreto_dashboard_get_user_committees()));
    $footer = '<a href="' . $base_url . '/dashboard/all_committees">...</a>';
    $meetings_my_committes = $this->decreto_dashboard_view_render('decreto_meetings', t('My committees meetings'), $footer, $args, FALSE); 
    $meetings_all_committes = $this->decreto_dashboard_view_render('decreto_meetings', t('All committees meetings'), $footer, array(), FALSE);

    return array(
      '#type' => 'container',
      '#markup' => $meetings_my_committes . $meetings_all_committes
    );
  }

  public function meetingsPage($committee) {
    $args = array();

    if ($committee == 'my_committees') {
      $args = array(implode('+', decreto_dashboard_get_user_committees()));
      $title = t('My commitees meetings');
    } else if ($committee == 'all_committees') {
      $title = t('All commitees meetings');
    } else {
      $args = array($committee);
      $title = \Drupal\taxonomy\Entity\Term::load($committee)->getName() . t(' committees meetings');
    }
    $meetings = $this->decreto_dashboard_view_render('decreto_meetings', $title, '', $args, TRUE);

    return array(
      '#type' => 'markup',
      '#markup' => $meetings,
    );
  }
  
/*
 * Set view's header
 */
  private function decreto_dashboard_set_view_header(&$view, $title) {
    $options = array(
      'id' => 'area_text_custom',
      'table' => 'views',
      'field' => 'area_text_custom',
      'content' => $title,
      'plugin_id' => 'text_custom',
    );
    $view->setHandler('meetings', 'header', 'area_text_custom', $options);
  }
/*
 * Set view's footer
 */
  private function decreto_dashboard_set_view_footer(&$view, $footer) {
    $options = array(
      'id' => 'area_text_custom',
      'table' => 'views',
      'field' => 'area_text_custom',
      'relationship' => 'none',
      'group_type' => 'none',
      'admin_label' => '',
      'empty' => TRUE,
      'tokenize' => FALSE,
      'content' => $footer,
      'plugin_id' => 'text_custom',
    );
    $view->setHandler('meetings', 'footer', 'area_text_custom', $options);
  }
/*
 * Render view 
 */
  private function decreto_dashboard_view_render($view_name, $title = "", $footer = "", $arg = array(), $all_rows = TRUE) {
    $view = \Drupal\views\Views::getView($view_name);   
    $view->setArguments($arg);
    $this->decreto_dashboard_set_view_header($view, $title);

    if (!$all_rows) {
      $full_view = \Drupal\views\Views::getView($view_name);    
      $full_view->setArguments($arg);
      $full_view->execute();

      $total_rows = (int) $full_view->total_rows;
      $view->getPager()->options['total_pages'] = 1;
    }
    if (!$all_rows && $view->getItemsPerPage() < $total_rows) {
      $this->decreto_dashboard_set_view_footer($view, $footer);
    }
    $view->execute();
    return \Drupal::service('renderer')->render($view->render());
  }

}
