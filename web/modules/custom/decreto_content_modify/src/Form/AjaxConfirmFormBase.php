<?php

namespace Drupal\decreto_content_modify\Form;

use Drupal\Core\Ajax\AjaxResponse;
use Drupal\Core\Ajax\CloseModalDialogCommand;
use Drupal\Core\Form\ConfirmFormBase;
use Drupal\Core\Form\FormStateInterface;
use Drupal\node\NodeInterface;
use Prophecy\Exception\Doubler\MethodNotFoundException;

/**
 * {@inheritdoc}
 */
abstract class AjaxConfirmFormBase extends ConfirmFormBase {
  /**
   * The node to be deleted.
   *
   * @var NodeInterface node
   */
  protected $node;

  /**
   * {@inheritdoc}
   * {@deprecated}
   */
  public function getCancelUrl() {
    //this function is not used in AjaxConfirmFormBase
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
    return $this->t('Delete @title?', ['@title' => $this->node->getTitle()]);
  }

  /**
   * {@inheritdoc}
   */
  public function buildForm(array $form, FormStateInterface $form_state, NodeInterface $node = NULL) {
    $this->node = $node;
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
   * {@inheritdoc}
   */
  public function submitForm(array &$form, FormStateInterface $form_state) {
    $this->node->delete();
  }

  /**
   * Simply closes pop-up dialog with ajax
   *
   * @param array $form
   * @param FormStateInterface $form_state
   * @return AjaxResponse
   */
  public function ajaxCloseForm(array &$form, FormStateInterface $form_state) {
    $response = new AjaxResponse();
    $response->addCommand(new CloseModalDialogCommand());

    return $response;
  }

  /**
   * Ajax handler after form is submitted
   *
   * @param array $form
   * @param FormStateInterface $form_state
   * @return mixed
   */
  public abstract function ajaxSubmitForm(array &$form, FormStateInterface $form_state);
}
