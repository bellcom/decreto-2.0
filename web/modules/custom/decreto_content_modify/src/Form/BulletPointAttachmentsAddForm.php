<?php

namespace Drupal\decreto_content_modify\Form;

use Drupal\Core\Form\FormStateInterface;
use Drupal\decreto_content_modify\Entity\DecretoBulletPoint;
use Drupal\node\Entity\Node;
use Drupal\node\NodeInterface;

/**
 * Implements the BulletPointAttachmentsAddForm form.
 *
 * @see \Drupal\Core\Form\FormBase
 */
class BulletPointAttachmentsAddForm extends AjaxFormBase {
  protected $bulletPoint;

  /**
   * {@inheritdoc}
   */
  public function getFormId() {
    return 'decreto-content-modify-bpa-add-form';
  }

  /**
   * {@inheritdoc}
   */
  public function buildForm(array $form, FormStateInterface $form_state, NodeInterface $bullet_point = NULL) {
    if (empty($bullet_point) || $bullet_point->getType() != 'decreto_bullet_point') {
      return $form;
    }

    $this->bulletPoint = $bullet_point;

    // Saving meeting for redirect purposes.
    $decretoBPA = new DecretoBulletPoint($bullet_point);
    $meeting = $decretoBPA->getMeeting();
    $this->parent = $meeting;

    $form['bullet_point_attachments'] = [
      '#tree' => TRUE,
      '#prefix' => '<div id="bullet-point-attachments-wrapper">',
      '#suffix' => '</div>',
    ];

    $counter = $form_state->getValue('counter');
    if (empty($counter) || $counter < 1) {
      $counter = 1;
    }

    for ($i = 0; $i < $counter; $i++) {
      $bullet_point_attachment = [
        '#prefix' => '<div class="form-group">',
        '#suffix' => '</div>',
      ];
      $bullet_point_attachment['title'] = [
        '#type' => 'textfield',
        '#placeholder' => $this->t('Title'),
      ];

      if ($counter > 1) {
        $bullet_point_attachment['delete'] = [
          '#name' => 'edit-bullet-point-attachment-index-delete-' . $i,
          '#value' => t('Delete'),
          '#bullet_point_attachment_index' => $i,
          '#ajax' => [
            'wrapper' => 'bullet-point-attachments-wrapper',
            'callback' => '::ajaxBulletPointAttachments',
            'event' => 'click',
          ],
          '#submit' => ['::submitDelete'],
          '#type' => 'submit',
        ];
      }
      $form['bullet_point_attachments'][] = $bullet_point_attachment;
    }

    $form['counter'] = [
      '#type' => 'value',
      '#value' => $counter,
    ];
    $form['add-more'] = [
      '#value' => t('Add'),
      '#name' => 'add more',
      '#ajax' => [
        'wrapper' => 'bullet-point-attachments-wrapper',
        'callback' => '::ajaxBulletPointAttachments',
        'event' => 'click',
      ],
      '#submit' => ['::submitAddMore'],
      '#type' => 'submit',
    ];

    $form = parent::buildForm($form, $form_state);

    return $form;
  }

  /**
   * {@inheritdoc}
   */
  public function validateForm(array &$form, FormStateInterface $form_state) {
    $triggering_element = $form_state->getTriggeringElement();
    if ($triggering_element['#name'] == 'save') {
      foreach ($form_state->getValue('bullet_point_attachments') as $key => $bpa) {
        if (empty($bpa['title'])) {
          $form_state->setError($form['bullet_point_attachments'][$key]['title'], t('Bullet point attachment title should not be empty.'));
        }
      }
    }
  }

  /**
   * {@inheritdoc}
   */
  public function submitForm(array &$form, FormStateInterface $form_state) {
    $bpas = $form_state->getValue('bullet_point_attachments');
    foreach ($bpas as $bpa) {
      $bpa_node = Node::create(array(
        'type' => 'decreto_bullet_point_attachment',
        'title' => $bpa['title'],
        'status' => 1,
      ));
      $bpa_node->save();

      $decretoBP = new DecretoBulletPoint($this->bulletPoint);
      $decretoBP->addBulletPointAttachment($bpa_node->id());
    }
  }

  /**
   * Ajax callback that increase amount of bullet points.
   *
   * @param array $form
   *   The Form API form.
   * @param \Drupal\Core\Form\FormStateInterface $form_state
   *   Current form state.
   *
   * @return array
   *   The Form API form.
   */
  public function submitAddMore(array $form, FormStateInterface $form_state) {
    $form_state->setValue('counter', $form_state->getValue('counter') + 1);
    $form_state->setRebuild();
    return $form;
  }

  /**
   * Ajax callback that reduce amount of bullet point attachments.
   *
   * @param array $form
   *   The Form API form.
   * @param \Drupal\Core\Form\FormStateInterface $form_state
   *   Current form state.
   *
   * @return array
   *   The Form API form.
   */
  public function submitDelete(array $form, FormStateInterface $form_state) {
    $triggering_element = $form_state->getTriggeringElement();
    $user_input = $form_state->getUserInput();
    unset($user_input['bullet_point_attachments'][$triggering_element['#bullet_point_attachment_index']]);
    $user_input['bullet_point_attachments'] = array_values($user_input['bullet_point_attachments']);
    $form_state->setUserInput($user_input);
    $form_state->setValue('counter', $form_state->getValue('counter') - 1);
    $form_state->setRebuild();
    return $form;
  }

  /**
   * Ajax bullet point attachments update function.
   *
   * @param array $form
   *   Form API form.
   * @param \Drupal\Core\Form\FormStateInterface $form_state
   *   Current form state.
   *
   * @return array
   *   Form array.
   */
  public function ajaxBulletPointAttachments(array $form, FormStateInterface $form_state) {
    return $form['bullet_point_attachments'];
  }

}
