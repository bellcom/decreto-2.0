<?php

namespace Drupal\decreto_organisation\Controller;

use Drupal\Core\Controller\ControllerBase;
use Symfony\Component\HttpFoundation\Response;

/**
 * Decreto organisation controller.
 */
class OrganisationController extends ControllerBase {

  /**
   * Renders view display.
   *
   * Renders "decreto_organisation_popup_embed" display of "
   * decreto_organisations" view and returns the result.
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

}
