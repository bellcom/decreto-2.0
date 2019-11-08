<?php

namespace Drupal\decreto_location\Entity;

use Drupal\node\Entity\Node;
use Drupal\taxonomy\TermInterface;

/**
 * Wrapper for Location object.
 *
 * Allows to perform commonly used procedures in a more efficient way.
 */
class DecretoLocation {
  protected $location;

  /**
   * DecretoUser constructor.
   *
   * @param \Drupal\taxonomy\TermInterface $location
   *   Department object.
   */
  public function __construct(TermInterface $location) {
    $this->location = $location;
  }

  /**
   * Returns original term entity.
   *
   * @return \Drupal\taxonomy\TermInterface
   *   User object.
   */
  public function getEntity() {
    return $this->location;
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
    if ($fieldOrganisation = $this->getEntity()->get('field_decreto_loc_org')->first()) {
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
      ->condition('field_decreto_meet_location', $this->getEntity()->id());

    $nids = $query->execute();
    if (!empty($nids)) {
      return ($load) ? Node::loadMultiple($nids) : $nids;
    }
    return [];
  }

}
