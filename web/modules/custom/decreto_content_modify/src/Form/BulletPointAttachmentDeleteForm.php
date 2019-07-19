<?php
namespace Drupal\decreto_content_modify\Form;


use Drupal\Core\Ajax\AjaxResponse;
use Drupal\Core\Ajax\CloseModalDialogCommand;
use Drupal\Core\Ajax\HtmlCommand;
use Drupal\Core\Ajax\RedirectCommand;
use Drupal\Core\Form\FormStateInterface;
use Drupal\decreto_content_modify\Utils\DecretoContentModifyUtils;
use Drupal\node\NodeInterface;

class BulletPointAttachmentDeleteForm extends AjaxConfirmFormBase {
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
    return 'decreto-content-modify-bpa-delete-form';
  }

  /**
   * {@inheritdoc}
   */
  public function submitForm(array &$form, FormStateInterface $form_state) {
    for ($i = 0; $i <= $this->parent->field_decreto_bp_bpas->count(); $i++) {
      if ($this->parent->field_decreto_bp_bpas->get($i)->target_id == $this->node->id()) {
        $this->parent->field_decreto_bp_bpas->removeItem($i);
        $this->parent->save();
        break;
      }
    }
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
      $response->addCommand(new HtmlCommand('#decreto-content-modify-bpa-delete-form', $form));
    }
    else {
      $response->addCommand(new CloseModalDialogCommand());
      /** @var NodeInterface $meeting */
      $meeting = DecretoContentModifyUtils::getRelatedNodes($this->parent, 'decreto_meeting');
      if (!empty($meeting)) {
        $response->addCommand(new RedirectCommand($meeting->toUrl()->toString()));
      }
    }

    return $response;
  }
}
