<?php

namespace Drupal\decreto_notification\Controller;

use Drupal\Core\Controller\ControllerBase;
use Symfony\Component\HttpFoundation\Response;

/**
 * Decreto notification controller.
 */
class NotificationController extends ControllerBase {

  public function popupContentRender() {
    $markup = \Drupal::service('renderer')->render(views_embed_view('decreto_notifications', 'decreto_notification_popup_embed'));

    // This is the important part, because will render only the TWIG template.
    return new Response($markup);
  }

}