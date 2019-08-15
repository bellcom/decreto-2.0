<?php

namespace Drupal\decreto_notification\Entity;

/*
 * @file
 * Contains \Drupal\decreto_notification\Entity\Notification.
 */

use Drupal\Core\Cache\Cache;
use Drupal\Core\Entity\ContentEntityBase;
use Drupal\Core\Entity\ContentEntityInterface;
use Drupal\Core\Entity\EntityTypeInterface;
use Drupal\Core\Field\BaseFieldDefinition;
use Drupal\decreto_content_modify\Entity\DecretoMeeting;
use Drupal\decreto_notification\Services\NotificationService;
use Drupal\user\EntityOwnerInterface;
use Drupal\user\UserInterface;

/**
 * Defines the Subscription entity.
 *
 * @ingroup notification
 * @ContentEntityType(
 *   id = "decreto_notification",
 *   label = @Translation("Decreto Notifications"),
 *   base_table = "decreto_notification_notifications",
 *   entity_keys = {
 *     "id" = "id",
 *     "uuid" = "uuid",
 *     "uid" = "uid",
 *   },
 *   handlers = {
 *     "view_builder" = "Drupal\decreto_notification\NotificationViewBuilder",
 *     "views_data" = "Drupal\decreto_notification\NotificationViewsData",
 *     "access" = "Drupal\decreto_notification\NotificationAccessControlHandler",
 *   },
 *   list_cache_contexts = { "user" },
 *   links = {
 *     "canonical" = "/notification/{decreto_notification}",
 *   }
 * )
 */
class Notification extends ContentEntityBase implements EntityOwnerInterface {

  /**
   * {@inheritdoc}
   */
  public static function baseFieldDefinitions(EntityTypeInterface $entity_type) {
    // Standard field, used as unique if primary index.
    $fields['id'] = BaseFieldDefinition::create('integer')
      ->setLabel(t('ID'))
      ->setDescription(t('The ID of the Notification entity.'))
      ->setReadOnly(TRUE);
    // Standard field, unique outside of the scope of the current project.
    $fields['uuid'] = BaseFieldDefinition::create('uuid')
      ->setLabel(t('UUID'))
      ->setDescription(t('The UUID of the Notification entity.'))
      ->setReadOnly(TRUE);
    // Body field for the notification.
    $fields['body'] = BaseFieldDefinition::create('string_long')
      ->setLabel(t('Body'))
      ->setDescription(t('The body of the Notification.'))
      ->setSettings(array(
        'not null' => TRUE,
      ))
      ->setDisplayOptions('view', [
        'label' => 'hidden',
        'type' => 'string',
        'weight' => -6,
      ]);
    // Unread field for the notification.
    $fields['unread'] = BaseFieldDefinition::create('boolean')
      ->setLabel(t('Unread'))
      ->setDescription(t('Whether notification is unread.'))
      ->setDefaultValue(TRUE);
    // User ID reference field.
    $fields['mid'] = BaseFieldDefinition::create('entity_reference')
      ->setLabel(t('Message'))
      ->setDescription(t('The message ID.'))
      ->setSettings(array(
        'target_type' => 'message',
        'not null' => TRUE,
      ));
    // User ID reference field.
    $fields['uid'] = BaseFieldDefinition::create('entity_reference')
      ->setLabel(t('User'))
      ->setDescription(t('The user ID.'))
      ->setSettings(array(
        'target_type' => 'user',
        'not null' => TRUE,
      ));
    // The changed field type automatically updates the timestamp every time the
    // entity is saved.
    $fields['created'] = BaseFieldDefinition::create('created')
      ->setLabel(t('Created'))
      ->setDescription(t('The time that the Notification was created.'));
    // The changed field type automatically updates the timestamp every time the
    // entity is saved.
    $fields['changed'] = BaseFieldDefinition::create('changed')
      ->setLabel(t('Changed'))
      ->setDescription(t('The time that the Notification was last edited.'));
    return $fields;
  }

  /**
   * {@inheritdoc}
   */
  public static function create(array $values = []) {
    // Invalidating notifications count.
    Cache::invalidateTags([NotificationService::CACHE_ID_DECRETO_NOTIFICATION_COUNTERS . ':' . $values['uid']]);

    return parent::create($values);
  }

  /**
   * {@inheritdoc}
   */
  public function save() {
    // Invalidating notifications count.
    Cache::invalidateTags([NotificationService::CACHE_ID_DECRETO_NOTIFICATION_COUNTERS . ':' . $this->get('uid')->target_id]);

    return parent::save();
  }

  /**
   * {@inheritdoc}
   */
  public function delete() {
    // Invalidating notifications count.
    Cache::invalidateTags([NotificationService::CACHE_ID_DECRETO_NOTIFICATION_COUNTERS . ':' . $this->get('uid')->target_id]);

    return parent::delete();
  }

  /**
   * {@inheritdoc}
   */
  public function getOwner() {
    return $this->get('uid')->entity;
  }

  /**
   * {@inheritdoc}
   */
  public function setOwner(UserInterface $account) {
    $this->set('uid', $account->id());
    return $this;
  }

  /**
   * {@inheritdoc}
   */
  public function getOwnerId() {
    return $this->get('uid')->target_id;
  }

  /**
   * {@inheritdoc}
   */
  public function setOwnerId($uid) {
    $this->set('uid', $uid);
    return $this;
  }

  /**
   * Returns Message attached to notification.
   *
   * @return \Drupal\message\MessageInterface
   *   Message attached to notification.
   *
   * @throws \Drupal\Core\TypedData\Exception\MissingDataException
   */

  /**
   * Returns Message attached to notification.
   *
   * @param bool $load
   *   If the returned entity shall be load. If FALSE, id is returned.
   *
   * @return \Drupal\message\MessageInterface|int|null
   *   Message entity, or Message entity id.
   *   NULL is nothing is found.
   *
   * @throws \Drupal\Core\TypedData\Exception\MissingDataException
   */
  public function getMessage($load = TRUE) {
    if ($fieldMid = $this->get('mid')->first()) {
      if ($load) {
        return $fieldMid->get('entity')->getTarget()->getValue();
      }
      else {
        return $fieldMid->getValue()['target_id'];
      }
    }

    return NULL;
  }

  /**
   * Returns Decreto meeting attached to notification's Message.
   *
   * @param bool $load
   *   If the returned node shall be load. If FALSE, nid is returned.
   *
   * @see getMessage()
   *
   * @return \Drupal\node\NodeInterface|int|null
   *   Meeting node, or Meeting nid.
   *   NULL is nothing is found.
   *
   * @throws \Drupal\Core\TypedData\Exception\MissingDataException
   */
  public function getMeeting($load = TRUE) {
    if ($fieldDecretoNotifMeeting = $this->getMessage()->get('field_decreto_notif_meeting')->first()) {
      if ($load) {
        return $fieldDecretoNotifMeeting->get('entity')->getTarget()->getValue();
      }
      else {
        return $fieldDecretoNotifMeeting->getValue()['target_id'];
      }
    }

    return NULL;
  }

  /**
   * Returns related department.
   *
   * Decreto department attached to meeting, related with Message
   * attached to notification.
   *
   * @param bool $load
   *   If the returned node shall be load. If FALSE, nid is returned.
   *
   * @return \Drupal\taxonomy\TermInterface|int|null
   *   Department term, or Department tid.
   *   NULL is nothing is found.
   *
   * @throws \Drupal\Core\TypedData\Exception\MissingDataException
   * @throws \Drupal\Core\Entity\Exception\UnsupportedEntityTypeDefinitionException
   */
  public function getDepartment($load = TRUE) {
    $meeting = $this->getMeeting();
    if ($meeting) {
      $decretoMeeting = new DecretoMeeting($meeting);
      return $decretoMeeting->getDepartment($load);
    }

    return NULL;
  }

}
