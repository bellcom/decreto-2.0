<?php
/**
 * @file
 * Contains \Drupal\decreto_content_modify\Form\MeetingsEditForm.
 */

namespace Drupal\decreto_content_modify\Form;

use Drupal\Core\Ajax\AjaxResponse;
use Drupal\Core\Ajax\CloseModalDialogCommand;
use Drupal\Core\Ajax\RedirectCommand;
use Drupal\Core\Ajax\ReplaceCommand;
use Drupal\Core\Datetime\DrupalDateTime;
use Drupal\Core\Field\Plugin\Field\FieldFormatter;
use Drupal\Core\Form\FormBase;
use Drupal\Core\Form\FormStateInterface;
use Drupal\datetime\Plugin\Field\FieldType\DateTimeItemInterface;
use Drupal\node\Entity\Node;
use Drupal\node\NodeInterface;

/**
 * Meeting create or edit form.
 */
class MeetingsEditForm extends FormBase {
  protected $meeting;

  /**
   * Returns the title for the form
   *
   * @param NodeInterface $meeting
   *   Meeting node, can be null.
   *
   * @return \Drupal\Core\StringTranslation\TranslatableMarkup
   *   Title for the form.
   */
  public function getTitle(NodeInterface $meeting = null) {
    if ($meeting) {
      return $this->t('Edit meeting @label', ['@label' => $meeting->label()]);
    }
    else {
      return $this->t('Create meeting');
    }
  }

  /**
   * {@inheritdoc}
   */
  public function getFormId() {
    return 'decreto-content-modify-meeting-edit-form';
  }

  /**
   * {@inheritdoc}
   */
  public function buildForm(array $form, FormStateInterface $form_state, NodeInterface $meeting = NULL) {
    $this->meeting = $meeting;

    $form['#prefix'] = '<div id="' . $this->getFormId(). '">';
    $form['#suffix'] = '</div>';

    $form['title'] = [
      '#type' => 'textfield',
      '#placeholder' => $this->t('Title'),
      '#title' => $this->t('Title'),
      '#description' => $this->t('Meeting full title'),
    ];

    // Department.
    $department_terms = \Drupal::service('entity_type.manager')
      ->getStorage('taxonomy_term')
      ->loadTree('decreto_tax_department');
    $department_options = array();
    foreach ($department_terms as $term) {
      $department_options[$term->tid] = $term->name;
    }
    $form['department'] = [
      '#type' => 'select',
      '#title' => $this->t('Department'),
      '#options' => $department_options,
      '#required' => TRUE,
    ];

    // Location.
    $location_terms = \Drupal::service('entity_type.manager')
      ->getStorage('taxonomy_term')
      ->loadTree('decreto_tax_location');
    $location_options = array();
    foreach ($location_terms as $term) {
      $location_options[$term->tid] = $term->name;
    }
    $form['location'] = [
      '#type' => 'select',
      '#title' => $this->t('Location'),
      '#options' => $location_options,
      '#required' => TRUE,
    ];

    $form['populate_department_members'] = [
      '#type' => 'checkbox',
      '#title' => $this->t('Automatically populate members from selected department'),
    ];

    // TODO: do we need meeting type?
//    //type
//    $type_options = options_allowed_values(FieldStorageConfig::loadByName('node', 'field_decreto_meet_type'));
//    $form['type'] = [
//      '#type' => 'select',
//      //'#empty_option' => $this->t('Type'),
//      '#options' => $type_options
//    ];

    // Meeting dates.
    $form['start_date'] = array(
      '#type' => 'datetime',
      '#title' => $this->t('Start date - Free choice'),
      '#default_value' => DrupalDateTime::createFromTimestamp(time()),
    );
    $form['end_date'] = array(
      '#type' => 'datetime',
      '#title' => $this->t('End date - Free choice'),
      '#default_value' => DrupalDateTime::createFromTimestamp(time()),
    );

    // TODO: do we need to upload PDF and save them as meeting description?
//    $form['full_doc'] = array(
//      '#title' => $this->t('Open description'),
//      '#type' => 'managed_file',
//      '#upload_location' => 'public://',
//      '#default_value' => NULL,
//      '#upload_validators' => array(
//        'file_validate_extensions' => array('txt pdf doc docx'),
//      )
//    );
//
//    $form['full_doc_closed'] = array(
//      '#title' => $this->t('Closed description'),
//      '#type' => 'managed_file',
//      //'#upload_location' => 'private://',
//      '#upload_location' => 'public://', //TODO:change to private
//      '#default_value' => NULL,
//      '#upload_validators' => array(
//        'file_validate_extensions' => array('txt pdf doc docx'),
//      )
//    );

//    // If it is meeting's edit page, populate values.
//    if ($meeting) {
//      $form['title']['#default_value'] = $meeting->getTitle();
//      $form['department']['#default_value'] = $meeting->field_decreto_meet_department->target_id;
////      $form['type']['#default_value'] = $node->field_decreto_meet_type->value;
//      if ($meeting->field_decreto_meet_start_date->value) {
//        $form['start_date']['#default_value'] = DrupalDateTime::createFromFormat(DATETIME_DATETIME_STORAGE_FORMAT, $meeting->field_decreto_meet_start_date->value);
//      }
//      if ($meeting->field_decreto_meet_end_date->value) {
//        $form['end_date']['#default_value'] = DrupalDateTime::createFromFormat(DATETIME_DATETIME_STORAGE_FORMAT, $meeting->field_decreto_meet_end_date->value);
//      }
//      $form['location']['#default_value'] = $meeting->field_decreto_meet_location->target_id;
////      if (!$node->field_decreto_meet_full_doc->isEmpty()) {
////        $form['full_doc']['#default_value']['fid'] = $node->field_decreto_meet_full_doc->target_id;
////      }
////      if (!$node->field_decreto_meet_full_doc_c->isEmpty()) {
////        $form['full_doc_closed']['#default_value']['fid'] = $node->field_decreto_meet_full_doc_c->target_id;
////      }
//    }

    $form['actions'] = [
      '#type' => 'actions',
    ];

    // Cancel button.
    $form['actions']['cancel'] = [
      '#type' => 'button',
      '#value' => $this->t('Cancel'),
      '#name' => 'cancel',
      '#ajax' => [
        'callback' => '::ajaxCloseForm',
        'event' => 'click',
      ],
      '#limit_validation_errors' => [],
    ];

    // Submit button.
    $form['actions']['submit'] = [
      '#type' => 'submit',
      '#value' => $this->t('Save'),
      '#ajax' => [
        'callback' => '::ajaxSubmitForm',
        'event' => 'click',
      ],
    ];

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
    $department_tid = $form_state->getValue('department');
//    $type = $form_state->getValue('type');
    $start_date = $form_state->getValue('start_date');
    $end_date = $form_state->getValue('end_date');
    $location_tid = $form_state->getValue('location');

    // Participants.
    $populate_department_members = $form_state->getValue('populate_department_members');
    $field_decreto_meet_partic_int = [];
    if ($populate_department_members) {
      $query = \Drupal::entityQuery('user')
        ->condition('field_decreto_usr_departments', $department_tid, 'IN');
      $users_ids = $query->execute();
      if (!empty($users_ids)) {
        foreach($users_ids as $user_id) {
          $field_decreto_meet_partic_int[]['target_id'] = $user_id;
        }
      }
    }

//    $description = $form_state->getValue('description');
//    $full_doc = $form_state->getValue('full_doc');
//    $full_doc_closed = $form_state->getValue('full_doc_closed');
//
    if (!$this->meeting) {
      $this->meeting = Node::create([
        'type' => 'decreto_meeting',
        'status' => 1,
        'title' => $title,
        'field_decreto_meet_department' => $department_tid,
        'field_decreto_meet_location' => $location_tid,
        //'field_decreto_meet_type' => $type,
        'field_decreto_meet_start_date' => ($start_date) ? $start_date->format(DateTimeItemInterface::DATETIME_STORAGE_FORMAT) : NULL,
        'field_decreto_meet_end_date' => ($end_date) ? $end_date->format(DateTimeItemInterface::DATETIME_STORAGE_FORMAT) : NULL,
        'field_decreto_meet_partic_int' => $field_decreto_meet_partic_int,
//        'field_decreto_meet_full_doc' => !empty($full_doc) ? ['target_id' => array_pop($full_doc)] : NULL,
//        'field_decreto_meet_full_doc_c' => !empty($full_doc_closed) ? ['target_id' => array_pop($full_doc_closed)] : NULL,
      ]);
    }
//    else {
//      $this->node->title = $title;
//      $this->node->field_decreto_meet_department = ($department_tid) ? $department_tid : NULL;
//      $this->node->field_decreto_meet_type = $type;
//      $this->node->field_decreto_meet_start_date = ($start_date) ? $start_date->format(DATETIME_DATETIME_STORAGE_FORMAT) : NULL;
//      $this->node->field_decreto_meet_end_date = ($end_date) ? $end_date->format(DATETIME_DATETIME_STORAGE_FORMAT) : NULL;
//      $this->node->field_decreto_meet_location = ($location_tid) ? $location_tid : NULL;
//      $this->node->field_decreto_meet_partic = $field_decreto_meet_partic;
//      $this->node->body = $description;
//      $this->node->field_decreto_meet_full_doc = !empty($full_doc) ? ['target_id' => array_pop($full_doc)] : NULL;
//      $this->node->field_decreto_meet_full_doc_c = !empty($full_doc_closed) ? ['target_id' => array_pop($full_doc_closed)] : NULL;
//      $this->node->field_decreto_meet_bps = $field_decreto_meet_bps;
//    }
//
    $this->meeting->save();
  }

  /**
   * Closing modal form.
   *
   * @param array $form
   *   Render array representing from.
   * @param \Drupal\Core\Form\FormStateInterface $form_state
   *   Current form state.
   *
   * @return \Drupal\Core\Ajax\AjaxResponse
   *   Array of ajax commands to execute on submit of the modal form.
   */
  public function ajaxCloseForm(array &$form, FormStateInterface $form_state) {
    $response = new AjaxResponse();
    $response->addCommand(new CloseModalDialogCommand());

    return $response;
  }

  /**
   * Implements the submit handler for the ajax call.
   *
   * @param array $form
   *   Render array representing from.
   * @param \Drupal\Core\Form\FormStateInterface $form_state
   *   Current form state.
   *
   * @return \Drupal\Core\Ajax\AjaxResponse
   *   Array of ajax commands to execute on submit of the modal form.
   */
  public function ajaxSubmitForm(array &$form, FormStateInterface $form_state) {
    $response = new AjaxResponse();

    if ($form_state->getErrors()) {
      // Replacing form to show errors.
      $form['status_messages'] = [
        '#type' => 'status_messages',
        '#weight' => -10,
      ];
      $response->addCommand(new ReplaceCommand('#' . $this->getFormId(), $form));
    }
    else {
      // Closing modal and Redirecting to created / updated meeting.
      $response->addCommand(new CloseModalDialogCommand());
      $response->addCommand(new RedirectCommand($this->meeting->toUrl()->toString()));
    }

    return $response;
  }
}