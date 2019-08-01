<?php

namespace Drupal\decreto_content_modify\Entity;

use Drupal\node\NodeInterface;

/**
 * Wrapper for Decreto Memo.
 *
 * Allows to perform commonly used procedures in a more efficient way.
 */
class DecretoMemo {
  protected $memo;

  /**
   * DecretoMemo constructor.
   *
   * @param \Drupal\node\NodeInterface $memo
   *   Memo node.
   */
  public function __construct(NodeInterface $memo) {
    $this->memo = $memo;
  }

  /**
   * Returns original node entity.
   *
   * @return \Drupal\node\NodeInterface
   *   Memo node.
   */
  public function getEntity() {
    return $this->memo;
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
   *
   * @throws \Drupal\Core\TypedData\Exception\MissingDataException
   */
  public function getMeeting($load = TRUE) {
    // Getting BP first.
    $bp = $this->getBulletPoint();

    if ($bp) {
      $decretoBP = new DecretoBulletPoint($bp);
      $decretoBP->getMeeting($load);
    }

    return NULL;
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
   *
   * @throws \Drupal\Core\TypedData\Exception\MissingDataException
   */
  public function getBulletPoint($load = TRUE) {
    if ($fieldBP = $this->getEntity()->get('field_decreto_memo_bp')->first()) {
      if ($load) {
        return $fieldBP->get('entity')->getTarget()->getValue();
      }
      else {
        return $fieldBP->getValue()['target_id'];
      }
    }

    return NULL;
  }

}
