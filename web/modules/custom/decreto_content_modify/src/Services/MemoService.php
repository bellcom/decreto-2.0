<?php

namespace Drupal\decreto_content_modify\Services;

use Drupal\Core\Cache\CacheBackendInterface;
use Drupal\Core\Entity\EntityStorageInterface;
use Drupal\Core\Entity\EntityTypeManagerInterface;
use Drupal\Core\Session\AccountProxyInterface;
use Drupal\node\NodeInterface;
use Drupal\user\UserInterface;

/**
 * The memo service.
 */
class MemoService {

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
  protected $memoStorage;

  /**
   * Constructs a MemoService object.
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
    $this->memoStorage = $entityTypeManager->getStorage('node');
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
  public function getCounters(UserInterface $user = NULL) {
    $uid = $this->currentUser->id();
    if (!empty($user)) {
      $uid = $user->id();
    }

    $cid = 'decreto_memo_count:' . $uid;
    $count = NULL;
    if ($cache = \Drupal::cache()
      ->get($cid)) {
      $count = $cache->data;
    }
    else {
      $count = $this->memoStorage->getQuery()
        ->condition('uid', $uid)
        ->condition('type', 'decreto_memo')
        ->count()
        ->execute();
      \Drupal::cache()
        ->set($cid, $count, CacheBackendInterface::CACHE_PERMANENT, [$cid]);
    }
    return ['total' => $count];
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

    $referenced_bps = $meeting->field_decreto_meet_bps->getValue();
    if (!empty($referenced_bps)) {
      $referenced_bp_ids = array_column($referenced_bps, 'target_id');

      $count = $this->memoStorage->getQuery()
        ->condition('uid', $uid)
        ->condition('type', 'decreto_memo')
        ->condition('field_decreto_memo_bp', $referenced_bp_ids, 'IN')
        ->count()
        ->execute();
    }

    return intval($count) > 0;
  }

}
