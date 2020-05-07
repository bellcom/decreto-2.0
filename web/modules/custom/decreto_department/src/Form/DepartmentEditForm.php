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
use Drupal\node\Entity\Node;
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
    $allUsersSelect = [];
    if (!empty($users)) {
      foreach ($users as $user) {
        $allUsersSelect[$user->id()] = $user->label();
      }
    }

    $form['department_admin'] = [
      '#type' => 'select',
      '#title' => $this->t('Department admin'),
      '#options' => $allUsersSelect,
      '#empty_value' => 0,
    ];


    // Department user roles.
    if ($this->entity) {
      $decretoDepartment = new DecretoDepartment($this->entity);
      $departmentUsers = $decretoDepartment->getUsers();
      $departmentUsersSelect = [];
      foreach ($departmentUsers as $user) {
        $departmentUsersSelect[$user->id()] = $user->label();
      }
      $departmentRoles = \Drupal::entityTypeManager()->getStorage('taxonomy_term')->loadTree('decreto_tax_department_roles');
      $form['department_roles'] = [
        '#type' => 'container',
        '#tree' => TRUE,
      ];
      foreach ($departmentRoles as $departmentRole) {
        $form['department_roles'][$departmentRole->tid] = [
          '#type' => 'select',
          '#title' => $this->t('Department role: %rolename', ['%rolename' => $departmentRole->name]),
          '#options' => $departmentUsersSelect,
          '#empty_value' => 0,
        ];
      }
    }

    // Organisation.
    $organisationNids = \Drupal::entityQuery('node')
      ->condition('status', 1)
      ->condition('type', 'decreto_organisation')
      ->execute();
    $organisations = Node::loadMultiple($organisationNids);
    $organisationsList = [];
    foreach ($organisations as $organisation) {
      $organisationsList[$organisation->id()] = $organisation->getTitle();
    }

    $form['organisation'] = [
      '#type' => 'select',
      '#title' => $this->t('Organisation'),
      '#required' => TRUE,
      '#options' => $organisationsList
    ];

    // Meeting video link.
    $form['video_link'] = [
      '#type' => 'textfield',
      '#placeholder' => $this->t('Video link'),
      '#title' => $this->t('Video link'),
      '#description' => $this->t('URL to video link, e.g. https://youtu.be/...'),
      '#pattern' => 'https?:\/\/.*',
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
    $form['organisation']['#default_value'] = $decretoDepartment->getOrganisation(FALSE);
    $form['organisation']['#attributes'] = ['disabled' => 'disabled'];
    $form['video_link']['#default_value'] = $department->field_decreto_dep_video_link->value;

    // Fill department roles.
    $departmentRoles = \Drupal::entityTypeManager()->getStorage('taxonomy_term')->loadTree('decreto_tax_department_roles');
    foreach ($departmentRoles as $departmentRole) {
      $uid = $decretoDepartment->getRoleUser($departmentRole->tid, FALSE);
      $form['department_roles'][$departmentRole->tid]['#default_value'] = $uid;
    }

    // Fill participants array based on user department attribute.
    $departmentUsers = $decretoDepartment->getUsers(FALSE);
    if (!empty($departmentUsers)) {
      foreach ($departmentUsers as $user_id) {
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
    $departmentRoles = $form_state->getValue('department_roles');
    $video_link = $form_state->getValue('video_link');

    if (!$this->entity) {
      $this->entity = Term::create([
        'vid' => 'decreto_tax_department',
        'name' => $name,
        'field_decreto_dep_org' => ['target_id' => $currentOrganisationId],
        'field_decreto_dep_admin' => ['target_id' => $departmentAdminId],
        'field_decreto_dep_video_link' => $video_link,
      ]);
    }
    else {
      $this->entity->name = $name;
      $this->entity->field_decreto_dep_admin = ['target_id' => $departmentAdminId];
      $this->entity->field_decreto_dep_video_link = $video_link;
    }

    $this->entity->save();
    // Setting parent the as department, so that redirect happens to department page.
    $this->parent = $this->entity;

    $decretoDepartment = new DecretoDepartment($this->entity);

    // Department roles.
    if (!empty($departmentRoles)) {
      foreach ($departmentRoles as $roleTid => $userId) {
        if ($userId) {
          $decretoDepartment->addRole($roleTid, $userId);
        }
        else {
          $decretoDepartment->removeRole($roleTid);
        }
      }
    }

    // Grab the selected members.
    $attached_users = [];
    $members = $form_state->getValue('members');
    foreach ($members as $user_id => $member) {
      if ($member['attached']) {
        $attached_users[$user_id] = $user_id;
      }
    }

    // Find all members that are currently part of this department.
    $users_ids = $decretoDepartment->getUsers(FALSE);
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
