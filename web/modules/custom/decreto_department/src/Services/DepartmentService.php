<?php

namespace Drupal\decreto_department\Services;

use Drupal\Core\Entity\EntityTypeManagerInterface;
use Drupal\decreto_organisation\Entity\DecretoOrganisation;

/**
 * Decreto notification service.
 */
class DepartmentService {

  /**
   * Cache ID to be used for department counters.
   */
  const CACHE_ID_DECRETO_DEPARTMENT_COUNTERS = 'decreto_tax_department_counters';

  /**
   * The taxonomy term storage.
   *
   * @var \Drupal\Core\Entity\EntityStorageInterface
   */
  protected $taxonomyTermStorage;

  /**
   * Constructs a ContentService object.
   *
   * @param \Drupal\Core\Entity\EntityTypeManagerInterface $entityTypeManager
   *   The entity type manager interface.
   *
   * @throws \Drupal\Component\Plugin\Exception\InvalidPluginDefinitionException
   * @throws \Drupal\Component\Plugin\Exception\PluginNotFoundException
   */
  public function __construct(EntityTypeManagerInterface $entityTypeManager) {
    $this->taxonomyTermStorage = $entityTypeManager->getStorage('taxonomy_term');
  }

  /**
   * Get department counter.
   *
   * @return array
   *   array(
   *    'my_org' => current user departments count
   *    'total' => total departments count
   *   )
   *
   * @throws \Drupal\Core\Entity\Exception\UnsupportedEntityTypeDefinitionException
   */
  public function getCounters() {
    $organisation = \Drupal::service('decreto_organisation.organisation')->getSelectedOrganisation();

    $totalCountCid = self::CACHE_ID_DECRETO_DEPARTMENT_COUNTERS;
    $orgCountCid = self::CACHE_ID_DECRETO_DEPARTMENT_COUNTERS . ':' . $organisation->id();

    $orgCount = NULL;
    if ($cache = \Drupal::cache()
      ->get($orgCountCid)) {
      $orgCount = $cache->data;
    }
    else {
      $decretoOrganisation = new DecretoOrganisation($organisation);
      $orgDepartmentsIds = $decretoOrganisation->getDepartments(FALSE);

      $orgCount = count($orgDepartmentsIds);

      // Caching for 10m = 600 seconds.
      \Drupal::cache()
        ->set($orgCountCid, $orgCount, 600, [$orgCountCid, $totalCountCid]);
    }

    $totalCount = NULL;
    if ($cache = \Drupal::cache()
      ->get($totalCountCid)) {
      $totalCount = $cache->data;
    }
    else {
      $totalCount = $this->taxonomyTermStorage->getQuery()
        ->condition('vid', 'decreto_tax_department')
        ->count()
        ->execute();

      // Caching for 10m = 600 seconds.
      \Drupal::cache()
        ->set($totalCountCid, $totalCount, 600, [$totalCountCid]);
    }
    return [
      'my_org' => $orgCount,
      'total' => $totalCount,
    ];
  }

}
