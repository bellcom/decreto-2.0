<?php

namespace Drupal\front_page;

use Drupal\Core\PathProcessor\OutboundPathProcessorInterface;
use Drupal\Core\Render\BubbleableMetadata;
use Symfony\Component\HttpFoundation\Request;

class FrontPagePathProcessor implements OutboundPathProcessorInterface {

  /**
   * {@inheritdoc}
   */
  public function processOutbound($path, &$options = array(), Request $request = NULL, BubbleableMetadata $bubbleable_metadata = NULL) {
    if ($path == '/main') {
      $path = '';
    }
    $config  = \Drupal::config('front_page.settings');
    $new_path = $config->get('home_link_path', '');
    if (($path === '/<front>' || empty($path)) && !empty($new_path)) {
      $path = '/' . $new_path;
    }
    return $path;
  }

}
?>