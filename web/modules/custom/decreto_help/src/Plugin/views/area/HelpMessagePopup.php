<?php

namespace Drupal\decreto_help\Plugin\views\area;

use Drupal\Core\Form\FormStateInterface;
use Drupal\views\Plugin\views\area\AreaPluginBase;
use Drupal\decreto_help\Form\HelpMessagesSettings;
/**
 * Render help message popup markup.
 *
 * @ingroup views_area_handlers
 *
 * @ViewsArea("decreto_help_message_popup")
 */
class HelpMessagePopup extends AreaPluginBase {

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
      $message = \Drupal::config('decreto_help_messages.settings')->get($this->options['message_key']);
      $build['message'] = [
        '#theme' => 'decreto_help_message_popup',
        '#content' => strip_tags($message),
        '#attached' => ['library' => ['core/jquery.ui.tooltip']]
      ];
      return $build;
    }
  }

}
