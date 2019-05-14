<?php

namespace Drupal\decreto_annotator\Entity;

use Drupal\Core\Cache\Cache;
use Drupal\Core\Field\BaseFieldDefinition;
use Drupal\Core\Entity\ContentEntityBase;
use Drupal\Core\Entity\EntityTypeInterface;

/**
 * Defines the Note entity.
 *
 * @ingroup rate
 *
 * @ContentEntityType(
 *   id = "decreto_annotator_note",
 *   label = @Translation("Note entity"),
 *   base_table = "decreto_annotator_notes",
 *   translatable = FALSE,
 *   entity_keys = {
 *     "id" = "id",
 *     "bpa_id" = "bpa_id",
 *     "uid" = "uid",
 *     "note_info" = "note_info",
 *   },
 *   list_cache_tags = { "config:decreto_annotator_note" }
 * )
 */
class Note extends ContentEntityBase {

  /**
   * {@inheritdoc}
   */
  public static function baseFieldDefinitions(EntityTypeInterface $entity_type) {
    $fields['id'] = BaseFieldDefinition::create('integer')
      ->setLabel(t('id'))
      ->setReadOnly(TRUE)
      ->setRequired(TRUE)
      ->setSetting('unsigned', TRUE);

    $fields['bpa_id'] = BaseFieldDefinition::create('integer')
      ->setLabel(t('Bullet point attachment id'))
      ->setRequired(TRUE)
      ->setReadOnly(TRUE);


    $fields['uid'] = BaseFieldDefinition::create('integer')
      ->setLabel(t('Note user id'))
      ->setRequired(TRUE)
      ->setReadOnly(TRUE);

    $fields['note_info'] = BaseFieldDefinition::create('string_long')
      ->setLabel(t('Note info'))
      ->setDefaultValue(serialize([]));

    return $fields;
  }

  /**
   * {@inheritdoc}
   */
  public static function create(array $values = []) {
    Cache::invalidateTags(['decreto_annotator_note_count:' . $values['uid']]);
    return parent::create($values);
  }

  /**
   * {@inheritdoc}
   */
  public function delete() {
    Cache::invalidateTags(['decreto_annotator_note_count:' . $this->get('uid')->value]);
    return parent::delete();
  }

}
