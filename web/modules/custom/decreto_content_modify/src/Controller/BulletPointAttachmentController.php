<?php

namespace Drupal\decreto_content_modify\Controller;

use Drupal\Core\Controller\ControllerBase;
use Drupal\node\NodeInterface;

/**
 * Decreto bullet point attachment controller.
 */
class BulletPointAttachmentController extends ControllerBase {

  /**
   * Renders node in modal view.
   *
   * @param \Drupal\node\NodeInterface $bullet_point_attachment
   *   Bullet point attachment node.
   *
   * @return array
   *   Render array.
   */
  public function modalContentRender(NodeInterface $bullet_point_attachment) {
    $view_builder = \Drupal::entityTypeManager()->getViewBuilder('node');
    $modal_output = $view_builder->view($bullet_point_attachment, 'modal_popup');

    return $modal_output;
  }

}
