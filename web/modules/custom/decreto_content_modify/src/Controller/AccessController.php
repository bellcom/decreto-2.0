<?php

namespace Drupal\decreto_content_modify\Controller;

use Drupal\Core\Access\AccessResult;
use Drupal\Core\Session\AccountInterface;
use Drupal\decreto_content_modify\Entity\DecretoBulletPoint;
use Drupal\decreto_content_modify\Entity\DecretoBulletPointAttachment;
use Drupal\decreto_content_modify\Entity\DecretoMeeting;
use Drupal\decreto_department\Entity\DecretoDepartment;
use Drupal\decreto_user\Entity\DecretoUser;
use Drupal\node\NodeInterface;
use Drupal\user\Entity\User;

/**
 * Controller for the access rights for CRUD operations on Decreto agenda
 * content.
 *
 * @package Drupal\decreto_content_modify\Controller
 */
class AccessController {

  /**
   * Returns if meeting can be created.
   *
   * Performs the permission check as first step.
   *
   * Checks if user has at least one department he is an admin of.
   *
   * @return \Drupal\Core\Access\AccessResultInterface
   *   The access result.
   */
  public static function createMeetingAccess() {
    if (\Drupal::currentUser()->hasPermission('create decreto_meeting content')) {
      return AccessResult::allowed();
    }

    $user = User::load(\Drupal::currentUser()->id());
    $decretoUser = new DecretoUser($user);

    if (!empty($decretoUser->getAdminDepartments(FALSE))) {
      return AccessResult::allowed();
    }
    else {
      return AccessResult::neutral();
    }
  }

  /**
   * Returns if meeting can be edited.
   *
   * @param \Drupal\node\NodeInterface $meeting
   *   Meeting node.
   * @param \Drupal\Core\Session\AccountInterface|null $user
   *   User to check against.
   *
   * @return \Drupal\Core\Access\AccessResultInterface
   *   The access result.
   *
   * @throws \Drupal\Core\Entity\Exception\UnsupportedEntityTypeDefinitionException
   * @throws \Drupal\Core\TypedData\Exception\MissingDataException
   */
  public static function editMeetingAccess(NodeInterface $meeting, AccountInterface $user = NULL) {
    if (!$user) {
      $user = \Drupal::currentUser();
    }

    $decretoMeeting = new DecretoMeeting($meeting);
    $department = $decretoMeeting->getDepartment();
    if ($department) {
      $decretoDepartment = new DecretoDepartment($department);

      if ($decretoDepartment->isDepartmentAdmin($user)) {
        return AccessResult::allowed();
      }
    }

    return AccessResult::neutral();
  }

  /**
   * Returns if meeting can be deleted.
   *
   * Does not performs the permission.
   *
   * @param \Drupal\node\NodeInterface $meeting
   *   Meeting node.
   * @param \Drupal\Core\Session\AccountInterface|null $user
   *   User to check against.
   *
   * @return \Drupal\Core\Access\AccessResultInterface
   *   The access result.
   *
   * @throws \Drupal\Core\Entity\Exception\UnsupportedEntityTypeDefinitionException
   * @throws \Drupal\Core\TypedData\Exception\MissingDataException
   */
  public static function deleteMeetingAccess(NodeInterface $meeting, AccountInterface $user = NULL) {
    if (!$user) {
      $user = \Drupal::currentUser();
    }

    $decretoMeeting = new DecretoMeeting($meeting);
    $department = $decretoMeeting->getDepartment();
    if ($department) {
      $decretoDepartment = new DecretoDepartment($department);

      if ($decretoDepartment->isDepartmentAdmin($user)) {
        return AccessResult::allowed();
      }
    }

    return AccessResult::neutral();
  }

  /**
   * Returns if a closed content of the meeting can be viewed.
   *
   * @param \Drupal\node\NodeInterface $meeting
   *   Meeting node.
   * @param \Drupal\Core\Session\AccountInterface|null $user
   *   User to check against.
   *
   * @return \Drupal\Core\Access\AccessResultInterface
   *   The access result.
   *
   * @throws \Drupal\Core\Entity\Exception\UnsupportedEntityTypeDefinitionException
   * @throws \Drupal\Core\TypedData\Exception\MissingDataException
   */
  public static function viewMeetingClosedContentAccess(NodeInterface $meeting, AccountInterface $user = NULL) {
    if (!$user) {
      $user = \Drupal::currentUser();
    }

    // User has permission to access any closed content.
    if ($user->hasPermission('access decreto closed content')) {
      return AccessResult::allowed();
    }

    $decretoMeeting = new DecretoMeeting($meeting);

    // Checking is user is an admin of meeting department.
    $department = $decretoMeeting->getDepartment();
    if ($department) {
      $decretoDepartment = new DecretoDepartment($department);
      if ($decretoDepartment->isDepartmentAdmin($user)) {
        return AccessResult::allowed();
      }
    }

    // Checking if user is part of internal participants.
    $internal_participants_id = $decretoMeeting->getInternalParticipants(FALSE);
    if (in_array($user->id(), $internal_participants_id)) {
      return AccessResult::allowed();
    }

    // None of the above.
    return AccessResult::forbidden('Cannot access meeting closed content');
  }

  /**
   * Returns if bullet point can be created.
   *
   * Performs the permission check as first step.
   *
   * @param \Drupal\node\NodeInterface $meeting
   *   Meeting node.
   *
   * @return \Drupal\Core\Access\AccessResultInterface
   *   The access result.
   *
   * @see editMeetingAccess()
   *
   * @throws \Drupal\Core\Entity\Exception\UnsupportedEntityTypeDefinitionException
   * @throws \Drupal\Core\TypedData\Exception\MissingDataException
   */
  public static function createBulletPointAccess(NodeInterface $meeting) {
    if (\Drupal::currentUser()->hasPermission('create decreto_bullet_point content')) {
      return AccessResult::allowed();
    }

    return AccessController::editMeetingAccess($meeting);
  }

  /**
   * Returns if bullet point can be edited.
   *
   * @param \Drupal\node\NodeInterface $bullet_point
   *   Bullet point node.
   * @param \Drupal\Core\Session\AccountInterface|null $user
   *   User to check against.
   *
   * @return \Drupal\Core\Access\AccessResultInterface
   *   The access result.
   *
   * @see editMeetingAccess()
   *
   * @throws \Drupal\Core\Entity\Exception\UnsupportedEntityTypeDefinitionException
   * @throws \Drupal\Core\TypedData\Exception\MissingDataException
   */
  public static function editBulletPointAccess(NodeInterface $bullet_point, AccountInterface $user = NULL) {
    if (!$user) {
      $user = \Drupal::currentUser();
    }

    $decretoBulletPoint = new DecretoBulletPoint($bullet_point);
    $meeting = $decretoBulletPoint->getMeeting();

    return AccessController::editMeetingAccess($meeting, $user);
  }

  /**
   * Returns if bullet point can be deleted.
   *
   * @param \Drupal\node\NodeInterface $node
   *   Bullet point node.
   * @param \Drupal\Core\Session\AccountInterface|null $user
   *   User to check against.
   *
   * @return \Drupal\Core\Access\AccessResultInterface
   *   The access result.
   *
   * @throws \Drupal\Core\Entity\Exception\UnsupportedEntityTypeDefinitionException
   * @throws \Drupal\Core\TypedData\Exception\MissingDataException
   */
  public static function deleteBulletPointAccess(NodeInterface $node, AccountInterface $user = NULL) {
    if (!$user) {
      $user = \Drupal::currentUser();
    }

    $decretoBulletPoint = new DecretoBulletPoint($node);
    $meeting = $decretoBulletPoint->getMeeting();

    $decretoMeeting = new DecretoMeeting($meeting);
    $department = $decretoMeeting->getDepartment();
    if ($department) {
      $decretoDepartment = new DecretoDepartment($department);

      if ($decretoDepartment->isDepartmentAdmin($user)) {
        return AccessResult::allowed();
      }
    }

    return AccessResult::neutral();
  }

  /**
   * Returns if bullet point attachment can be created.
   *
   * Performs the permission check as first step.
   *
   * @param \Drupal\node\NodeInterface $bullet_point
   *   Bullet point node.
   *
   * @return \Drupal\Core\Access\AccessResultInterface
   *   The access result.
   *
   * @see editMeetingAccess()
   *
   * @throws \Drupal\Core\Entity\Exception\UnsupportedEntityTypeDefinitionException
   * @throws \Drupal\Core\TypedData\Exception\MissingDataException
   */
  public static function createBulletPointAttachmentAccess(NodeInterface $bullet_point) {
    if (\Drupal::currentUser()->hasPermission('create decreto_bullet_point_attachment content')) {
      return AccessResult::allowed();
    }

    $decretoBulletPoint = new DecretoBulletPoint($bullet_point);
    $meeting = $decretoBulletPoint->getMeeting();

    return AccessController::editMeetingAccess($meeting);
  }

  /**
   * Returns if bullet point attachment can be edited.
   *
   * @param \Drupal\node\NodeInterface $bullet_point_attachment
   *   Bullet point attachment node.
   * @param \Drupal\Core\Session\AccountInterface|null $user
   *   User to check against.
   *
   * @return \Drupal\Core\Access\AccessResultInterface
   *   The access result.
   *
   * @see editMeetingAccess()
   *
   * @throws \Drupal\Core\Entity\Exception\UnsupportedEntityTypeDefinitionException
   * @throws \Drupal\Core\TypedData\Exception\MissingDataException
   */
  public static function editBulletPointAttachmentAccess(NodeInterface $bullet_point_attachment, AccountInterface $user = NULL) {
    if (!$user) {
      $user = \Drupal::currentUser();
    }

    $decretoBPA = new DecretoBulletPointAttachment($bullet_point_attachment);
    $meeting = $decretoBPA->getMeeting();

    return AccessController::editMeetingAccess($meeting, $user);
  }

  /**
   * Returns if bullet point attachment can be deleted.
   *
   * @param \Drupal\node\NodeInterface $node
   *   Bullet point attachment node.
   * @param \Drupal\Core\Session\AccountInterface|null $user
   *   User to check against.
   *
   * @return \Drupal\Core\Access\AccessResultInterface
   *   The access result.
   *
   * @throws \Drupal\Core\Entity\Exception\UnsupportedEntityTypeDefinitionException
   * @throws \Drupal\Core\TypedData\Exception\MissingDataException
   */
  public static function deleteBulletPointAttachmentAccess(NodeInterface $node, AccountInterface $user = NULL) {
    if (!$user) {
      $user = \Drupal::currentUser();
    }

    $decretoBPA = new DecretoBulletPointAttachment($node);
    $meeting = $decretoBPA->getMeeting();

    $decretoMeeting = new DecretoMeeting($meeting);
    $department = $decretoMeeting->getDepartment();
    if ($department) {
      $decretoDepartment = new DecretoDepartment($department);

      if ($decretoDepartment->isDepartmentAdmin($user)) {
        return AccessResult::allowed();
      }
    }

    return AccessResult::neutral();
  }

}
