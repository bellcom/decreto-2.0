<?php

namespace Drupal\decreto_organisation\Services;

use Drupal\Core\TempStore\PrivateTempStoreFactory;
use Drupal\decreto_user\Entity\DecretoUser;
use Drupal\node\Entity\Node;
use Drupal\user\Entity\User;

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
   * IF it is not possible to get selected organisation, then next organisation
   * is selected automatically.
   *
   * @param bool $load
   *   If organisation needs to be loaded.
   *
   * @return \Drupal\Core\Entity\EntityInterface|\Drupal\node\Entity\Node|null
   *   If load is TRUE organisation node is returned,
   *   If load is FALSE organisation nid is returned,
   *   If organisation is empty or node does not exits next available
   *   organisation is returned.
   */
  public function getSelectedOrganisation($load = TRUE) {
    $organisationId = $this->tempStore->get('selected_organisation');

    // Check if organisation nid is valid node id.
    if ($organisationId) {
      $values = \Drupal::entityQuery('node')->condition('nid', $organisationId)->execute();
      $node_exists = !empty($values);

      if ($node_exists) {
        return ($load) ? Node::load($organisationId) : $organisationId;
      }
    }

    // Organisation nid is not valid, attempt to return next available
    // organisation nid.
    $user = User::load(\Drupal::currentUser()->id());
    $decretoUser = new DecretoUser($user);
    $orgIds = $decretoUser->getOrganisations(FALSE);
    $organisationId = reset($orgIds);
    if ($organisationId) {
      \Drupal::service('decreto_organisation.organisation')->setSelectedOrganisation($organisationId);

      return ($load) ? Node::load($organisationId) : $organisationId;
    }
  }

  /**
   * Sets the selected organisation.
   *
   * @param int $organisationId
   *   New selected organisation nid.
   *
   * @throws \Drupal\Core\TempStore\TempStoreException
   */
  public function setSelectedOrganisation($organisationId) {
    $this->tempStore->set('selected_organisation', $organisationId);
  }

}
