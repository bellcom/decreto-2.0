<?php

namespace Drupal\decreto_user\Form;

/**
 * @file
 * Contains \Drupal\decreto_user\Form\UserEditForm.
 */

use Drupal\Core\Entity\ContentEntityInterface;
use Drupal\Core\Form\FormStateInterface;
use Drupal\Core\Session\AccountInterface;
use Drupal\decreto_content_modify\Form\AjaxFormBase;
use Drupal\user\Entity\User;
use Drupal\user\UserInterface;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

/**
 * User create or edit form.
 */
class UserEditForm extends AjaxFormBase {

  /**
   * Returns the title for the form.
   *
   * @param \Drupal\user\UserInterface $user
   *   User entity, can be null.
   *
   * @return \Drupal\Core\StringTranslation\TranslatableMarkup
   *   Title for the form.
   */
  public function getTitle(UserInterface $user = NULL) {
    if ($user) {
      return $this->t('Edit user @label', ['@label' => $user->getDisplayName()]);
    }
    else {
      return $this->t('Create user');
    }
  }

  /**
   * {@inheritdoc}
   */
  public function getFormId() {
    return 'decreto-user-edit-form';
  }

  /**
   * {@inheritdoc}
   */
  public function buildForm(array $form, FormStateInterface $form_state, ContentEntityInterface $user = NULL) {
    if ($user) {
      if ($user->bundle() != 'user') {
        throw new NotFoundHttpException();
      }
      $this->entity = $user;
      // Setting parent the as user, so that redirect happens to user page.
      $this->parent = $user;
    }

    // Adding help message.
    $form[] = \Drupal::service('decreto_help.message')->getMessageMarkup('user_create_edit_form');

    // Details.
    $form[] = [
      '#markup' => '<h4><strong>' . $this->t('Details') . '</strong></h4>',
    ];

    // Current password.
    // Only visible for account with no 'administer users' permission.
    if (!\Drupal::currentUser()->hasPermission('administer users')) {
      $form['currentPassword'] = [
        '#type' => 'password',
        '#title' => $this->t('Current password'),
      ];
    }

    // First name.
    $form['firstName'] = [
      '#type' => 'textfield',
      '#placeholder' => $this->t('First name'),
      '#title' => $this->t('First name'),
      '#required' => TRUE,
    ];

    // Last name.
    $form['lastName'] = [
      '#type' => 'textfield',
      '#placeholder' => $this->t('Last name'),
      '#title' => $this->t('Last name'),
      '#required' => TRUE,
    ];

    // Email.
    $form['email'] = [
      '#type' => 'textfield',
      '#placeholder' => $this->t('Email'),
      '#title' => $this->t('Email'),
      '#required' => TRUE,
    ];

    // Roles.
    // Only visible for account with 'administer users' permission.
    if (\Drupal::currentUser()->hasPermission('administer users')) {
      $roles = \Drupal::entityTypeManager()->getStorage('user_role')->loadMultiple();
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
        '#title' => $this->t('Roles'),
      );
    }

    // Password + confirm password.
    $form['password'] = [
      '#type' => 'password_confirm',
      '#required' => ($user) ? FALSE : TRUE,
    ];

    if ($user) {
      $form = $this->populateFormData($form, $form_state, $user);
    }

    $form = parent::buildForm($form, $form_state);

    return $form;
  }

  /**
   * Populates user form with data from real user.
   *
   * @param array $form
   *   Render array representing from.
   * @param \Drupal\Core\Form\FormStateInterface $form_state
   *   Current form state.
   * @param \Drupal\user\UserInterface $user
   *   User entity.
   *
   * @return array
   *   Form array with appended page.
   */
  public function populateFormData(array $form, FormStateInterface $form_state, UserInterface $user) {
    $form['firstName']['#default_value'] = $user->field_decreto_firstname->value;
    $form['lastName']['#default_value'] = $user->field_decreto_lastname->value;
    $form['email']['#default_value'] = $user->getEmail();

    $roles = $user->getRoles(TRUE);
    $form['roles']['#default_value'] = $roles;

    return $form;
  }

  /**
   * {@inheritdoc}
   */
  public function validateForm(array &$form, FormStateInterface $form_state) {
    $currentPassword = $form_state->getValue('currentPassword');
    $firstName = $form_state->getValue('firstName');
    $lastName = $form_state->getValue('lastName');
    $email = $form_state->getValue('email');
    $password = $form_state->getValue('password');

    if (!$this->entity) {
      // Getting the currently selected organisation, so that new user does not
      // have empty organisation field.
      $organisationId = \Drupal::service('decreto_organisation.organisation')->getSelectedOrganisation(FALSE);

      $this->entity = User::create([
        'field_decreto_firstname' => $firstName,
        'field_decreto_lastname' => $lastName,
        'field_decreto_usr_orgs' => [
          'target_id' => $organisationId,
        ],
      ]);

      $this->entity->setPassword($password);
      $this->entity->setUsername($email);
      $this->entity->setEmail($email);
      $this->entity->enforceIsNew();
      $this->entity->activate();
    }
    else {
      // Setting existing password if it is present.
      if ($currentPassword) {
        $this->entity->setExistingPassword($currentPassword);
      }

      // Updating username to new email value if username equals to the old
      // email value.
      if ($this->entity->getEmail() === $this->entity->getUsername()) {
        $this->entity->setUsername($email);
      }
      $this->entity->field_decreto_firstname = $firstName;
      $this->entity->field_decreto_lastname = $lastName;
      $this->entity->setEmail($email);
      if (!empty($password)) {
        $this->entity->setPassword($password);
      }
    }

    $violations = $this->entity->validate();

    if ($violations->count()) {
      foreach ($violations as $violation) {
        $form_state->setErrorByName('', $violation->getMessage());
      }
    }
  }

  /**
   * {@inheritdoc}
   */
  public function submitForm(array &$form, FormStateInterface $form_state) {
    // Entity is already being filled with values in formValidate function,
    // therefore we can just proceed by saving it.

    // Roles, only visible for account with 'administer users' permission.
    if (\Drupal::currentUser()->hasPermission('administer users')) {
      $roles = $form_state->getValue('roles');
      foreach ($roles as $roleId => $roleValue) {
        if ($roleValue) {
          $this->entity->addRole($roleId);
        }
        else {
          $this->entity->removeRole($roleId);
        }
      }
    }

    $this->entity->save();
    // Setting parent the as user, so that redirect happens to user page.
    $this->parent = $this->entity;
  }

}
