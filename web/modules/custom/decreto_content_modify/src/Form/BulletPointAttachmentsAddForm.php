<?php

namespace Drupal\decreto_content_modify\Form;

use Drupal\Core\Ajax\AjaxResponse;
use Drupal\Core\Ajax\CloseModalDialogCommand;
use Drupal\Core\Ajax\HtmlCommand;
use Drupal\Core\Ajax\RedirectCommand;
use Drupal\Core\Form\FormBase;
use Drupal\Core\Form\FormStateInterface;
use Drupal\decreto_content_modify\Entity\DecretoBulletPoint;
use Drupal\node\Entity\Node;
use Drupal\node\NodeInterface;

/**
 * Implements the BulletPointAttachmentsAddForm form.
 *
 * @see \Drupal\Core\Form\FormBase
 */
class BulletPointAttachmentsAddForm extends FormBase {
  protected $meeting;
  protected $bulletPoint;

  /**
   * {@inheritdoc}
   */
  public function getFormId() {
    return 'decreto-content-modify-bpa-add-form';
  }

  /**
   * Form constructor.
   *
   * @param array $form
   *   An associative array containing the structure of the form.
   * @param FormStateInterface $form_state
   *   The current state of the form.
   * @param NodeInterface $meeting
   *   Meeting node that hosts bullet points.
   *
   * @return array
   *   The form structure.
   */
  public function buildForm(array $form, FormStateInterface $form_state, NodeInterface $bullet_point = NULL) {
    if (empty($bullet_point) || $bullet_point->getType() != 'decreto_bullet_point') {
      return $form;
    }

    $this->bulletPoint = $bullet_point;

    // Saving meeting for redirect purposes.
    $decretoBPA = new DecretoBulletPoint($bullet_point);
    $meeting = $decretoBPA->getMeeting();
    $this->meeting = $meeting;

    $form['#prefix'] = '<div id="' . $this->getFormId() . '">';
    $form['#suffix'] = '</div>';

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

    // Group submit handlers in an actions element with a key of "actions" so
    // that it gets styled correctly, and so that other modules may add actions
    // to the form.
    $form['actions'] = [
      '#type' => 'actions',
    ];

    // Add a submit button that handles the submission of the form.
    $form['actions']['submit'] = [
      '#type' => 'submit',
      '#name' => 'save',
      '#value' => $this->t('Save'),
      '#ajax' => [
        'callback' => '::ajaxSubmitForm',
        'event' => 'click',
      ],
    ];

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
      $bpa_node->isNew();

      if ($bpa_node->save() == SAVED_NEW) {
        $decretoBP = new DecretoBulletPoint($this->bulletPoint);
        $decretoBP->addBulletPointAttachment($bpa_node->id());
      }
    }

  }

  /**
   * Implements the submit handler for the ajax call.
   *
   * @param array $form
   *   Render array representing from.
   * @param \Drupal\Core\Form\FormStateInterface $form_state
   *   Current form state.
   *
   * @return \Drupal\Core\Ajax\AjaxResponse
   *   Array of ajax commands to execute on submit of the modal form.
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

  /**
   * Ajax callback that increase amount of bullet points.
   *
   * @param array $form
   *   The Form API form.
   * @param FormStateInterface $form_state
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
   * Ajax callback that reduce amount of bullet point attachments.
   *
   * @param array $form
   *   The Form API form.
   * @param FormStateInterface $form_state
   *   The FormState object.
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
   * @param FormStateInterface $form_state
   *   Form API form.
   *
   * @return array
   *   Form array.
   */
  public function ajaxBulletPointAttachments(array $form, FormStateInterface $form_state) {
    return $form['bullet_point_attachments'];
  }

}
