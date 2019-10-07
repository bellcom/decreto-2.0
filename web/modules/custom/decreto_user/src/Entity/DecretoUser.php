<?php

namespace Drupal\decreto_user\Entity;

use Drupal\node\Entity\Node;
use Drupal\taxonomy\Entity\Term;
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

  /**
   * Returns user organisations.
   *
   * @param bool $load
   *   If the returned nodes shall be load. If FALSE, array of nids is returned.
   *
   * @return array
   *   If load is TRUE array of nodes is returned,
   *   If load is FALSE array of nids is returned,
   *   If field is empty, empty array is returned.
   */
  public function getOrganisations($load = TRUE) {
    if ($fieldOrgs = $this->getEntity()->get('field_decreto_usr_orgs')) {
      if ($load) {
        return $fieldOrgs->referencedEntities();
      }
      else {
        return array_column($fieldOrgs->getValue(), 'target_id');
      }
    }

    return array();
  }

  /**
   * Adds organisation to the user.
   *
   * @param int $organisationId
   *   Organisation ID.
   * @param bool $save
   *   If user object needs to be saved right away.
   *
   * @throws \Drupal\Core\Entity\EntityStorageException
   */
  public function addOrganisation($organisationId, $save = TRUE) {
    $this->user->field_decreto_usr_orgs[] = ['target_id' => $organisationId];
    if ($save) {
      $this->user->save();
    }
  }

  /**
   * Removes organisation from the user.
   *
   * If organisation is not added to user, nothing is done.
   *
   * @param int $organisationId
   *   Organisation ID.
   * @param bool $save
   *   If user object needs to be saved right away.
   *
   * @throws \Drupal\Core\Entity\EntityStorageException
   */
  public function removeOrganisation($organisationId, $save = TRUE) {
    $organisationIsPresent = FALSE;

    $userOrganisations = $this->user->field_decreto_usr_orgs->getValue();

    foreach ($userOrganisations as $delta => $userOrganisation) {
      if ($userOrganisation['target_id'] == $organisationId) {
        $organisationIsPresent = TRUE;
        unset($userOrganisations[$delta]);
        break;
      }
    }

    if ($organisationIsPresent) {
      $this->user->field_decreto_usr_orgs = $userOrganisations;

      if ($save) {
        $this->user->save();
      }
    }
  }

  /**
   * Returns departments, which user is admin of.
   *
   * @param bool $load
   *   If the returned taxonomy terms shall be load. If FALSE, array of tids is
   *   returned.
   *
   * @return array
   *   If load is TRUE array of taxonomy terms is returned,
   *   If load is FALSE array of tids is returned,
   *   If field is empty, empty array is returned.
   */
  public function getAdminDepartments($load = TRUE) {
    $query = \Drupal::entityQuery('taxonomy_term')
      ->condition('vid', 'decreto_tax_department')
      ->condition('field_decreto_dep_admin', $this->getEntity()->id());

    $tids = $query->execute();
    if (!empty($tids)) {
      return ($load) ? Term::loadMultiple($tids) : $tids;
    }

    return array();
  }

}
