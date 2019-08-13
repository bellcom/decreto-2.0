<?php

namespace Drupal\decreto_content_modify\Form;

use Drupal\Core\Ajax\AjaxResponse;
use Drupal\Core\Ajax\ReplaceCommand;
use Drupal\Core\Datetime\DrupalDateTime;
use Drupal\Core\Form\FormStateInterface;
use Drupal\datetime\Plugin\Field\FieldType\DateTimeItemInterface;
use Drupal\field\Entity\FieldStorageConfig;
use Drupal\node\Entity\Node;
use Drupal\node\NodeInterface;
use Drupal\user\Entity\User;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

/**
 * Meeting create or edit form.
 *
 * @see \Drupal\Core\Form\FormBase
 */
class MeetingEditForm extends AjaxFormBase {

  /**
   * Returns the title for the form.
   *
   * @param \Drupal\node\NodeInterface $meeting
   *   Meeting node, can be null.
   *
   * @return \Drupal\Core\StringTranslation\TranslatableMarkup
   *   Title for the form.
   */
  public function getTitle(NodeInterface $meeting = NULL) {
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
    if ($meeting) {
      if ($meeting->getType() != 'decreto_meeting') {
        throw new NotFoundHttpException();
      }
      $this->node = $meeting;
      // Setting parent the as meeting, so that redirect happens to meetings page.
      $this->parent = $meeting;
    }

    $useDepartmentMembers = $form_state->get('use_department_members');
    if (!isset($useDepartmentMembers)) {
      if ($meeting) {
        // Reading 'use_department_members' from meeting.
        $useDepartmentMembers = $meeting->field_decreto_meet_use_dep_mem->value;
      }
      else {
        // No meeting, activate by default.
        $useDepartmentMembers = TRUE;
      }

      $form_state->set('use_department_members', $useDepartmentMembers);
    }

    $activePage = $form_state->get('active_page');
    if (!isset($activePage)) {
      $activePage = 1;
      $form_state->set('active_page', $activePage);
    }

    // Adding help message.
    $form[] = \Drupal::service('decreto_help.message')->getMessageMarkup('meetings_create_edit_form');

    // Steps container START.
    $form['steps-container'] = [
      '#type' => 'container',
      '#attributes' => [
        'class' => ['steps', ($useDepartmentMembers ? 'hidden' : '')],
      ],
    ];
    $form['steps-container']['steps-step-1'] = [
      '#type' => 'html_tag',
      '#tag' => 'span',
      '#value' => '1',
      '#attributes' => [
        'class' => ['steps__item', ($activePage === 1 ? 'steps__item--active' : '')],
      ],
    ];
    $form['steps-container']['steps-step-2'] = [
      '#type' => 'html_tag',
      '#tag' => 'span',
      '#value' => '2',
      '#attributes' => [
        'class' => ['steps__item', ($activePage === 2 ? 'steps__item--active' : '')],
      ],
    ];
    // Steps container END.

    // Adding pages START.
    $form = $this->appendFormPage1($form, $form_state);
    $form = $this->appendFormPage2($form, $form_state);
    // Adding pages END.

    // If it is meeting's edit page, populate values.
    if ($meeting) {
      $form = $this->populateFormData($form, $form_state, $meeting);
    }

    $form = parent::buildForm($form, $form_state);

    // Adding button before submit button START.
    $submitButton = $form['actions']['submit'];
    unset($form['actions']['submit']);
    $form['actions']['switch-page'] = [
      '#type' => 'submit',
      '#value' => ($activePage === 1) ? $this->t('Go further') : $this->t('Go back'),
      '#ajax' => [
        'callback' => '::ajaxReloadForm',
        'event' => 'click',
      ],
      '#submit' => ['::submitSwitchPage'],
      '#attributes' => [
        'class' => [($useDepartmentMembers) ? 'hidden' : '']
      ]
    ];
    $form['actions']['submit'] = $submitButton;
    // Adding button before submit button END.

    // Submit button custom behavior.
    $form['actions']['submit']['#attributes'] = [
      // Show button only if we use department members, or if we are on the
      // second page of the form.
      'class' => [(!$useDepartmentMembers && $activePage !== 2) ? 'hidden' : ''],
    ];


    return $form;
  }

  /**
   * Appends first page components to a form.
   *
   * @param array $form
   *   Render array representing from.
   * @param \Drupal\Core\Form\FormStateInterface $form_state
   *   Current form state.
   *
   * @return array
   *   Form array with appended page.
   */
  private function appendFormPage1(array $form, FormStateInterface $form_state) {
    $useDepartmentMembers = $form_state->get('use_department_members');
    $activePage = $form_state->get('active_page');

    // Page 1 container.
    $form['pages-page-1'] = [
      '#type' => 'container',
      '#attributes' => [
        'class' => [($activePage !== 1) ? 'hidden' : ''],
      ],
    ];

    // Details.
    $form['pages-page-1']['details'] = [
      '#markup' => '<h4><strong>' . $this->t('Details') . '</strong></h4>',
    ];

    // Title.
    $form['pages-page-1']['title'] = [
      '#type' => 'textfield',
      '#placeholder' => $this->t('Title'),
      '#title' => $this->t('Title'),
      '#required' => TRUE,
      '#description' => $this->t('Full title of the meeting'),
    ];

    // Type.
    $type_options = options_allowed_values(FieldStorageConfig::loadByName('node', 'field_decreto_meet_type'));
    $form['pages-page-1']['type'] = [
      '#type' => 'select',
      '#title' => $this->t('Type'),
      '#options' => $type_options,
      '#required' => TRUE,
      '#prefix' => '<div class="row"><div class="col-xs-12 col-sm-4">',
      '#suffix' => '</div>',
    ];

    // Department.
    $department_terms = \Drupal::service('entity_type.manager')
      ->getStorage('taxonomy_term')
      ->loadTree('decreto_tax_department');
    $department_options = [];
    foreach ($department_terms as $term) {
      $department_options[$term->tid] = $term->name;
    }
    $form['pages-page-1']['department'] = [
      '#type' => 'select',
      '#title' => $this->t('Department'),
      '#options' => $department_options,
      '#required' => TRUE,
      '#prefix' => '<div class="col-xs-12 col-sm-4">',
      '#suffix' => '</div>',
    ];

    // Location.
    $location_terms = \Drupal::service('entity_type.manager')
      ->getStorage('taxonomy_term')
      ->loadTree('decreto_tax_location');
    $location_options = [];
    foreach ($location_terms as $term) {
      $location_options[$term->tid] = $term->name;
    }
    $form['pages-page-1']['location'] = [
      '#type' => 'select',
      '#title' => $this->t('Location'),
      '#options' => $location_options,
      '#required' => TRUE,
      '#prefix' => '<div class="col-xs-12 col-sm-4">',
      '#suffix' => '</div></div>',
    ];

    // Use department members button.
    // Must be of type submit in order to talk to backend via Ajax.
    $form['pages-page-1']['use_department_members'] = [
      '#type' => 'submit',
      '#value' => $this->t('Use department members as meeting participants'),
      '#ajax' => [
        'callback' => '::ajaxReloadForm',
        'progress' => [
          'type' => 'none'
        ]
      ],
      '#attributes' => [
        // Example of altering button class depending on ;'use department
        // members' mode status.
        'class' => [($useDepartmentMembers) ? 'btn-primary' : ''],
      ],
      '#submit' => ['::submitToggleUseDepartmentMembers'],
      '#limit_validation_errors' => [],
    ];

    // Meeting dates.
    $form['pages-page-1']['start_date'] = [
      '#type' => 'datetime',
      '#title' => $this->t('Start date - optional'),
      '#default_value' => DrupalDateTime::createFromTimestamp(time()),
      '#prefix' => '<div class="row"><div class="col-xs-12 col-sm-6">',
      '#suffix' => '</div>',
    ];
    $form['pages-page-1']['end_date'] = [
      '#type' => 'datetime',
      '#title' => $this->t('End date - optional'),
      '#default_value' => DrupalDateTime::createFromTimestamp(time()),
      '#prefix' => '<div class="col-xs-12 col-sm-6">',
      '#suffix' => '</div></div>',
    ];

    // Meeting description files.
    $form['pages-page-1']['full_doc'] = [
      '#title' => $this->t('Open description'),
      '#type' => 'managed_file',
      '#upload_location' => 'public://',
      '#upload_validators' => [
        'file_validate_extensions' => ['txt pdf doc docx'],
      ],
    ];
    $form['pages-page-1']['full_doc_closed'] = [
      '#title' => $this->t('Closed description'),
      '#type' => 'managed_file',
      '#upload_location' => 'private://',
      '#upload_validators' => [
        'file_validate_extensions' => ['txt pdf doc docx'],
      ],
    ];

    return $form;
  }

  /**
   * Appends second page components to a form.
   *
   * @param array $form
   *   Render array representing from.
   * @param \Drupal\Core\Form\FormStateInterface $form_state
   *   Current form state.
   *
   * @return array
   *   Form array with appended page.
   */
  private function appendFormPage2(array $form, FormStateInterface $form_state) {
    $activePage = $form_state->get('active_page');

    // Page 2 container.
    $form['pages-page-2'] = [
      '#type' => 'container',
      '#attributes' => [
        'class' => [($activePage !== 2) ? 'hidden' : ''],
      ],
    ];

    // Participants START.
    $form['pages-page-2']['participants-container'] = [
      '#type' => 'container',
    ];
    $form['pages-page-2']['participants-container']['header'] = [
      '#type' => 'container',
      '#attributes' => [
        'class' => ['row'],
      ],
    ];
    $form['pages-page-2']['participants-container']['header'][] = [
      '#type' => 'html_tag',
      '#tag' => 'div',
      '#value' => $this->t('First and last name'),
      '#attributes' => [
        'class' => ['col-xs-6'],
      ],
    ];
    $form['pages-page-2']['participants-container']['header'][] = [
      '#type' => 'html_tag',
      '#tag' => 'div',
      '#value' => $this->t('Internal'),
      '#attributes' => [
        'class' => ['col-xs-3'],
      ],
    ];
    $form['pages-page-2']['participants-container']['header'][] = [
      '#type' => 'html_tag',
      '#tag' => 'div',
      '#value' => $this->t('External'),
      '#attributes' => [
        'class' => ['col-xs-3'],
      ],
    ];

    $query = \Drupal::entityQuery('user')
      ->condition('status', 1);
    $users_ids = $query->execute();
    if (!empty($users_ids)) {
      $form['pages-page-2']['participants-container']['participants'] = [
        '#type' => 'container',
        '#tree' => TRUE,
      ];
      $users = User::loadMultiple($users_ids);

      foreach ($users as $user) {
        $user_id = $user->id();
        $form['pages-page-2']['participants-container']['participants'][$user_id] = [
          '#type' => 'container',
          '#attributes' => [
            'class' => ['row'],
          ],
        ];
        $form['pages-page-2']['participants-container']['participants'][$user_id]['name'] = [
          '#type' => 'html_tag',
          '#tag' => 'div',
          '#value' => $user->label(),
          '#attributes' => [
            'class' => ['col-xs-6'],
          ],
        ];
        $form['pages-page-2']['participants-container']['participants'][$user_id]['internal'] = [
          '#type' => 'checkbox',
          '#prefix' => '<div class="col-xs-3">',
          '#suffix' => '</div>',
        ];
        $form['pages-page-2']['participants-container']['participants'][$user_id]['external'] = [
          '#type' => 'checkbox',
          '#prefix' => '<div class="col-xs-3">',
          '#suffix' => '</div>',
        ];
      }
    }
    // Participants END.

    return $form;
  }

  /**
   * Populates meeting form with data from real meeting.
   *
   * @param array $form
   *   Render array representing from.
   * @param \Drupal\Core\Form\FormStateInterface $form_state
   *   Current form state.
   * @param \Drupal\node\NodeInterface $meeting
   *   Meeting node.
   *
   * @return array
   *   Form array with appended page.
   */
  public function populateFormData(array $form, FormStateInterface $form_state, NodeInterface $meeting) {
    $form['pages-page-1']['title']['#default_value'] = $meeting->getTitle();
    $form['pages-page-1']['type']['#default_value'] = $meeting->field_decreto_meet_type->value;
    $form['pages-page-1']['department']['#default_value'] = $meeting->field_decreto_meet_department->target_id;
    $form['pages-page-1']['location']['#default_value'] = $meeting->field_decreto_meet_location->target_id;

    if ($start_date = $meeting->field_decreto_meet_start_date->value) {
      $form['pages-page-1']['start_date']['#default_value'] = DrupalDateTime::createFromFormat(DateTimeItemInterface::DATETIME_STORAGE_FORMAT, $start_date);
    }
    if ($end_date = $meeting->field_decreto_meet_end_date->value) {
      $form['pages-page-1']['end_date']['#default_value'] = DrupalDateTime::createFromFormat(DateTimeItemInterface::DATETIME_STORAGE_FORMAT, $end_date);
    }

    if (!$meeting->field_decreto_meet_full_doc->isEmpty()) {
      $form['pages-page-1']['full_doc']['#default_value']['fid'] = $meeting->field_decreto_meet_full_doc->target_id;
    }
    if (!$meeting->field_decreto_meet_full_doc_c->isEmpty()) {
      $form['pages-page-1']['full_doc_closed']['#default_value']['fid'] = $meeting->field_decreto_meet_full_doc_c->target_id;
    }

    // Populating participants checkboxes.
    if (!$form_state->get('use_department_members')) {
      // Internal participants.
      $internal_participants_ids = array_column($meeting->field_decreto_meet_partic_int->getValue(), 'target_id');
      foreach ($internal_participants_ids as $participant_id) {
        $form['pages-page-2']['participants-container']['participants'][$participant_id]['internal']['#default_value'] = TRUE;
      }

      // External participants.
      $external_participants_ids = array_column($meeting->field_decreto_meet_partic_ext->getValue(), 'target_id');
      foreach ($external_participants_ids as $participant_id) {
        $form['pages-page-2']['participants-container']['participants'][$participant_id]['external']['#default_value'] = TRUE;
      }
    }

    return $form;
  }

  /**
   * {@inheritdoc}
   */
  public function submitForm(array &$form, FormStateInterface $form_state) {
    $title = $form_state->getValue('title');
    $type = $form_state->getValue('type');
    $department_tid = $form_state->getValue('department');
    $start_date = $form_state->getValue('start_date');
    $end_date = $form_state->getValue('end_date');
    $location_tid = $form_state->getValue('location');
    $full_doc = $form_state->getValue('full_doc');
    $full_doc_closed = $form_state->getValue('full_doc_closed');

    // Participants.
    $useDepartmentMembers = $form_state->get('use_department_members');
    $field_decreto_meet_partic_int = [];
    $field_decreto_meet_partic_ext = [];

    if (!$useDepartmentMembers) {
      // Not using department members, grab the selected participants.
      $participants = $form_state->getValue('participants');

      foreach ($participants as $user_id => $participant) {
        if ($participant['internal']) {
          $field_decreto_meet_partic_int[]['target_id'] = $user_id;
        }
        if ($participant['external']) {
          $field_decreto_meet_partic_ext[]['target_id'] = $user_id;
        }
      }
    }
    if (!$this->node) {
      $this->node = Node::create([
        'type' => 'decreto_meeting',
        'status' => 1,
        'title' => $title,
        'field_decreto_meet_type' => $type,
        'field_decreto_meet_department' => $department_tid,
        'field_decreto_meet_location' => $location_tid,
        'field_decreto_meet_start_date' => ($start_date) ? $start_date->format(DateTimeItemInterface::DATETIME_STORAGE_FORMAT) : NULL,
        'field_decreto_meet_end_date' => ($end_date) ? $end_date->format(DateTimeItemInterface::DATETIME_STORAGE_FORMAT) : NULL,
        'field_decreto_meet_partic_int' => $field_decreto_meet_partic_int,
        'field_decreto_meet_partic_ext' => $field_decreto_meet_partic_ext,
        'field_decreto_meet_use_dep_mem' => $useDepartmentMembers,
        'field_decreto_meet_full_doc' => !empty($full_doc) ? ['target_id' => reset($full_doc)] : NULL,
        'field_decreto_meet_full_doc_c' => !empty($full_doc_closed) ? ['target_id' => reset($full_doc_closed)] : NULL,
      ]);
    }
    else {
      $this->node->title = $title;
      $this->node->field_decreto_meet_department = ($department_tid) ? $department_tid : NULL;
      $this->node->field_decreto_meet_type = $type;
      $this->node->field_decreto_meet_start_date = ($start_date) ? $start_date->format(DateTimeItemInterface::DATETIME_STORAGE_FORMAT) : NULL;
      $this->node->field_decreto_meet_end_date = ($end_date) ? $end_date->format(DateTimeItemInterface::DATETIME_STORAGE_FORMAT) : NULL;
      $this->node->field_decreto_meet_location = ($location_tid) ? $location_tid : NULL;
      $this->node->field_decreto_meet_partic_int = $field_decreto_meet_partic_int;
      $this->node->field_decreto_meet_partic_ext = $field_decreto_meet_partic_ext;
      $this->node->field_decreto_meet_use_dep_mem = $useDepartmentMembers;
      $this->node->field_decreto_meet_full_doc = !empty($full_doc) ? ['target_id' => reset($full_doc)] : NULL;
      $this->node->field_decreto_meet_full_doc_c = !empty($full_doc_closed) ? ['target_id' => reset($full_doc_closed)] : NULL;
    }

    $this->node->save();

    // Setting parent the as meeting, so that redirect happens to meetings page.
    $this->parent = $this->node;
  }

  /**
   * Submit handler for 'use_department_members' button.
   *
   * Toggles between using department members and manual fill.
   *
   * @param array $form
   *   Render array representing from.
   * @param \Drupal\Core\Form\FormStateInterface $form_state
   *   Current form state.
   */
  public function submitToggleUseDepartmentMembers(array &$form, FormStateInterface $form_state) {
    $useDepartmentMembers = $form_state->get('use_department_members');

    $form_state->set('use_department_members', !$useDepartmentMembers);
    $form_state->setRebuild();
  }

  /**
   * Submit handler for 'swift-page' button.
   *
   * Switches between pages.
   *
   * @param array $form
   *   Render array representing from.
   * @param \Drupal\Core\Form\FormStateInterface $form_state
   *   Current form state.
   */
  public function submitSwitchPage(array &$form, FormStateInterface $form_state) {
    // Getting current page.
    $active_page = $form_state->get('active_page');

    // Switching page.
    if ($active_page === 1) {
      $form_state->set('active_page', 2);
    }
    else {
      $form_state->set('active_page', 1);
    }

    $form_state->setRebuild();
  }

  /**
   * Replaces the form after it has been reloaded by submit handler.
   *
   * @param array $form
   *   Render array representing from.
   * @param \Drupal\Core\Form\FormStateInterface $form_state
   *   Current form state.
   *
   * @return \Drupal\Core\Ajax\AjaxResponse
   *   Array of ajax commands to execute on submit of the modal form.
   */
  public function ajaxReloadForm(array &$form, FormStateInterface $form_state) {
    $response = new AjaxResponse();

    if ($form_state->getErrors()) {
      // Replacing form to show errors.
      $form['status_messages'] = [
        '#type' => 'status_messages',
        '#weight' => -10,
      ];
    }

    // Rebuilding form after ajax request.
    $response->addCommand(new ReplaceCommand('#' . $this->getFormId(), $form));

    return $response;
  }

}
