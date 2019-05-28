<?php

namespace Drupal\decreto_calendar\Plugin\views\style;

use Drupal\Component\Utility\UrlHelper;
use Drupal\Core\Url;
use Drupal\calendar\Plugin\views\style\Calendar;
use Drupal\Core\Form\FormStateInterface;

/**
 * Decreto calendar views style plugin.
 *
 * Overriden views style plugin for the Calendar module.
 *
 * @ingroup views_style_plugins
 *
 * @ViewsStyle(
 *   id = "decreto_calendar",
 *   title = @Translation("Decreto Calendar"),
 *   help = @Translation("Present view results as a Decreto Calendar."),
 *   theme = "calendar_style",
 *   display_types = {"normal"},
 *   even_empty = TRUE
 * )
 */
class DecretoCalendar extends Calendar {
  
  /**
   * {@inheritdoc}
   */
  protected function defineOptions() {
    $options = parent::defineOptions();

    $options['granularity_links_custom_path'] = [
      'default' => [
        'day' => '',
        'week' => '',
      ],
    ];
    
    return $options;
  }

  /**
   * {@inheritdoc}
   */
  public function buildOptionsForm(&$form, FormStateInterface $form_state) {
    parent::buildOptionsForm($form, $form_state);
    $token = [
      '#theme' => 'item_list',
      '#items' => [
        '[decreto_calendar_date] Calendar date',
        '[decreto_calendar_date:custom:Ymd] Calendar date with custom format.',
      ],
    ];
    // Allow custom path for Day and Week links
    $form['granularity_links_custom_path'] = ['#tree' => TRUE];
    $form['granularity_links_custom_path']['day'] = [
      '#title' => $this->t('Day link path'),
      '#type' => 'textfield',
      '#default_value' => $this->options['granularity_links_custom_path']['day'],
      '#description' => $this->t("Specify internal path to be rendered in a day links. You can use following tokens: @list", [
        '@list' => \Drupal::service('renderer')->render($token),
      ]),
    ];
  }

  /**
   * {@inheritdoc}
   */
  public function validateOptionsForm(&$form, FormStateInterface $form_state) {
    parent::validateOptionsForm($form, $form_state);

    $day_path = $form_state->getValue(['style_options', 'granularity_links_custom_path', 'day']);
    if (UrlHelper::isExternal($day_path)) {
      $form_state->setErrorByName('style_options][granularity_links_custom_path][day', $this->t('Only internal paths allowed.'));
    }

    if (!UrlHelper::isValid($day_path, FALSE)
      || strpos($day_path, '/') !== 0) {
      $form_state->setErrorByName('style_options][granularity_links_custom_path][day', $this->t('Path is not valid.'));
    }
  }

  /**
   * {@inheritdoc}
   */
  public function calendarBuildDay() {
    $current_day_date = $this->currentDay->format(DATETIME_DATE_STORAGE_FORMAT);
    $has_events = FALSE;
    foreach ($this->items as $date => $day) {
      if ($date == $current_day_date) {
        $has_events = TRUE;
        break;
      }
    }

    $style_options = $this->view->getStyle()->options;
    // Using custom path for day link if it's present in style config.
    if (!empty($style_options['granularity_links_custom_path']['day'])) {
      $day_title = intval(substr($current_day_date, 8, 2));
      $content = [
        '#type' => 'container',
        '#attributes' => ['class' => ['mini-day-off']],
        'day' => ['#markup' => $day_title],
      ];
      $token = \Drupal::token();
      if ($has_events) {
        $content['day'] = [
          '#type' => 'link',
          '#url' => Url::fromUri('internal:' . $token->replace($style_options['granularity_links_custom_path']['day'], ['decreto_calendar_date' => $current_day_date])),
          '#title' => $day_title,
        ];
      }
      return $content;
    }
    
    return parent::calendarBuildDay();
  }

}
