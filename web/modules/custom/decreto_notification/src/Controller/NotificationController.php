<?php

namespace Drupal\decreto_notification\Controller;

use Drupal\Core\Controller\ControllerBase;
use Drupal\decreto_notification\Entity\Notification;
use Symfony\Component\HttpFoundation\RedirectResponse;
use Symfony\Component\HttpFoundation\Response;

/**
 * Decreto notification controller.
 */
class NotificationController extends ControllerBase {

  /**
   * Renders "decreto_notification_popup_embed" display of "decreto_notifications" view and
   * returns the result.
   *
   * @return Response
   *   Rendered view.
   */
  public function popupContentRender() {
    $view = views_embed_view('decreto_notifications', 'decreto_notification_popup_embed');
    $markup = \Drupal::service('renderer')->render($view);

    // This is the important part, because will render only the TWIG template.
    return new Response($markup);
  }

  /**
   * Notification resolver.
   *
   * Loads referenced entity and redirect to it.
   *
   * @param Notification $decreto_notification
   *   Decreto notification entity.
   *
   * @return RedirectResponse
   *   Redirect response.
   *
   * @throws
   */
  public function resolve(Notification $decreto_notification) {
    if ($decreto_notification->unread) {
      $decreto_notification->unread = 0;
      $decreto_notification->save();
    }

    // Loading referenced entity.
    // Has to be improved to Notification::getReferencedEntity() method.
    $referenced_entity = $decreto_notification->getMeeting();
    $response = new RedirectResponse($referenced_entity->toUrl()->toString());
    return $response;
  }

}
