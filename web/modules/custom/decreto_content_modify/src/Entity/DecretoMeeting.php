<?php

namespace Drupal\decreto_content_modify\Entity;

use Drupal\node\NodeInterface;

/**
 * Wrapper for Decreto Meeting.
 *
 * Allows to perform commonly used procedures in a more efficient way.
 */
class DecretoMeeting {
  protected $meeting;

  /**
   * DecretoMeeting constructor.
   *
   * @param \Drupal\node\NodeInterface $meeting
   *   Memo node.
   */
  public function __construct(NodeInterface $meeting) {
    $this->meeting = $meeting;
  }

  /**
   * Returns original node entity.
   *
   * @return \Drupal\node\NodeInterface
   *   Memo node.
   */
  public function getEntity() {
    return $this->meeting;
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

}
