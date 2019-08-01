<?php
namespace Drupal\decreto_content_modify\Form;

use Drupal\Core\Ajax\AjaxResponse;
use Drupal\Core\Ajax\CloseModalDialogCommand;
use Drupal\Core\Ajax\HtmlCommand;
use Drupal\Core\Ajax\RedirectCommand;
use Drupal\Core\Form\FormStateInterface;

/**
 * Class BulletPointDeleteForm.
 * @package Drupal\decreto_content_modify\Form
 */
class BulletPointDeleteForm extends AjaxConfirmFormBase {

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

    if ($form_state->getErrors()) {
      unset($form['#prefix']);
      unset($form['#suffix']);
      $form['status_messages'] = [
        '#type' => 'status_messages',
        '#weight' => -10,
      ];
      $response->addCommand(new HtmlCommand('#decreto-content-modify-bp-delete-form', $form));
    }
    else {
      $response->addCommand(new CloseModalDialogCommand());

      $decretoBP = new DecretoBulletPoint($this->node);
      $meeting = $decretoBP->getMeeting();

      if (!empty($meeting)) {
        $response->addCommand(new RedirectCommand($meeting->toUrl()->toString()));
      }
    }

    return $response;
  }
}
