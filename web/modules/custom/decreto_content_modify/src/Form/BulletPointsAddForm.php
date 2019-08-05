<?php

namespace Drupal\decreto_content_modify\Form;

use Drupal\Core\Form\FormStateInterface;
use Drupal\decreto_content_modify\Entity\DecretoMeeting;
use Drupal\node\Entity\Node;
use Drupal\node\NodeInterface;

/**
 * Implements the BulletPointsAddForm form.
 *
 * @see \Drupal\Core\Form\FormBase
 */
class BulletPointsAddForm extends AjaxFormBase {

  /**
   * {@inheritdoc}
   */
  public function getFormId() {
    return 'decreto-content-modify-bp-add-form';
  }

  /**
   * {@inheritdoc}
   */
  public function buildForm(array $form, FormStateInterface $form_state, NodeInterface $meeting = NULL) {
    if (empty($meeting) || $meeting->getType() != 'decreto_meeting') {
      return $form;
    }

    $this->parent = $meeting;

    $form['bullet_points'] = [
      '#tree' => TRUE,
      '#prefix' => '<div id="bullet-points-wrapper">',
      '#suffix' => '</div>',
    ];

    $counter = $form_state->getValue('counter');
    if (empty($counter) || $counter < 1) {
      $counter = 1;
    }

    for ($i = 0; $i < $counter; $i++) {
      $bullet_point = [
        '#prefix' => '<div class="form-group">',
        '#suffix' => '</div>',
      ];
      $bullet_point['title'] = [
        '#type' => 'textfield',
        '#placeholder' => $this->t('Title'),
      ];

      $bullet_point['closed'] = [
        '#prefix' => '<div class="form-inline form-item">',
        '#type' => 'checkbox',
        '#title' => $this->t('Closed'),
      ];
      $bullet_point['personal'] = [
        '#type' => 'checkbox',
        '#title' => $this->t('Personal'),
        '#suffix' => '</div>',
      ];
      if ($counter > 1) {
        $bullet_point['delete'] = [
          '#name' => 'edit-bullet-point-index-delete-' . $i,
          '#value' => t('Delete'),
          '#bullet_point_index' => $i,
          '#ajax' => [
            'wrapper' => 'bullet-points-wrapper',
            'callback' => '::ajaxBulletPoints',
            'event' => 'click',
          ],
          '#submit' => ['::submitDelete'],
          '#type' => 'submit',
        ];
      }
      $form['bullet_points'][] = $bullet_point;
    }

    $form['counter'] = [
      '#type' => 'value',
      '#value' => $counter,
    ];
    $form['add-more'] = [
      '#value' => t('Add'),
      '#name' => 'add more',
      '#ajax' => [
        'wrapper' => 'bullet-points-wrapper',
        'callback' => '::ajaxBulletPoints',
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
      foreach ($form_state->getValue('bullet_points') as $key => $bullet_point) {
        if (empty($bullet_point['title'])) {
          $form_state->setError($form['bullet_points'][$key]['title'], t('Bullet point title should not be empty.'));
        }
      }
    }
  }

  /**
   * {@inheritdoc}
   */
  public function submitForm(array &$form, FormStateInterface $form_state) {
    $bullet_points = $form_state->getValue('bullet_points');
    foreach ($bullet_points as $bullet_point) {
      $bullet_point_node = Node::create(array(
        'type' => 'decreto_bullet_point',
        'title' => $bullet_point['title'],
        'status' => 1,
        'field_decreto_bp_closed' => [
          'value' => $bullet_point['closed'],
        ],
        'field_decreto_bp_personal' => [
          'value' => $bullet_point['personal'],
        ],
      ));

      $bullet_point_node->save();

      $decretoMeeting = new DecretoMeeting($this->parent);
      $decretoMeeting->addBulletPoint($bullet_point_node->id());
    }
  }

  /**
   * Ajax callback that increase amount of bullet points.
   *
   * @param array $form
   *   The Form API form.
   * @param \Drupal\Core\Form\FormStateInterface $form_state
   *   The FormState object.
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
   * Ajax callback that reduce amount of bullet points.
   *
   * @param array $form
   *   The Form API form.
   * @param \Drupal\Core\Form\FormStateInterface $form_state
   *   The FormState object.
   *
   * @return array
   *   The Form API form.
   */
  public function submitDelete(array $form, FormStateInterface $form_state) {
    $triggering_element = $form_state->getTriggeringElement();
    $user_input = $form_state->getUserInput();
    unset($user_input['bullet_points'][$triggering_element['#bullet_point_index']]);
    $user_input['bullet_points'] = array_values($user_input['bullet_points']);
    $form_state->setUserInput($user_input);
    $form_state->setValue('counter', $form_state->getValue('counter') - 1);
    $form_state->setRebuild();
    return $form;
  }

  /**
   * Ajax bullet point update function.
   *
   * @param array $form
   *   Form API form.
   * @param \Drupal\Core\Form\FormStateInterface $form_state
   *   Form API form.
   *
   * @return array
   *   Form array.
   */
  public function ajaxBulletPoints(array $form, FormStateInterface $form_state) {
    return $form['bullet_points'];
  }

}
