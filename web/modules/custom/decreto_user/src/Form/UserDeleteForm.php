<?php

namespace Drupal\decreto_user\Form;

use Drupal\Core\Entity\ContentEntityInterface;
use Drupal\Core\Form\FormStateInterface;
use Drupal\Core\Url;
use Drupal\decreto_content_modify\Form\AjaxDeleteFormBase;

/**
 * Class UserDeleteForm.
 *
 * @package Drupal\decreto_user\Form
 */
class UserDeleteForm extends AjaxDeleteFormBase {

  /**
   * {@inheritdoc}
   */
  public function getFormId() {
    return 'decreto-user-delete-form';
  }

  /**
   * {@inheritdoc}
   */
  public function buildForm(array $form, FormStateInterface $form_state, ContentEntityInterface $user = NULL) {
    $form = parent::buildForm($form, $form_state, $user);

    // Since user delete involves Batch, remove the ajax behavior and use normal
    // submit instead.
    unset($form['actions']['submit']['#ajax']);

    return $form;
  }

  /**
   * {@inheritdoc}
   */
  public function submitForm(array &$form, FormStateInterface $form_state) {
    // Making user content anonymous, the operation set batch job, which will
    // be triggered automatically by Form API.
    user_cancel([], $this->entity->id(), 'user_cancel_reassign');

    // Redirecting to front page after batch is finished.
    $url = Url::fromRoute('<front>');
    $form_state->setRedirectUrl($url);
  }

}
