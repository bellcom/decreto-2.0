<?php

namespace Drupal\decreto_organisation\Controller;

use Drupal\Core\Cache\Cache;
use Drupal\Core\Controller\ControllerBase;
use Drupal\Core\Url;
use Drupal\node\NodeInterface;
use Symfony\Component\HttpFoundation\RedirectResponse;
use Symfony\Component\HttpFoundation\Response;

/**
 * Decreto organisation controller.
 */
class OrganisationController extends ControllerBase {

  /**
   * Renders view display.
   *
   * Renders "decreto_organisation_popup_embed" display of
   * "decreto_organisations" view and returns the result.
   *
   * @return \Symfony\Component\HttpFoundation\Response
   *   Rendered view result.
   */
  public function popupContentRender() {
    $view_embed = views_embed_view('decreto_organisations', 'decreto_organisation_popup_embed');
    $markup = \Drupal::service('renderer')->render($view_embed);

    // This is the important part, because will render only the TWIG template.
    return new Response($markup);
  }

  /**
   * Switching user selected organisation.
   *
   * @param \Drupal\node\NodeInterface $decreto_organisation
   *   New selected organisation.
   *
   * @return \Symfony\Component\HttpFoundation\RedirectResponse
   *   Redirect to the front page.
   */
  public function switchOrganisation(NodeInterface $decreto_organisation) {
    $tempstore = \Drupal::service('user.private_tempstore')->get('decreto_organisation');
    $tempstore->set('selected_organisation', $decreto_organisation->id());

    // Invalidating user tags.
    Cache::invalidateTags(array('user:' . \Drupal::currentUser()->id()));

    $url = Url::fromRoute('<front>');
    $response = new RedirectResponse($url->toString());

    return $response;
  }

}
