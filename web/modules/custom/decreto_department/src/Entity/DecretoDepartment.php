<?php

namespace Drupal\decreto_department\Entity;

use Drupal\Core\Session\AccountProxyInterface;
use Drupal\node\Entity\Node;
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

}
