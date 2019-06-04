<?php

namespace Drupal\decreto_notification\Services;

use Drupal\Core\Cache\CacheBackendInterface;
use Drupal\Core\Datetime\DrupalDateTime;
use Drupal\Core\Entity\EntityStorageInterface;
use Drupal\Core\Entity\EntityTypeManagerInterface;
use Drupal\Core\Session\AccountProxyInterface;
use Drupal\node\NodeInterface;
use Drupal\user\Entity\User;
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
   * @var AccountProxyInterface
   */
  protected $currentUser;

  /**
   * The node storage.
   *
   * @var EntityStorageInterface
   */
  protected $notificationStorage;

  /**
   * Constructs a ContentService object.
   *
   * @param AccountProxyInterface $currentUser
   *   The current user.
   * @param EntityTypeManagerInterface $entityTypeManager
   *   The entity type manager interface.
   *
   * @throws
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
   * @param UserInterface $user
   *   User to calculate counters.
   *
   * @return array
   *   array with data.
   */
  public function getCounters(UserInterface $user = NULL) {
    $uid = $this->currentUser->id();
    if (!empty($user)) {
      $uid = $user->id();
    }

    $cid = self::CACHE_ID_DECRETO_NOTIFICATION_COUNTERS . ':' . $uid;
    $count = NULL;
    if ($cache = \Drupal::cache()
      ->get($cid)) {
      $count = $cache->data;
    }
    else {
      $count = $this->notificationStorage->getQuery()
        ->condition('uid', $uid)
        ->condition('unread', TRUE)
        ->count()
        ->execute();
      \Drupal::cache()
        ->set($cid, $count, CacheBackendInterface::CACHE_PERMANENT, [$cid, self::CACHE_ID_DECRETO_NOTIFICATION_COUNTERS]);
    }

    return ['total' => $count];
  }

}
