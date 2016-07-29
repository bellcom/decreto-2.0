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
      '#value' => implode(',', $bp_nids),
      '#attributes' => ['id' => 'js-bp-nids'],
    ];

    foreach ($bp_nids as $bp_nid) {
      $form = self::buildSingleBulletPointContainer($form, $bp_nid);
    }

    return $form;
  }

  public static function buildSingleBulletPointContainer($form, $bp_nid = null) {
    $bullet_point = Node::load($bp_nid);

    $form['bullet_points_container']['bp_' . $bp_nid] = array(
      '#type' => 'container',
      '#attributes' => ['id' => "js-bp-$bp_nid-container"],
      '#label' => $bullet_point->title->value,
      '#theme' => 'decreto_content_modify_bullet_point',
      '#node' => $bullet_point,
      '#content' => array(
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
        'field_decreto_bp_bpas' => array(
          '#theme' => 'field',
          '#title' => 'Bullet point attachments',
          '#field_type' => 'entity_reference',
          '#label_display' => "hidden",
          '#field_name' => 'field_decreto_bp_bpas',
          '#entity_type' => 'node',
          '#bundle' => 'decreto_bullet_point',
          '#is_multiple' => TRUE
        ),
      ),
    );

    if (\Drupal::moduleHandler()->moduleExists('decreto_context_menu')) {
      $form['bullet_points_container']['bp_' . $bp_nid]['#decreto_context_menu'] = decreto_context_menu_get_menu($bullet_point, 'teaser_ajax');
    }

    $bpa_counter = 0;
    foreach ($bullet_point->get('field_decreto_bp_bpas')->getValue() as $bpa_target) {
      $bpa = Node::load($bpa_target['target_id']);
      $form['bullet_points_container']['bp_' . $bp_nid]['#content']['field_decreto_bp_bpas'][$bpa_counter] = array(
        '#theme' => 'node',
        '#node' => $bpa,
        '#view_mode' => 'teaser',
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
        )
      );

      if ($bpa->field_decreto_bpa_html->entity) {
        $form['bullet_points_container']['bp_' . $bp_nid]['#content']['field_decreto_bp_bpas'][$bpa_counter]['field_decreto_bpa_html'] = array(
          '0' => array(
            '#theme' => "decreto_pdf2htmlex_rendered_html_first_page_formatter",
            '#file' => $bpa->field_decreto_bpa_html->entity,
          )
        );
      }
      $bpa_counter++;
    }

    return $form;
  }
}