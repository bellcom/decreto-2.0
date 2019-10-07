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
   * Performs the permission check as first step.
   *
   * @param \Drupal\taxonomy\TermInterface $department
   *   Department term.
   *
   * @return \Drupal\Core\Access\AccessResultInterface
   *   The access result.
   *
   * @throws \Drupal\Core\TypedData\Exception\MissingDataException
   */
  public static function editDepartmentAccess(TermInterface $department) {
    if (\Drupal::currentUser()->hasPermission('edit terms in decreto_tax_department')) {
      return AccessResult::allowed();
    }

    $decretoDepartment = new DecretoDepartment($department);

    if ($decretoDepartment->isDepartmentAdmin(\Drupal::currentUser())) {
      return AccessResult::allowed();
    }
    else {
      return AccessResult::neutral();
    }
  }

  /**
   * Returns if department can be deleted.
   *
   * Performs the permission check as first step.
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

    if ($user->hasPermission('delete terms in decreto_tax_department')) {
      return AccessResult::allowed();
    }

    $decretoDepartment = new DecretoDepartment($department);

    if ($decretoDepartment->isDepartmentAdmin(\Drupal::currentUser())) {
      return AccessResult::allowed();
    }
    else {
      return AccessResult::neutral();
    }
  }

}
