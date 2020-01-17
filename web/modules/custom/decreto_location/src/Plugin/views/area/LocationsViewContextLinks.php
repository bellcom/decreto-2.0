<?php

namespace Drupal\decreto_location\Plugin\views\area;

use Drupal\Core\Form\FormStateInterface;
use Drupal\taxonomy\Entity\Term;
use Drupal\views\Plugin\views\area\TokenizeAreaPluginBase;

/**
 * Render context links for location views.
 *
 * @ingroup views_area_handlers
 *
 * @ViewsArea("decreto_location_locations_view_context_links")
 */
class LocationsViewContextLinks extends TokenizeAreaPluginBase {

  /**
   * {@inheritdoc}
   */
  protected function defineOptions() {
    $options = parent::defineOptions();

    $options['create_location'] = ['default' => ''];
    $options['create_location_use_ajax'] = ['default' => ''];
    $options['edit_location'] = ['default' => ''];
    $options['location_id'] = ['default' => ''];

    return $options;
  }

  /**
   * {@inheritdoc}
   */
  public function buildOptionsForm(&$form, FormStateInterface $form_state) {
    parent::buildOptionsForm($form, $form_state);

    $form['create_location'] = [
      '#title' => $this->t('Create location link'),
      '#type' => 'checkbox',
      '#default_value' => empty($this->options['create_location']) ? '' : $this->options['create_location'],
    ];

    $form['create_location_use_ajax'] = [
      '#title' => $this->t('Use ajax for create location button'),
      '#type' => 'checkbox',
      '#states' => array(
        'invisible' => array(
          ':input[name="options[create_location]"]' => array('checked' => FALSE),
        ),
      ),
      '#default_value' => empty($this->options['create_location_use_ajax']) ? '' : $this->options['create_location_use_ajax'],
    ];

    $form['edit_location'] = [
      '#title' => $this->t('Edit location link'),
      '#type' => 'checkbox',
      '#default_value' => empty($this->options['edit_location']) ? '' : $this->options['edit_location'],
    ];

    $form['location_id'] = [
      '#title' => $this->t('location ID'),
      '#type' => 'textfield',
      '#default_value' => empty($this->options['location_id']) ? '' : $this->options['location_id'],
      '#description' => $this->t('Use fixed or token value for providing location ID'),
    ];
  }

  /**
   * {@inheritdoc}
   */
  public function render($empty = FALSE) {
    $location_id = 0;
    $location = NULL;
    if (isset($this->options['location_id'])) {
      $location_id = $this->tokenizeValue($this->options['location_id']);
      $location = Term::load($location_id);
    }

    return [
      '#theme' => 'decreto_location_locations_view_context_links',
      '#create_location' => $this->options['create_location'],
      '#create_location_use_ajax' => $this->options['create_location_use_ajax'],
      '#edit_location' => $this->options['edit_location'],
      '#location_id' => $location_id,
      '#access' => [
        'decreto_location' => [
          'canEdit' => ($location) ? $location->access('update') : NULL,
        ],
      ],
    ];
  }

}
