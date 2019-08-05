<?php

namespace Drupal\decreto_content_modify\Form;

use Drupal\Core\Ajax\AjaxResponse;
use Drupal\Core\Ajax\CloseModalDialogCommand;
use Drupal\Core\Ajax\RedirectCommand;
use Drupal\Core\Ajax\ReplaceCommand;
use Drupal\Core\Form\FormBase;
use Drupal\Core\Form\FormStateInterface;
use Drupal\decreto_content_modify\Entity\DecretoBulletPointAttachment;
use Drupal\decreto_pdf2htmlex\Utils\DecretoPdf2htmlexUtils as DecretoHTMLUtils;
use Drupal\decreto_pdf_conversion_manager\Utils\DecretoPdfConversionManagerUtils as DecretoPDFUtils;
use Drupal\file\Entity\File;
use Drupal\node\NodeInterface;

/**
 * Implements the ModalForm form controller.
 *
 * This example demonstrates implementation of a form that is designed to be
 * used as a modal form.  To properly display the modal the link presented by
 * the \Drupal\fapi_example\Controller\Page page controller loads the Drupal
 * dialog and ajax libraries.  The submit handler in this class returns ajax
 * commands to replace text in the calling page after submission .
 *
 * @see \Drupal\Core\Form\FormBase
 */
class BulletPointAttachmentEditForm extends FormBase {
  protected $meeting;
  protected $bulletPointAttachment;

  /**
   * {@inheritdoc}
   */
  public function getFormId() {
    return 'decreto-content-modify-bpa-edit-form';
  }

  /**
   * {@inheritdoc}
   */
  public function buildForm(array $form, FormStateInterface $form_state, NodeInterface $bullet_point_attachment = NULL) {
    if (empty($bullet_point_attachment) || $bullet_point_attachment->getType() != 'decreto_bullet_point_attachment') {
      return $form;
    }

    $this->bulletPointAttachment = $bullet_point_attachment;

    // Saving meeting for redirect purposes.
    $decretoBPA = new DecretoBulletPointAttachment($bullet_point_attachment);
    $meeting = $decretoBPA->getMeeting();
    $this->meeting = $meeting;

    $form['#prefix'] = '<div id="' . $this->getFormId() . '">';
    $form['#suffix'] = '</div>';

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
    if ($this->bulletPointAttachment) {
      $form = $this->populateFormData($form, $form_state);
    }

    // Form actions START.
    $form['actions'] = [
      '#type' => 'actions',
    ];
    $form['actions']['cancel'] = [
      '#type' => 'button',
      '#value' => $this->t('Cancel'),
      '#name' => 'cancel',
      '#ajax' => [
        'callback' => '::ajaxCloseForm',
        'event' => 'click',
      ],
      '#limit_validation_errors' => [],
    ];
    $form['actions']['submit'] = [
      '#type' => 'submit',
      '#value' => $this->t('Save'),
      '#ajax' => [
        'callback' => '::ajaxSubmitForm',
        'event' => 'click',
      ],
    ];
    // Form actions END.

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

    // File field.
    $form['upload_file']['file'] = array(
      '#type' => 'managed_file',
      '#upload_location' => 'public://',
      '#default_value' => NULL,
      '#upload_validators' => array(
        'file_validate_extensions' => array('txt pdf doc docx html'),
      ),
    );

    // Convert to PDF.
    if (\Drupal::moduleHandler()->moduleExists('decreto_pdf_conversion_manager')) {
      $form['upload_file']['convert_to_pdf'] = [
        '#type' => 'checkbox',
        '#title' => $this->t('Convert to PDF'),
        '#default_value' => TRUE,
      ];
    }

    // Convert to HTML.
    if (\Drupal::moduleHandler()->moduleExists('decreto_pdf2htmlex')) {
      $form['upload_file']['convert_to_html'] = [
        '#type' => 'checkbox',
        '#title' => $this->t('Convert to HTML'),
        '#default_value' => TRUE,
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
    $bpa = $this->bulletPointAttachment;
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

      // TODO: redo after DecretoHTMLUtils is refactored.
      if (DecretoHTMLUtils::isScheduled($bpa->field_decreto_bpa_file->entity, $bpa)) {
        $form['upload_file']['convert_to_html']['#default_value'] = 1;
      }

      // TODO: redo after DecretoPDFUtils is refactored.
      if (DecretoPDFUtils::isScheduled($bpa->field_decreto_bpa_file->entity, $bpa)) {
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

    $this->bulletPointAttachment->title = $title;
    $this->bulletPointAttachment->body = $body;
    if ($bpa_file) {
      $this->bulletPointAttachment->field_decreto_bpa_file->setValue(['target_id' => $bpa_file->id()]);
      $this->bulletPointAttachment->field_decreto_bpa_html->setValue(NULL);
    }
    else {
      $this->bulletPointAttachment->field_decreto_bpa_file->setValue(NULL);
    }

    if ($bpa_html) {
      $this->bulletPointAttachment->field_decreto_bpa_html->setValue(['target_id' => $bpa_html->id()]);
      $this->bulletPointAttachment->field_decreto_bpa_file->setValue(['target_id' => $bpa_html->id()]);
    }
    else {
      $this->bulletPointAttachment->field_decreto_bpa_html->setValue(NULL);
    }

    // Saving bullet point attachment.
    $this->bulletPointAttachment->save();

    // Handle PDF > HTML conversion.
    if (\Drupal::moduleHandler()->moduleExists('decreto_pdf2htmlex')) {
      if ($bpa_file && $convert_to_html && $bpa_file->getMimeType() == 'application/pdf') {
        DecretoHTMLUtils::scheduleConversion($bpa_file, $this->bulletPointAttachment);
      }
    }

    if (\Drupal::moduleHandler()->moduleExists('decreto_pdf_conversion_manager')) {
      if ($bpa_file && $convert_to_pdf) {
        DecretoPDFUtils::scheduleConversion($bpa_file, $this->bulletPointAttachment, $convert_to_html);
      }
    }
  }

  /**
   * Closing modal form.
   *
   * @param array $form
   *   Render array representing from.
   * @param \Drupal\Core\Form\FormStateInterface $form_state
   *   Current form state.
   *
   * @return \Drupal\Core\Ajax\AjaxResponse
   *   Array of ajax commands to execute on submit of the modal form.
   */
  public function ajaxCloseForm(array &$form, FormStateInterface $form_state) {
    $response = new AjaxResponse();
    $response->addCommand(new CloseModalDialogCommand());

    return $response;
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
      // Replacing form to show errors.
      $form['status_messages'] = [
        '#type' => 'status_messages',
        '#weight' => -10,
      ];
      $response->addCommand(new ReplaceCommand('#' . $this->getFormId(), $form));
    }
    else {
      // Closing modal and Redirecting to created / updated meeting.
      $response->addCommand(new CloseModalDialogCommand());
      $response->addCommand(new RedirectCommand($this->meeting->toUrl()->toString()));
    }

    return $response;
  }

}
