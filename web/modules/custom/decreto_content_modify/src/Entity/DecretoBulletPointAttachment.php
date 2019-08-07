<?php

namespace Drupal\decreto_content_modify\Entity;

use Drupal\decreto_annotator\Entity\Note;
use Drupal\node\Entity\Node;
use Drupal\user\UserInterface;

/**
 * Wrapper for Decreto Bullet point attachment.
 *
 * Allows to perform commonly used procedures in a more efficient way.
 */
class DecretoBulletPointAttachment extends DecretoNode {

  /**
   * {@inheritdoc}
   */
  public function getEntityType() {
    return 'decreto_bullet_point_attachment';
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
   *
   * @throws \Drupal\Core\Entity\Exception\UnsupportedEntityTypeDefinitionException
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

  /**
   * Returns BPA file.
   *
   * @param bool $load
   *   If the returned file entity shall be load. If FALSE, nid is returned.
   *
   * @return \Drupal\file\FileInterface|int|null
   *   File entity, or File did.
   *   NULL is nothing is found.
   *
   * @throws \Drupal\Core\TypedData\Exception\MissingDataException
   */
  public function getFile($load = TRUE) {
    if ($fieldBpaFile = $this->getEntity()->get('field_decreto_bpa_file')->first()) {
      if ($load) {
        return $fieldBpaFile->get('entity')->getTarget()->getValue();
      }
      else {
        return $fieldBpaFile->getValue()['target_id'];
      }
    }

    return NULL;
  }

  /**
   * Returns related notes.
   *
   * @param bool $load
   *   If the returned note shall be load. If FALSE, array of ids is returned.
   *
   * @return array
   *   If load is TRUE array of notes is returned,
   *   If load is FALSE array of ids is returned,
   *   If field is empty, empty array is returned.
   */
  public function getNotes($load = TRUE) {
    $query = \Drupal::entityQuery('decreto_annotator_note')
      ->condition('bpa_id', $this->getEntity()->id());

    $ids = $query->execute();
    if (!empty($ids)) {
      return ($load) ? Note::loadMultiple($ids) : $ids;
    }

    return array();
  }

  /**
   * Check whether a given bullet_point_attachment has notes authored by user.
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

    $count = $query = \Drupal::entityQuery('decreto_annotator_note')
      ->condition('bpa_id', $this->getEntity()->id())
      ->condition('uid', $user->id())
      ->count()
      ->execute();

    return intval($count) > 0;
  }

}
