<?php

namespace Drupal\decreto_user\Entity;

use Drupal\user\UserInterface;

/**
 * Wrapper for User object.
 *
 * Allows to perform commonly used procedures in a more efficient way.
 */
class DecretoUser {
  protected $user;

  /**
   * DecretoUser constructor.
   *
   * @param \Drupal\user\UserInterface $user
   *   User object.
   */
  public function __construct(UserInterface $user) {
    $this->user = $user;
  }

  /**
   * Returns original node entity.
   *
   * @return \Drupal\user\UserInterface
   *   User object.
   */
  public function getEntity() {
    return $this->user;
  }

  /**
   * Adds department to the user.
   *
   * @param int $departmentId
   *   Department ID.
   * @param bool $save
   *   If user object needs to be saved right away.
   *
   * @throws \Drupal\Core\Entity\EntityStorageException
   */
  public function addDepartment($departmentId, $save = TRUE) {
    $this->user->field_decreto_usr_departments[] = ['target_id' => $departmentId];
    if ($save) {
      $this->user->save();
    }
  }

  /**
   * Removes department from the user.
   *
   * If department is not added to user, nothing is done.
   *
   * @param int $departmentId
   *   Department ID.
   * @param bool $save
   *   If user object needs to be saved right away.
   *
   * @throws \Drupal\Core\Entity\EntityStorageException
   */
  public function removeDepartment($departmentId, $save = TRUE) {
    $departmentIsPresent = FALSE;

    $userDepartments = $this->user->field_decreto_usr_departments->getValue();

    foreach ($userDepartments as $delta => $userDepartment) {
      if ($userDepartment['target_id'] == $departmentId) {
        $departmentIsPresent = TRUE;
        unset($userDepartments[$delta]);
        break;
      }
    }

    if ($departmentIsPresent) {
      $this->user->field_decreto_usr_departments = $userDepartments;

      if ($save) {
        $this->user->save();
      }
    }
  }

}
