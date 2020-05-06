<?php

namespace Drupal\decreto_department\Plugin\views\area;

use Drupal\Core\Form\FormStateInterface;
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
    $options['create_department_use_ajax'] = ['default' => ''];
    $options['edit_department'] = ['default' => ''];
    $options['department_user_create'] = ['default' => ''];
    $options['department_id'] = ['default' => ''];
    $options['show_roles_legend'] = ['default' => ''];

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

    $form['create_department_use_ajax'] = [
      '#title' => $this->t('Use ajax for create department button'),
      '#type' => 'checkbox',
      '#states' => array(
        'invisible' => array(
          ':input[name="options[create_department]"]' => array('checked' => FALSE),
        ),
      ),
      '#default_value' => empty($this->options['create_department_use_ajax']) ? '' : $this->options['create_department_use_ajax'],
    ];

    $form['edit_department'] = [
      '#title' => $this->t('Edit department link'),
      '#type' => 'checkbox',
      '#default_value' => empty($this->options['edit_department']) ? '' : $this->options['edit_department'],
    ];

    $form['department_user_create'] = [
      '#title' => $this->t('Create user'),
      '#type' => 'checkbox',
      '#default_value' => empty($this->options['department_user_create']) ? '' : $this->options['department_user_create'],
    ];

    $form['department_id'] = [
      '#title' => $this->t('Department ID'),
      '#type' => 'textfield',
      '#default_value' => empty($this->options['department_id']) ? '' : $this->options['department_id'],
      '#description' => $this->t('Use fixed or token value for providing Department ID'),
    ];

    $form['show_roles_legend'] = [
      '#title' => $this->t('Show roles legend'),
      '#type' => 'checkbox',
      '#default_value' => empty($this->options['show_roles_legend']) ? '' : $this->options['show_roles_legend'],
    ];
  }

  /**
   * {@inheritdoc}
   */
  public function render($empty = FALSE) {
    $department_id = 0;
    $department = NULL;
    if (isset($this->options['department_id'])) {
      $department_id = $this->tokenizeValue($this->options['department_id']);
      $department = Term::load($department_id);
    }

    $roles_legend = [];
    if ($this->options['show_roles_legend']) {
      // Instantiate the transliteration class.
      $trans = \Drupal::transliteration();

      $departmentRoles = \Drupal::entityTypeManager()->getStorage('taxonomy_term')->loadTree('decreto_tax_department_roles');
      foreach ($departmentRoles as $departmentRole) {
        $roles_legend[$departmentRole->tid] = [
          'name' => $departmentRole->name,
          'name_safe' => $trans
            ->transliterate($departmentRole->name),
        ];
      }
    }

    return [
      '#theme' => 'decreto_department_departments_view_context_links',
      '#create_department' => $this->options['create_department'],
      '#create_department_use_ajax' => $this->options['create_department_use_ajax'],
      '#edit_department' => $this->options['edit_department'],
      '#department_user_create' => $this->options['department_user_create'],
      '#department_id' => $department_id,
      '#show_roles_legend' => $this->options['show_roles_legend'],
      '#roles_legend' => $roles_legend,
      '#access' => [
        'decreto_department' => [
          'canEdit' => ($department) ? $department->access('update') : NULL,
        ],
      ],
    ];
  }

}
