<?php

namespace Drupal\decreto_content_modify\Form;

use Drupal\Core\Entity\ContentEntityInterface;
use Drupal\Core\Form\FormStateInterface;
use Drupal\decreto_content_modify\Entity\DecretoBulletPointAttachment;

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
   * Returns the title for the form.
   *
   * @return \Drupal\Core\StringTranslation\TranslatableMarkup
   *   Title for the form.
   */
  public function getTitle() {
    return $this->t('Delete bullet point attachment');
  }

  /**
   * {@inheritdoc}
   */
  public function buildForm(array $form, FormStateInterface $form_state, ContentEntityInterface $bullet_point_attachment = NULL) {
    // Saving meeting for redirect purposes.
    $decretoBPA = new DecretoBulletPointAttachment($bullet_point_attachment);
    $meeting = $decretoBPA->getMeeting();
    $this->parent = $meeting;

    return parent::buildForm($form, $form_state, $bullet_point_attachment);
  }

}
