<?php

namespace Drupal\decreto_content_modify\Form;

use Drupal\Core\Form\FormStateInterface;
use Drupal\decreto_content_modify\Entity\DecretoBulletPoint;
use Drupal\node\NodeInterface;

/**
 * Class BulletPointDeleteForm.
 *
 * @package Drupal\decreto_content_modify\Form
 */
class BulletPointDeleteForm extends AjaxDeleteFormBase {

  /**
   * {@inheritdoc}
   */
  public function getFormId() {
    return 'decreto-content-modify-bp-delete-form';
  }

  /**
   * {@inheritdoc}
   */
  public function buildForm(array $form, FormStateInterface $form_state, NodeInterface $node = NULL) {
    // Saving meeting for redirect purposes.
    $decretoBP = new DecretoBulletPoint($node);
    $meeting = $decretoBP->getMeeting();
    $this->parent = $meeting;

    return parent::buildForm($form, $form_state, $node);
  }

}
