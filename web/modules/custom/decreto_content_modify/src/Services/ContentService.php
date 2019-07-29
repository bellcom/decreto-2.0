<?php

namespace Drupal\decreto_content_modify\Services;

use Drupal\Core\Cache\CacheBackendInterface;
use Drupal\Core\Datetime\DrupalDateTime;
use Drupal\Core\Entity\EntityStorageInterface;
use Drupal\Core\Entity\EntityTypeManagerInterface;
use Drupal\Core\Session\AccountProxyInterface;
use Drupal\node\NodeInterface;
use Drupal\user\Entity\User;
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
   * @var AccountProxyInterface
   */
  protected $currentUser;

  /**
   * The node storage.
   *
   * @var EntityStorageInterface
   */
  protected $nodeStorage;

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
    $this->nodeStorage = $entityTypeManager->getStorage('node');
  }

  /**
   * Get meetings counter.
   *
   * @return array
   *   array with data.
   */
  public function getMeetingCounters() {
    $cid = self::CACHE_ID_DECRETO_MEETING_COUNTERS;

    $count = NULL;
    if ($cache = \Drupal::cache()
      ->get($cid)) {
      $count = $cache->data;
    }
    else {
      $now = new DrupalDateTime('now');
      $count = $this->nodeStorage->getQuery()
        ->condition('type', 'decreto_meeting')
        ->condition('status', 1)
        ->condition('field_decreto_meet_start_date', $now->format(DATETIME_DATETIME_STORAGE_FORMAT), '>=')
        ->count()
        ->execute();
      // Caching for 10m = 600 seconds.
      \Drupal::cache()
        ->set($cid, $count, 600, [$cid, self::CACHE_ID_DECRETO_MEETING_COUNTERS]);
    }
    return [
      'my_org' => $count,
      'total' => $count
    ];
  }

  /**
   * Get memo counter by user.
   *
   * If user not provided current user info will be returned.
   *
   * @param UserInterface $user
   *   User to calculate counters.
   *
   * @return array
   *   array with data.
   */
  public function getMemoCounters(UserInterface $user = NULL) {
    $uid = $this->currentUser->id();
    if (!empty($user)) {
      $uid = $user->id();
    }

    $cid = self::CACHE_ID_DECRETO_MEMO_COUNTERS . ':' . $uid;
    $count = NULL;
    if ($cache = \Drupal::cache()
      ->get($cid)) {
      $count = $cache->data;
    }
    else {
      $count = $this->nodeStorage->getQuery()
        ->condition('uid', $uid)
        ->condition('type', 'decreto_memo')
        ->count()
        ->execute();
      \Drupal::cache()
        ->set($cid, $count, CacheBackendInterface::CACHE_PERMANENT, [$cid]);
    }
    return [
      'my_org' => $count,
      'total' => $count
    ];
  }

  /**
   * Check whether a given meeting has any memos attached to its children bullet points.
   *
   * @param NodeInterface $meeting
   *   Meeting in inspect.
   * @param UserInterface $user
   *   Notes author.
   *
   * @return boolean
   *   TRUE or FALSE.
   */
  public function getMeetingHasMemo(NodeInterface $meeting, UserInterface $user = NULL) {
    $uid = $this->currentUser->id();
    if (!empty($user)) {
      $uid = $user->id();
    }

    $count = 0;

    $referencedBps = $meeting->field_decreto_meet_bps->getValue();
    if (!empty($referencedBps)) {
      $referencedBpIds = array_column($referencedBps, 'target_id');

      $count = $this->nodeStorage->getQuery()
        ->condition('uid', $uid)
        ->condition('type', 'decreto_memo')
        ->condition('field_decreto_memo_bp', $referencedBpIds, 'IN')
        ->count()
        ->execute();
    }

    return intval($count) > 0;
  }

}
