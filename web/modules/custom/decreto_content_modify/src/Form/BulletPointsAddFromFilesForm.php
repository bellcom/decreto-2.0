<?php

namespace Drupal\decreto_content_modify\Form;

use Drupal\Core\Form\FormStateInterface;
use Drupal\decreto_content_modify\Entity\DecretoBulletPoint;
use Drupal\decreto_content_modify\Entity\DecretoMeeting;
use Drupal\file\Entity\File;
use Drupal\node\Entity\Node;
use Drupal\node\NodeInterface;

/**
 * Implements the BulletPointsAddFromFile form.
 *
 * @see \Drupal\Core\Form\FormBase
 */
class BulletPointsAddFromFilesForm extends AjaxFormBase {

  /**
   * {@inheritdoc}
   */
  public function getFormId() {
    return 'decreto-content-modify-bp-add-from-files-form';
  }

  /**
   * {@inheritdoc}
   */
  public function buildForm(array $form, FormStateInterface $form_state, NodeInterface $meeting = NULL) {
    if (empty($meeting) || $meeting->getType() != 'decreto_meeting') {
      return $form;
    }

    $this->parent = $meeting;

    $bundle_fields = \Drupal::getContainer()->get('entity_field.manager')->getFieldDefinitions('node', 'decreto_bullet_point_attachment');
    $field_definition = $bundle_fields['field_decreto_bpa_file'];
    $availableExtensions = $field_definition->getSetting('file_extensions');

    // Title.
    $form['title'] = [
      '#type' => 'textfield',
      '#placeholder' => $this->t('Title'),
      '#required' => TRUE,
    ];

    // Closed.
    $form['closed'] = [
      '#prefix' => '<div class="form-inline form-item">',
      '#type' => 'checkbox',
      '#title' => $this->t('Closed'),
    ];

    // Personal.
    $form['personal'] = [
      '#type' => 'checkbox',
      '#title' => $this->t('Personal'),
      '#suffix' => '</div>',
    ];

    // Convert to PDF.
    if (\Drupal::moduleHandler()->moduleExists('decreto_pdf_conversion_manager')) {
      $form['upload_file']['convert_to_pdf'] = [
        '#type' => 'checkbox',
        '#title' => $this->t('Convert to PDF'),
        '#default_value' => TRUE,
        '#description' => $this->t('skipped if file is already PDF'),
      ];
    }

    // Convert to HTML.
    if (\Drupal::moduleHandler()->moduleExists('decreto_pdf2htmlex')) {
      $form['upload_file']['convert_to_html'] = [
        '#type' => 'checkbox',
        '#title' => $this->t('Convert to HTML'),
        '#default_value' => TRUE,
        '#description' => $this->t('by conversion to HTML file becomes available for attaching notes'),
        '#states' => array(
          'invisible' => array(
            ':input[name="convert_to_pdf"]' => array('checked' => FALSE),
          ),
        ),
      ];
    }

    // Files container.
    $form['files_container'] = [
      '#type' => 'container',
      '#prefix' => '<div id="js-files-container-wrapper">',
      '#suffix' => '</div>',
      '#tree' => TRUE,
    ];

    $counter = $form_state->get('counter');
    if (empty($counter) || $counter < 1) {
      $counter = 1;
      $form_state->set('counter', $counter);
    }

    for ($i = 0; $i < $counter; $i++) {
      $file_container = [
        '#type' => 'container',
        '#prefix' => '<div class="form-group">',
        '#suffix' => '</div>',
      ];

      $file_container['file'] = [
        '#type' => 'managed_file',
        '#upload_location' => 'public://',
        '#default_value' => NULL,
        '#upload_validators' => array(
          'file_validate_extensions' => array($availableExtensions),
        ),
        '#description' => $this->t('Available extensions are: %extensions', ['%extensions' => $availableExtensions]),
      ];

      if ($counter > 1) {
        $file_container['delete'] = [
          '#name' => 'edit-file-index-delete-' . $i,
          '#value' => t('Delete'),
          '#file_index' => $i,
          '#ajax' => [
            'wrapper' => 'js-files-container-wrapper',
            'callback' => '::ajaxFiles',
            'event' => 'click',
          ],
          '#submit' => ['::submitDelete'],
          '#type' => 'submit',
          '#limit_validation_errors' => [],
        ];
      }
      $form['files_container'][] = $file_container;
    }

    $form['add-more'] = [
      '#value' => t('Add'),
      '#name' => 'add more',
      '#ajax' => [
        'wrapper' => 'js-files-container-wrapper',
        'callback' => '::ajaxFiles',
        'event' => 'click',
      ],
      '#submit' => ['::submitAddMore'],
      '#type' => 'submit',
      '#limit_validation_errors' => [],
    ];

    $form = parent::buildForm($form, $form_state);

    return $form;
  }

  /**
   * {@inheritdoc}
   */
  public function submitForm(array &$form, FormStateInterface $form_state) {
    // Getting values.
    $title = $form_state->getValue('title');
    $closed = $form_state->getValue('closed');
    $personal = $form_state->getValue('personal');
    $convert_to_pdf = $form_state->getValue('convert_to_pdf');
    $convert_to_html = $form_state->getValue('convert_to_html');
    $files_container = $form_state->getValue('files_container');

    // Creating bullet point node.
    $bullet_point_node = Node::create(array(
      'type' => 'decreto_bullet_point',
      'title' => $title,
      'status' => 1,
      'field_decreto_bp_closed' => [
        'value' => $closed,
      ],
      'field_decreto_bp_personal' => [
        'value' => $personal,
      ],
    ));
    $bullet_point_node->save();

    // Adding bullet point attachments.
    $decretoBP = new DecretoBulletPoint($bullet_point_node);
    foreach ($files_container as $file_container) {
      $fid = $file_container['file'][0];
      $file = File::load($fid);
      $bpa_node = Node::create(array(
        'type' => 'decreto_bullet_point_attachment',
        'title' => $file->label(),
        'status' => 1,
        'field_decreto_bpa_file' => [
          'target_id' => $fid,
        ],
      ));
      $bpa_node->save();

      // Handle * > PDF conversion.
      if (\Drupal::moduleHandler()->moduleExists('decreto_pdf_conversion_manager')) {
        if ($file && $convert_to_pdf && $file->getMimeType() != 'application/pdf') {
          \Drupal::service('decreto_pdf_conversion_manager.pdfConversionManagerService')->scheduleFile($file->id(), $bpa_node->id(), $convert_to_html);
        }
      }
      // Handle PDF > HTML conversion.
      if (\Drupal::moduleHandler()->moduleExists('decreto_pdf2htmlex')) {
        if ($file && $convert_to_html && $file->getMimeType() == 'application/pdf') {
          \Drupal::service('decreto_pdf2htmlex.pdf2htmlex')->scheduleFile($file->id(), $bpa_node->id());
        }
      }

      // Adding to bullet point, but not saving the node yet,
      // it will be saved as a last step.
      $decretoBP->addBulletPointAttachment($bpa_node, FALSE);
    }
    // Finally saving the bullet point node.
    $decretoBP->save();

    // Attaching created bullet point to meeting.
    $decretoMeeting = new DecretoMeeting($this->parent);
    $decretoMeeting->addBulletPoint($bullet_point_node->id(), FALSE);

    // Telling meeting to recheck attached BPA files, that will also save the
    // meeting.
    $decretoMeeting->refreshBpaFiles();
  }

  /**
   * Ajax callback that increase amount of files.
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
    $counter = $form_state->get('counter');
    $form_state->set('counter', $counter + 1);
    $form_state->setRebuild();
    return $form;
  }

  /**
   * Ajax callback that reduce amount of files.
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

    // Saving user input for future.
    $user_input = $form_state->getUserInput();

    // Unsetting file that is deleted.
    unset($user_input['files_container'][$triggering_element['#file_index']]);
    $user_input['files_container'] = array_values($user_input['files_container']);

    // Reusing saved user input for future.
    $form_state->setUserInput($user_input);

    // Updating counter.
    $counter = $form_state->get('counter');
    $form_state->set('counter', $counter - 1);

    $form_state->setRebuild();
    return $form;
  }

  /**
   * Ajax files container update function.
   *
   * @param array $form
   *   Form API form.
   * @param \Drupal\Core\Form\FormStateInterface $form_state
   *   Form API form.
   *
   * @return array
   *   Form array.
   */
  public function ajaxFiles(array $form, FormStateInterface $form_state) {
    return $form['files_container'];
  }

}
