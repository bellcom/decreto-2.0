<?php

namespace Drupal\decreto_organisation\Services;

use Drupal\Core\TempStore\PrivateTempStoreFactory;
use Drupal\node\Entity\Node;

/**
 * Decreto organisation service.
 */
class OrganisationService {

  /**
   * The temp storage.
   *
   * @var \Drupal\Core\TempStore\PrivateTempStoreFactory
   */
  protected $tempStore;

  /**
   * OrganisationService constructor.
   *
   * @param \Drupal\Core\TempStore\PrivateTempStoreFactory $temp_store_factory
   *   Temp storage.
   */
  public function __construct(PrivateTempStoreFactory $temp_store_factory) {
    $this->tempStore = $temp_store_factory->get('decreto_organisation');
  }

  /**
   * Gets the selected organisation.
   *
   * @param bool $load
   *   If organisation needs to be loaded.
   *
   * @return \Drupal\Core\Entity\EntityInterface|\Drupal\node\Entity\Node|null
   *   If load is TRUE organisation node is returned,
   *   If load is FALSE organisation nid is returned,
   *   If organisation is empty, null is returned.
   */
  public function getSelectedOrganisation($load = TRUE) {
    $organisationId = $this->tempStore->get('selected_organisation');
    if ($load) {
      if ($organisationId) {
        return Node::load($organisationId);
      }

      return NULL;
    }

    return $organisationId;
  }

  /**
   * Sets the selected organisation.
   *
   * @param $organisationId
   *   New selected organisation nid.
   */
  public function setSelectedOrganisation($organisationId) {
    $this->tempStore->set('selected_organisation', $organisationId);
  }

}
