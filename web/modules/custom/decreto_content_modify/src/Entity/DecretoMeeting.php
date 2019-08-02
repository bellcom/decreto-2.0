<?php

namespace Drupal\decreto_content_modify\Entity;

use Drupal\decreto_annotator\Entity\Note;
use Drupal\message\Entity\Message;

/**
 * Wrapper for Decreto Meeting.
 *
 * Allows to perform commonly used procedures in a more efficient way.
 */
class DecretoMeeting extends DecretoNode {

  /**
   * {@inheritdoc}
   */
  public function getEntityType() {
    return 'decreto_meeting';
  }

  /**
   * Returns related department.
   *
   * @param bool $load
   *   If the returned node shall be load. If FALSE, nid is returned.
   *
   * @return \Drupal\taxonomy\TermInterface|int|null
   *   Department term, or Department tid.
   *   NULL is nothing is found.
   *
   * @throws \Drupal\Core\TypedData\Exception\MissingDataException
   */
  public function getDepartment($load = TRUE) {
    if ($fieldDepartment = $this->getEntity()->get('field_decreto_meet_department')->first()) {
      if ($load) {
        return $fieldDepartment->get('entity')->getTarget()->getValue();
      }
      else {
        return $fieldDepartment->getValue()['target_id'];
      }
    }

    return NULL;
  }

  /**
   * Adds the file fid to meeting field_decreto_meet_bpa_files.
   *
   * Only does so if the file is not already there.
   * Saves the meeting as well.
   *
   * @param int $fid
   *   Fid of the file.
   * @param bool $save
   *   If node needs to be saved right away.
   *
   * @throws \Drupal\Core\Entity\EntityStorageException
   */
  public function addBpaFile($fid, $save = TRUE) {
    $bpaFiles = $this->getEntity()->get('field_decreto_meet_bpa_files')->getValue();
    $key = array_search($fid, array_column($bpaFiles, 'target_id'));
    if (!$key) {
      $this->getEntity()->get('field_decreto_meet_bpa_files')->appendItem($fid);
      if ($save) {
        $this->getEntity()->save();
      }
    }
  }

  /**
   * Removes the file fid from meeting field_decreto_meet_bpa_files.
   *
   * Saves the meeting as well.
   *
   * @param int $fid
   *   Fid of the file.
   * @param bool $save
   *   If node needs to be saved right away.
   *
   * @throws \Drupal\Core\Entity\EntityStorageException
   */
  public function removeBpaFile($fid, $save = TRUE) {
    $bpaFiles = $this->getEntity()->get('field_decreto_meet_bpa_files')->getValue();
    $key = array_search($fid, array_column($bpaFiles, 'target_id'));
    $this->getEntity()->get('field_decreto_meet_bpa_files')->removeItem($key);
    if ($save) {
      $this->getEntity()->save();
    }
  }

  /**
   * Returns related bullet points.
   *
   * @param bool $load
   *   If the returned nodes shall be load. If FALSE, array of nids is returned.
   *
   * @return array
   *   If load is TRUE array of nodes is returned,
   *   If load is FALSE array of nids is returned,
   *   If field is empty, empty array is returned.
   */
  public function getBulletPoints($load = TRUE) {
    if ($fieldBps = $this->getEntity()->get('field_decreto_meet_bps')) {
      if ($load) {
        return $fieldBps->referencedEntities();
      }
      else {
        return array_column($fieldBps->getValue(), 'target_id');
      }
    }

    return array();
  }

  /**
   * Removes bullet point nid from meeting field_decreto_meet_bps field..
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
  public function removeBulletPoint($nid, $save = TRUE) {
    $bps = $this->getEntity()->get('field_decreto_meet_bps')->getValue();
    $key = array_search($nid, array_column($bps, 'target_id'));
    $this->getEntity()->get('field_decreto_meet_bps')->removeItem($key);
    if ($save) {
      $this->getEntity()->save();
    }
  }

  /**
   * Returns related messages.
   *
   * @param bool $load
   *   If the returned nodes shall be load. If FALSE, array of nids is returned.
   *
   * @return array
   *   If load is TRUE array of nodes is returned,
   *   If load is FALSE array of nids is returned,
   *   If field is empty, empty array is returned.
   */
  public function getMessages($load = TRUE) {
    $query = \Drupal::entityQuery('message');
    $results = $query
      ->condition('field_decreto_notif_meeting', $this->getEntity()->id());

    $ids = $query->execute();
    if (!empty($ids)) {
      return ($load) ? Message::loadMultiple($ids) : $ids;
    }

    return $results;
  }

}
