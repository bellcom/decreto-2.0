<?php

namespace Drupal\decreto_user\Entity;

use Drupal\decreto_annotator\Entity\Note;
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
   * Only does so if the department is not already added.
   * Saves the user as well.
   *
   * @param int $departmentId
   *   Department ID.
   * @param bool $save
   *   If user object needs to be saved right away.
   *
   * @throws \Drupal\Core\Entity\EntityStorageException
   */
  public function addDepartment($departmentId, $save = TRUE) {
    $userDepartments = $this->getEntity()->get('field_decreto_usr_departments')->getValue();
    $key = array_search($departmentId, array_column($userDepartments, 'target_id'));
    if ($key === FALSE) {
      $this->getEntity()->get('field_decreto_usr_departments')->appendItem($departmentId);
      if ($save) {
        $this->getEntity()->save();
      }
    }
  }

  /**
   * Removes department from the user.
   *
   * If department is not added to user, nothing is done.
   * Saves the user as well.
   *
   * @param int $departmentId
   *   Department ID.
   * @param bool $save
   *   If user object needs to be saved right away.
   *
   * @throws \Drupal\Core\Entity\EntityStorageException
   */
  public function removeDepartment($departmentId, $save = TRUE) {
    $userDepartments = $this->getEntity()->get('field_decreto_usr_departments')->getValue();
    $key = array_search($departmentId, array_column($userDepartments, 'target_id'));
    if ($key !== FALSE) {
      $this->getEntity()->get('field_decreto_usr_departments')->removeItem($key);
      if ($save) {
        $this->getEntity()->save();
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
   * Only does so if the organisation is not already added.
   * Saves the user as well.
   *
   * @param int $organisationId
   *   Organisation ID.
   * @param bool $save
   *   If user object needs to be saved right away.
   *
   * @throws \Drupal\Core\Entity\EntityStorageException
   */
  public function addOrganisation($organisationId, $save = TRUE) {
    $userOrganisations = $this->getEntity()->get('field_decreto_usr_orgs')->getValue();
    $key = array_search($organisationId, array_column($userOrganisations, 'target_id'));
    if ($key === FALSE) {
      $this->getEntity()->get('field_decreto_usr_orgs')->appendItem($organisationId);
      if ($save) {
        $this->getEntity()->save();
      }
    }
  }

  /**
   * Removes organisation from the user.
   *
   * If organisation is not added to user, nothing is done.
   * Saves the user as well.
   *
   * @param int $organisationId
   *   Organisation ID.
   * @param bool $save
   *   If user object needs to be saved right away.
   *
   * @throws \Drupal\Core\Entity\EntityStorageException
   */
  public function removeOrganisation($organisationId, $save = TRUE) {
    $userOrganisations = $this->getEntity()->get('field_decreto_usr_orgs')->getValue();
    $key = array_search($organisationId, array_column($userOrganisations, 'target_id'));
    if ($key !== FALSE) {
      $this->getEntity()->get('field_decreto_usr_orgs')->removeItem($key);
      if ($save) {
        $this->getEntity()->save();
      }
    }
  }

  /**
   * Returns user departments.
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
  public function getDepartments($load = TRUE) {
    if ($fieldUsrDepartments = $this->getEntity()->get('field_decreto_usr_departments')) {
      if ($load) {
        return $fieldUsrDepartments->referencedEntities();
      }
      else {
        return array_column($fieldUsrDepartments->getValue(), 'target_id');
      }
    }

    return array();
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

  /**
   * Returns related notes.
   *
   * @param bool $load
   *   If the returned note shall be load. If FALSE, array of ids is returned.
   *
   * @return array
   *   If load is TRUE array of notes is returned,
   *   If load is FALSE array of ids is returned,
   *   If field is empty, empty array is returned.
   */
  public function getNotes($load = TRUE) {
    $query = \Drupal::entityQuery('decreto_annotator_note')
      ->condition('uid', $this->getEntity()->id());

    $ids = $query->execute();
    if (!empty($ids)) {
      return ($load) ? Note::loadMultiple($ids) : $ids;
    }

    return array();
  }

  /**
   * Returns related internal meetings.
   *
   * @param bool $load
   *   If the returned nodes shall be load. If FALSE, array of nids is returned.
   *
   * @return array
   *   If load is TRUE array of nodes is returned,
   *   If load is FALSE array of nids is returned,
   *   If field is empty, empty array is returned.
   */
  public function getInternalMeetings($load = TRUE) {
    $query = \Drupal::entityQuery('node')
      ->condition('type', 'decreto_meeting')
      ->condition('field_decreto_meet_partic_int', $this->getEntity()->id());

    $nids = $query->execute();
    if (!empty($nids)) {
      return ($load) ? Node::loadMultiple($nids) : $nids;
    }

    return array();
  }

  /**
   * Returns related external meetings.
   *
   * @param bool $load
   *   If the returned nodes shall be load. If FALSE, array of nids is returned.
   *
   * @return array
   *   If load is TRUE array of nodes is returned,
   *   If load is FALSE array of nids is returned,
   *   If field is empty, empty array is returned.
   */
  public function getExternalMeetings($load = TRUE) {
    $query = \Drupal::entityQuery('node')
      ->condition('type', 'decreto_meeting')
      ->condition('field_decreto_meet_partic_ext', $this->getEntity()->id());

    $nids = $query->execute();
    if (!empty($nids)) {
      return ($load) ? Node::loadMultiple($nids) : $nids;
    }

    return array();
  }

}
