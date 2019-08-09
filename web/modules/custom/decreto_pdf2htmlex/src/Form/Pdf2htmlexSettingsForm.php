<?php

namespace Drupal\decreto_pdf2htmlex\Form;

use Drupal\Core\Form\ConfigFormBase;
use Drupal\Core\Form\FormStateInterface;
use Drupal\Core\Messenger\MessengerInterface;

/**
 * Configure example settings for this site.
 */
class Pdf2htmlexSettingsForm extends ConfigFormBase {

  /**
   * {@inheritdoc}
   */
  public function getFormId() {
    return 'decreto_pdf2htmlex_settings';
  }

  /**
   * {@inheritdoc}
   */
  protected function getEditableConfigNames() {
    return [
      'decreto_pdf2htmlex.settings',
    ];
  }

  /**
   * {@inheritdoc}
   */
  public function buildForm(array $form, FormStateInterface $form_state) {
    $config = $this->config('decreto_pdf2htmlex.settings');
    $form['decreto_pdf2htmlex_path'] = array(
      '#type' => 'textfield',
      '#title' => $this->t('Path to pdf2htmlEX'),
      '#default_value' => $config->get('decreto_pdf2htmlex_path'),
      '#description' => $this->t('If left empty pdf2htmlEX will be used as generic command'),
    );
    $form['decreto_pdf2htmlex_zoom'] = array(
      '#type' => 'textfield',
      '#title' => $this->t('Default zoom for convertion'),
      '#default_value' => $config->get('decreto_pdf2htmlex_zoom'),
    );

    return parent::buildForm($form, $form_state);
  }

  /**
   * {@inheritdoc}
   */
  public function submitForm(array &$form, FormStateInterface $form_state) {
    $config = \Drupal::service('config.factory')->getEditable('decreto_pdf2htmlex.settings');
    $config->set('decreto_pdf2htmlex_path', $form_state->getValue('decreto_pdf2htmlex_path'))
      ->set('decreto_pdf2htmlex_zoom', $form_state->getValue('decreto_pdf2htmlex_zoom'))
      ->save();
    parent::submitForm($form, $form_state);

    $version = \Drupal::service('decreto_pdf2htmlex.pdf2htmlex')->getVersion();
    if ($version) {
      \Drupal::messenger()->addMessage($this->t('pdf2htmlEX is successfully initialized. Version %version', ['%version' => $version]), 'status');
    }
    else {
      \Drupal::messenger()->addMessage($this->t('pdf2htmlEX is not found on the provided path', ['%version' => $version]), 'error');
    }
  }

}
