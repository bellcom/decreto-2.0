<?php

namespace Drupal\decreto_department\Plugin\views\area;

use Drupal\Core\Form\FormStateInterface;
use Drupal\decreto_department\Controller\AccessController;
use Drupal\taxonomy\Entity\Term;
use Drupal\views\Plugin\views\area\TokenizeAreaPluginBase;

/**
 * Render context links for department views.
 *
 * @ingroup views_area_handlers
 *
 * @ViewsArea("decreto_department_departments_view_context_links")
 */
class DepartmentsViewContextLinks extends TokenizeAreaPluginBase {

  /**
   * {@inheritdoc}
   */
  protected function defineOptions() {
    $options = parent::defineOptions();

    $options['create_department'] = ['default' => ''];
    $options['edit_department'] = ['default' => ''];
    $options['department_id'] = ['default' => ''];

    return $options;
  }

  /**
   * {@inheritdoc}
   */
  public function buildOptionsForm(&$form, FormStateInterface $form_state) {
    parent::buildOptionsForm($form, $form_state);

    $form['create_department'] = [
      '#title' => $this->t('Create department link'),
      '#type' => 'checkbox',
      '#default_value' => empty($this->options['create_department']) ? '' : $this->options['create_department'],
    ];

    $form['edit_department'] = [
      '#title' => $this->t('Edit department link'),
      '#type' => 'checkbox',
      '#default_value' => empty($this->options['edit_department']) ? '' : $this->options['edit_department'],
    ];

    $form['department_id'] = [
      '#title' => $this->t('Department ID'),
      '#type' => 'textfield',
      '#default_value' => empty($this->options['department_id']) ? '' : $this->options['department_id'],
      '#description' => $this->t('Use fixed or token value for providing Department ID'),
    ];
  }

  /**
   * {@inheritdoc}
   */
  public function render($empty = FALSE) {
    $department_id = 0;
    if (isset($this->options['department_id'])) {
      $department_id = $this->tokenizeValue($this->options['department_id']);
    }
    $department = Term::load($department_id);
    return [
      '#theme' => 'decreto_department_departments_view_context_links',
      '#create_department' => $this->options['create_department'],
      '#edit_department' => $this->options['edit_department'],
      '#department_id' => $department_id,
      '#access' => [
        'decreto_department' => [
          'canEdit' => AccessController::editDepartmentAccess($department)->isAllowed(),
        ],
      ],
    ];
  }

}
