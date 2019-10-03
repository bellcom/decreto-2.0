<?php

namespace Drupal\decreto_content_modify\Form;

use Drupal\Core\Entity\ContentEntityInterface;
use Drupal\Core\Form\FormStateInterface;
use Drupal\decreto_content_modify\Entity\DecretoBulletPointAttachment;
use Drupal\file\Entity\File;

/**
 * Implements the BulletPointAttachmentEditForm form.
 *
 * @see \Drupal\Core\Form\FormBase
 */
class BulletPointAttachmentEditForm extends AjaxFormBase {

  /**
   * {@inheritdoc}
   */
  public function getFormId() {
    return 'decreto-content-modify-bpa-edit-form';
  }

  /**
   * Returns the title for the form.
   *
   * @return \Drupal\Core\StringTranslation\TranslatableMarkup
   *   Title for the form.
   */
  public function getTitle() {
    return $this->t('Edit bullet point attachment');
  }

  /**
   * {@inheritdoc}
   */
  public function buildForm(array $form, FormStateInterface $form_state, ContentEntityInterface $bullet_point_attachment = NULL) {
    if (empty($bullet_point_attachment) || $bullet_point_attachment->getType() != 'decreto_bullet_point_attachment') {
      return $form;
    }

    $this->entity = $bullet_point_attachment;

    // Saving meeting for redirect purposes.
    $decretoBPA = new DecretoBulletPointAttachment($bullet_point_attachment);
    $meeting = $decretoBPA->getMeeting();
    $this->parent = $meeting;

    // Adding help message.
    $form[] = \Drupal::service('decreto_help.message')->getMessageMarkup('bpa_edit_form');

    // Title.
    $form['title'] = [
      '#type' => 'textfield',
      '#placeholder' => $this->t('Title'),
      '#required' => TRUE,
    ];

    // Tab content START.
    $form = $this->appendFormCustomText($form, $form_state);
    $form = $this->appendFormUploadFile($form, $form_state);
    // Tab content END.

    // Populate values.
    $form = $this->populateFormData($form, $form_state);

    $form = parent::buildForm($form, $form_state);

    $form['#theme'] = 'decreto_content_modify_bpa_edit_form';

    return $form;
  }

  /**
   * Appends custom text components to a form.
   *
   * @param array $form
   *   Render array representing from.
   * @param \Drupal\Core\Form\FormStateInterface $form_state
   *   Current form state.
   *
   * @return array
   *   Form array with appended page.
   */
  private function appendFormCustomText(array $form, FormStateInterface $form_state) {
    $form['custom_text'] = array(
      '#type' => 'container',
    );

    // Custom_text.
    $form['custom_text']['body'] = array(
      '#type' => 'text_format',
      '#format' => 'basic_html',
      '#allowed_formats' => ['basic_html'],
    );

    return $form;
  }

  /**
   * Appends upload file components to a form.
   *
   * @param array $form
   *   Render array representing from.
   * @param \Drupal\Core\Form\FormStateInterface $form_state
   *   Current form state.
   *
   * @return array
   *   Form array with appended page.
   */
  private function appendFormUploadFile(array $form, FormStateInterface $form_state) {
    $form['upload_file'] = array(
      '#type' => 'container',
    );

    $bundle_fields = \Drupal::getContainer()->get('entity_field.manager')->getFieldDefinitions('node', 'decreto_bullet_point_attachment');
    $field_definition = $bundle_fields['field_decreto_bpa_file'];
    $availableExtensions = $field_definition->getSetting('file_extensions');

    // File field.
    $form['upload_file']['file'] = array(
      '#type' => 'managed_file',
      '#upload_location' => 'public://',
      '#default_value' => NULL,
      '#upload_validators' => array(
        'file_validate_extensions' => array($availableExtensions),
      ),
      '#description' => $this->t('Available extensions are: %extensions', ['%extensions' => $availableExtensions]),
    );

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

    return $form;
  }

  /**
   * Populates form with data from real bullet point attachment.
   *
   * @param array $form
   *   Render array representing from.
   * @param \Drupal\Core\Form\FormStateInterface $form_state
   *   Current form state.
   *
   * @return array
   *   Form array with appended page.
   *
   * @throws \Drupal\Core\Entity\Exception\UnsupportedEntityTypeDefinitionException
   * @throws \Drupal\Core\TypedData\Exception\MissingDataException
   */
  private function populateFormData(array $form, FormStateInterface $form_state) {
    $bpa = $this->entity;
    $form['title']['#default_value'] = $bpa->getTitle();
    $form['custom_text']['body']['#default_value'] = $bpa->body->value;

    // Enabling custom text tab as active.
    $form['#custom_text_tab_active'] = 'active';

    $decretoBPA = new DecretoBulletPointAttachment($bpa);
    if ($fid = $decretoBPA->getFile(FALSE)) {
      $form['upload_file']['file']['#default_value']['fid'] = $fid;

      // Enabling upload file tab as active.
      $form['#custom_text_tab_active'] = '';
      $form['#upload_file_tab_active'] = 'active';

      if (\Drupal::service('decreto_pdf2htmlex.pdf2htmlex')->isFileScheduled($fid, $bpa->id())) {
        $form['upload_file']['convert_to_html']['#default_value'] = 1;
      }

      if (\Drupal::service('decreto_pdf_conversion_manager.pdfConversionManagerService')->isFileScheduled($fid, $bpa->id())) {
        $form['upload_file']['convert_to_pdf']['#default_value'] = 1;
      }
    }

    return $form;
  }

  /**
   * {@inheritdoc}
   */
  public function submitForm(array &$form, FormStateInterface $form_state) {
    $title = $form_state->getValue('title');
    $body = $form_state->getValue('body');
    $file_field = $form_state->getValue('file');
    $convert_to_pdf = $form_state->getValue('convert_to_pdf');
    $convert_to_html = $form_state->getValue('convert_to_html');
    $bpa_file = NULL;
    $bpa_html = NULL;

    if ($file_field) {
      $file = File::load(array_pop($file_field));

      if ($file->getMimeType() == 'text/html') {
        $bpa_html = $file;
      }
      else {
        $bpa_file = $file;
      }
    }

    $this->entity->title = $title;
    $this->entity->body = $body;
    if ($bpa_file) {
      $this->entity->field_decreto_bpa_file->setValue(['target_id' => $bpa_file->id()]);
      $this->entity->field_decreto_bpa_html->setValue(NULL);
    }
    else {
      $this->entity->field_decreto_bpa_file->setValue(NULL);
    }

    if ($bpa_html) {
      $this->entity->field_decreto_bpa_html->setValue(['target_id' => $bpa_html->id()]);
      $this->entity->field_decreto_bpa_file->setValue(['target_id' => $bpa_html->id()]);
    }
    else {
      $this->entity->field_decreto_bpa_html->setValue(NULL);
    }

    // Saving bullet point attachment.
    $this->entity->save();

    // Handle * > PDF conversion.
    if (\Drupal::moduleHandler()->moduleExists('decreto_pdf_conversion_manager')) {
      if ($bpa_file && $convert_to_pdf && $bpa_file->getMimeType() != 'application/pdf') {
        \Drupal::service('decreto_pdf_conversion_manager.pdfConversionManagerService')->scheduleFile($bpa_file->id(), $this->entity->id(), $convert_to_html);
      }
    }
    // Handle PDF > HTML conversion.
    if (\Drupal::moduleHandler()->moduleExists('decreto_pdf2htmlex')) {
      if ($bpa_file && $convert_to_html && $bpa_file->getMimeType() == 'application/pdf') {
        \Drupal::service('decreto_pdf2htmlex.pdf2htmlex')->scheduleFile($bpa_file->id(), $this->entity->id());
      }
    }
  }

}
