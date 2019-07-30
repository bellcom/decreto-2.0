<?php

namespace Drupal\decreto_department\Services;

use Drupal\Core\Entity\EntityStorageInterface;
use Drupal\Core\Entity\EntityTypeManagerInterface;

/**
 * Decreto notification service.
 */
class DepartmentService {
  /**
   * Cache ID to be used for department counters.
   */
  const CACHE_ID_DECRETO_DEPARTMENT_COUNTERS = 'decreto_tax_department_counters';

  /**
   * The taxnomy term storage.
   *
   * @var EntityStorageInterface
   */
  protected $taxonomyTermStorage;

  /**
   * Constructs a ContentService object.
   *
   * @param EntityTypeManagerInterface $entityTypeManager
   *   The entity type manager interface.
   *
   * @throws
   */
  public function __construct(EntityTypeManagerInterface $entityTypeManager) {
    $this->taxonomyTermStorage = $entityTypeManager->getStorage('taxonomy_term');
  }

  /**
   * Get department counter.
   *
   * @return array
   *   array with data.
   */
  public function getCounters() {
    $cid = self::CACHE_ID_DECRETO_DEPARTMENT_COUNTERS;

    $count = NULL;
    if ($cache = \Drupal::cache()
      ->get($cid)) {
      $count = $cache->data;
    }
    else {
      $count = $this->taxonomyTermStorage->getQuery()
        ->condition('vid', 'decreto_tax_department')
        ->count()
        ->execute();

      // Caching for 10m = 600 seconds.
      \Drupal::cache()
        ->set($cid, $count, 600, [$cid, self::CACHE_ID_DECRETO_DEPARTMENT_COUNTERS]);
    }
    return [
      'my_org' => $count,
      'total' => $count
    ];
  }

}
