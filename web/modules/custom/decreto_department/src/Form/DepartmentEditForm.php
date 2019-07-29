<?php

namespace Drupal\decreto_department\Form;

/**
 * @file
 * Contains \Drupal\decreto_department\Form\DepartmentEditForm.
 */

use Drupal\Core\Ajax\AjaxResponse;
use Drupal\Core\Ajax\CloseModalDialogCommand;
use Drupal\Core\Ajax\RedirectCommand;
use Drupal\Core\Ajax\ReplaceCommand;
use Drupal\Core\Form\FormBase;
use Drupal\Core\Form\FormStateInterface;
use Drupal\taxonomy\Entity\Term;
use Drupal\taxonomy\TermInterface;
use Drupal\user\Entity\User;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

/**
 * Department create or edit form.
 */
class DepartmentEditForm extends FormBase {
  protected $department;

  /**
   * Returns the title for the form.
   *
   * @param \Drupal\taxonomy\TermInterface $department
   *   Meeting node, can be null.
   *
   * @return \Drupal\Core\StringTranslation\TranslatableMarkup
   *   Title for the form.
   */
  public function getTitle(TermInterface $department = NULL) {
    if ($department) {
      return $this->t('Edit department @label', ['@label' => $department->label()]);
    }
    else {
      return $this->t('Create department');
    }
  }

  /**
   * {@inheritdoc}
   */
  public function getFormId() {
    return 'decreto-department-edit-form';
  }

  /**
   * {@inheritdoc}
   */
  public function buildForm(array $form, FormStateInterface $form_state, TermInterface $department = NULL) {
    if ($department) {
      if ($department->bundle() != 'decreto_tax_department') {
        throw new NotFoundHttpException();
      }
      $this->department = $department;
    }

    $form['#prefix'] = '<div id="' . $this->getFormId() . '">';
    $form['#suffix'] = '</div>';

    // Adding help message.
    $form[] = \Drupal::service('decreto_help.message')->getMessageMarkup('department_create_edit_form');

    // Details.
    $form[] = [
      '#markup' => '<h4><strong>' . $this->t('Details') . '</strong></h4>',
    ];

    // Name.
    $form['name'] = [
      '#type' => 'textfield',
      '#placeholder' => $this->t('Name'),
      '#title' => $this->t('Name'),
      '#required' => TRUE,
    ];

    // Members START.
    $form[] = [
      '#markup' => '<h4><strong>' . $this->t('Members') . '</strong></h4>',
    ];
    $form['member-container'] = [
      '#type' => 'container',
    ];
    $form['member-container']['header'] = [
      '#type' => 'container',
      '#attributes' => [
        'class' => ['row'],
      ],
    ];
    $form['member-container']['header'][] = [
      '#type' => 'html_tag',
      '#tag' => 'div',
      '#value' => $this->t('First and last name'),
      '#attributes' => [
        'class' => ['col-xs-6'],
      ],
    ];
    $form['member-container']['header'][] = [
      '#type' => 'html_tag',
      '#tag' => 'div',
      '#value' => $this->t('Attached'),
      '#attributes' => [
        'class' => ['col-xs-3'],
      ],
    ];

    $query = \Drupal::entityQuery('user')
      ->condition('status', 1);
    $users_ids = $query->execute();
    if (!empty($users_ids)) {
      $form['member-container']['members'] = [
        '#type' => 'container',
        '#tree' => TRUE,
      ];
      $users = User::loadMultiple($users_ids);

      foreach ($users as $user) {
        $user_id = $user->id();
        $form['member-container']['members'][$user_id] = [
          '#type' => 'container',
          '#attributes' => [
            'class' => ['row'],
          ],
        ];
        $form['member-container']['members'][$user_id]['name'] = [
          '#type' => 'html_tag',
          '#tag' => 'div',
          '#value' => $user->label(),
          '#attributes' => [
            'class' => ['col-xs-6'],
          ],
        ];
        $form['member-container']['members'][$user_id]['attached'] = [
          '#type' => 'checkbox',
          '#prefix' => '<div class="col-xs-3">',
          '#suffix' => '</div>'
        ];
      }
    }
    // Members END.

    if ($department) {
      $form = $this->populateFormData($form, $form_state, $department);
    }

    // Form actions START.
    $form['actions'] = [
      '#type' => 'actions',
    ];
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
    $form['actions']['submit'] = [
      '#type' => 'submit',
      '#value' => $this->t('Save'),
      '#ajax' => [
        'callback' => '::ajaxSubmitForm',
        'event' => 'click',
      ],
    ];
    // Form actions END.

    return $form;
  }

  /**
   * Populates meeting form with data from real meeting.
   *
   * @param array $form
   *   Render array representing from.
   * @param FormStateInterface $form_state
   *   Current form state.
   * @param TermInterface $department
   *   Department term.
   *
   * @return array
   *   Form array with appended page.
   */
  public function populateFormData(array $form, FormStateInterface $form_state, TermInterface $department) {
    $form['name']['#default_value'] = $department->getName();

    // Fill participants array based on user department attribute.
    $query = \Drupal::entityQuery('user')
      ->condition('status', 1)
      ->condition('field_decreto_usr_departments', $this->department->id(), 'IN');
    $users_ids = $query->execute();
    if (!empty($users_ids)) {
      foreach ($users_ids as $user_id) {
        $form['member-container']['members'][$user_id]['attached']['#default_value'] = TRUE;
      }
    }

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
    $name = $form_state->getValue('name');

    if (!$this->department) {
      $this->department = Term::create([
        'vid' => 'decreto_tax_department',
        'name' => $name,
      ]);
    }
    else {
      $this->department->name = $name;
    }

    $this->department->save();

    $attached_users = [];

    // Grab the selected members.
    $members = $form_state->getValue('members');
    foreach ($members as $user_id => $member) {
      if ($member['attached']) {
        $attached_users[$user_id] = $user_id;
      }
    }

    // Find all members that are currently part of this department.
    $query = \Drupal::entityQuery('user')
      ->condition('status', 1)
      ->condition('field_decreto_usr_departments', $this->department->id(), 'IN');
    $users_ids = $query->execute();
    if (!empty($users_ids)) {
      foreach ($users_ids as $user_id) {
        if (in_array($user_id, $attached_users)) {
          // User is already attached to a department, remove from list.
          unset($attached_users[$user_id]);
        }
        else {
          // User is no longer present in department, detach department.
          $user = User::load($user_id);
          $user_departments = $user->field_decreto_usr_departments->getValue();

          foreach ($user_departments as $delta => $user_department) {
            if ($user_department['target_id'] == $this->department->id()) {
              unset($user_departments[$delta]);
              break;
            }
          }
          $user->field_decreto_usr_departments = $user_departments;
          $user->save();

          // Remove from list.
          unset($attached_users[$user_id]);
        }
      }
    }

    // Attaching department to those users that are still in list - new members.
    if (!empty($attached_users)) {
      foreach ($attached_users as $attached_user) {
        $user = User::load($attached_user);
        $user->field_decreto_usr_departments[] = ['target_id' => $this->department->id()];
        $user->save();
      }
    }
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
      $response->addCommand(new RedirectCommand($this->department->toUrl()->toString()));
    }

    return $response;
  }

}
