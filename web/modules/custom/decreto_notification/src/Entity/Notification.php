<?php
/**
 * @file
 * Contains \Drupal\decreto_notification\Entity\Notification.
 */
namespace Drupal\decreto_notification\Entity;

use Drupal\Core\Cache\Cache;
use Drupal\Core\Entity\ContentEntityBase;
use Drupal\Core\Entity\ContentEntityInterface;
use Drupal\Core\Entity\EntityTypeInterface;
use Drupal\Core\Field\BaseFieldDefinition;
use Drupal\decreto_notification\Services\NotificationService;

/**
 * Defines the Subscription entity.
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
 * )
 */
class Notification extends ContentEntityBase implements ContentEntityInterface {

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
      ));
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
    Cache::invalidateTags([NotificationService::CACHE_ID_DECRETO_NOTIFICATION_COUNTERS. ':' . $values['uid']]);

    return parent::create($values);
  }

  /**
   * {@inheritdoc}
   */
  public function delete() {
    // Invalidating notifications count.
    Cache::invalidateTags([NotificationService::CACHE_ID_DECRETO_NOTIFICATION_COUNTERS. ':' . $this->get('uid')->target_id]);

    return parent::delete();
  }
}
