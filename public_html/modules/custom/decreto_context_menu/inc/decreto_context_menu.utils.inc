<?php

use Drupal\Core\Url;

/**
 * Returns the array of the context links based on node type and the user permissions
 *
 * @param $node
 * @param $view_mode
 * @return array of links
 */
function decreto_context_menu_get_menu_links($node, $view_mode) {
  $links = array();

  if ($view_mode == 'full') {
    $links[] = array(
      'name' => 'Share',
      'cssClass' => array('dec-quick-share-link')
    );
    $links[] = array(
      'name' => 'Print',
      'cssClass' => array('dec-quick-print-link')
    );

    if ($node->getType = 'decreto_meeting') {
      $links[] = array(
        'name' => 'Download',
        'cssClass' => array('dec-quick-download-link')
      );
    }
  }

  //default links for decreto_meeting
  if (($view_mode == 'full' || $view_mode == 'teaser') && $node->getType == 'decreto_meeting') {
    if ($node->access('update')) {
      $links[] = array(
        'name' => 'Edit',
        'path' => Url::fromRoute('entity.node.edit_form', array('node' => $node->id())),
        'cssClass' => array('dec-quick-edit-link')
      );
    }
    if ($node->access('delete')) {
      $links[] = array(
        'name' => 'Delete',
        'path' => Url::fromRoute('entity.node.delete_form', array('node' => $node->id())),
        'cssClass' => array('dec-quick-delete-link')
      );
    }
  }

  //ajax links, for decreto_content_modify module
  if ($view_mode == 'teaser_ajax' && \Drupal::moduleHandler()->moduleExists('decreto_content_modify')) {
    if ($node->getType() == 'decreto_bullet_point') {
      if ($node->access('update')) {
        $links[] = array(
          'name' => 'Edit',
          'path' => Url::fromRoute('decreto_content_modify.bps_edit', array('node' => $node->id())),
          'cssClass' => array('use-ajax', 'dec-quick-edit-link'),
          'data' => [
            'dialog-type' => 'modal',
          ]
        );
      }
      if ($node->access('delete')) {
        $links[] = array(
          'name' => 'Delete',
          'path' => Url::fromRoute('decreto_content_modify.bps_delete', array('node' => $node->id())),
          'cssClass' => array('use-ajax', 'dec-quick-delete-link'),
          'data' => [
            'dialog-type' => 'modal',
          ]
        );
      }
    }
  }

  return $links;
}