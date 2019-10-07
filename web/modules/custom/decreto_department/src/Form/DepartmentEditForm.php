<?php

namespace Drupal\decreto_department\Form;

/**
 * @file
 * Contains \Drupal\decreto_department\Form\DepartmentEditForm.
 */

use Drupal\Core\Entity\ContentEntityInterface;
use Drupal\Core\Form\FormStateInterface;
use Drupal\decreto_content_modify\Form\AjaxFormBase;
use Drupal\decreto_department\Entity\DecretoDepartment;
use Drupal\decreto_organisation\Entity\DecretoOrganisation;
use Drupal\decreto_user\Entity\DecretoUser;
use Drupal\taxonomy\Entity\Term;
use Drupal\taxonomy\TermInterface;
use Drupal\user\Entity\User;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

/**
 * Department create or edit form.
 */
class DepartmentEditForm extends AjaxFormBase {

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
  public function buildForm(array $form, FormStateInterface $form_state, ContentEntityInterface $department = NULL) {
    if ($department) {
      if ($department->bundle() != 'decreto_tax_department') {
        throw new NotFoundHttpException();
      }
      $this->entity = $department;
      // Setting parent the as department, so that redirect happens to department page.
      $this->parent = $department;
    }

    $currentOrganisation = \Drupal::service('decreto_organisation.organisation')->getSelectedOrganisation();
    $decretoOrganisation = new DecretoOrganisation($currentOrganisation);
    $users = $decretoOrganisation->getUsers();

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

    // Department admin.
    $selectUsers = [];
    if (!empty($users)) {
      foreach ($users as $user) {
        $selectUsers[$user->id()] = $user->label();
      }
    }

    $form['department_admin'] = [
      '#type' => 'select',
      '#title' => $this->t('Department admin'),
      '#options' => $selectUsers,
      '#empty_value' => 0,
    ];

    // Members START.
    $form[] = [
      '#markup' => '<h4><strong>' . $this->t('Members') . '</strong></h4>',
    ];
    $form['member-container'] = [
      '#type' => 'container',
      '#prefix' => '<div class="div-table">',
      '#suffix' => '</div>',
    ];
    $form['member-container']['header'] = [
      '#type' => 'container',
      '#attributes' => [
        'class' => ['row'],
      ],
      '#prefix' => '<div class="div-table__thead"><div class="div-table__tr">',
      '#suffix' => '</div></div>',
    ];
    $form['member-container']['header'][] = [
      '#type' => 'html_tag',
      '#tag' => 'div',
      '#value' => $this->t('First and last name'),
      '#attributes' => [
        'class' => ['div-table__th'],
      ],
      '#prefix' => '<div class="col-xs-8">',
      '#suffix' => '</div>',
    ];
    $form['member-container']['header'][] = [
      '#type' => 'html_tag',
      '#tag' => 'div',
      '#value' => $this->t('Attached'),
      '#attributes' => [
        'class' => ['div-table__th'],
      ],
      '#prefix' => '<div class="col-xs-4">',
      '#suffix' => '</div>',
    ];

    if (!empty($users)) {
      $form['member-container']['members'] = [
        '#type' => 'container',
        '#tree' => TRUE,
        '#prefix' => '<div class="div-table__tbody">',
        '#suffix' => '</div>',
      ];

      foreach ($users as $user) {
        $user_id = $user->id();
        $form['member-container']['members'][$user_id] = [
          '#type' => 'container',
          '#attributes' => [
            'class' => ['row'],
          ],
          '#prefix' => '<div class="div-table__tr">',
          '#suffix' => '</div>',
        ];
        $form['member-container']['members'][$user_id]['name'] = [
          '#type' => 'html_tag',
          '#tag' => 'div',
          '#value' => $user->label(),
          '#attributes' => [
            'class' => ['div-table__td'],
          ],
          '#prefix' => '<div class="col-xs-8">',
          '#suffix' => '</div>',
        ];
        $form['member-container']['members'][$user_id]['attached'] = [
          '#type' => 'checkbox',
          '#prefix' => '<div class="col-xs-4"><div class="div-table__td">',
          '#suffix' => '</div></div>',
        ];
      }
    }
    // Members END.

    if ($department) {
      $form = $this->populateFormData($form, $form_state, $department);
    }

    $form = parent::buildForm($form, $form_state);

    return $form;
  }

  /**
   * Populates meeting form with data from real meeting.
   *
   * @param array $form
   *   Render array representing from.
   * @param \Drupal\Core\Form\FormStateInterface $form_state
   *   Current form state.
   * @param \Drupal\taxonomy\TermInterface $department
   *   Department term.
   *
   * @return array
   *   Form array with appended page.
   *
   * @throws \Drupal\Core\TypedData\Exception\MissingDataException
   */
  public function populateFormData(array $form, FormStateInterface $form_state, TermInterface $department) {
    $form['name']['#default_value'] = $department->getName();
    $decretoDepartment = new DecretoDepartment($department);
    $form['department_admin']['#default_value'] = $decretoDepartment->getDepartmentAdmin(FALSE);

    // Fill participants array based on user department attribute.
    $query = \Drupal::entityQuery('user')
      ->condition('status', 1)
      ->condition('field_decreto_usr_departments', $this->entity->id(), 'IN');
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
  public function submitForm(array &$form, FormStateInterface $form_state) {
    $name = $form_state->getValue('name');
    $departmentAdminId = $form_state->getValue('department_admin');
    $currentOrganisationId = \Drupal::service('decreto_organisation.organisation')->getSelectedOrganisation(FALSE);

    if (!$this->entity) {
      $this->entity = Term::create([
        'vid' => 'decreto_tax_department',
        'name' => $name,
        'field_decreto_dep_org' => ['target_id' => $currentOrganisationId],
        'field_decreto_dep_admin' => ['target_id' => $departmentAdminId],
      ]);
    }
    else {
      $this->entity->name = $name;
      $this->entity->field_decreto_dep_admin = ['target_id' => $departmentAdminId];
    }

    $this->entity->save();
    // Setting parent the as department, so that redirect happens to department page.
    $this->parent = $this->entity;

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
      ->condition('field_decreto_usr_departments', $this->entity->id(), 'IN');
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
          $decretoUser = new DecretoUser($user);
          $decretoUser->removeDepartment($this->entity->id());

          // Remove from list.
          unset($attached_users[$user_id]);
        }
      }
    }

    // Attaching department to those users that are still in list - new members.
    if (!empty($attached_users)) {
      foreach ($attached_users as $attached_user) {
        $user = User::load($attached_user);
        $decretoUser = new DecretoUser($user);
        $decretoUser->addDepartment($this->entity->id());
      }
    }
  }

}
