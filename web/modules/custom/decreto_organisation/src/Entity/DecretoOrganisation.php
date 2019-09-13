<?php

namespace Drupal\decreto_organisation\Entity;

use Drupal\decreto_content_modify\Entity\DecretoNode;
use Drupal\taxonomy\Entity\Term;

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

}
