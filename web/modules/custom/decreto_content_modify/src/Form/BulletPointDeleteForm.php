<?php

namespace Drupal\decreto_content_modify\Form;

use Drupal\Core\Entity\ContentEntityInterface;
use Drupal\Core\Form\FormStateInterface;
use Drupal\decreto_content_modify\Entity\DecretoBulletPoint;

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
   * Returns the title for the form.
   *
   * @return \Drupal\Core\StringTranslation\TranslatableMarkup
   *   Title for the form.
   */
  public function getTitle() {
    return $this->t('Delete bullet point');
  }

  /**
   * {@inheritdoc}
   */
  public function buildForm(array $form, FormStateInterface $form_state, ContentEntityInterface $bullet_point = NULL) {
    // Saving meeting for redirect purposes.
    $decretoBP = new DecretoBulletPoint($bullet_point);
    $meeting = $decretoBP->getMeeting();
    $this->parent = $meeting;

    return parent::buildForm($form, $form_state, $bullet_point);
  }

}
