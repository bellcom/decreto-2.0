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

    if ($node->getType() == 'decreto_meeting') {
      $links[] = array(
        'name' => 'Download',
        'cssClass' => array('dec-quick-download-link')
      );
    }
  }

  //default links for decreto_meeting
  if (($view_mode == 'full' || $view_mode == 'teaser') && $node->getType() == 'decreto_meeting') {
    if ($node->access('update')) {
      $links[] = array(
        'name' => 'Edit',
        'path' => Url::fromRoute('decreto_content_modify.meetings_edit', ['node' => $node->id()]),
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
    $edit_link = [
      'name' => 'Edit',
      'path' => null,
      'cssClass' => ['use-ajax', 'dec-quick-edit-link'],
      'data' => ['dialog-type' => 'modal']
    ];
    $delete_link = [
      'name' => 'Delete',
      'path' => null,
      'cssClass' => ['use-ajax', 'dec-quick-delete-link'],
      'data' => ['dialog-type' => 'modal']
    ];

    if ($node->getType() == 'decreto_bullet_point') {
      if ($node->access('update')) {
        $links['edit'] = $edit_link;
        $links['edit']['path'] = Url::fromRoute('decreto_content_modify.bps_edit', ['node' => $node->id()]);
      }
      if ($node->access('delete')) {
        $links['delete'] = $delete_link;
        $links['delete']['path'] = Url::fromRoute('decreto_content_modify.bps_delete', ['node' => $node->id()]);
      }
    }

    if ($node->getType() == 'decreto_bullet_point_attachment') {
      $query = \Drupal::entityQuery('node');
      $query->condition('status', 1);
      $query->condition('type', 'decreto_bullet_point');
      $query->condition('field_decreto_bp_bpas',[$node->id()],'IN');
      $entity_ids = $query->execute();
      if (!empty($entity_ids)) {
        $parent_nid = array_pop($entity_ids);
        if ($node->access('update')) {
          $links['edit'] = $edit_link;
          $links['edit']['path'] = Url::fromRoute('decreto_content_modify.bpas_edit', ['bullet_point' => $parent_nid, 'node' => $node->id()]);
        }
      if ($node->access('delete')) {
        $links['delete'] = $delete_link;
        $links['delete']['path'] = Url::fromRoute('decreto_content_modify.bpas_delete', ['parent' => $parent_nid, 'node' => $node->id()]);
      }
      }
    }
  }

  return $links;
}