<?php

namespace Drupal\decreto_content_modify\Form;

use Drupal\Core\Ajax\AjaxResponse;
use Drupal\Core\Ajax\ReplaceCommand;
use Drupal\Core\Datetime\DrupalDateTime;
use Drupal\Core\Entity\ContentEntityInterface;
use Drupal\Core\Form\FormStateInterface;
use Drupal\datetime\Plugin\Field\FieldType\DateTimeItemInterface;
use Drupal\decreto_content_modify\Entity\DecretoMeeting;
use Drupal\decreto_organisation\Entity\DecretoOrganisation;
use Drupal\decreto_user\Entity\DecretoUser;
use Drupal\field\Entity\FieldConfig;
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
      return $this->t('Edit meeting');
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
  public function buildForm(array $form, FormStateInterface $form_state, ContentEntityInterface $meeting = NULL) {
    if ($meeting) {
      if ($meeting->getType() != 'decreto_meeting') {
        throw new NotFoundHttpException();
      }
      $this->entity = $meeting;
      // Setting parent the as meeting, so that redirect happens to meetings
      // page.
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
    $form['steps-container']['steps-step-3'] = [
      '#type' => 'html_tag',
      '#tag' => 'span',
      '#value' => '3',
      '#attributes' => [
        'class' => ['steps__item', ($activePage === 3 ? 'steps__item--active' : 'hidden')],
      ],
    ];
    // Steps container END.

    // Adding pages START.
    $form = $this->appendFormPage1($form, $form_state);
    $form = $this->appendFormPage2($form, $form_state);
    if ($activePage === 3) {
      $form = $this->appendFormPage3($form, $form_state);
    }
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
      '#name' => 'switch-page',
      '#value' => ($activePage === 1) ? $this->t('Go further') : $this->t('Go back'),
      '#ajax' => [
        'callback' => '::ajaxReloadForm',
        'event' => 'click',
      ],
      '#submit' => ['::submitSwitchPage'],
      '#attributes' => [
        'class' => [($useDepartmentMembers) ? 'hidden' : ''],
      ],
    ];
    // On third page, don't validate fields when page switching back.
    if ($activePage === 3) {
      $form['actions']['switch-page']['#limit_validation_errors'] = [];
    }

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
   *
   * @throws \Drupal\Core\Entity\Exception\UnsupportedEntityTypeDefinitionException
   */
  private function appendFormPage1(array $form, FormStateInterface $form_state) {
    $useDepartmentMembers = $form_state->get('use_department_members');
    $activePage = $form_state->get('active_page');

    $currentOrganisation = \Drupal::service('decreto_organisation.organisation')->getSelectedOrganisation();
    $decretoOrganisation = new DecretoOrganisation($currentOrganisation);

    // Page 1 container.
    $form['pages-page-1'] = [
      '#type' => 'container',
      '#attributes' => [
        'class' => [($activePage !== 1) ? 'hidden' : ''],
      ],
      '#theme' => 'decreto_content_modify_meeting_edit_form_page_1',
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
    $type_default_value = FieldConfig::loadByName('node', 'decreto_meeting', 'field_decreto_meet_type')->getDefaultValueLiteral();

    $form['pages-page-1']['type'] = [
      '#type' => 'select',
      '#title' => $this->t('Type'),
      '#options' => $type_options,
      '#default_value' => ($type_default_value) ? $type_default_value[0]['value'] : NULL,
      '#required' => TRUE,
      '#prefix' => '<div class="row"><div class="col-xs-12 col-sm-4">',
      '#suffix' => '</div>',
    ];

    // Department.
    if (\Drupal::currentUser()->hasPermission('create decreto_meeting content')) {
      // User has create meeting permission, can create any department meeting.
      $department_terms = $decretoOrganisation->getDepartments();
    }
    else {
      // User does not have a permission, allow creating only for departments
      // user is admin of.
      $decretoUser = new DecretoUser(User::load(\Drupal::currentUser()->id()));
      $department_terms = $decretoUser->getAdminDepartments();
    }

    $department_options = [];
    foreach ($department_terms as $term) {
      $department_options[$term->id()] = $term->label();
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
    $location_terms = $decretoOrganisation->getLocations();
    $location_options = [];
    foreach ($location_terms as $term) {
      $location_options[$term->id()] = $term->label();
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
          'type' => 'none',
        ],
      ],
      '#attributes' => [
        // Example of altering button class depending on ;'use department
        // members' mode status.
        'class' => ['btn-checkbox', (($useDepartmentMembers) ? 'btn-checkbox--active' : '')],
      ],
      '#submit' => ['::submitToggleUseDepartmentMembers'],
      '#limit_validation_errors' => [],
    ];

    // Meeting dates.
    $form['pages-page-1']['start_date'] = [
      '#title' => $this->t('Start date - optional'),
      '#type' => 'bootstrap_date_time',
      '#date_type' => 'datetime',
      '#hour_format' => '24h',
      '#allow_times' => '15',
      '#disable_days' => [],
      '#exclude_date' => '',
      '#datetime_format' => DECRETO_BOOTSTRAP_DATETIMEPICKER_DATETIME_JS_FORMAT,
      '#default_value' => DrupalDateTime::createFromTimestamp(time())->format(DECRETO_BOOTSTRAP_DATETIMEPICKER_DATETIME_FORMAT),
      '#prefix' => '<div class="row"><div class="col-xs-12 col-sm-6">',
      '#suffix' => '</div>',
    ];
    $form['pages-page-1']['end_date'] = [
      '#title' => $this->t('End date - optional'),
      '#type' => 'bootstrap_date_time',
      '#date_type' => 'datetime',
      '#hour_format' => '24h',
      '#allow_times' => '15',
      '#disable_days' => [],
      '#exclude_date' => '',
      '#datetime_format' => DECRETO_BOOTSTRAP_DATETIMEPICKER_DATETIME_JS_FORMAT,
      '#default_value' => DrupalDateTime::createFromTimestamp(time())->format(DECRETO_BOOTSTRAP_DATETIMEPICKER_DATETIME_FORMAT),
      '#prefix' => '<div class="col-xs-12 col-sm-6">',
      '#suffix' => '</div></div>',
    ];

    // Meeting user roles.
    if ($this->entity) {
      $decretoMeeting = new DecretoMeeting($this->entity);
      $meetingUsers = $decretoMeeting->getParticipants();

      $meetingUsersSelect = [];
      foreach ($meetingUsers as $user) {
        $meetingUsersSelect[$user->id()] = $user->label();
      }

      $meetingRoles = \Drupal::entityTypeManager()->getStorage('taxonomy_term')->loadTree('decreto_tax_meeting_roles');
      $form['pages-page-1']['meeting_roles'] = [
        '#type' => 'container',
        '#tree' => TRUE,
      ];
      foreach ($meetingRoles as $meetingRole) {
        $form['pages-page-1']['meeting_roles'][$meetingRole->tid] = [
          '#type' => 'select',
          '#title' => $this->t('Meeting role: %rolename', ['%rolename' => $meetingRole->name]),
          '#options' => $meetingUsersSelect,
          '#empty_value' => 0,
        ];
      }
    }

    $bundle_fields = \Drupal::getContainer()->get('entity_field.manager')->getFieldDefinitions('node', 'decreto_meeting');
    $field_decreto_meet_full_doc_field_definition = $bundle_fields['field_decreto_meet_full_doc'];
    $field_decreto_meet_full_doc_c_field_definition = $bundle_fields['field_decreto_meet_full_doc_c'];

    // Meeting description files.
    $form['pages-page-1']['full_doc'] = [
      '#title' => $this->t('Open description'),
      '#type' => 'managed_file',
      '#upload_location' => 'private://',
      '#upload_validators' => [
        'file_validate_extensions' => [$field_decreto_meet_full_doc_field_definition->getSetting('file_extensions')],
      ],
    ];
    $form['pages-page-1']['full_doc_closed'] = [
      '#title' => $this->t('Closed description'),
      '#type' => 'managed_file',
      '#upload_location' => 'private://',
      '#upload_validators' => [
        'file_validate_extensions' => [$field_decreto_meet_full_doc_c_field_definition->getSetting('file_extensions')],
      ],
    ];

    $form['#attached']['library'][] = 'decreto_content_modify/meeting-edit';
    $form['#attached']['drupalSettings']['decreto_bootstrap_datetimepicker']['datetime_js_format'] = DECRETO_BOOTSTRAP_DATETIMEPICKER_DATETIME_JS_FORMAT;

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

    $currentOrganisation = \Drupal::service('decreto_organisation.organisation')->getSelectedOrganisation();
    $decretoOrganisation = new DecretoOrganisation($currentOrganisation);

    // Page 2 container.
    $form['pages-page-2'] = [
      '#type' => 'container',
      '#attributes' => [
        'class' => [($activePage !== 2) ? 'hidden' : ''],
      ],
      '#theme' => 'decreto_content_modify_meeting_edit_form_page_2',
    ];

    // Participants START.
    $form['pages-page-2']['participants-container'] = [
      '#type' => 'container',
      '#attributes' => [
        'class' => ['div-table'],
      ],
    ];

    $form['pages-page-2']['participants-container']['header'] = [
      '#type' => 'container',
      '#attributes' => [
        'class' => ['div-table__thead'],
      ],
    ];
    $form['pages-page-2']['participants-container']['header']['row'] = [
      '#type' => 'container',
      '#attributes' => [
        'class' => ['row'],
      ],
    ];

    // Name.
    $form['pages-page-2']['participants-container']['header']['row']['name'] = [
      '#type' => 'container',
      '#attributes' => [
        'class' => ['col-xs-6'],
      ],
    ];
    $form['pages-page-2']['participants-container']['header']['row']['name'][] = [
      '#type' => 'html_tag',
      '#tag' => 'div',
      '#value' => $this->t('First and last name'),
      '#attributes' => [
        'class' => ['div-table__th'],
      ],
    ];

    // Internal.
    $form['pages-page-2']['participants-container']['header']['row']['internal'] = [
      '#type' => 'container',
      '#attributes' => [
        'class' => ['col-xs-3'],
      ],
    ];
    $form['pages-page-2']['participants-container']['header']['row']['internal'][] = [
      '#type' => 'html_tag',
      '#tag' => 'div',
      '#value' => $this->t('Internal'),
      '#attributes' => [
        'class' => ['div-table__th', 'text-center'],
      ],
    ];

    // External.
    $form['pages-page-2']['participants-container']['header']['row']['external'] = [
      '#type' => 'container',
      '#attributes' => [
        'class' => ['col-xs-3'],
      ],
    ];
    $form['pages-page-2']['participants-container']['header']['row']['external'][] = [
      '#type' => 'html_tag',
      '#tag' => 'div',
      '#value' => $this->t('External'),
      '#attributes' => [
        'class' => ['div-table__th', 'text-center'],
      ],
    ];

    $users = $decretoOrganisation->getUsers();
    if (!empty($users)) {
      $form['pages-page-2']['participants-container']['participants'] = [
        '#type' => 'container',
        '#tree' => TRUE,
        '#attributes' => [
          'class' => ['div-table__tbody'],
        ],
      ];

      foreach ($users as $user) {
        $user_id = $user->id();
        $form['pages-page-2']['participants-container']['participants'][$user_id] = [
          '#type' => 'container',
          '#attributes' => [
            'class' => ['div-table__tr', 'js-meeting-member'],
            'data-name' => $user->label(),
          ],
        ];
        $form['pages-page-2']['participants-container']['participants'][$user_id]['row'] = [
          '#type' => 'container',
          '#attributes' => [
            'class' => ['row'],
          ],
        ];

        // Name.
        $form['pages-page-2']['participants-container']['participants'][$user_id]['row']['name_column'] = [
          '#type' => 'container',
          '#attributes' => [
            'class' => ['col-xs-6'],
          ],
        ];
        $form['pages-page-2']['participants-container']['participants'][$user_id]['row']['name_column']['name'] = [
          '#type' => 'html_tag',
          '#tag' => 'div',
          '#value' => $user->label(),
          '#attributes' => [
            'class' => ['div-table__td', 'js-member-name-wrapper'],
          ],
        ];

        // Internal.
        $form['pages-page-2']['participants-container']['participants'][$user_id]['row']['internal_column'] = [
          '#type' => 'container',
          '#attributes' => [
            'class' => ['col-xs-3'],
          ],
        ];
        $form['pages-page-2']['participants-container']['participants'][$user_id]['row']['internal_column']['internal'] = [
          '#type' => 'checkbox',
          '#prefix' => '<div class="div-table__td text-center js-checkbox" data-member-type="internal">',
          '#suffix' => '</div>',
        ];

        // External.
        $form['pages-page-2']['participants-container']['participants'][$user_id]['row']['external_column'] = [
          '#type' => 'container',
          '#attributes' => [
            'class' => ['col-xs-3'],
          ],
        ];
        $form['pages-page-2']['participants-container']['participants'][$user_id]['row']['external_column']['external'] = [
          '#type' => 'checkbox',
          '#prefix' => '<div class="div-table__td text-center js-checkbox" data-member-type="external">',
          '#suffix' => '</div>',
        ];
      }
    }
    // Participants END.

    $form['pages-page-2']['add-new-external-user'] = [
      '#type' => 'submit',
      '#name' => 'add-new-external-user',
      '#value' => $this->t('New external user'),
      '#ajax' => [
        'callback' => '::ajaxReloadForm',
        'event' => 'click',
      ],
      '#submit' => ['::submitSwitchPage'],
      '#limit_validation_errors' => [],
    ];

    return $form;
  }

  /**
   * Appends third page components to a form.
   *
   * @param array $form
   *   Render array representing from.
   * @param \Drupal\Core\Form\FormStateInterface $form_state
   *   Current form state.
   *
   * @return array
   *   Form array with appended page.
   *
   * @throws \Drupal\Component\Plugin\Exception\InvalidPluginDefinitionException
   * @throws \Drupal\Component\Plugin\Exception\PluginNotFoundException
   */
  private function appendFormPage3(array $form, FormStateInterface $form_state) {
    $activePage = $form_state->get('active_page');

    // Page 2 container.
    $form['pages-page-3'] = [
      '#type' => 'container',
      '#attributes' => [
        'class' => [($activePage !== 3) ? 'hidden' : ''],
      ],
    ];

    /** @var \Drupal\decreto_user\Services\DecretoUserFormsService $userFormsService */
    $userFormsService = \Drupal::service('decreto_user.user_forms');
    $form['pages-page-3'][] = $userFormsService->getUserEditFormStructure();

    $form['pages-page-3']['submit-create-new-user'] = [
      '#type' => 'submit',
      '#name' => 'submit-create-new-user',
      '#value' => $this->t('Create user'),
      '#ajax' => [
        'callback' => '::ajaxReloadForm',
        'event' => 'click',
      ],
      '#submit' => ['::submitCreateNewUser'],
    ];

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

    $decretoMeeting = new DecretoMeeting($meeting);

    $start_date = $end_date = NULL;

    if ($start_date_str = $meeting->field_decreto_meet_start_date->value) {
      $start_date = DrupalDateTime::createFromFormat(DateTimeItemInterface::DATETIME_STORAGE_FORMAT, $start_date_str, new \DateTimeZone(DateTimeItemInterface::STORAGE_TIMEZONE));

      $form['pages-page-1']['start_date']['#default_value'] = $start_date->format(DECRETO_BOOTSTRAP_DATETIMEPICKER_DATETIME_FORMAT, ['timezone' => date_default_timezone_get()]);
    }
    if ($end_date_str = $meeting->field_decreto_meet_end_date->value) {
      $end_date = DrupalDateTime::createFromFormat(DateTimeItemInterface::DATETIME_STORAGE_FORMAT, $end_date_str, new \DateTimeZone(DateTimeItemInterface::STORAGE_TIMEZONE));

      $form['pages-page-1']['end_date']['#default_value'] = $end_date->format(DECRETO_BOOTSTRAP_DATETIMEPICKER_DATETIME_FORMAT, ['timezone' => date_default_timezone_get()]);
    }

    // Fill department roles.
    $meetingRoles = \Drupal::entityTypeManager()->getStorage('taxonomy_term')->loadTree('decreto_tax_meeting_roles');
    foreach ($meetingRoles as $meetingRole) {
      $uid = $decretoMeeting->getRoleUser($meetingRole->tid, FALSE);
      $form['pages-page-1']['meeting_roles'][$meetingRole->tid]['#default_value'] = $uid;
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
      $internal_participants_ids = $decretoMeeting->getInternalParticipants(FALSE);
      foreach ($internal_participants_ids as $participant_id) {
        $form['pages-page-2']['participants-container']['participants'][$participant_id]['row']['internal_column']['internal']['#default_value'] = TRUE;
      }

      // External participants.
      $external_participants_ids = $decretoMeeting->getExternalParticipants(FALSE);
      foreach ($external_participants_ids as $participant_id) {
        $form['pages-page-2']['participants-container']['participants'][$participant_id]['row']['external_column']['external']['#default_value'] = TRUE;
      }
    }

    $form['pages-page-2']['meeting_summary']['#markup'] = $meeting->getTitle() . ', ' . $start_date->format(DECRETO_BOOTSTRAP_DATETIMEPICKER_DATETIME_FORMAT, ['timezone' => date_default_timezone_get()]);

    return $form;
  }

  /**
   * {@inheritdoc}
   */
  public function validateForm(array &$form, FormStateInterface $form_state) {
    parent::validateForm($form, $form_state);

    // Getting triggering element name.
    $triggeringElement = $form_state->getTriggeringElement();
    $triggerName = $triggeringElement['#name'];

    // If trigger is 'submit-create-new-user', validate the user that is about
    // to be created.
    if ($triggerName == 'submit-create-new-user') {
      /** @var \Drupal\decreto_user\Services\DecretoUserFormsService $userFormsService */
      $userFormsService = \Drupal::service('decreto_user.user_forms');

      // Validating the input and creating new unsaved user entity.
      $externalUser = $userFormsService->validateUserEditForm($form_state);
      $form_state->set('externalUser', $externalUser);
    }
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
    $meetingRoles = $form_state->getValue('meeting_roles');
    $location_tid = $form_state->getValue('location');
    $full_doc = $form_state->getValue('full_doc');
    $full_doc_closed = $form_state->getValue('full_doc_closed');

    // Participants.
    $useDepartmentMembers = $form_state->get('use_department_members');
    $field_decreto_meet_partic_int = [];
    $field_decreto_meet_partic_ext = [];

    // Keeping participants list for notifications.
    $addedParticipantsIds = [];
    $removedParticipantsIds = [];

    if (!$useDepartmentMembers) {
      // Not using department members, grab the selected participants.
      $participants = $form_state->getValue('participants');

      foreach ($participants as $user_id => $participant) {
        if ($participant['row']['internal_column']['internal']) {
          $field_decreto_meet_partic_int[]['target_id'] = $user_id;
        }
        if ($participant['row']['external_column']['external']) {
          $field_decreto_meet_partic_ext[]['target_id'] = $user_id;
        }
      }
    }

    if ($start_date) {
      $start_date = DrupalDateTime::createFromFormat(DECRETO_BOOTSTRAP_DATETIMEPICKER_DATETIME_FORMAT, $start_date, drupal_get_user_timezone());
    }
    if ($end_date) {
      $end_date = DrupalDateTime::createFromFormat(DECRETO_BOOTSTRAP_DATETIMEPICKER_DATETIME_FORMAT, $end_date, drupal_get_user_timezone());
    }

    if (!$this->entity) {
      $this->entity = Node::create([
        'type' => 'decreto_meeting',
        'status' => 1,
        'title' => $title,
        'field_decreto_meet_type' => $type,
        'field_decreto_meet_department' => $department_tid,
        'field_decreto_meet_location' => $location_tid,
        'field_decreto_meet_start_date' => ($start_date) ? $start_date->format(DateTimeItemInterface::DATETIME_STORAGE_FORMAT, ['timezone' => DateTimeItemInterface::STORAGE_TIMEZONE]) : NULL,
        'field_decreto_meet_end_date' => ($end_date) ? $end_date->format(DateTimeItemInterface::DATETIME_STORAGE_FORMAT, ['timezone' => DateTimeItemInterface::STORAGE_TIMEZONE]) : NULL,
        'field_decreto_meet_partic_int' => $field_decreto_meet_partic_int,
        'field_decreto_meet_partic_ext' => $field_decreto_meet_partic_ext,
        'field_decreto_meet_use_dep_mem' => $useDepartmentMembers,
        'field_decreto_meet_full_doc' => !empty($full_doc) ? ['target_id' => reset($full_doc)] : NULL,
        'field_decreto_meet_full_doc_c' => !empty($full_doc_closed) ? ['target_id' => reset($full_doc_closed)] : NULL,
      ]);

      // Getting new participants.
      $decreto_meeting = new DecretoMeeting($this->entity);
      $newInternalParticipantsIds = $decreto_meeting->getInternalParticipants(FALSE);
      $newExternalParticipantsIds = $decreto_meeting->getExternalParticipants(FALSE);
      $addedParticipantsIds = array_merge([], $newInternalParticipantsIds, $newExternalParticipantsIds);
    }
    else {
      // Saving the participants.
      $decreto_meeting = new DecretoMeeting($this->entity);
      $oldParticipantsIds = $decreto_meeting->getParticipants(FALSE);

      $this->entity->title = $title;
      $this->entity->field_decreto_meet_department = ($department_tid) ? $department_tid : NULL;
      $this->entity->field_decreto_meet_type = $type;
      $this->entity->field_decreto_meet_start_date = ($start_date) ? $start_date->format(DateTimeItemInterface::DATETIME_STORAGE_FORMAT, ['timezone' => DateTimeItemInterface::STORAGE_TIMEZONE]) : NULL;
      $this->entity->field_decreto_meet_end_date = ($end_date) ? $end_date->format(DateTimeItemInterface::DATETIME_STORAGE_FORMAT, ['timezone' => DateTimeItemInterface::STORAGE_TIMEZONE]) : NULL;
      $this->entity->field_decreto_meet_location = ($location_tid) ? $location_tid : NULL;
      $this->entity->field_decreto_meet_partic_int = $field_decreto_meet_partic_int;
      $this->entity->field_decreto_meet_partic_ext = $field_decreto_meet_partic_ext;
      $this->entity->field_decreto_meet_use_dep_mem = $useDepartmentMembers;
      $this->entity->field_decreto_meet_full_doc = !empty($full_doc) ? ['target_id' => reset($full_doc)] : NULL;
      $this->entity->field_decreto_meet_full_doc_c = !empty($full_doc_closed) ? ['target_id' => reset($full_doc_closed)] : NULL;

      // Getting new participants.
      $decreto_meeting = new DecretoMeeting($this->entity);
      $newParticipantsIds = $decreto_meeting->getParticipants(FALSE);

      $addedParticipantsIds = array_diff($newParticipantsIds, $oldParticipantsIds);
      $removedParticipantsIds = array_diff($oldParticipantsIds, $newParticipantsIds);
    }

    $this->entity->save();

    // Setting parent the as meeting, so that redirect happens to meetings page.
    $this->parent = $this->entity;

    $decretoMeeting = new DecretoMeeting($this->entity);

    // Meeting roles.
    if (!empty($meetingRoles)) {
      foreach ($meetingRoles as $roleTid => $userId) {
        if ($userId) {
          $decretoMeeting->addRole($roleTid, $userId);
        }
        else {
          $decretoMeeting->removeRole($roleTid);
        }
      }
    }

    $this->handleMeetingNotifications($addedParticipantsIds, $removedParticipantsIds);
  }

  /**
   * Handles the meeting participants notifications.
   *
   * Notifies each participants about being added or removed from a meeting.
   *
   * @param array $addedParticipantsIds
   *   List of UID of the users added to a meeting (added participants).
   * @param array $removedParticipantsIds
   *   List of UID of the users removed from a meeting (removed participants).
   */
  private function handleMeetingNotifications(array $addedParticipantsIds, array $removedParticipantsIds) {
    $addedParticipants = User::loadMultiple($addedParticipantsIds);
    $removedParticipants = User::loadMultiple($removedParticipantsIds);

    /** @var \Drupal\decreto_content_modify\Services\ContentService $contentService */
    $contentService = \Drupal::service('decreto_content_modify.content');

    foreach ($addedParticipants as $participant) {
      $contentService->notifyAddedToMeeting($participant, $this->entity);
    }

    foreach ($removedParticipants as $participant) {
      $contentService->notifyRemovedFromMeeting($participant, $this->entity);
    }
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
   * Submit handler for 'swift-page' and 'add-new-external-user' buttons.
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

    // Getting triggering element name.
    $triggeringElement = $form_state->getTriggeringElement();
    $triggerName = $triggeringElement['#name'];

    // Switching page.
    if ($triggerName == 'switch-page') {
      if ($active_page === 1) {
        $form_state->set('active_page', 2);
      }
      elseif ($active_page === 2) {
        $form_state->set('active_page', 1);
      }
      elseif ($active_page === 3) {
        $form_state->set('active_page', 2);
      }
    }
    elseif ($triggerName == 'add-new-external-user') {
      $form_state->set('active_page', 3);
    }

    $form_state->setRebuild();
  }

  /**
   * Submit handler for 'submit-create-new-user' button.
   *
   * Submits the user, handles the user being added to the list, and does
   * the page switching.
   *
   * @param array $form
   *   Render array representing from.
   * @param \Drupal\Core\Form\FormStateInterface $form_state
   *   Current form state.
   *
   * @throws \Drupal\Core\Entity\EntityMalformedException
   * @throws \Drupal\Core\Entity\EntityStorageException
   */
  public function submitCreateNewUser(array &$form, FormStateInterface $form_state) {
    // IF no errors, proceed with user saving.
    if (!$form_state->getErrors()) {
      $externalUser = $form_state->get('externalUser');

      /** @var \Drupal\decreto_user\Services\DecretoUserFormsService $userFormsService */
      $userFormsService = \Drupal::service('decreto_user.user_forms');

      // Submitting will actually save the user.
      $externalUser = $userFormsService->submitUserEditForm($form_state, $externalUser);
      $form_state->set('messages', 1);

      $userInput = $form_state->getUserInput();

      // Adding participant to the list.
      $userInput['participants'][$externalUser->id()]['row'] = [
        'internal_column' => ['internal' => NULL],
        'external_column' => ['external' => '1'],
      ];

      // Clearing user form input.
      foreach ($form['pages-page-3'][0] as $key => $element) {
        unset($userInput[$key]);
      }

      $form_state->setUserInput($userInput);

      // Page switch.
      $form_state->set('active_page', 2);

      // Removing external user form form state.
      $form_state->set('externalUser', NULL);

      // Rebuilding form.
      $form_state->setRebuild();
    }
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

    if ($form_state->getErrors() || $form_state->has('messages')) {
      // Replacing form to show errors.
      $form['status_messages'] = [
        '#type' => 'status_messages',
        '#weight' => -10,
      ];
    }
    $form_state->set('messages', NULL);

    // Rebuilding form after ajax request.
    $response->addCommand(new ReplaceCommand('#' . $this->getFormId(), $form));

    return $response;
  }

}
