<?php

namespace Drupal\decreto_department\Entity;

use Drupal\Core\Session\AccountProxyInterface;
use Drupal\node\Entity\Node;
use Drupal\paragraphs\Entity\Paragraph;
use Drupal\taxonomy\TermInterface;
use Drupal\user\Entity\User;

/**
 * Wrapper for Department object.
 *
 * Allows to perform commonly used procedures in a more efficient way.
 */
class DecretoDepartment {
  protected $department;

  /**
   * DecretoUser constructor.
   *
   * @param \Drupal\taxonomy\TermInterface $department
   *   Department object.
   */
  public function __construct(TermInterface $department) {
    $this->department = $department;
  }

  /**
   * Returns original term entity.
   *
   * @return \Drupal\taxonomy\TermInterface
   *   User object.
   */
  public function getEntity() {
    return $this->department;
  }

  /**
   * Returns department admin user.
   *
   * @param bool $load
   *   If the returned user shall be load. If FALSE, uid is returned.
   *
   * @return \Drupal\user\Entity\User|int|null
   *   User object, or User id.
   *   NULL is nothing is found.
   *
   * @throws \Drupal\Core\TypedData\Exception\MissingDataException
   */
  public function getDepartmentAdmin($load = TRUE) {
    if ($fieldDepartmentAdmin = $this->getEntity()->get('field_decreto_dep_admin')->first()) {
      if ($load) {
        return $fieldDepartmentAdmin->get('entity')->getTarget()->getValue();
      }
      else {
        return $fieldDepartmentAdmin->getValue()['target_id'];
      }
    }

    return NULL;
  }

  /**
   * Checks if a provided user is a department admin.
   *
   * @param \Drupal\Core\Session\AccountProxyInterface $currentUser
   *   User to check against.
   *
   * @return bool
   *   TRUE if the user is a department admin,
   *   FALSE otherwise.
   *
   * @throws \Drupal\Core\TypedData\Exception\MissingDataException
   */
  public function isDepartmentAdmin(AccountProxyInterface $currentUser) {
    $departmendAdminUid = $this->getDepartmentAdmin(FALSE);

    if ($departmendAdminUid == \Drupal::currentUser()->id()) {
      return TRUE;
    }

    return FALSE;
  }

  /**
   * Returns related organisation.
   *
   * @param bool $load
   *   If the returned node shall be load. If FALSE, nid is returned.
   *
   * @return \Drupal\Node\NodeInterface|int|null
   *   Organisation node, or Organisation nid.
   *   NULL is nothing is found.
   *
   * @throws \Drupal\Core\TypedData\Exception\MissingDataException
   */
  public function getOrganisation($load = TRUE) {
    if ($fieldOrganisation = $this->getEntity()->get('field_decreto_dep_org')->first()) {
      if ($load) {
        return $fieldOrganisation->get('entity')->getTarget()->getValue();
      }
      else {
        return $fieldOrganisation->getValue()['target_id'];
      }
    }

    return NULL;
  }

  /**
   * Returns users from this department.
   *
   * @param bool $load
   *   If the returned users shall be load. If FALSE, array of ids is returned.
   *
   * @return array
   *   If load is TRUE array of users is returned,
   *   If load is FALSE array of uids is returned,
   *   If field is empty, empty array is returned.
   */
  public function getUsers($load = TRUE) {
    $query = \Drupal::entityQuery('user')
      ->condition('field_decreto_usr_departments', $this->getEntity()->id(), 'IN');

    $uids = $query->execute();
    if (!empty($uids)) {
      return ($load) ? User::loadMultiple($uids) : $uids;
    }
    return [];
  }

  /**
   * Returns related meetings.
   *
   * @param bool $load
   *   If the returned nodes shall be load. If FALSE, array of ids is returned.
   *
   * @return array
   *   If load is TRUE array of nodes is returned,
   *   If load is FALSE array of nids is returned,
   *   If field is empty, empty array is returned.
   */
  public function getMeetings($load = TRUE) {
    $query = \Drupal::entityQuery('node')
      ->condition('field_decreto_meet_department', $this->getEntity()->id());

    $nids = $query->execute();
    if (!empty($nids)) {
      return ($load) ? Node::loadMultiple($nids) : $nids;
    }
    return [];
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
      ->condition('type', 'decreto_department_user_role')
      ->condition('parent_id', $this->getEntity()->id())
      ->condition('field_decreto_dur_role', $roleId)
      ->execute();

    if (!empty($pids)) {
      $pid = reset($pids);
      $userRoleParagraph = Paragraph::load($pid);

      if ($fieldUser = $userRoleParagraph->get('field_decreto_dur_user')->first()) {
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
   * Gets the role that is related by the specified user.
   *
   * @param int $userId
   *   ID of the user.
   * @param bool $load
   *   If the returned user shall be load. If FALSE, id is returned.
   *   TRUE is default value.
   *
   * @return \Drupal\taxonomy\TermInterface|int|null
   *   If load is TRUE, Term entity is returned,
   *   If load if FALSE, Term ID is returned.
   *   If user has no role attached, null is returned.
   */
  public function getUserRole($userId, $load = TRUE) {
    // Finding if paragraphs for that already exists.
    $pids = \Drupal::entityQuery('paragraph')
      ->condition('type', 'decreto_department_user_role')
      ->condition('parent_id', $this->getEntity()->id())
      ->condition('field_decreto_dur_user', $userId)
      ->execute();

    if (!empty($pids)) {
      $pid = reset($pids);
      $userRoleParagraph = Paragraph::load($pid);

      if ($fieldRole = $userRoleParagraph->get('field_decreto_dur_role')->first()) {
        if ($load) {
          return $fieldRole->get('entity')->getTarget()->getValue();
        }
        else {
          return $fieldRole->getValue()['target_id'];
        }
      }
    }

    return NULL;
  }

  /**
   * Adds the role-user connection to this department.
   *
   * If an relation already exists, it will be updated with new values.
   * If relation does not exist, it will be created first.
   *
   * @param int $roleId
   *   ID of the role.
   * @param int $userId
   *   ID of the meeting.
   * @param bool $save
   *   If department need to be saved right away. TRUE is default value.
   *
   * @throws \Drupal\Core\Entity\EntityStorageException
   * @throws \Drupal\Core\TypedData\Exception\MissingDataException
   */
  public function addRole($roleId, $userId, $save = TRUE) {
    $userRoleParagraph = NULL;

    // Finding if paragraphs for that already exists.
    $pids = \Drupal::entityQuery('paragraph')
      ->condition('type', 'decreto_department_user_role')
      ->condition('parent_id', $this->getEntity()->id())
      ->condition('field_decreto_dur_role', $roleId)
      ->execute();

    if (!empty($pids)) {
      $pid = reset($pids);
      $userRoleParagraph = Paragraph::load($pid);

      $userRoleParagraph->set('field_decreto_dur_user', $userId);
    }
    else {
      $userRoleParagraph = Paragraph::create([
        'type' => 'decreto_department_user_role',
        'field_decreto_dur_role' => $roleId,
        'field_decreto_dur_user' => $userId,
      ]);
    }
    $userRoleParagraph->save();

    // Creating paragraph item.
    $item = [
      'target_id' => $userRoleParagraph->id(),
      'target_revision_id' => $userRoleParagraph->getRevisionId(),
    ];

    // Updating or adding this item.
    $userRoles = $this->getEntity()->get('field_decreto_dep_user_roles')->getValue();
    $key = array_search($userRoleParagraph->id(), array_column($userRoles, 'target_id'));
    if ($key !== FALSE) {
      $this->getEntity()->get('field_decreto_dep_user_roles')->set($key, $item);
    }
    else {
      $this->getEntity()->get('field_decreto_dep_user_roles')->appendItem($item);
    }

    if ($save) {
      $this->getEntity()->save();
    }
  }

  /**
   * Removes the role from department.
   *
   * Will also delete the paragraph used internally for storing the relation.
   *
   * @param int $roleId
   *   ID of the role.
   * @param bool $save
   *   If this department needs to be saved right away. TRUE is default value.
   *
   * @throws \Drupal\Core\Entity\EntityStorageException
   */
  public function removeRole($roleId, $save = TRUE) {
    // Finding if paragraphs for that already exists.
    $pids = \Drupal::entityQuery('paragraph')
      ->condition('type', 'decreto_department_user_role')
      ->condition('parent_id', $this->getEntity()->id())
      ->condition('field_decreto_dur_role', $roleId)
      ->execute();

    if (!empty($pids)) {
      $pid = reset($pids);

      $userRoles = $this->getEntity()->get('field_decreto_dep_user_roles')->getValue();
      $key = array_search($pid, array_column($userRoles, 'target_id'));
      if ($key !== FALSE) {
        $this->getEntity()->get('field_decreto_dep_user_roles')->removeItem($key);

        Paragraph::load($pid)->delete();
        if ($save) {
          $this->getEntity()->save();
        }
      }
    }
  }

}
