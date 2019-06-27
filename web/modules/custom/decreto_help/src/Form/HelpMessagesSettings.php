<?php

namespace Drupal\decreto_help\Form;

use Drupal\Core\KeyValueStore\KeyValueFactoryInterface;
use Drupal\Core\Form\FormBase;
use Drupal\Core\Form\FormStateInterface;
use Drupal\Core\KeyValueStore\KeyValueStoreInterface;
use Symfony\Component\DependencyInjection\ContainerInterface;

/**
 * Form to configure Decreto help messages.
 */
class HelpMessagesSettings extends FormBase {

  /**
   * Messages keys array.
   *
   * @var array $keys
   */
  protected $keys;

  /**
   * Messages storage object.
   *
   * @var KeyValueStoreInterface $storage
   */
  protected $storage;

  /**
   * {@inheritDoc}
   */
  public function __construct(KeyValueFactoryInterface $keyValueFactory) {
    $this->keys = $this->getKeys();
    $this->storage = $keyValueFactory->get('decreto_help.messages_settings');
  }

  /**
   * {@inheritdoc}
   */
  public static function create(ContainerInterface $container) {
    return new static(
      $container->get('keyvalue')
    );
  }

  public function getFormId() {
    return 'decreto_help_messages_settings';
  }

  public function buildForm(array $form, FormStateInterface $form_state) {
    foreach ($this->keys as $key => $title) {
      $data = $this->storage->get($key);
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

    $form['actions']['#type'] = 'actions';
    $form['actions']['submit'] = [
      '#type' => 'submit',
      '#value' => $this->t('Save configuration'),
      '#button_type' => 'primary',
    ];

    return $form;
  }

  public function submitForm(array &$form, FormStateInterface $form_state) {
    foreach ($this->keys as $key => $title) {
      $this->storage->set($key, $form_state->getValue($key));
    }
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
      'meetings_search_form' => 'Meetings search (form)',
      'meetings_search_table' => 'Meetings search (results table)'
    ];
  }

}
