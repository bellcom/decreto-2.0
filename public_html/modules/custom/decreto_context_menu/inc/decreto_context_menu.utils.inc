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
      'cssClass' => 'dec-quick-share-link'
    );
    $links[] = array(
      'name' => 'Print',
      'cssClass' => 'dec-quick-print-link'
    );

    if ($node->getType = 'decreto_meeting') {
      $links[] = array(
        'name' => 'Download',
        'cssClass' => 'dec-quick-download-link'
      );
    }
  }

  //default links for every node
  if ($node->access('update')) {
    $links[] = array(
      'name' => 'Edit',
      'path' => Url::fromRoute('entity.node.edit_form', array('node' => $node->id())),
      'cssClass' => 'dec-quick-edit-link'
    );
  }
  if ($node->access('delete')) {
    $links[] = array(
      'name' => 'Delete',
      'path' => Url::fromRoute('entity.node.delete_form', array('node' => $node->id())),
      'cssClass' => 'dec-quick-delete-link'
    );
  }

  return $links;
}