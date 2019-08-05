<?php

namespace Drupal\decreto_content_modify\Form;

use Drupal\Core\Form\FormStateInterface;
use Drupal\decreto_content_modify\Entity\DecretoBulletPointAttachment;
use Drupal\node\NodeInterface;

/**
 * Class BulletPointAttachmentDeleteForm.
 *
 * @package Drupal\decreto_content_modify\Form
 */
class BulletPointAttachmentDeleteForm extends AjaxDeleteFormBase {

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
    $this->parent = $meeting;

    return parent::buildForm($form, $form_state, $node);
  }

}
