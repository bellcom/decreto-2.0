<?php

namespace Drupal\decreto_help\Form;

use Drupal\Core\Config\ConfigFactoryInterface;
use Drupal\Core\Form\ConfigFormBase;
use Drupal\Core\Form\FormStateInterface;

/**
 * Form to configure Decreto help messages.
 */
class HelpMessagesSettings extends ConfigFormBase {

  /**
   * Messages keys array.
   *
   * @var array $keys
   */
  protected $keys;

  /**
   * {@inheritDoc}
   */
  public function __construct(ConfigFactoryInterface $config_factory) {
    $this->keys = $this->getKeys();
    return parent::__construct($config_factory);
  }

  public function getFormId() {
    return 'decreto_help_messages_settings';
  }

  protected function getEditableConfigNames() {
    return ['decreto_help_messages.settings'];
  }

  public function buildForm(array $form, FormStateInterface $form_state) {
    $config = $this->config('decreto_help_messages.settings');
    foreach ($this->keys as $key => $title) {
      $data = $config->get($key);
      $form[$key. '_fieldset'] = [
        '#type' => 'details',
        '#title' => $title,
        '#open' => TRUE,
        '#collapsoble' => FALSE,
        $key => [
          '#type' => 'textarea',
          '#default_value' => empty($data) ? '' : $data,
        ]
      ];
    }
    return parent::buildForm($form, $form_state);
  }

  public function submitForm(array &$form, FormStateInterface $form_state) {
    $config = $this->configFactory->getEditable('decreto_help_messages.settings');
    foreach ($this->keys as $key => $title) {
      $config->set($key, $form_state->getValue($key));
    }
    $config->save();
    parent::submitForm($form, $form_state);
  }

  /**
   * Get function to define message keys.
   *
   * @return array
   */
  static public function getKeys() {
    return [
      'upcoming_events' => 'Upcoming events',
      'my_upcoming_events' => 'My upcoming events',
      'my_departments' => 'My departments',
      'my_organizations' => 'My organizations',
    ];
  }

}
