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
class BulletPointAttachmentEditForm extends BulletPointAttachmentBaseEditForm {

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

    // Closed.
    $form['closed'] = [
      '#type' => 'checkbox',
      '#title' => $this->t('Closed'),
      '#prefix' => '<div class="form-inline form-item">',
    ];

    // Personal.
    $form['personal'] = [
      '#type' => 'checkbox',
      '#title' => $this->t('Personal'),
      '#suffix' => '</div>',
    ];

    // Tab content START.
    $form = parent::appendFormCustomText($form);
    $form = parent::appendFormUploadFile($form);
    // Tab content END.

    // Populate values.
    $form = $this->populateFormData($form, $form_state);

    $form = parent::buildForm($form, $form_state);

    $form['#theme'] = 'decreto_content_modify_bpa_edit_form';

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

    $form['closed']['#default_value'] = $bpa->get('field_decreto_bpa_closed')->value;
    $form['personal']['#default_value'] = $bpa->get('field_decreto_bpa_personal')->value;

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
    $closed = $form_state->getValue('closed');
    $personal = $form_state->getValue('personal');
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
        $bpa_file = $file;
      }
      else {
        $bpa_file = $file;
      }
    }

    $this->entity->title = $title;
    $this->entity->field_decreto_bpa_closed = $closed;
    $this->entity->field_decreto_bpa_personal = $personal;
    $this->entity->body = $body;
    if ($bpa_file) {
      $this->entity->field_decreto_bpa_file->setValue(['target_id' => $bpa_file->id()]);
    }
    else {
      $this->entity->field_decreto_bpa_file->setValue(NULL);
    }

    if ($bpa_html) {
      $this->entity->field_decreto_bpa_html->setValue(['target_id' => $bpa_html->id()]);
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
