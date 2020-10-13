<?php

namespace Drupal\decreto_content_modify\Entity;

use Drupal\Core\Datetime\DrupalDateTime;
use Drupal\datetime\Plugin\Field\FieldType\DateTimeItemInterface;
use Drupal\message\Entity\Message;
use Drupal\paragraphs\Entity\Paragraph;
use Drupal\user\Entity\User;
use Drupal\user\UserInterface;

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
   * Returns formatted meeting start date.
   *
   * @param string $format
   *   (Optional) Drupal format.
   *
   * @return mixed
   *   Formatted date.
   *
   * @throws \Drupal\Core\TypedData\Exception\MissingDataException
   */
  public function getStartDate($format = 'short') {
    if ($fieldStartDate = $this->getEntity()->get('field_decreto_meet_start_date')->first()) {
      $start_date = DrupalDateTime::createFromFormat(DateTimeItemInterface::DATETIME_STORAGE_FORMAT, $fieldStartDate->value, new \DateTimeZone(DateTimeItemInterface::STORAGE_TIMEZONE));

      return \Drupal::service('date.formatter')->format($start_date->getTimestamp(), $format);
    }
  }

  /**
   * Returns formatted meeting end date.
   *
   * @param string $format
   *   (Optional) Drupal format.
   *
   * @return mixed
   *   Formatted date.
   *
   * @throws \Drupal\Core\TypedData\Exception\MissingDataException
   */
  public function getEndDate($format = 'short') {
    if ($fieldEndDate = $this->getEntity()->get('field_decreto_meet_end_date')->first()) {
      $end_date = DrupalDateTime::createFromFormat(DateTimeItemInterface::DATETIME_STORAGE_FORMAT, $fieldEndDate->value, new \DateTimeZone(DateTimeItemInterface::STORAGE_TIMEZONE));

      return \Drupal::service('date.formatter')->format($end_date->getTimestamp(), $format);
    }
  }

  /**
   * Returns related department.
   *
   * @param bool $load
   *   If the returned term shall be load. If FALSE, tid is returned.
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
   * Returns related location.
   *
   * @param bool $load
   *   If the returned term shall be load. If FALSE, tid is returned.
   *
   * @return \Drupal\taxonomy\TermInterface|int|null
   *   Location term, or Location tid.
   *   NULL is nothing is found.
   *
   * @throws \Drupal\Core\TypedData\Exception\MissingDataException
   */
  public function getLocation($load = TRUE) {
    if ($fieldDepartment = $this->getEntity()->get('field_decreto_meet_location')->first()) {
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
   * Returns related BPA files.
   *
   * @param bool $load
   *   If the returned files shall be load. If FALSE, array of fids is returned.
   *
   * @return array
   *   If load is TRUE array of files is returned,
   *   If load is FALSE array of fids is returned,
   *   If field is empty, empty array is returned.
   */
  public function getBpaFiles($load = TRUE) {
    if ($fieldBpaFies = $this->getEntity()->get('field_decreto_meet_bpa_files')) {
      if ($load) {
        return $fieldBpaFies->referencedEntities();
      }
      else {
        return array_column($fieldBpaFies->getValue(), 'target_id');
      }
    }

    return array();
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
    if ($key === FALSE) {
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
    if ($key !== FALSE) {
      $this->getEntity()->get('field_decreto_meet_bpa_files')->removeItem($key);
      if ($save) {
        $this->getEntity()->save();
      }
    }
  }

  /**
   * Refreshes the list of BPA files attached to the meeting.
   *
   * Is useful to check that all the attached files are still relevant, which
   * means they are still attached to the meetings related content, for example,
   * bullet point attachment.
   */
  public function refreshBpaFiles() {
    // Get the currently attached fids to the field.
    $bpaFileFieldFids = $this->getBpaFiles(FALSE);

    // Go through attached BPAs and get their fids.
    $bpaFileFids = [];
    $bps = $this->getBulletPoints();
    foreach ($bps as $bp) {
      $decretoBP = new DecretoBulletPoint($bp);

      $bpas = $decretoBP->getBulletPointAttachments();
      foreach ($bpas as $bpa) {
        $decretoBPA = new DecretoBulletPointAttachment($bpa);
        $fid = $decretoBPA->getFile(FALSE);
        $bpaFileFids[] = $fid;
      }
    }

    // Remove those that are no longer present.
    $removeFids = array_diff($bpaFileFieldFids, $bpaFileFids);
    foreach ($removeFids as $fid) {
      $this->removeBpaFile($fid, FALSE);
    }

    // Add those that are missing.
    $addFids = array_diff($bpaFileFids, $bpaFileFieldFids);
    foreach ($addFids as $fid) {
      $this->addBpaFile($fid, FALSE);
    }

    // Saving the meeting.
    $this->save();
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
   * Sets the BP list.
   *
   * @param array $bpList
   *   The array of BP references, formatted like:
   *   array(
   *     0 => ['target_id' => bp_1_id],
   *     1 => ['target_id' => bp_2_id]
   *     ...
   *   )
   * @param bool $save
   *   If meeting needs to be saved right away.
   *
   * @throws \Drupal\Core\Entity\EntityStorageException
   */
  public function setBulletPoints(array $bpList, $save = TRUE) {
    $this->getEntity()->set('field_decreto_meet_bps', $bpList);
    if ($save) {
      $this->getEntity()->save();
    }
  }

  /**
   * Adds the bullet point nid to meeting.
   *
   * Only does so if the node is not already added.
   * Saves the meeting as well.
   *
   * @param int $nid
   *   Nid of the node.
   * @param bool $save
   *   If meeting needs to be saved right away.
   *
   * @throws \Drupal\Core\Entity\EntityStorageException
   */
  public function addBulletPoint($nid, $save = TRUE) {
    $bps = $this->getEntity()->get('field_decreto_meet_bps')->getValue();
    $key = array_search($nid, array_column($bps, 'target_id'));
    if ($key === FALSE) {
      $this->getEntity()->get('field_decreto_meet_bps')->appendItem($nid);
      if ($save) {
        $this->getEntity()->save();
      }
    }
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
    if ($key !== FALSE) {
      $this->getEntity()->get('field_decreto_meet_bps')->removeItem($key);
      if ($save) {
        $this->getEntity()->save();
      }
    }
  }

  /**
   * Set the new order of the bullet points in this meeting.
   *
   * The meeting will only be updated if all the existing bullet points are
   * present in the provided order list.
   *
   * @param array $bulletPointsOrder
   *   Array structured like:
   *     array(
   *      'weight' => 'nid',
   *     ).
   *
   * @throws \Drupal\Core\Entity\EntityStorageException
   */
  public function reorderBulletPoints(array $bulletPointsOrder) {
    // Filtering the provided array, so that only existing bullet points
    // are to be added.
    $existingBpIds = $this->getBulletPoints(FALSE);
    $bulletPointsOrder = array_intersect($bulletPointsOrder, $existingBpIds);

    if (count($bulletPointsOrder) == count($existingBpIds)) {
      // Resetting keys.
      $bulletPointsOrder = array_values($bulletPointsOrder);

      // Updating value.
      $this->getEntity()->set('field_decreto_meet_bps', $bulletPointsOrder);
      $this->save();
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
    $query->condition('field_decreto_notif_meeting', $this->getEntity()->id());

    $ids = $query->execute();
    if (!empty($ids)) {
      return ($load) ? Message::loadMultiple($ids) : $ids;
    }

    return $ids;
  }

  /**
   * Check whether a given meeting has notes authored by user.
   *
   * @param \Drupal\user\UserInterface $user
   *   The note author.
   *
   * @return bool
   *   TRUE or FALSE.
   *
   * @throws \Drupal\Core\Entity\Exception\UnsupportedEntityTypeDefinitionException
   */
  public function hasUserNotes(UserInterface $user = NULL) {
    $bps = $this->getBulletPoints();
    foreach ($bps as $bp) {
      $decretoBP = new DecretoBulletPoint($bp);
      if ($decretoBP->hasUserNotes($user)) {
        return TRUE;
      }
    }

    return FALSE;
  }

  /**
   * Check whether a given meeting has memos authored by user.
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

    $count = 0;
    $bpIds = $this->getBulletPoints(FALSE);

    if (!empty($bpIds)) {
      $count = \Drupal::entityQuery('node')
        ->condition('uid', $user->id())
        ->condition('type', 'decreto_memo')
        ->condition('field_decreto_memo_bp', $bpIds, 'IN')
        ->count()
        ->execute();
    }

    return intval($count) > 0;
  }

  /**
   * Returns internal participants.
   *
   * @param bool $load
   *   If the returned users shall be load. If FALSE, array of uids is returned.
   *
   * @return array
   *   If load is TRUE array of users is returned,
   *   If load is FALSE array of uids is returned,
   *   If field is empty, empty array is returned.
   */
  public function getInternalParticipants($load = TRUE) {
    if ($fieldInternalParticipants = $this->getEntity()->get('field_decreto_meet_partic_int')) {
      if ($load) {
        return $fieldInternalParticipants->referencedEntities();
      }
      else {
        return array_column($fieldInternalParticipants->getValue(), 'target_id');
      }
    }

    return [];
  }

  /**
   * Removes user uid from meeting field_decreto_meet_partic_int field.
   *
   * Saves the meeting as well.
   *
   * @param int $uid
   *   Uid of the user.
   * @param bool $save
   *   If node needs to be saved right away.
   *
   * @throws \Drupal\Core\Entity\EntityStorageException
   */
  public function removeInternalParticipant($uid, $save = TRUE) {
    $users = $this->getEntity()->get('field_decreto_meet_partic_int')->getValue();
    $key = array_search($uid, array_column($users, 'target_id'));
    if ($key !== FALSE) {
      $this->getEntity()->get('field_decreto_meet_partic_int')->removeItem($key);
      if ($save) {
        $this->getEntity()->save();
      }
    }
  }

  /**
   * Returns external participants.
   *
   * @param bool $load
   *   If the returned users shall be load. If FALSE, array of uids is returned.
   *
   * @return array
   *   If load is TRUE array of users is returned,
   *   If load is FALSE array of uids is returned,
   *   If field is empty, empty array is returned.
   */
  public function getExternalParticipants($load = TRUE) {
    if ($fieldExternalParticipants = $this->getEntity()->get('field_decreto_meet_partic_ext')) {
      if ($load) {
        return $fieldExternalParticipants->referencedEntities();
      }
      else {
        return array_column($fieldExternalParticipants->getValue(), 'target_id');
      }
    }

    return [];
  }

  /**
   * Removes user uid from meeting field_decreto_meet_partic_ext field.
   *
   * Saves the meeting as well.
   *
   * @param int $uid
   *   Uid of the user.
   * @param bool $save
   *   If node needs to be saved right away.
   *
   * @throws \Drupal\Core\Entity\EntityStorageException
   */
  public function removeExternalParticipant($uid, $save = TRUE) {
    $users = $this->getEntity()->get('field_decreto_meet_partic_ext')->getValue();
    $key = array_search($uid, array_column($users, 'target_id'));
    if ($key !== FALSE) {
      $this->getEntity()->get('field_decreto_meet_partic_ext')->removeItem($key);
      if ($save) {
        $this->getEntity()->save();
      }
    }
  }

  /**
   * Returns all participants (both internal and external).
   *
   * Does a union of both lists, so that only unique participants are returned.
   *
   * @param bool $load
   *   If the returned users shall be load. If FALSE, array of uids is returned.
   *
   * @return array
   *   If load is TRUE array of users is returned,
   *   If load is FALSE array of uids is returned,
   *   If field is empty, empty array is returned.
   */
  public function getParticipants($load = TRUE) {
    $internalParticipants = $this->getInternalParticipants(FALSE);
    $internalParticipants = array_combine($internalParticipants, $internalParticipants);

    $externalParticipants = $this->getExternalParticipants(FALSE);
    $externalParticipants = array_combine($externalParticipants, $externalParticipants);

    $participants = $internalParticipants + $externalParticipants;
    if ($load) {
      return User::loadMultiple($participants);
    }
    else {
      return $participants;
    }
  }

  /**
   * Gets the user that is related by the specified role.
   *
   * @param int $roleId
   *   ID of the role.
   * @param bool $load
   *   If the returned user shall be load. If FALSE, id is returned.
   *   TRUE is default value.
   *
   * @return \Drupal\user\UserInterface|int|null
   *   If load is TRUE, User entity is returned,
   *   If load if FALSE, User ID is returned.
   *   If role has no user attached, null is returned.
   */
  public function getRoleUser($roleId, $load = TRUE) {
    // Finding if paragraphs for that already exists.
    $pids = \Drupal::entityQuery('paragraph')
      ->condition('type', 'decreto_meeting_user_role')
      ->condition('parent_id', $this->getEntity()->id())
      ->condition('field_decreto_mur_role', $roleId)
      ->execute();

    if (!empty($pids)) {
      $pid = reset($pids);
      $userRoleParagraph = Paragraph::load($pid);

      if ($fieldUser = $userRoleParagraph->get('field_decreto_mur_user')->first()) {
        if ($load) {
          return $fieldUser->get('entity')->getTarget()->getValue();
        }
        else {
          return $fieldUser->getValue()['target_id'];
        }
      }
    }

    return NULL;
  }

  /**
   * Adds the role-user connection to this meeting.
   *
   * If an relation already exists, it will be updated with new values.
   * If relation does not exist, it will be created first.
   *
   * @param int $roleId
   *   ID of the role.
   * @param int $userId
   *   ID of the meeting.
   * @param bool $save
   *   If meeting needs to be saved right away. TRUE is default value.
   *
   * @throws \Drupal\Core\Entity\EntityStorageException
   * @throws \Drupal\Core\TypedData\Exception\MissingDataException
   */
  public function addRole($roleId, $userId, $save = TRUE) {
    $userRoleParagraph = NULL;

    // Finding if paragraphs for that already exists.
    $pids = \Drupal::entityQuery('paragraph')
      ->condition('type', 'decreto_meeting_user_role')
      ->condition('parent_id', $this->getEntity()->id())
      ->condition('field_decreto_mur_role', $roleId)
      ->execute();

    if (!empty($pids)) {
      $pid = reset($pids);
      $userRoleParagraph = Paragraph::load($pid);

      $userRoleParagraph->set('field_decreto_mur_user', $userId);
    }
    else {
      $userRoleParagraph = Paragraph::create([
        'type' => 'decreto_meeting_user_role',
        'field_decreto_mur_role' => $roleId,
        'field_decreto_mur_user' => $userId,
      ]);
    }
    $userRoleParagraph->save();

    // Creating paragraph item.
    $item = [
      'target_id' => $userRoleParagraph->id(),
      'target_revision_id' => $userRoleParagraph->getRevisionId(),
    ];

    // Updating or adding this item.
    $userRoles = $this->getEntity()->get('field_decreto_meet_user_roles')->getValue();
    $key = array_search($userRoleParagraph->id(), array_column($userRoles, 'target_id'));
    if ($key !== FALSE) {
      $this->getEntity()->get('field_decreto_meet_user_roles')->set($key, $item);
    }
    else {
      $this->getEntity()->get('field_decreto_meet_user_roles')->appendItem($item);
    }

    if ($save) {
      $this->getEntity()->save();
    }
  }

  /**
   * Removes the role from meeting.
   *
   * Will also delete the paragraph used internally for storing the relation.
   *
   * @param int $roleId
   *   ID of the role.
   * @param bool $save
   *   If this meeting needs to be saved right away. TRUE is default value.
   *
   * @throws \Drupal\Core\Entity\EntityStorageException
   */
  public function removeRole($roleId, $save = TRUE) {
    // Finding if paragraphs for that already exists.
    $pids = \Drupal::entityQuery('paragraph')
      ->condition('type', 'decreto_meeting_user_role')
      ->condition('parent_id', $this->getEntity()->id())
      ->condition('field_decreto_mur_role', $roleId)
      ->execute();

    if (!empty($pids)) {
      $pid = reset($pids);

      $userRoles = $this->getEntity()->get('field_decreto_meet_user_roles')->getValue();
      $key = array_search($pid, array_column($userRoles, 'target_id'));
      if ($key !== FALSE) {
        $this->getEntity()->get('field_decreto_meet_user_roles')->removeItem($key);

        Paragraph::load($pid)->delete();
        if ($save) {
          $this->getEntity()->save();
        }
      }
    }
  }

}
