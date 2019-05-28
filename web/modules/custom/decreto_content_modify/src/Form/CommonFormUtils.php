<?php

namespace Drupal\decreto_content_modify\Form;

use Drupal\Core\Url;
use Drupal\node\Entity\Node;

class CommonFormUtils {
  public static function buildBulletPointsContainer($form, $bp_nids = NULL) {
    //printing BP container
    $form['bullet_points_container'] = [
      '#type' => 'container',
      '#attributes' => ['id' => 'js-bps-container'],
    ];

    $form['bullet_points_container']['bp_nids'] = [
      '#type' => 'hidden',
      '#default_value' => !empty($bp_nids)? implode(',', $bp_nids) : '',
      '#attributes' => ['id' => 'js-bp-nids'],
    ];

    foreach ($bp_nids as $bp_nid) {
      $form = self::buildSingleBulletPointContainer($form, $bp_nid);
    }

    return $form;
  }

  public static function buildSingleBulletPointContainer($form, $bp_nid = NULL, $expanded = FALSE) {
    $bullet_point = Node::load($bp_nid);

    $form['bullet_points_container']['bp_' . $bp_nid] = array(
      '#type' => 'container',
      '#attributes' => ['id' => "js-bp-$bp_nid-container"],
      '#theme' => 'node',
      '#view_mode' => 'teaser_ajax',
      '#node' => $bullet_point,
      '#expanded' => $expanded,
      'title' => array(
        '#label_display' => "hidden",
        '#field_name' => "title",
        '#field_type' => "string",
        '#entity_type' => "node",
        '#bundle' => "decreto_bullet_point",
        '0' => array(
          '#type' => "inline_template",
          '#template' => "{{ value|nl2br }}",
          '#context' => [
            'value' => $bullet_point->title->value,
          ]
        ),
        '#is_multiple' => FALSE,
      ),
      'field_decreto_bp_closed' => array(
        '#theme' => 'field',
        '#title' => 'Closed',
        '#field_type' => 'boolean',
        '#label_display' => 'hidden',
        '#field_name' => 'field_decreto_bp_closed',
        '#entity_type' => 'node',
        '#bundle' => 'decreto_bullet_point',
        '#is_multiple' => FALSE,
        '0' => array('#markup' => $bullet_point->get('field_decreto_bp_closed')->value),
      ),
    );

    // Bullet point attachments - START
    $form['bullet_points_container']['bp_' . $bp_nid]['bpas_container'] = [
      '#type' => 'container',
      '#attributes' => ['id' => "js-bp-$bp_nid-bpas-container"],
    ];

    foreach ($bullet_point->get('field_decreto_bp_bpas')->getValue() as $bpa_target) {
      $form = self::buildSingleBPA($form, $bp_nid, $bpa_target['target_id']);
    }

    $form['bullet_points_container']['bp_' . $bp_nid]['add_bpa'] = [
      '#title' => t('Add new bullet point attachment'),
      '#type' => 'link',
      '#url' => Url::fromRoute('decreto_content_modify.bpas_add', array('bullet_point' => $bullet_point->id())),
      '#attributes' => array(
        'class' => array('use-ajax'),
        'data-dialog-type' => 'modal',
      ),
    ];
    // Bullet point attachments - END

    return $form;
  }

  public static function buildSingleBPA($form, $bp_nid, $bpa_nid) {
    $bpa = Node::load($bpa_nid);

    $field_decreto_bpa_html = NULL;
    if ($bpa->field_decreto_bpa_html->entity) {
      $field_decreto_bpa_html = [
        '0' => [
          '#theme' => "decreto_pdf2htmlex_rendered_html_first_page_formatter",
          '#file' => $bpa->field_decreto_bpa_html->entity,
        ]
      ];
    }

    $form['bullet_points_container']['bp_' . $bp_nid]['bpas_container']['field_decreto_bp_bpas'][] = array(
      '#theme' => 'node',
      '#node' => $bpa,
      '#view_mode' => 'teaser_ajax',
      'title' => array(
        '#label_display' => "hidden",
        '#field_name' => "title",
        '#field_type' => "string",
        '#entity_type' => "node",
        '#bundle' => "decreto_bullet_point_attachment",
        '0' => array(
          '#type' => "inline_template",
          '#template' => "{{ value|nl2br }}",
          '#context' => [
            'value' => $bpa->title->value,
          ]
        ),
        '#is_multiple' => FALSE,
      ),
      'body' => array(
        '0' => array(
          '#type' => 'processed_text',
          '#text' => $bpa->body->value,
          '#format' => 'basic_html',
        ),
      ),
      'field_decreto_bpa_html' => $field_decreto_bpa_html,
    );

    return $form;
  }
}