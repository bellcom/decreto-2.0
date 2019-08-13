<?php

namespace Drupal\decreto_pdf_conversion_manager\Form;

use Drupal\Core\Form\ConfigFormBase;
use Drupal\Core\Form\FormStateInterface;

/**
 * PDF conversion manager settings form.
 */
class PdfConversionManagerSettingsForm extends ConfigFormBase {

  /**
   * {@inheritdoc}
   */
  public function getFormId() {
    return 'decreto_pdf_conversion_manager_settings';
  }

  /**
   * {@inheritdoc}
   */
  protected function getEditableConfigNames() {
    return [
      'decreto_pdf_conversion_manager.settings',
    ];
  }

  /**
   * {@inheritdoc}
   */
  public function buildForm(array $form, FormStateInterface $form_state) {
    $config = $this->config('decreto_pdf_conversion_manager.settings');
    $form['decreto_pdf_conversion_manager_max_attempts'] = array(
      '#type' => 'textfield',
      '#title' => $this->t('Max attempts to try to convert single file'),
      '#default_value' => $config->get('decreto_pdf_conversion_manager_max_attempts', 5),
    );
    $form['decreto_pdf_conversion_manager_unoconv'] = array(
      '#type' => 'textfield',
      '#title' => $this->t('Path to unoconv'),
      '#default_value' => $config->get('decreto_pdf_conversion_manager_unoconv'),
      '#description' => $this->t('If left empty unoconv will be used as generic command'),
    );
    $form['decreto_pdf_conversion_manager_imagemagick'] = array(
      '#type' => 'textfield',
      '#title' => $this->t('Path to imagemagick'),
      '#default_value' => $config->get('decreto_pdf_conversion_manager_imagemagick'),
      '#description' => $this->t('If left empty imagemagick will be used as generic command'),
    );
    $form['decreto_pdf_conversion_manager_iconv'] = array(
      '#type' => 'textfield',
      '#title' => $this->t('Path to iconv'),
      '#default_value' => $config->get('decreto_pdf_conversion_manager_iconv'),
      '#description' => $this->t('If left empty iconv will be used as generic command'),
    );

    return parent::buildForm($form, $form_state);
  }

  /**
   * {@inheritdoc}
   */
  public function submitForm(array &$form, FormStateInterface $form_state) {
    $config = \Drupal::service('config.factory')->getEditable('decreto_pdf_conversion_manager.settings');
    foreach ($form_state->getValues() as $key => $item) {
      $config->set($key, $item);
    }
    $config->save();

    parent::submitForm($form, $form_state);

    // Checking unoconv.
    $unoconv_version = \Drupal::service('decreto_pdf_conversion_manager.pdfConversionManagerService')->getVersion('unoconv');
    if ($unoconv_version) {
      \Drupal::messenger()->addMessage($this->t('unoconv is successfully initialized. Version %version', ['%version' => $unoconv_version]), 'status');
    }
    else {
      \Drupal::messenger()->addMessage($this->t('unoconv is not found on the provided path', ['%version' => $unoconv_version]), 'error');
    }

    // Checking ImageMagick: convert.
    $image_magick_version = \Drupal::service('decreto_pdf_conversion_manager.pdfConversionManagerService')->getVersion('imagemagick');
    if ($image_magick_version) {
      \Drupal::messenger()->addMessage($this->t('imagemagick is successfully initialized. Version %version', ['%version' => $image_magick_version]), 'status');
    }
    else {
      \Drupal::messenger()->addMessage($this->t('imagemagick is not found on the provided path', ['%version' => $image_magick_version]), 'error');
    }

    // Checking iconv.
    $iconv_version = \Drupal::service('decreto_pdf_conversion_manager.pdfConversionManagerService')->getVersion('iconv');
    if ($iconv_version) {
      \Drupal::messenger()->addMessage($this->t('iconv is successfully initialized. Version %version', ['%version' => $iconv_version]), 'status');
    }
    else {
      \Drupal::messenger()->addMessage($this->t('iconv is not found on the provided path', ['%version' => $iconv_version]), 'error');
    }
  }

}
