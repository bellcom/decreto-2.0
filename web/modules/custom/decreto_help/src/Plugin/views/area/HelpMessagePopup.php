<?php

namespace Drupal\decreto_help\Plugin\views\area;

use Drupal\Core\Form\FormStateInterface;
use Drupal\Core\Plugin\ContainerFactoryPluginInterface;
use Drupal\decreto_help\HelpMessageService;
use Drupal\views\Plugin\views\area\AreaPluginBase;
use Drupal\decreto_help\Form\HelpMessagesSettings;
use Symfony\Component\DependencyInjection\ContainerInterface;

/**
 * Render help message popup markup.
 *
 * @ingroup views_area_handlers
 *
 * @ViewsArea("decreto_help_message_popup")
 */
class HelpMessagePopup extends AreaPluginBase implements ContainerFactoryPluginInterface {

  /**
   * Decreto help message service.
   *
   * @var HelpMessageService
   */
  protected $decretoHelpMessageService;

  /**
   * {@inheritdoc}
   *
   * @param \Drupal\Core\Entity\EntityTypeManagerInterface $entity_type_manager
   *   The entity type manager service.
   * @param \Drupal\Core\Language\LanguageManagerInterface $language_manager
   *   The language manager.
   */
  public function __construct(array $configuration, $plugin_id, $plugin_definition, $decretoHelpMessageService) {
    parent::__construct($configuration, $plugin_id, $plugin_definition);
    $this->decretoHelpMessageService = $decretoHelpMessageService;
  }

  /**
   * {@inheritdoc}
   */
  public static function create(ContainerInterface $container, array $configuration, $plugin_id, $plugin_definition) {
    return new static(
      $configuration,
      $plugin_id,
      $plugin_definition,
      $container->get('decreto_help.message')
    );
  }

  /**
   * {@inheritdoc}
   */
  protected function defineOptions() {
    $options = parent::defineOptions();

    $options['message_key'] = ['default' => ''];

    return $options;
  }

  /**
   * {@inheritdoc}
   */
  public function buildOptionsForm(&$form, FormStateInterface $form_state) {
    parent::buildOptionsForm($form, $form_state);

    $form['message_key'] = [
      '#title' => $this->t('Message key'),
      '#type' => 'select',
      '#default_value' => empty($this->options['message_key']) ? '' : $this->options['message_key'],
      '#options' => HelpMessagesSettings::getKeys(),
    ];
  }

  /**
   * {@inheritdoc}
   */
  public function render($empty = FALSE) {
    if (!$empty || !empty($this->options['message_key'])) {
      return $this->decretoHelpMessageService->getMessageMarkup($this->options['message_key']);
    }
  }

}
