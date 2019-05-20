<?php

namespace Drupal\decreto_annotator\Services;

use Drupal\Core\Cache\CacheBackendInterface;
use Drupal\Core\Entity\EntityStorageInterface;
use Drupal\Core\Entity\EntityTypeManagerInterface;
use Drupal\Core\Session\AccountProxyInterface;
use Drupal\user\UserInterface;

/**
 * The Note service for the decreto annotator module.
 */
class NoteService {

  /**
   * The current user.
   *
   * @var AccountProxyInterface
   */
  protected $currentUser;

  /**
   * The note storage manager.
   *
   * @var EntityStorageInterface
   */
  protected $noteManager;

  /**
   * Constructs a Note service object.
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
    $this->noteManager = $entityTypeManager->getStorage('decreto_annotator_note');
  }

  /**
   * Get note counter by user.
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

    $cid = 'decreto_annotator_note_count:' . $uid;
    $count = NULL;
    if ($cache = \Drupal::cache()
      ->get($cid)) {
      $count = $cache->data;
    }
    else {
      $count = $this->noteManager->getQuery()
        ->condition('uid', $uid)
        ->count()
        ->execute();
      \Drupal::cache()
        ->set($cid, $count, CacheBackendInterface::CACHE_PERMANENT, [$cid]);
    }
    return ['total' => $count];
  }

}
