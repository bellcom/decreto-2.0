<?php

namespace Drupal\decreto_content_modify\Entity;

use Drupal\node\Entity\Node;

/**
 * Wrapper for Decreto Bullet point.
 *
 * Allows to perform commonly used procedures in a more efficient way.
 */
class DecretoBulletPoint extends DecretoNode {

  /**
   * {@inheritdoc}
   */
  public function getEntityType() {
    return 'decreto_bullet_point';
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

  /**
   * Returns related bullet point attachments.
   *
   * @param bool $load
   *   If the returned nodes shall be load. If FALSE, array of nids is returned.
   *
   * @return array
   *   If load is TRUE array of nodes is returned,
   *   If load is FALSE array of nids is returned,
   *   If field is empty, empty array is returned.
   */
  public function getBulletPointAttachments($load = TRUE) {
    if ($fieldBpas = $this->getEntity()->get('field_decreto_bp_bpas')) {
      if ($load) {
        return $fieldBpas->referencedEntities();
      }
      else {
        return array_column($fieldBpas->getValue(), 'target_id');
      }
    }

    return array();
  }

  /**
   * Removes bullet point attachment nid from bullet point field_decreto_bp_bpas field..
   *
   * Saves the bullet point as well.
   *
   * @param int $nid
   *   Nid of the bullet point attachment.
   * @param bool $save
   *   If node needs to be saved right away.
   *
   * @throws \Drupal\Core\Entity\EntityStorageException
   */
  public function removeBulletPointAttachment($nid, $save = TRUE) {
    $bpas = $this->getEntity()->get('field_decreto_bp_bpas')->getValue();
    $key = array_search($nid, array_column($bpas, 'target_id'));
    $this->getEntity()->get('field_decreto_bp_bpas')->removeItem($key);
    if ($save) {
      $this->getEntity()->save();
    }
  }

  /**
   * Returns related memos.
   *
   * @param bool $load
   *   If the returned nodes shall be load. If FALSE, array of nids is returned.
   *
   * @return array
   *   If load is TRUE array of nodes is returned,
   *   If load is FALSE array of nids is returned,
   *   If field is empty, empty array is returned.
   */
  public function getMemos($load = TRUE) {
    $query = \Drupal::entityQuery('node')
      ->condition('type', 'decreto_memo')
      ->condition('field_decreto_memo_bp', $this->getEntity()->id());

    $nids = $query->execute();
    if (!empty($nids)) {
      return ($load) ? Node::loadMultiple($nids) : $nids;
    }

    return array();
  }

}
