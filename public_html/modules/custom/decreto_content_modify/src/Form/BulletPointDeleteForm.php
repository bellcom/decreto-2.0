<?php
namespace Drupal\decreto_content_modify\Form;


use Drupal\Core\Form\FormStateInterface;
use Drupal\Core\Ajax\AjaxResponse;
use Drupal\Core\Ajax\RemoveCommand;
use Drupal\Core\Ajax\CloseModalDialogCommand;
use Drupal\Core\Ajax\InvokeCommand;

class BulletPointDeleteForm extends AjaxConfirmFormBase{
  /**
   * {@inheritdoc}
   */
  public function getQuestion() {
    return $this->t('Delete @title?', ['@title' => $this->node->getTitle()]);
  }

  /**
   * {@inheritdoc}
   */
  public function getFormId() {
    return 'decreto-content-modify-bp-delete-form';
  }

  /**
   * {@inheritdoc}
   */
  public function submitForm(array &$form, FormStateInterface $form_state) {
    $this->node->delete();
  }


  /**
   * {@inheritdoc}
   */
  public function ajaxSubmitForm(array &$form, FormStateInterface $form_state) {
    $response = new AjaxResponse();
    if (!$form_state->getErrors()) {
      $nid = $this->node->id();
      $response->addCommand(new RemoveCommand("#js-bp-$nid-container"));
      $response->addCommand(new InvokeCommand('#js-bp-nids', 'removeValue', array($nid)));
      $response->addCommand(new CloseModalDialogCommand());
    }

    return $response;
  }
}