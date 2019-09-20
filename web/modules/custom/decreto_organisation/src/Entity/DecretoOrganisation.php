<?php

namespace Drupal\decreto_organisation\Entity;

use Drupal\decreto_content_modify\Entity\DecretoNode;
use Drupal\taxonomy\Entity\Term;
use Drupal\user\Entity\User;

/**
 * Wrapper for Decreto Organisation.
 *
 * Allows to perform commonly used procedures in a more efficient way.
 */
class DecretoOrganisation extends DecretoNode {

  /**
   * {@inheritdoc}
   */
  public function getEntityType() {
    return 'decreto_organisation';
  }

  /**
   * Returns related departments.
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
    $query = \Drupal::entityQuery('taxonomy_term')
      ->condition('vid', 'decreto_tax_department')
      ->condition('field_decreto_dep_org', $this->getEntity()->id());

    $tids = $query->execute();
    if (!empty($tids)) {
      return ($load) ? Term::loadMultiple($tids) : $tids;
    }

    return array();
  }

  /**
   * Returns related locations.
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
  public function getLocations($load = TRUE) {
    $query = \Drupal::entityQuery('taxonomy_term')
      ->condition('vid', 'decreto_tax_location')
      ->condition('field_decreto_loc_org', $this->getEntity()->id());

    $tids = $query->execute();
    if (!empty($tids)) {
      return ($load) ? Term::loadMultiple($tids) : $tids;
    }

    return array();
  }

  /**
   * Returns organisation users..
   *
   * @param bool $load
   *   If the returned users shall be load. If FALSE, array of uids is
   *   returned.
   *
   * @return array
   *   If load is TRUE array of users is returned,
   *   If load is FALSE array of uids is returned,
   *   If field is empty, empty array is returned.
   */
  public function getUsers($load = TRUE) {
    $query = \Drupal::entityQuery('user')
      ->condition('status', 1)
      ->condition('field_decreto_usr_orgs', $this->getEntity()->id());

    $uids = $query->execute();
    if (!empty($uids)) {
      return ($load) ? User::loadMultiple($uids) : $uids;
    }

    return array();
  }

}
