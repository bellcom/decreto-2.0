<?php

namespace Drupal\decreto_notification\Services;

use Drupal\Core\Cache\CacheBackendInterface;
use Drupal\Core\Entity\EntityTypeManagerInterface;
use Drupal\Core\Session\AccountProxyInterface;
use Drupal\user\UserInterface;

/**
 * Decreto notification service.
 */
class NotificationService {
  /**
   * Cache ID to be used for meeting counters.
   */
  const CACHE_ID_DECRETO_NOTIFICATION_COUNTERS = 'decreto_notification_counters';

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
  protected $notificationStorage;

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
    $this->notificationStorage = $entityTypeManager->getStorage('decreto_notification');
  }

  /**
   * Get unread notification counter by user.
   *
   * If user not provided current user info will be returned.
   *
   * @param \Drupal\user\UserInterface $user
   *   User to calculate counters.
   *
   * @return array
   *   array(
   *    'my_org' => current user organisation notes count
   *    'total' => total notes count
   *   )
   */
  public function getCounters(UserInterface $user = NULL) {
    $selectOrganisationId = \Drupal::service('decreto_organisation.organisation')->getSelectedOrganisation(FALSE);

    $uid = $this->currentUser->id();
    if (!empty($user)) {
      $uid = $user->id();
    }

    $orgCountCid = self::CACHE_ID_DECRETO_NOTIFICATION_COUNTERS . ':' . $uid . ':' . $selectOrganisationId;
    $totalCountCid = self::CACHE_ID_DECRETO_NOTIFICATION_COUNTERS . ':' . $uid;

    $orgCount = NULL;
    if ($cache = \Drupal::cache()
      ->get($orgCountCid)) {
      $orgCount = $cache->data;
    }
    else {
      $orgCount = $this->notificationStorage->getQuery()
        ->condition('uid', $uid)
        ->condition('org_id', $selectOrganisationId)
        ->condition('unread', TRUE)
        ->count()
        ->execute();

      \Drupal::cache()
        ->set($orgCountCid, $orgCount, CacheBackendInterface::CACHE_PERMANENT, [
          self::CACHE_ID_DECRETO_NOTIFICATION_COUNTERS,
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
      $totalCount = $this->notificationStorage->getQuery()
        ->condition('uid', $uid)
        ->condition('unread', TRUE)
        ->count()
        ->execute();
      \Drupal::cache()
        ->set($totalCountCid, $totalCount, CacheBackendInterface::CACHE_PERMANENT, [$totalCountCid, self::CACHE_ID_DECRETO_NOTIFICATION_COUNTERS]);
    }

    return [
      'my_org' => $orgCount,
      'total' => $totalCount,
    ];
  }

}
