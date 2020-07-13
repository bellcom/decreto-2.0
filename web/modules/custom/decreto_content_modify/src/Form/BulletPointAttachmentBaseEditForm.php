<?php

namespace Drupal\decreto_content_modify\Form;

/**
 * Implements the BulletPointAttachmentBaseEditForm form.
 *
 * @see \Drupal\Core\Form\FormBase
 */
abstract class BulletPointAttachmentBaseEditForm extends AjaxFormBase {

  /**
   * Appends custom text components to a form.
   *
   * @param array $form
   *   Render array representing from.
   *
   * @return array
   *   Form array with appended page.
   */
  protected function appendFormCustomText(array $form) {
    $form['custom_text'] = [
      '#type' => 'container',
    ];

    // Custom_text.
    $form['custom_text']['body'] = [
      '#type' => 'text_format',
      '#format' => 'basic_html',
      '#allowed_formats' => ['basic_html'],
    ];

    return $form;
  }

  /**
   * Appends upload file components to a form.
   *
   * @param array $form
   *   Render array representing from.
   *
   * @return array
   *   Form array with appended page.
   */
  protected function appendFormUploadFile(array $form) {
    $form['upload_file'] = [
      '#type' => 'container',
    ];

    $bundle_fields = \Drupal::getContainer()
      ->get('entity_field.manager')
      ->getFieldDefinitions('node', 'decreto_bullet_point_attachment');
    $field_definition = $bundle_fields['field_decreto_bpa_file'];
    $availableExtensions = $field_definition->getSetting('file_extensions');

    // File field.
    $form['upload_file']['file'] = [
      '#type' => 'managed_file',
      '#upload_location' => 'private://bpas',
      '#default_value' => NULL,
      '#upload_validators' => [
        'file_validate_extensions' => [$availableExtensions],
      ],
      '#description' => $this->t('Available extensions are: %extensions', ['%extensions' => $availableExtensions]),
    ];

    // Convert to PDF.
    if (\Drupal::moduleHandler()
      ->moduleExists('decreto_pdf_conversion_manager')) {
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
        '#states' => [
          'invisible' => [
            ':input[name="convert_to_pdf"]' => ['checked' => FALSE],
          ],
        ],
      ];
    }

    return $form;
  }

}
