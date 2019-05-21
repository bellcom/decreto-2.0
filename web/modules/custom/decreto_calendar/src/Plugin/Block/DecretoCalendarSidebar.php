<?php

namespace Drupal\decreto_calendar\Plugin\Block;

use Drupal\Core\Block\BlockBase;
use Drupal\Core\Block\BlockPluginInterface;

/**
 * Provides Decreto calendar block.
 * @Block(
 *   id = "decreto_calendar_sidebar",
 *   admin_label = @Translation("Decreto Calendar sidebar block"),
 * )
 */
class DecretoCalendarSidebar extends BlockBase implements BlockPluginInterface {

  /**
   * {@inheritdoc}
   */
  public function build() {
    $config = $this->getConfiguration();
    $block = views_embed_view('decreto_calender', 'calendar_block');

    return $block;
  }
}
