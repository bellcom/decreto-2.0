<?php

namespace Drupal\decreto_content_modify\Form;

use Drupal\Core\Ajax\AjaxResponse;
use Drupal\Core\Ajax\CloseModalDialogCommand;
use Drupal\Core\Ajax\HtmlCommand;
use Drupal\Core\Ajax\RedirectCommand;
use Drupal\Core\Entity\ContentEntityInterface;
use Drupal\Core\Form\ConfirmFormBase;
use Drupal\Core\Form\FormStateInterface;
use Drupal\Core\Url;

/**
 * {@inheritdoc}
 */
abstract class AjaxDeleteFormBase extends ConfirmFormBase {

  /**
   * The node to be deleted.
   *
   * @var \Drupal\Core\Entity\ContentEntityInterface
   */
  protected $entity;

  /**
   * The node to be redirected to after success.
   *
   * @var \Drupal\Core\Entity\ContentEntityInterface
   */
  protected $parent;

  /**
   * {@inheritdoc}
   */
  public function getCancelUrl() {
    // Used only as a stub.
  }

  /**
   * {@inheritdoc}
   */
  public function getConfirmText() {
    return $this->t('Yes');
  }

  /**
   * {@inheritdoc}
   */
  public function getCancelText() {
    return $this->t('No');
  }

  /**
   * {@inheritdoc}
   */
  public function getQuestion() {
    return $this->t('Delete @title?', ['@title' => $this->entity->label()]);
  }

  /**
   * {@inheritdoc}
   */
  public function buildForm(array $form, FormStateInterface $form_state, ContentEntityInterface $entity = NULL) {
    $this->entity = $entity;

    if (!isset($form['#theme'])) {
      $form['#theme'] = 'decreto_content_modify_delete_form';
    }

    $form = parent::buildForm($form, $form_state);

    $form['actions']['submit']['#ajax'] = [
      'callback' => '::ajaxSubmitForm',
      'event' => 'click',
    ];

    $form['actions']['cancel'] = [
      '#type' => 'button',
      '#value' => $this->getCancelText(),
      '#ajax' => [
        'callback' => '::ajaxCloseForm',
        'event' => 'click',
      ],
    ];

    return $form;
  }

  /**
   * Deletes the node.
   *
   * @param array $form
   *   The form.
   * @param \Drupal\Core\Form\FormStateInterface $form_state
   *   Form state.
   *
   * @throws \Drupal\Core\Entity\EntityStorageException
   */
  public function submitForm(array &$form, FormStateInterface $form_state) {
    $this->entity->delete();
  }

  /**
   * Simply closes pop-up dialog with ajax.
   *
   * @param array $form
   *   The form.
   * @param \Drupal\Core\Form\FormStateInterface $form_state
   *   Form state.
   *
   * @return \Drupal\Core\Ajax\AjaxResponse
   *   Ajax response with commands.
   */
  public function ajaxCloseForm(array &$form, FormStateInterface $form_state) {
    $response = new AjaxResponse();
    $response->addCommand(new CloseModalDialogCommand());

    return $response;
  }

  /**
   * Ajax handler after form is submitted.
   *
   * Set the errors, if any. Closes the form and redirects to parent node on
   * success.
   *
   * @param array $form
   *   The form.
   * @param \Drupal\Core\Form\FormStateInterface $form_state
   *   Form state.
   *
   * @return \Drupal\Core\Ajax\AjaxResponse
   *   Ajax response with commands.
   *
   * @throws \Drupal\Core\Entity\EntityMalformedException
   */
  public function ajaxSubmitForm(array &$form, FormStateInterface $form_state) {
    $response = new AjaxResponse();

    if ($form_state->getErrors()) {
      unset($form['#prefix']);
      unset($form['#suffix']);
      $form['status_messages'] = [
        '#type' => 'status_messages',
        '#weight' => -10,
      ];
      $response->addCommand(new HtmlCommand('#' . $this->getFormId(), $form));
    }
    else {
      $response->addCommand(new CloseModalDialogCommand());

      // Adding redirect command.
      if (!empty($this->parent)) {
        $url = $this->parent->toUrl();
      }
      else {
        $url = Url::fromRoute('<front>');
      }

      $response->addCommand(new RedirectCommand($url->toString()));
    }

    return $response;
  }

}
