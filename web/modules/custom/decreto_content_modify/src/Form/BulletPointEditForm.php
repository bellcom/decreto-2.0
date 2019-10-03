<?php

namespace Drupal\decreto_content_modify\Form;

use Drupal\Core\Entity\ContentEntityInterface;
use Drupal\Core\Form\FormStateInterface;
use Drupal\decreto_content_modify\Entity\DecretoBulletPoint;

/**
 * Implements the BulletPointsAdd form.
 *
 * @see \Drupal\Core\Form\FormBase
 */
class BulletPointEditForm extends AjaxFormBase {

  protected $entity;

  /**
   * {@inheritdoc}
   */
  public function getFormId() {
    return 'decreto-content-modify-bp-edit-form';
  }

  /**
   * Returns the title for the form.
   *
   * @return \Drupal\Core\StringTranslation\TranslatableMarkup
   *   Title for the form.
   */
  public function getTitle() {
    return $this->t('Edit bullet point');
  }

  /**
   * {@inheritdoc}
   */
  public function buildForm(array $form, FormStateInterface $form_state, ContentEntityInterface $bullet_point = NULL) {
    if (empty($bullet_point) || $bullet_point->getType() != 'decreto_bullet_point') {
      return $form;
    }

    $this->entity = $bullet_point;
    $decretoBP = new DecretoBulletPoint($this->entity);
    $this->parent = $decretoBP->getMeeting();

    // Title.
    $form['title'] = [
      '#type' => 'textfield',
      '#placeholder' => $this->t('Title'),
      '#required' => TRUE,
      '#default_value' => $bullet_point->getTitle(),
    ];

    // Closed.
    $form['closed'] = [
      '#type' => 'checkbox',
      '#title' => $this->t('Closed'),
      '#default_value' => $bullet_point->get('field_decreto_bp_closed')->value,
      '#prefix' => '<div class="form-inline form-item">',
    ];

    // Personal.
    $form['personal'] = [
      '#type' => 'checkbox',
      '#title' => $this->t('Personal'),
      '#default_value' => $bullet_point->get('field_decreto_bp_personal')->value,
      '#suffix' => '</div>',
    ];

    $form = parent::buildForm($form, $form_state);

    return $form;
  }

  /**
   * {@inheritdoc}
   */
  public function submitForm(array &$form, FormStateInterface $form_state) {
    if (!empty($this->entity)) {
      $this->entity->title = $form_state->getValue('title');;
      $this->entity->field_decreto_bp_closed = [
        'value' => $form_state->getValue('closed')
      ];
      $this->entity->field_decreto_bp_personal = [
        'value' => $form_state->getValue('personal')
      ];
      $this->entity->save();
    }
  }

}
