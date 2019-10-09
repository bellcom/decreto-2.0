<?php

namespace Drupal\decreto_department\Controller;

use Drupal\Core\Access\AccessResult;
use Drupal\Core\Session\AccountInterface;
use Drupal\decreto_department\Entity\DecretoDepartment;
use Drupal\taxonomy\TermInterface;

/**
 * Controller for the access rights for CRUD operations on Decreto Department.
 *
 * @package Drupal\decreto_department\Controller
 */
class AccessController {

  /**
   * Returns if department can be edited.
   *
   * @param \Drupal\taxonomy\TermInterface $department
   *   Department term.
   * @param \Drupal\Core\Session\AccountInterface|null $user
   *   User to check against.
   *
   * @return \Drupal\Core\Access\AccessResultInterface
   *   The access result.
   *
   * @throws \Drupal\Core\TypedData\Exception\MissingDataException
   */
  public static function editDepartmentAccess(TermInterface $department, AccountInterface $user = NULL) {
    if (!$user) {
      $user = \Drupal::currentUser();
    }

    $decretoDepartment = new DecretoDepartment($department);

    if ($decretoDepartment->isDepartmentAdmin($user)) {
      return AccessResult::allowed();
    }
    else {
      return AccessResult::neutral();
    }
  }

  /**
   * Returns if department can be deleted.
   *
   * @param \Drupal\taxonomy\TermInterface $department
   *   Department term.
   * @param \Drupal\Core\Session\AccountInterface|null $user
   *   User to check against.
   *
   * @return \Drupal\Core\Access\AccessResultInterface
   *   The access result.
   *
   * @throws \Drupal\Core\TypedData\Exception\MissingDataException
   */
  public static function deleteDepartmentAccess(TermInterface $department, AccountInterface $user = NULL) {
    if (!$user) {
      $user = \Drupal::currentUser();
    }

    $decretoDepartment = new DecretoDepartment($department);

    if ($decretoDepartment->isDepartmentAdmin($user)) {
      return AccessResult::allowed();
    }
    else {
      return AccessResult::neutral();
    }
  }

}
