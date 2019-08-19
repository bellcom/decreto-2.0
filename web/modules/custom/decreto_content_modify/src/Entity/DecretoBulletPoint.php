<?php

namespace Drupal\decreto_content_modify\Entity;

use Drupal\node\Entity\Node;
use Drupal\user\UserInterface;

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
   * Sets the BPA list.
   *
   * @param array $bpaList
   *   The array of BPA references, formatted like:
   *   array(
   *     0 => ['target_id' => bpa_1_id],
   *     1 => ['target_id' => bpa_2_id]
   *     ...
   *   )
   * @param bool $save
   *   If bullet point needs to be saved right away.
   *
   * @throws \Drupal\Core\Entity\EntityStorageException
   */
  public function setBulletPointAttachments(array $bpaList, $save = TRUE) {
    $this->getEntity()->set('field_decreto_bp_bpas', $bpaList);
    if ($save) {
      $this->getEntity()->save();
    }
  }

  /**
   * Adds the bullet point attachment nid to bullet point.
   *
   * Only does so if the node is not already added.
   * Saves the bullet point as well.
   *
   * @param int $nid
   *   Nid of the node.
   * @param bool $save
   *   If bullet point needs to be saved right away.
   *
   * @throws \Drupal\Core\Entity\EntityStorageException
   */
  public function addBulletPointAttachment($nid, $save = TRUE) {
    $bpas = $this->getEntity()->get('field_decreto_bp_bpas')->getValue();
    $key = array_search($nid, array_column($bpas, 'target_id'));
    if (!$key) {
      $this->getEntity()->get('field_decreto_bp_bpas')->appendItem($nid);
      if ($save) {
        $this->getEntity()->save();
      }
    }
  }

  /**
   * Removes bullet point attachment nid from bullet point field_decreto_bp_bpas field.
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

  /**
   * Check whether a given bullet_point has memos authored by user.
   *
   * @param \Drupal\user\UserInterface $user
   *   The note author.
   *
   * @return bool
   *   TRUE or FALSE.
   */
  public function hasUserMemos(UserInterface $user = NULL) {
    if (empty($user)) {
      $user = \Drupal::currentUser();
    }

    $count = \Drupal::entityQuery('node')
      ->condition('uid', $user->id())
      ->condition('type', 'decreto_memo')
      ->condition('field_decreto_memo_bp', $this->getEntity()->id())
      ->count()
      ->execute();

    return intval($count) > 0;
  }

  /**
   * Check whether a given bullet_point has notes authored by user.
   *
   * @param \Drupal\user\UserInterface $user
   *   The note author.
   *
   * @return bool
   *   TRUE or FALSE.
   */
  public function hasUserNotes(UserInterface $user = NULL) {
    if (empty($user)) {
      $user = \Drupal::currentUser();
    }

    $count = 0;
    $bpaIds = $this->getBulletPointAttachments(FALSE);

    if (!empty($bpaIds)) {
      $count = $query = \Drupal::entityQuery('decreto_annotator_note')
        ->condition('uid', $user->id())
        ->condition('bpa_id', $bpaIds, 'IN')
        ->count()
        ->execute();
    }

    return intval($count) > 0;
  }

  /**
   * Returns whether this bullet point is closed.
   *
   * @return bool
   *   TRUE if closed, FALSE otherwise.
   *
   * @throws \Drupal\Core\TypedData\Exception\MissingDataException
   */
  public function isClosed() {
    return intval($this->getEntity()->get('field_decreto_bp_closed')->first()->getString()) == 1;
  }

  /**
   * Returns whether this bullet point is personal.
   *
   * @return bool
   *   TRUE if closed, FALSE otherwise.
   *
   * @throws \Drupal\Core\TypedData\Exception\MissingDataException
   */
  public function isPersonal() {
    return intval($this->getEntity()->get('field_decreto_bp_personal')->first()->getString()) == 1;
  }

}
