<?php

namespace Drupal\decreto_pdf_conversion_manager\Form;

use Drupal\Core\Form\ConfigFormBase;
use Drupal\Core\Form\FormStateInterface;
use Drupal\decreto_pdf_conversion_manager\Utils\DecretoPdfConversionManagerUtils as DecretoPDFUtils;

/**
 * Configure example settings for this site.
 */
class PdfConversionManagerSettingsForm extends ConfigFormBase {
  public function getFormId() {
    return 'decreto_pdf_conversion_manager_settings';
  }

  protected function getEditableConfigNames() {
    return [
      'decreto_pdf_conversion_manager.settings',
    ];
  }

  public function buildForm(array $form, FormStateInterface $form_state) {
    dpm('here');
    DecretoPDFUtils::deleteScheduledJob(14);

    $config = $this->config('decreto_pdf_conversion_manager.settings');
    $form['decreto_pdf_conversion_manager_max_attempts'] = array(
      '#type' => 'textfield',
      '#title' => $this->t('Max attempts to try to convert single file'),
      '#default_value' => $config->get('decreto_pdf_conversion_manager_max_attempts', 5),
    );

    return parent::buildForm($form, $form_state);
  }

  public function submitForm(array &$form, FormStateInterface $form_state) {
    $config = \Drupal::service('config.factory')->getEditable('decreto_pdf_conversion_manager.settings');
    $config->set('decreto_pdf_conversion_manager_max_attempts', $form_state->getValue('decreto_pdf_conversion_manager_max_attempts'))
      ->save();

    parent::submitForm($form, $form_state);
  }
}