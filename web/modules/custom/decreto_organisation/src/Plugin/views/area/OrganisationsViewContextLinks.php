<?php

namespace Drupal\decreto_organisation\Plugin\views\area;

use Drupal\Core\Form\FormStateInterface;
use Drupal\views\Plugin\views\area\TokenizeAreaPluginBase;

/**
 * Render context links for organisation views.
 *
 * @ingroup views_area_handlers
 *
 * @ViewsArea("decreto_organisation_organisations_view_context_links")
 */
class OrganisationsViewContextLinks extends TokenizeAreaPluginBase {

  /**
   * {@inheritdoc}
   */
  protected function defineOptions() {
    $options = parent::defineOptions();

    $options['create_organisation'] = ['default' => ''];
    $options['edit_organisation'] = ['default' => ''];
    $options['organisation_id'] = ['default' => ''];

    return $options;
  }

  /**
   * {@inheritdoc}
   */
  public function buildOptionsForm(&$form, FormStateInterface $form_state) {
    parent::buildOptionsForm($form, $form_state);

    $form['create_organisation'] = [
      '#title' => $this->t('Create organisation link'),
      '#type' => 'checkbox',
      '#default_value' => empty($this->options['create_organisation']) ? '' : $this->options['create_organisation'],
    ];

    $form['edit_organisation'] = [
      '#title' => $this->t('Edit organisation link'),
      '#type' => 'checkbox',
      '#default_value' => empty($this->options['edit_organisation']) ? '' : $this->options['edit_organisation'],
    ];

    $form['organisation_id'] = [
      '#title' => $this->t('Organisation ID'),
      '#type' => 'textfield',
      '#default_value' => empty($this->options['organisation_id']) ? '' : $this->options['organisation_id'],
      '#description' => $this->t('Use fixed or token value for providing organisation ID'),
    ];
  }

  /**
   * {@inheritdoc}
   */
  public function render($empty = FALSE) {
    $organisationId = 0;
    if (isset($this->options['organisation_id'])) {
      $organisationId = $this->tokenizeValue($this->options['organisation_id']);
    }
    return [
      '#theme' => 'decreto_organisation_organisations_view_context_links',
      '#create_organisation' => $this->options['create_organisation'],
      '#edit_organisation' => $this->options['edit_organisation'],
      '#organisation_id' => $organisationId,
    ];
  }

}
