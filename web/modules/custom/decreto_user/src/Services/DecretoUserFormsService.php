<?php

namespace Drupal\decreto_user\Services;

use Drupal\Core\Form\FormStateInterface;
use Drupal\Core\Session\AccountInterface;
use Drupal\decreto_user\Entity\DecretoUser;
use Drupal\user\Entity\User;
use Drupal\user\UserInterface;

/**
 * Decreto user forms service.
 */
class DecretoUserFormsService {

  /**
   * Generates the form structure for user add or edit forms.
   *
   * Created to avoid code duplication, as user create/edit forms are needed in
   * several places.
   *
   * @param \Drupal\user\UserInterface|null $user
   *   If that is an edit form, provide an existing user.
   *
   * @return array
   *   Form array ready for being rendered.
   *
   * @throws \Drupal\Component\Plugin\Exception\InvalidPluginDefinitionException
   * @throws \Drupal\Component\Plugin\Exception\PluginNotFoundException
   */
  public function getUserEditFormStructure(UserInterface $user = NULL) {
    // Details.
    $form[] = [
      '#markup' => '<h4><strong>' . t('Details') . '</strong></h4>',
    ];

    // Current password.
    // Only visible for account with no 'administer users' permission.
    if (!\Drupal::currentUser()->hasPermission('administer users')) {
      $form['currentPassword'] = [
        '#type' => 'password',
        '#title' => t('Current password'),
      ];
    }

    // First name.
    $form['firstName'] = [
      '#type' => 'textfield',
      '#placeholder' => t('First name'),
      '#title' => t('First name'),
      '#required' => TRUE,
    ];

    // Last name.
    $form['lastName'] = [
      '#type' => 'textfield',
      '#placeholder' => t('Last name'),
      '#title' => t('Last name'),
      '#required' => TRUE,
    ];

    // Email.
    $form['email'] = [
      '#type' => 'textfield',
      '#placeholder' => t('Email'),
      '#title' => t('Email'),
      '#required' => TRUE,
    ];

    // This part is only visible for account with 'administer users' permission.
    if (\Drupal::currentUser()->hasPermission('administer users')) {
      // Roles.
      $roles = \Drupal::entityTypeManager()
        ->getStorage('user_role')
        ->loadMultiple();
      $rolesSelect = [];
      foreach ($roles as $role) {
        // Skipping reserved roles.
        if ($role->id() == AccountInterface::ANONYMOUS_ROLE
          || $role->id() == AccountInterface::AUTHENTICATED_ROLE
          || $role->id() == 'administrator') {
          continue;
        }

        $rolesSelect[$role->id()] = $role->label();
      }
      $form['roles'] = array(
        '#type' => 'checkboxes',
        '#options' => $rolesSelect,
        '#title' => t('Roles'),
      );

      // Department.
      $vid = 'decreto_tax_department';
      $departments = \Drupal::entityTypeManager()
        ->getStorage('taxonomy_term')
        ->loadTree($vid, 0, NULL, TRUE);

      $departmentsSelect = [];
      foreach ($departments as $department) {
        // Only those departments that user can edit.
        if ($department->access('update')) {
          $departmentsSelect[$department->id()] = $department->getName();
        }
      }

      if (!empty($departmentsSelect)) {
        $form['departments'] = [
          '#type' => 'checkboxes',
          '#options' => $departmentsSelect,
          '#title' => t('Department'),
        ];
      }
    }

    // Password + confirm password.
    $form['password'] = [
      '#type' => 'password_confirm',
      '#required' => ($user) ? FALSE : TRUE,
    ];

    return $form;
  }

  /**
   * User form validate function.
   *
   * Validates that the user about to be created is valid.
   * Using user entity validate function.
   *
   * @param \Drupal\Core\Form\FormStateInterface $form_state
   *   Current form state.
   * @param \Drupal\user\UserInterface|null $user
   *   If user is already created, it's passed as a parameter.
   *
   * @return \Drupal\Core\Entity\EntityInterface|\Drupal\user\UserInterface
   *   Unsaved user entity.
   */
  public function validateUserEditForm(FormStateInterface &$form_state, UserInterface $user = NULL) {
    $currentPassword = $form_state->getValue('currentPassword');
    $firstName = $form_state->getValue('firstName');
    $lastName = $form_state->getValue('lastName');
    $email = $form_state->getValue('email');
    $password = $form_state->getValue('password');

    if (!$user) {
      // Getting the currently selected organisation, so that new user does not
      // have empty organisation field.
      $organisationId = \Drupal::service('decreto_organisation.organisation')->getSelectedOrganisation(FALSE);

      $user = User::create([
        'field_decreto_firstname' => $firstName,
        'field_decreto_lastname' => $lastName,
        'field_decreto_usr_orgs' => [
          'target_id' => $organisationId,
        ],
      ]);

      $user->setPassword($password);
      $user->setUsername($email);
      $user->setEmail($email);
      $user->enforceIsNew();
      $user->activate();
    }
    else {
      // Setting existing password if it is present.
      if ($currentPassword) {
        $user->setExistingPassword($currentPassword);
      }

      // Updating username to new email value if username equals to the old
      // email value.
      if ($user->getEmail() === $user->getUsername()) {
        $user->setUsername($email);
      }
      $user->field_decreto_firstname = $firstName;
      $user->field_decreto_lastname = $lastName;
      $user->setEmail($email);
      if (!empty($password)) {
        $user->setPassword($password);
      }
    }

    $violations = $user->validate();
    if ($violations->count()) {
      foreach ($violations as $violation) {
        $form_state->setErrorByName('', $violation->getMessage());
      }
    }

    return $user;
  }

  /**
   * User forms create user.
   *
   * User entity must be already filled with values in validateUserEditForm
   * function, therefore we can just proceed by saving it.
   *
   * @param \Drupal\Core\Form\FormStateInterface $form_state
   *   Current form state.
   * @param \Drupal\user\UserInterface $user
   *   Filled and unsaved user entity.
   *
   * @return \Drupal\user\UserInterface
   *   Saved user entity.
   *
   * @throws \Drupal\Core\Entity\EntityMalformedException
   * @throws \Drupal\Core\Entity\EntityStorageException
   */
  public function submitUserEditForm(FormStateInterface &$form_state, UserInterface $user) {
    // Roles, only visible for account with 'administer users' permission.
    if (\Drupal::currentUser()->hasPermission('administer users')) {
      $roles = $form_state->getValue('roles');
      foreach ($roles as $roleId => $roleValue) {
        if ($roleValue) {
          $user->addRole($roleId);
        }
        else {
          $user->removeRole($roleId);
        }
      }
    }

    // Saving isNew for later usage.
    $isNew = $user->isNew();
    // Saving the entity.
    $user->save();

    // Departments, only visible for account with 'administer users' permission.
    if (\Drupal::currentUser()->hasPermission('administer users')) {
      $departments = $form_state->getValue('departments');
      $decretoUser = new DecretoUser($user);
      foreach ($departments as $departmentId => $departmentValue) {
        if ($departmentValue) {
          $decretoUser->addDepartment($departmentId, FALSE);
        }
        else {
          $decretoUser->removeDepartment($departmentId, FALSE);
        }
      }
      $decretoUser->getEntity()->save();
    }

    // Notify user.
    if ($isNew) {
      _user_mail_notify('register_admin_created', $user);
      \Drupal::messenger()->addStatus(t('A welcome message with further instructions has been emailed to the new user <a href=":url">%name</a>.', [':url' => $user->toUrl()->toString(), '%name' => $user->getAccountName()]));
    }

    return $user;
  }

}
