<?php

namespace Drupal\decreto_annotator\Services;

use Drupal\Core\Cache\CacheBackendInterface;
use Drupal\Core\Entity\EntityStorageInterface;
use Drupal\Core\Entity\EntityTypeManagerInterface;
use Drupal\Core\Session\AccountProxyInterface;
use Drupal\node\NodeInterface;
use Drupal\user\UserInterface;

/**
 * The Note service for the decreto annotator module.
 */
class NoteService {
  /**
   * Cache ID to be used for note counters.
   */
  const CACHE_ID_DECRETO_NOTE_COUNTERS = 'decreto_annotator_note_counters';

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

    $cid = self::CACHE_ID_DECRETO_NOTE_COUNTERS . ':' . $uid;
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

  /**
   * Check whether a given meeting has any notes attached to its children bullet points attachments.
   *
   * @param NodeInterface $meeting
   *   Meeting in inspect.
   * @param UserInterface $user
   *   Notes author.
   *
   * @return boolean
   *   TRUE or FALSE.
   */
  public function getMeetingHasNote(NodeInterface $meeting, UserInterface $user = NULL) {
    $uid = $this->currentUser->id();
    if (!empty($user)) {
      $uid = $user->id();
    }

    $count = 0;

    $referenced_bps = $meeting->field_decreto_meet_bps->referencedEntities();
    foreach($referenced_bps as $bp) {
      $referenced_bpas = $bp->field_decreto_bp_bpas->getValue();

      if (!empty($referenced_bpas)) {
        $referenced_bpa_ids = array_column($referenced_bpas, 'target_id');

        $count = $this->noteManager->getQuery()
          ->condition('uid', $uid)
          ->condition('bpa_id', $referenced_bpa_ids, 'IN')
          ->count()
          ->execute();

        // It's enough to find at least one BP, not need to continue loop.
        if ($count) {
          break;
        }
      }
    }

    return intval($count) > 0;
  }

}
