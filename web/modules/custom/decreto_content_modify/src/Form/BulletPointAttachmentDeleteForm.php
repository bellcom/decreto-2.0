<?php

namespace Drupal\decreto_content_modify\Form;

use Drupal\Core\Ajax\AjaxResponse;
use Drupal\Core\Ajax\CloseModalDialogCommand;
use Drupal\Core\Ajax\HtmlCommand;
use Drupal\Core\Ajax\RedirectCommand;
use Drupal\Core\Form\FormStateInterface;
use Drupal\decreto_content_modify\Entity\DecretoBulletPointAttachment;
use Drupal\node\NodeInterface;

/**
 * Class BulletPointAttachmentDeleteForm.
 *
 * @package Drupal\decreto_content_modify\Form
 */
class BulletPointAttachmentDeleteForm extends AjaxConfirmFormBase {
  protected $meeting;

  /**
   * {@inheritdoc}
   */
  public function getFormId() {
    return 'decreto-content-modify-bpa-delete-form';
  }

  /**
   * {@inheritdoc}
   */
  public function buildForm(array $form, FormStateInterface $form_state, NodeInterface $node = NULL) {
    // Saving meeting for redirect purposes.
    $decretoBPA = new DecretoBulletPointAttachment($node);
    $meeting = $decretoBPA->getMeeting();
    $this->meeting = $meeting;

    return parent::buildForm($form, $form_state, $node);
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
      $response->addCommand(new HtmlCommand('#' . $this->getFormId(), $form));
    }
    else {
      $response->addCommand(new CloseModalDialogCommand());

      // Adding redirect command.
      if (!empty($this->meeting)) {
        $response->addCommand(new RedirectCommand($this->meeting->toUrl()->toString()));
      }
    }

    return $response;
  }

}
