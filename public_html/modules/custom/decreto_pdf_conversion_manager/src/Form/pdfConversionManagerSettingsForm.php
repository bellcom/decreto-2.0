<?php

namespace Drupal\decreto_pdf_conversion_manager\Form;

use Drupal\Core\Form\ConfigFormBase;
use Drupal\Core\Form\FormStateInterface;

/**
 * Configure example settings for this site.
 */
class pdfConversionManagerSettingsForm extends ConfigFormBase {

  public function getFormId() {
    return 'decreto_pdf_conversion_manager_settings';
  }

  protected function getEditableConfigNames() {
    return [
      'decreto_pdf_conversion_manager.settings',
    ];
  }

  public function buildForm(array $form, FormStateInterface $form_state) {
    $config = $this->config('decreto_pdf_conversion_manager.settings');

    $form['decreto_pdf_conversion_dir'] = array(
      '#type' => 'textfield',
      '#title' => $this->t('Directory to send the files for converting:'),
      '#default_value' => $config->get('decreto_pdf_conversion_dir'),
    );
    return parent::buildForm($form, $form_state);
  }

  public function submitForm(array &$form, FormStateInterface $form_state) {
    $config = \Drupal::service('config.factory')->getEditable('decreto_pdf_conversion_manager.settings');
    $config->set('decreto_pdf_conversion_dir', $form_state->getValue('decreto_pdf_conversion_dir'))
      ->save();
    parent::submitForm($form, $form_state);
  }

}
