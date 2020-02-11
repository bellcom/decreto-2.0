<?php

namespace Drupal\decreto_content_modify\Form;

use Drupal\Core\Ajax\AjaxResponse;
use Drupal\Core\Ajax\CloseModalDialogCommand;
use Drupal\Core\Ajax\ReplaceCommand;
use Drupal\Core\Entity\ContentEntityInterface;
use Drupal\Core\Form\FormStateInterface;
use Drupal\decreto_content_modify\Ajax\ReloadPageCommand;
use Drupal\decreto_content_modify\Entity\DecretoBulletPoint;
use Drupal\file\Entity\File;
use Drupal\node\Entity\Node;

/**
 * Implements the BulletPointAttachmentsAddForm form.
 *
 * @see \Drupal\Core\Form\FormBase
 */
class BulletPointAttachmentsAddForm extends BulletPointAttachmentBaseEditForm {

  protected $bulletPoint;

  /**
   * {@inheritdoc}
   */
  public function getFormId() {
    return 'decreto-content-modify-bpa-add-form';
  }

  /**
   * Returns the title for the form.
   *
   * @return \Drupal\Core\StringTranslation\TranslatableMarkup
   *   Title for the form.
   */
  public function getTitle() {
    return $this->t('Create bullet point attachments');
  }

  /**
   * {@inheritdoc}
   */
  public function buildForm(array $form, FormStateInterface $form_state, ContentEntityInterface $bullet_point = NULL) {
    if (empty($bullet_point) || $bullet_point->getType() != 'decreto_bullet_point') {
      return $form;
    }

    $this->bulletPoint = $bullet_point;

    // Saving meeting for redirect purposes.
    $decretoBPA = new DecretoBulletPoint($bullet_point);
    $meeting = $decretoBPA->getMeeting();
    $this->parent = $meeting;

    $form['bullet_point_attachments'] = [
      '#type' => 'container',
      '#prefix' => '<div id="js-bullet-point-attachments-wrapper">',
      '#suffix' => '</div>',
      '#tree' => TRUE,
    ];

    $counter = $form_state->get('counter');
    if (empty($counter) || $counter < 1) {
      $counter = 1;
      $form_state->set('counter', $counter);
    }

    $userInput = $form_state->getUserInput();

    for ($i = 0; $i < $counter; $i++) {
      $bullet_point_attachment = [
        '#type' => 'container',
        '#prefix' => '<div class="form-group form-group--highlighted">',
        '#suffix' => '</div>',
        '#theme' => 'decreto_content_modify_bpas_add_form_bpa_container',
        '#custom_text_tab_active' => 'active',
        '#upload_file_tab_active' => '',
        '#delta' => $i,
      ];

      // Check if we need to open Upload file tab instead.
      if ($userInput) {
        if (!empty($userInput['bullet_point_attachments'][$i]['upload_file']['file']['fids'])) {
          $bullet_point_attachment['#custom_text_tab_active'] = '';
          $bullet_point_attachment['#upload_file_tab_active'] = 'active';
        }
      }

      $bullet_point_attachment['title'] = [
        '#type' => 'textfield',
        '#placeholder' => $this->t('Title'),
      ];
      $bullet_point_attachment['closed'] = [
        '#prefix' => ($counter > 1) ? '<div class="row"><div class="col-xs-6"><div class="form-inline form-item">' : '<div class="form-inline form-item">',
        '#type' => 'checkbox',
        '#title' => $this->t('Closed'),
      ];
      $bullet_point_attachment['personal'] = [
        '#type' => 'checkbox',
        '#title' => $this->t('Personal'),
        '#suffix' => ($counter > 1) ? '</div></div>' : '</div>',
      ];

      if ($counter > 1) {
        $bullet_point_attachment['delete'] = [
          '#name' => 'edit-bullet-point-attachment-index-delete-' . $i,
          '#value' => t('Delete'),
          '#bullet_point_attachment_index' => $i,
          '#ajax' => [
            'wrapper' => 'js-bullet-point-attachments-wrapper',
            'callback' => '::ajaxBulletPointAttachments',
            'event' => 'click',
          ],
          '#submit' => ['::submitDelete'],
          '#type' => 'submit',
          '#limit_validation_errors' => [],
          '#prefix' => '<div class="col-xs-6 text-right">',
          '#suffix' => '</div></div>',
        ];
      }

      // Tab content START.
      $bullet_point_attachment = parent::appendFormCustomText($bullet_point_attachment);
      $bullet_point_attachment = parent::appendFormUploadFile($bullet_point_attachment);
      // Tab content END.

      $form['bullet_point_attachments'][] = $bullet_point_attachment;
    }

    $form['add-more'] = [
      '#value' => t('Add'),
      '#name' => 'add more',
      '#ajax' => [
        'wrapper' => 'js-bullet-point-attachments-wrapper',
        'callback' => '::ajaxBulletPointAttachments',
        'event' => 'click',
      ],
      '#submit' => ['::submitAddMore'],
      '#type' => 'submit',
      '#limit_validation_errors' => [],
      '#prefix' => '<div class="add-more-elements">',
      '#suffix' => '</div>',
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
      // Skipping those with empty titles.
      if (!$bpa['title']) {
        continue;
      }

      $bpa_file = NULL;
      $bpa_html = NULL;

      if ($bpa['upload_file']['file']) {
        $file = File::load(array_pop($bpa['upload_file']['file']));

        if ($file->getMimeType() == 'text/html') {
          $bpa_html = $file;
          $bpa_file = $file;
        }
        else {
          $bpa_file = $file;
        }
      }

      $bpa_node = Node::create(array(
        'type' => 'decreto_bullet_point_attachment',
        'title' => $bpa['title'],
        'status' => 1,
        'field_decreto_bpa_closed' => [
          'value' => $bpa['closed'],
        ],
        'field_decreto_bpa_personal' => [
          'value' => $bpa['personal'],
        ],
        'body' => $bpa['custom_text']['body'],
        'field_decreto_bpa_file' => ($bpa_file) ? ['target_id' => $bpa_file->id()] : NULL,
        'field_decreto_bpa_html' => ($bpa_html) ? ['target_id' => $bpa_html->id()] : NULL,
      ));
      $bpa_node->save();

      // Handle * > PDF conversion.
      if (\Drupal::moduleHandler()->moduleExists('decreto_pdf_conversion_manager')) {
        if ($bpa_file && $bpa['upload_file']['convert_to_pdf'] && $bpa_file->getMimeType() != 'application/pdf') {
          \Drupal::service('decreto_pdf_conversion_manager.pdfConversionManagerService')->scheduleFile($bpa_file->id(), $bpa_node->id(), $bpa['upload_file']['convert_to_html']);
        }
      }
      // Handle PDF > HTML conversion.
      if (\Drupal::moduleHandler()->moduleExists('decreto_pdf2htmlex')) {
        if ($bpa_file && $bpa['upload_file']['convert_to_html'] && $bpa_file->getMimeType() == 'application/pdf') {
          \Drupal::service('decreto_pdf2htmlex.pdf2htmlex')->scheduleFile($bpa_file->id(), $bpa_node->id());
        }
      }

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
    $counter = $form_state->get('counter');
    $form_state->set('counter', $counter + 1);
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

    // Saving user input for future.
    $user_input = $form_state->getUserInput();

    // Unsetting element that is deleted.
    unset($user_input['bullet_point_attachments'][$triggering_element['#bullet_point_attachment_index']]);
    $user_input['bullet_point_attachments'] = array_values($user_input['bullet_point_attachments']);

    // Reusing saved user input for future.
    $form_state->setUserInput($user_input);

    // Updating counter.
    $counter = $form_state->get('counter');
    $form_state->set('counter', $counter - 1);

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
