<?php

namespace Drupal\decreto_annotator;

use Drupal\Core\Access\AccessResult;
use Drupal\Core\Entity\EntityAccessControlHandler;
use Drupal\Core\Entity\EntityInterface;
use Drupal\Core\Session\AccountInterface;

/**
 * Access controller for the Note entity.
 *
 * @see \Drupal\decreto_annotator\Entity\Note.
 */
class NoteAccessControlHandler extends EntityAccessControlHandler {

  /**
   * {@inheritdoc}
   *
   * Link the activities to the permissions. checkAccess is called with the
   * $operation as defined in the routing.yml file.
   */
  protected function checkAccess(EntityInterface $entity, $operation, AccountInterface $account) {
    switch ($operation) {
      case 'view':
      case 'update':
      case 'delete':
        return AccessResult::allowedIf($entity->getOwnerId() == $account->id());
    }
    return AccessResult::allowed();
  }

}
