<?php

namespace Drupal\decreto_content_modify\Entity;

use Drupal\node\Entity\Node;
use Drupal\node\NodeInterface;

/**
 * Wrapper for Decreto Bullet point.
 *
 * Allows to perform commonly used procedures in a more efficient way.
 */
class DecretoBulletPoint {
  protected $bulletPoint;

  /**
   * DecretoBulletPointAttachment constructor.
   *
   * @param \Drupal\node\NodeInterface $bp
   *   Bullet point node.
   */
  public function __construct(NodeInterface $bp) {
    $this->bulletPoint = $bp;
  }

  /**
   * Returns original node entity.
   *
   * @return \Drupal\node\NodeInterface
   *   Bullet point node.
   */
  public function getEntity() {
    return $this->bulletPoint;
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
    $query = \Drupal::entityQuery('node')
      ->condition('type', 'decreto_meeting')
      ->condition('field_decreto_meet_bps', $this->getEntity()->id());

    $nids = $query->execute();
    if (!empty($nids)) {
      $nid = reset($nids);
      return ($load) ? Node::load($nid) : $nid;
    }

    return NULL;
  }

}
