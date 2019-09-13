<?php

namespace Drupal\decreto_content_modify\Services;

use Drupal\Core\Cache\CacheBackendInterface;
use Drupal\Core\Datetime\DrupalDateTime;
use Drupal\Core\Entity\EntityTypeManagerInterface;
use Drupal\Core\Session\AccountProxyInterface;
use Drupal\datetime\Plugin\Field\FieldType\DateTimeItemInterface;
use Drupal\decreto_organisation\Entity\DecretoOrganisation;
use Drupal\user\UserInterface;

/**
 * Decreto content service service.
 */
class ContentService {
  /**
   * Cache ID to be used for meeting counters.
   */
  const CACHE_ID_DECRETO_MEETING_COUNTERS = 'decreto_meeting_counters';

  /**
   * Cache ID to be used for memo counters.
   */
  const CACHE_ID_DECRETO_MEMO_COUNTERS = 'decreto_memo_counters';

  /**
   * The current user.
   *
   * @var \Drupal\Core\Session\AccountProxyInterface
   */
  protected $currentUser;

  /**
   * The node storage.
   *
   * @var \Drupal\Core\Entity\EntityStorageInterface
   */
  protected $nodeStorage;

  /**
   * Constructs a ContentService object.
   *
   * @param \Drupal\Core\Session\AccountProxyInterface $currentUser
   *   The current user.
   * @param \Drupal\Core\Entity\EntityTypeManagerInterface $entityTypeManager
   *   The entity type manager interface.
   *
   * @throws \Drupal\Component\Plugin\Exception\InvalidPluginDefinitionException
   * @throws \Drupal\Component\Plugin\Exception\PluginNotFoundException
   */
  public function __construct(
    AccountProxyInterface $currentUser,
    EntityTypeManagerInterface $entityTypeManager
  ) {
    $this->currentUser = $currentUser;
    $this->nodeStorage = $entityTypeManager->getStorage('node');
  }

  /**
   * Get meetings counter.
   *
   * @return array
   *   array(
   *    'my_org' => current user organisation meetings count
   *    'total' => total meetings count
   *   )
   *
   * @throws \Drupal\Core\Entity\Exception\UnsupportedEntityTypeDefinitionException
   */
  public function getMeetingCounters() {
    $organisation = \Drupal::service('decreto_organisation.organisation')->getSelectedOrganisation();

    $orgCountCid = self::CACHE_ID_DECRETO_MEETING_COUNTERS . ':' . $organisation->id();
    $totalCountCid = self::CACHE_ID_DECRETO_MEETING_COUNTERS;

    $orgCount = NULL;
    if ($cache = \Drupal::cache()
      ->get($orgCountCid)) {
      $orgCount = $cache->data;
    }
    else {
      $now = new DrupalDateTime('now');
      $decretoOrganisation = new DecretoOrganisation($organisation);
      $orgDepartmentsIds = $decretoOrganisation->getDepartments(FALSE);

      if (!empty($orgDepartmentsIds)) {
        $orgCount = $this->nodeStorage->getQuery()
          ->condition('type', 'decreto_meeting')
          ->condition('status', 1)
          ->condition('field_decreto_meet_start_date', $now->format(DateTimeItemInterface::DATETIME_STORAGE_FORMAT), '>=')
          ->condition('field_decreto_meet_department', $orgDepartmentsIds, 'IN')
          ->count()
          ->execute();
      }
      else {
        $orgCount = 0;
      }

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
      $now = new DrupalDateTime('now');

      $totalCount = $this->nodeStorage->getQuery()
        ->condition('type', 'decreto_meeting')
        ->condition('status', 1)
        ->condition('field_decreto_meet_start_date', $now->format(DateTimeItemInterface::DATETIME_STORAGE_FORMAT), '>=')
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

  /**
   * Get memo counter by user.
   *
   * If user not provided current user info will be returned.
   *
   * @param \Drupal\user\UserInterface $user
   *   User to calculate counters.
   *
   * @return array
   *   array(
   *    'my_org' => current user organisation memos count
   *    'total' => total memos count
   *   )
   */
  public function getMemoCounters(UserInterface $user = NULL) {
    $selectOrganisationId = \Drupal::service('decreto_organisation.organisation')->getSelectedOrganisation(FALSE);

    $uid = $this->currentUser->id();
    if (!empty($user)) {
      $uid = $user->id();
    }

    $orgCountCid = self::CACHE_ID_DECRETO_MEMO_COUNTERS . ':' . $uid . ':' . $selectOrganisationId;
    $totalCountCid = self::CACHE_ID_DECRETO_MEMO_COUNTERS . ':' . $uid;

    $orgCount = NULL;
    if ($cache = \Drupal::cache()
      ->get($orgCountCid)) {
      $orgCount = $cache->data;
    }
    else {
      // Load the heavy calculation on the views API. We know the view
      // calculates the amount correctly.
      $orgCount = count(views_get_view_result('decreto_memos', 'decreto_page_memos'));

      \Drupal::cache()
        ->set($orgCountCid, $orgCount, CacheBackendInterface::CACHE_PERMANENT, [
          self::CACHE_ID_DECRETO_MEMO_COUNTERS,
          $orgCountCid,
          $totalCountCid,
        ]);
    }

    $totalCount = NULL;
    if ($cache = \Drupal::cache()
      ->get($totalCountCid)) {
      $totalCount = $cache->data;
    }
    else {
      $totalCount = $this->nodeStorage->getQuery()
        ->condition('uid', $uid)
        ->condition('type', 'decreto_memo')
        ->count()
        ->execute();
      \Drupal::cache()
        ->set($totalCountCid, $totalCount, CacheBackendInterface::CACHE_PERMANENT, [
          self::CACHE_ID_DECRETO_MEMO_COUNTERS,
          $totalCountCid,
        ]);
    }

    return [
      'my_org' => $orgCount,
      'total' => $totalCount,
    ];
  }

}
