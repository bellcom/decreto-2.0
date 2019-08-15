<?php

namespace Drupal\decreto_annotator\Entity;

use Drupal\Core\Cache\Cache;
use Drupal\Core\Field\BaseFieldDefinition;
use Drupal\Core\Entity\ContentEntityBase;
use Drupal\Core\Entity\EntityTypeInterface;
use Drupal\decreto_annotator\Services\NoteService;
use Drupal\decreto_content_modify\Entity\DecretoBulletPoint;
use Drupal\decreto_content_modify\Entity\DecretoBulletPointAttachment;
use Drupal\decreto_content_modify\Entity\DecretoMeeting;
use Drupal\node\Entity\Node;
use Drupal\user\EntityOwnerInterface;
use Drupal\user\UserInterface;

/**
 * Defines the Note entity.
 *
 * @ingroup rate
 *
 * @ContentEntityType(
 *   id = "decreto_annotator_note",
 *   label = @Translation("Decreto Note"),
 *   base_table = "decreto_annotator_notes",
 *   translatable = FALSE,
 *   entity_keys = {
 *     "id" = "id",
 *     "uuid" = "uuid",
 *     "bpa_id" = "bpa_id",
 *     "uid" = "uid",
 *   },
 *   handlers = {
 *     "view_builder" = "Drupal\decreto_annotator\NoteViewBuilder",
 *     "views_data" = "Drupal\decreto_annotator\NoteViewsData",
 *     "access" = "Drupal\decreto_annotator\NoteAccessControlHandler",
 *   },
 *   list_cache_tags = { "config:decreto_annotator_note" }
 * )
 */
class Note extends ContentEntityBase implements EntityOwnerInterface {

  /**
   * {@inheritdoc}
   */
  public static function baseFieldDefinitions(EntityTypeInterface $entity_type) {
    // Standard field, used as unique if primary index.
    $fields['id'] = BaseFieldDefinition::create('integer')
      ->setLabel(t('id'))
      ->setReadOnly(TRUE)
      ->setRequired(TRUE)
      ->setSetting('unsigned', TRUE);

    // Standard field, unique outside of the scope of the current project.
    $fields['uuid'] = BaseFieldDefinition::create('uuid')
      ->setLabel(t('UUID'))
      ->setDescription(t('The UUID of the Notification entity.'))
      ->setReadOnly(TRUE);

    // Bullet point attachment ID reference field.
    $fields['bpa_id'] = BaseFieldDefinition::create('entity_reference')
      ->setLabel(t('Bullet point attachment'))
      ->setDescription(t('Bullet point attachment ID.'))
      ->setSettings(array(
        'target_type' => 'node',
        'not null' => TRUE,
      ))
      ->setRequired(TRUE)
      ->setReadOnly(TRUE);

    // User ID reference field.
    $fields['uid'] = BaseFieldDefinition::create('entity_reference')
      ->setLabel(t('User'))
      ->setDescription(t('The user ID.'))
      ->setSettings(array(
        'target_type' => 'user',
        'not null' => TRUE,
      ))
      ->setRequired(TRUE)
      ->setReadOnly(TRUE);

    // Note info field, json.
    $fields['note_info'] = BaseFieldDefinition::create('string_long')
      ->setLabel(t('Note info'))
      ->setDefaultValue(serialize([]));

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
    $uid = $values['uid'];
    $bpa_id = $values['bpa_id'];
    self::invalidateCaches($uid, $bpa_id);

    return parent::create($values);
  }

  /**
   * {@inheritdoc}
   */
  public function delete() {
    $uid = $this->get('uid')->target_id;
    $bpa_id = $this->get('bpa_id')->first()->getString();
    self::invalidateCaches($uid, $bpa_id);

    return parent::delete();
  }

  /**
   * Gets note actual text extracted from note_info.
   *
   * @return string
   *   Note text.
   */
  public function getText() {
    $note_info_json = $this->getNoteInfo();

    return $note_info_json->text;
  }

  /**
   * Gets note quote text extracted from note_info.
   *
   * @return string
   *   Note quote.
   */
  public function getQuote() {
    $note_info_json = $this->getNoteInfo();

    return $note_info_json->quote;
  }

  /**
   * Gets note info as json object.
   *
   * @return mixed
   *   Note info as json object.
   */
  public function getNoteInfo() {
    $note_info = $this->get('note_info')->value;
    $note_info_json = json_decode($note_info);

    return $note_info_json;
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
   * Returns related department.
   *
   * @param bool $load
   *   If the returned node shall be load. If FALSE, nid is returned.
   *
   * @return \Drupal\taxonomy\TermInterface|int|null
   *   Department term, or department tid.
   *   NULL is nothing is found.
   *
   * @throws \Drupal\Core\TypedData\Exception\MissingDataException
   * @throws \Drupal\Core\Entity\Exception\UnsupportedEntityTypeDefinitionException
   */
  public function getDepartment($load = TRUE) {
    // Getting meeting first.
    $meeting = $this->getMeeting();

    if ($meeting) {
      $decretoMeeting = new DecretoMeeting($meeting);
      return $decretoMeeting->getDepartment($load);
    }

    return NULL;
  }

  /**
   * Returns related meeting.
   *
   * @param bool $load
   *   If the returned node shall be load. If FALSE, nid is returned.
   *
   * @return \Drupal\node\NodeInterface|int|null
   *   Meeting node, or meeting nid.
   *   NULL is nothing is found.
   *
   * @throws \Drupal\Core\TypedData\Exception\MissingDataException
   * @throws \Drupal\Core\Entity\Exception\UnsupportedEntityTypeDefinitionException
   */
  public function getMeeting($load = TRUE) {
    // Getting BPA first.
    $bpa = $this->getBulletPointAttachment();

    if ($bpa) {
      $decretoBPA = new DecretoBulletPointAttachment($bpa);
      return $decretoBPA->getMeeting($load);
    }

    return NULL;
  }

  /**
   * Returns related bullet point.
   *
   * @param bool $load
   *   If the returned node shall be load. If FALSE, nid is returned.
   *
   * @return \Drupal\node\NodeInterface|int|null
   *   Bullet point node, or Bullet point  nid.
   *   NULL is nothing is found.
   *
   * @throws \Drupal\Core\TypedData\Exception\MissingDataException
   * @throws \Drupal\Core\Entity\Exception\UnsupportedEntityTypeDefinitionException
   */
  public function getBulletPoint($load = TRUE) {
    // Getting BPA first.
    $bpa = $this->getBulletPointAttachment();

    if ($bpa) {
      $decretoBPA = new DecretoBulletPointAttachment($bpa);
      return $decretoBPA->getBulletPoint($load);
    }

    return NULL;
  }

  /**
   * Returns related bullet point attachment.
   *
   * @param bool $load
   *   If the returned node shall be load. If FALSE, nid is returned.
   *
   * @return \Drupal\node\NodeInterface|int|null
   *   Bullet point attachment node, or Bullet point attachment nid.
   *   NULL is nothing is found.
   *
   * @throws \Drupal\Core\TypedData\Exception\MissingDataException
   */
  public function getBulletPointAttachment($load = TRUE) {
    if ($bpaIdField = $this->get('bpa_id')->first()) {
      if ($load) {
        return $bpaIdField->get('entity')->getTarget()->getValue();
      }
      else {
        return $bpaIdField->getValue()['target_id'];
      }
    }

    return NULL;
  }

  /**
   * Invalidates caches of related entities.
   *
   * Invalidates notes counter, related bullet point attachment, bullet point
   * and meeting caches.
   *
   * @param int $uid
   *   Uid of the note author.
   * @param int $bpa_id
   *   Nid of the related bullet point attachment.
   *
   * @throws \Drupal\Core\Entity\Exception\UnsupportedEntityTypeDefinitionException
   */
  private static function invalidateCaches($uid, $bpa_id) {
    // Invalidating notes count.
    Cache::invalidateTags([NoteService::CACHE_ID_DECRETO_NOTE_COUNTERS . ':' . $uid]);

    // Getting related bullet point attachment.
    $bpa = Node::load($bpa_id);
    if ($bpa) {
      // Invalidating bullet point attachment.
      Cache::invalidateTags($bpa->getCacheTagsToInvalidate());

      // Getting related bullet point.
      $decretoBPA = new DecretoBulletPointAttachment($bpa);
      $bp = $decretoBPA->getBulletPoint();
      if ($bp) {
        // Invalidating bullet point.
        Cache::invalidateTags($bpa->getCacheTagsToInvalidate());

        // Getting related meeting.
        $decretoBP = new DecretoBulletPoint($bp);
        $meeting = $decretoBP->getMeeting();
        if ($meeting) {
          // Invalidating meeting.
          Cache::invalidateTags($meeting->getCacheTagsToInvalidate());
        }
      }
    }
  }

}
