<?php
namespace Drupal\decreto_content_modify\Form;


use Drupal\Core\Form\FormStateInterface;
use Drupal\Core\Ajax\AjaxResponse;
use Drupal\Core\Ajax\RemoveCommand;
use Drupal\Core\Ajax\CloseModalDialogCommand;
use Drupal\Core\Ajax\InvokeCommand;

class SpeakerPaperDeleteForm extends AjaxConfirmFormBase{
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
    return 'decreto-content-modify-sp-delete-form';
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

    if ($form_state->getErrors()) {
      unset($form['#prefix']);
      unset($form['#suffix']);
      $form['status_messages'] = [
        '#type' => 'status_messages',
        '#weight' => -10,
      ];
      $response->addCommand(new HtmlCommand('#decreto-content-modify-sp-delete-form', $form));
    } else {      
      $response->addCommand(new RemoveCommand("#speaker-paper-{$this->node->id()}"));      
      $response->addCommand(new CloseModalDialogCommand());
    }

    return $response;
  }
}
