<?php

namespace Drupal\decreto_user\Form;

/**
 * @file
 * Contains \Drupal\decreto_user\Form\UserEditForm.
 */

use Drupal\Core\Entity\ContentEntityInterface;
use Drupal\Core\Form\FormStateInterface;
use Drupal\decreto_content_modify\Form\AjaxFormBase;
use Drupal\decreto_user\Entity\DecretoUser;
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

    /** @var \Drupal\decreto_user\Services\DecretoUserFormsService $userFormsService */
    $userFormsService = \Drupal::service('decreto_user.user_forms');
    $form += $userFormsService->getUserEditFormStructure($user);

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

    if (isset($form['roles'])) {
      $roles = $user->getRoles(TRUE);
      $form['roles']['#default_value'] = $roles;
    }

    if (isset($form['departments'])) {
      $decretoUser = new DecretoUser($user);
      $departments = $decretoUser->getDepartments(FALSE);
      $form['departments']['#default_value'] = $departments;
    }

    return $form;
  }

  /**
   * {@inheritdoc}
   */
  public function validateForm(array &$form, FormStateInterface $form_state) {
    /** @var \Drupal\decreto_user\Services\DecretoUserFormsService $userFormsService */
    $userFormsService = \Drupal::service('decreto_user.user_forms');

    // Validating the input and creating new unsaved user entity.
    $this->entity = $userFormsService->validateUserEditForm($form_state, $this->entity);
  }

  /**
   * {@inheritdoc}
   */
  public function submitForm(array &$form, FormStateInterface $form_state) {
    /** @var \Drupal\decreto_user\Services\DecretoUserFormsService $userFormsService */
    $userFormsService = \Drupal::service('decreto_user.user_forms');

    // Submitting will actually save the user.
    $this->entity = $userFormsService->submitUserEditForm($form_state, $this->entity);

    // Setting parent the as user, so that redirect happens to user page.
    if (!$this->parent) {
      $this->parent = $this->entity;
    }
  }

}
