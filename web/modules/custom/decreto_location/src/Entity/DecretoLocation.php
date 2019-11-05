<?php

namespace Drupal\decreto_location\Entity;

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

}
