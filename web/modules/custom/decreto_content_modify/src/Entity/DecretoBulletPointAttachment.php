<?php

namespace Drupal\decreto_content_modify\Entity;

use Drupal\node\Entity\Node;
use Drupal\node\NodeInterface;

/**
 * Wrapper for Decreto Bullet point attachment.
 *
 * Allows to perform commonly used procedures in a more efficient way.
 */
class DecretoBulletPointAttachment {
  protected $bulletPointAttachment;

  /**
   * DecretoBulletPointAttachment constructor.
   *
   * @param \Drupal\node\NodeInterface $bpa
   *   Bullet point attachment node.
   */
  public function __construct(NodeInterface $bpa) {
    $this->bulletPointAttachment = $bpa;
  }

  /**
   * Returns original node entity.
   *
   * @return \Drupal\node\NodeInterface
   *   Bullet point attachment node.
   */
  public function getEntity() {
    return $this->bulletPointAttachment;
  }

  /**
   * Returns related bullet point.
   *
   * @param bool $load
   *   If the returned node shall be load. If FALSE, nid is returned.
   *
   * @return \Drupal\node\NodeInterface|int|null
   *   Bullet point node, or Bullet point nid.
   *   NULL is nothing is found.
   */
  public function getBulletPoint($load = TRUE) {
    $query = \Drupal::entityQuery('node')
      ->condition('type', 'decreto_bullet_point')
      ->condition('field_decreto_bp_bpas', $this->getEntity()->id());

    $nids = $query->execute();
    if (!empty($nids)) {
      $nid = reset($nids);
      return ($load) ? Node::load($nid) : $nid;
    }

    return NULL;
  }

  /**
   * Returns related meeting.
   *
   * @param bool $load
   *   If the returned node shall be load. If FALSE, nid is returned.
   *
   * @return \Drupal\node\NodeInterface|int|null
   *   Meeting node, or Meeting nid.
   *   NULL is nothing is found.
   */
  public function getMeeting($load = TRUE) {
    // Getting BP first.
    $bp = $this->getBulletPoint();

    if ($bp) {
      $decretoBP = new DecretoBulletPoint($bp);
      return $decretoBP->getMeeting($load);
    }

    return NULL;
  }

}
