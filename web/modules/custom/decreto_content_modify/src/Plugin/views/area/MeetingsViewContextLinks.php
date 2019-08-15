<?php

namespace Drupal\decreto_content_modify\Plugin\views\area;

use Drupal\views\Plugin\views\area\AreaPluginBase;

/**
 * Render context links for meeting views.
 *
 * @ingroup views_area_handlers
 *
 * @ViewsArea("decreto_content_modify_meetings_view_context_links")
 */
class MeetingsViewContextLinks extends AreaPluginBase {

  /**
   * {@inheritdoc}
   */
  public function render($empty = FALSE) {
    return [
      '#theme' => 'decreto_content_modify_meetings_view_context_links',
    ];
  }

}
