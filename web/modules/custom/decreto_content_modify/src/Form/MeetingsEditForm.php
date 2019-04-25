<?php
/**
 * @file
 * Contains \Drupal\decreto_content_modify\Form\MeetingsEditForm.
 */

namespace Drupal\decreto_content_modify\Form;

use Drupal\Core\Datetime\DrupalDateTime;
use Drupal\Core\Field\Plugin\Field\FieldFormatter;
use Drupal\Core\Form\FormBase;
use Drupal\Core\Form\FormStateInterface;
use Drupal\Core\Url;
use Drupal\field\Entity\FieldStorageConfig;
use Drupal\node\Entity\Node;
use Drupal\node\NodeInterface;

/**
 * Implements an example form.
 */
class MeetingsEditForm extends FormBase {
  protected $node;

  /**
   * {@inheritdoc}
   */
  public function getFormId() {
    return 'decreto-content-modify-meeting-edit-form';
  }

  /**
   * {@inheritdoc}
   */
  public function buildForm(array $form, FormStateInterface $form_state, NodeInterface $node = NULL) {
    $this->node = $node;

    $form['#attached']['library'][] = 'core/drupal.ajax';
    $form['#attached']['library'][] = 'core/drupal.dialog';
    $form['#attached']['library'][] = 'core/drupal.dialog.ajax';
    $form['#attached']['library'][] = 'decreto_content_modify/meeting-edit';
    $form['#attached']['library'][] = 'decreto_context_menu/decreto-stretchy-navigation';

    $form['title'] = [
      '#type' => 'textfield',
      '#placeholder' => $this->t('Title'),
    ];

    //committee
    $committee_terms = \Drupal::service('entity_type.manager')
      ->getStorage("taxonomy_term")
      ->loadTree('decreto_tax_committee');
    $committee_options = array();
    foreach ($committee_terms as $term) {
      $committee_options[$term->tid] = $term->name;
    }
    $form['committee'] = [
      '#type' => 'select',
      '#empty_option' => $this->t('-Select committee-'),
      '#options' => $committee_options
    ];

    //type
    $type_options = options_allowed_values(FieldStorageConfig::loadByName('node', 'field_decreto_meet_type'));
    $form['type'] = [
      '#type' => 'select',
      //'#empty_option' => $this->t('Type'),
      '#options' => $type_options
    ];

    //dates
    $form['start_date'] = array(
      '#type' => 'datetime',
      '#default_value' => DrupalDateTime::createFromTimestamp(time()),
    );
    $form['end_date'] = array(
      '#type' => 'datetime',
      '#default_value' => DrupalDateTime::createFromTimestamp(time()),
    );

    //location
    $location_terms = \Drupal::service('entity_type.manager')
      ->getStorage("taxonomy_term")
      ->loadTree('decreto_tax_location');
    $location_options = array();
    foreach ($location_terms as $term) {
      $location_options[$term->tid] = $term->name;
    }
    $form['location'] = [
      '#type' => 'select',
      '#empty_option' => $this->t('-Select location-'),
      '#options' => $location_options
    ];

    //participants
    $form['participants'] = array(
      '#type' => 'textarea',
      '#title' => $this->t('Participants'),
    );

    //description
    $form['description'] = array(
      '#type' => 'text_format',
      '#format' => 'basic_html',
      '#title' => $this->t('Description'),
    );

    $form['full_doc'] = array(
      '#title' => $this->t('Open description'),
      '#type' => 'managed_file',
      '#upload_location' => 'public://',
      '#default_value' => NULL,
      '#upload_validators' => array(
        'file_validate_extensions' => array('txt pdf doc docx'),
      )
    );

    $form['full_doc_closed'] = array(
      '#title' => $this->t('Closed description'),
      '#type' => 'managed_file',
      //'#upload_location' => 'private://',
      '#upload_location' => 'public://', //TODO:change to private
      '#default_value' => NULL,
      '#upload_validators' => array(
        'file_validate_extensions' => array('txt pdf doc docx'),
      )
    );

    //loading values
    $bp_ids = array();
    if ($node) {
      $form['title']['#default_value'] = $node->getTitle();
      $form['committee']['#default_value'] = $node->field_decreto_meet_committee->target_id;
      $form['type']['#default_value'] = $node->field_decreto_meet_type->value;
      if ($node->field_decreto_meet_start_date->value) {
        $form['start_date']['#default_value'] = DrupalDateTime::createFromFormat(DATETIME_DATETIME_STORAGE_FORMAT, $node->field_decreto_meet_start_date->value);
      }
      if ($node->field_decreto_meet_end_date->value) {
        $form['end_date']['#default_value'] = DrupalDateTime::createFromFormat(DATETIME_DATETIME_STORAGE_FORMAT, $node->field_decreto_meet_end_date->value);
      }
      $form['location']['#default_value'] = $node->field_decreto_meet_location->target_id;
      $form['participants']['#default_value'] = $node->field_decreto_meet_partic->value;
      $form['description']['#default_value'] = $node->body->value;
      if (!$node->field_decreto_meet_full_doc->isEmpty()) {
        $form['full_doc']['#default_value']['fid'] = $node->field_decreto_meet_full_doc->target_id;
      }
      if (!$node->field_decreto_meet_full_doc_c->isEmpty()) {
        $form['full_doc_closed']['#default_value']['fid'] = $node->field_decreto_meet_full_doc_c->target_id;
      }
      foreach ($node->field_decreto_meet_bps as $bp) {
        $bp_ids[] = $bp->target_id;
      }
    }

    $form = CommonFormUtils::buildBulletPointsContainer($form, $bp_ids);

    $form['add_bp'] = [
      '#title' => $this->t('Add new bullet point'),
      '#type' => 'link',
      '#url' => Url::fromRoute('decreto_content_modify.bps_add', array('node' => NULL)),
      '#attributes' => array(
        'class' => array('use-ajax'),
        'data-dialog-type' => 'modal',
      ),
    ];

    $form['message'] = [
      '#type' => 'container',
      '#attributes' => ['id' => 'fapi-example-message'],
    ];

    $form['actions']['#type'] = 'actions';
    $form['actions']['submit'] = array(
      '#type' => 'submit',
      '#value' => $this->t('Save'),
      '#button_type' => 'primary',
    );
    return $form;
  }

  /**
   * {@inheritdoc}
   */
  public function validateForm(array &$form, FormStateInterface $form_state) {
  }

  /**
   * {@inheritdoc}
   */
  public function submitForm(array &$form, FormStateInterface $form_state) {
    $title = $form_state->getValue('title');
    $committee_tid = $form_state->getValue('committee');
    $type = $form_state->getValue('type');
    $start_date = $form_state->getValue('start_date');
    $end_date = $form_state->getValue('end_date');
    $location_tid = $form_state->getValue('location');
    $participants = $form_state->getValue('participants');
    $description = $form_state->getValue('description');
    $full_doc = $form_state->getValue('full_doc');
    $full_doc_closed = $form_state->getValue('full_doc_closed');

    $bp_nids = explode(',', $form_state->getValue('bp_nids'));
    $field_decreto_meet_bps = array();
    foreach ($bp_nids as $bp_nid) {
      $field_decreto_meet_bps[]['target_id'] = $bp_nid;
    }

    if (!$this->node) {
      $this->node = Node::create(array(
        'type' => 'decreto_meeting',
        'status' => 1,
        'title' => $title,
        'field_decreto_meet_committee' => ($committee_tid) ? $committee_tid : NULL,
        'field_decreto_meet_type' => $type,
        'field_decreto_meet_start_date' => ($start_date) ? $start_date->format(DATETIME_DATETIME_STORAGE_FORMAT) : NULL,
        'field_decreto_meet_end_date' => ($end_date) ? $end_date->format(DATETIME_DATETIME_STORAGE_FORMAT) : NULL,
        'field_decreto_meet_location' => ($location_tid) ? $location_tid : NULL,
        'field_decreto_meet_partic' => $participants,
        'body' => $description,
        'field_decreto_meet_full_doc' => !empty($full_doc) ? ['target_id' => array_pop($full_doc)] : NULL,
        'field_decreto_meet_full_doc_c' => !empty($full_doc_closed) ? ['target_id' => array_pop($full_doc_closed)] : NULL,
        'field_decreto_meet_bps' => $field_decreto_meet_bps
      ));
    }
    else {
      $this->node->title = $title;
      $this->node->field_decreto_meet_committee = ($committee_tid) ? $committee_tid : NULL;
      $this->node->field_decreto_meet_type = $type;
      $this->node->field_decreto_meet_start_date = ($start_date) ? $start_date->format(DATETIME_DATETIME_STORAGE_FORMAT) : NULL;
      $this->node->field_decreto_meet_end_date = ($end_date) ? $end_date->format(DATETIME_DATETIME_STORAGE_FORMAT) : NULL;
      $this->node->field_decreto_meet_location = ($location_tid) ? $location_tid : NULL;
      $this->node->field_decreto_meet_partic = $participants;
      $this->node->body = $description;
      $this->node->field_decreto_meet_full_doc = !empty($full_doc) ? ['target_id' => array_pop($full_doc)] : NULL;
      $this->node->field_decreto_meet_full_doc_c = !empty($full_doc_closed) ? ['target_id' => array_pop($full_doc_closed)] : NULL;
      $this->node->field_decreto_meet_bps = $field_decreto_meet_bps;
    }

    $this->node->save();
  }
}