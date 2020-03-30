<?php

namespace Drupal\decreto_user\Form;

use Drupal\Core\Entity\ContentEntityInterface;
use Drupal\Core\Form\FormStateInterface;
use Drupal\Core\Url;
use Drupal\user\Form\UserCancelForm;

/**
 * Class UserDeleteForm.
 *
 * @package Drupal\decreto_user\Form
 */
class UserDeleteForm extends UserCancelForm {

  /**
   * {@inheritdoc}
   */
  public function getFormId() {
    return 'decreto-user-delete-form';
  }

  /**
   * {@inheritdoc}
   */
  public function getBaseFormId() {
    return $this->getFormId();
  }

  /**
   * {@inheritdoc}
   */
  public function buildForm(array $form, FormStateInterface $form_state, ContentEntityInterface $user = NULL) {
    // Setting params needed for default UserCancelForm.
    $this->entity = $user;
    $this->moduleHandler = \Drupal::moduleHandler();

    $form = parent::buildForm($form, $form_state);

    $form['user_cancel_method']['#default_value'] = 'user_cancel_reassign';
    $form['user_cancel_confirm']['#access'] = FALSE;

    return $form;
  }

  /**
   * {@inheritdoc}
   */
  public function submitForm(array &$form, FormStateInterface $form_state) {
    parent::submitForm($form, $form_state);

    // Redirecting to front page after batch is finished.
    $url = Url::fromRoute('<front>');
    $form_state->setRedirectUrl($url);
  }

}
