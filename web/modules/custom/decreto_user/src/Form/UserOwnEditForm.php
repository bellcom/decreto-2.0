<?php

namespace Drupal\decreto_user\Form;

/**
 * @file
 * Contains \Drupal\decreto_user\Form\UserEditForm.
 */

use Drupal\Core\Entity\ContentEntityInterface;
use Drupal\Core\Form\FormStateInterface;
use Drupal\user\Entity\User;
use Drupal\user\UserInterface;

/**
 * User create or edit form.
 */
class UserOwnEditForm extends UserEditForm {

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
    return $this->t('Edit your user');
  }

  /**
   * {@inheritdoc}
   */
  public function buildForm(array $form, FormStateInterface $form_state, ContentEntityInterface $user = NULL) {
    // Getting current user.
    $user = User::load(\Drupal::currentUser()->id());

    $this->entity = $user;
    // Setting parent the as user, so that redirect happens to user page.
    $this->parent = $user;

    return parent::buildForm($form, $form_state, $user);
  }

}
