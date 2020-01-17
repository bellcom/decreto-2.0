<?php

namespace Drupal\decreto_user\Plugin\views\area;

use Drupal\Core\Form\FormStateInterface;
use Drupal\views\Plugin\views\area\TokenizeAreaPluginBase;

/**
 * Render context links for user views.
 *
 * @ingroup views_area_handlers
 *
 * @ViewsArea("decreto_user_users_view_context_links")
 */
class UsersViewContextLinks extends TokenizeAreaPluginBase {

  /**
   * {@inheritdoc}
   */
  protected function defineOptions() {
    $options = parent::defineOptions();

    $options['create_user'] = ['default' => ''];
    $options['create_user_use_ajax'] = ['default' => ''];

    return $options;
  }

  /**
   * {@inheritdoc}
   */
  public function buildOptionsForm(&$form, FormStateInterface $form_state) {
    parent::buildOptionsForm($form, $form_state);

    $form['create_user'] = [
      '#title' => $this->t('Create user link'),
      '#type' => 'checkbox',
      '#default_value' => empty($this->options['create_user']) ? '' : $this->options['create_user'],
    ];

    $form['create_user_use_ajax'] = [
      '#title' => $this->t('Use ajax for create user button'),
      '#type' => 'checkbox',
      '#states' => array(
        'invisible' => array(
          ':input[name="options[create_user]"]' => array('checked' => FALSE),
        ),
      ),
      '#default_value' => empty($this->options['create_user_use_ajax']) ? '' : $this->options['create_user_use_ajax'],
    ];
  }

  /**
   * {@inheritdoc}
   */
  public function render($empty = FALSE) {
    return [
      '#theme' => 'decreto_user_users_view_context_links',
      '#create_user' => $this->options['create_user'],
      '#create_user_use_ajax' => $this->options['create_user_use_ajax'],
    ];
  }

}
