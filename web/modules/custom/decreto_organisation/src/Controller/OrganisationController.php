<?php

namespace Drupal\decreto_organisation\Controller;

use Drupal\Core\Cache\Cache;
use Drupal\Core\Controller\ControllerBase;
use Drupal\Core\Url;
use Drupal\decreto_content_modify\Services\ContentService;
use Drupal\decreto_department\Services\DepartmentService;
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
    $organisationId = $decreto_organisation->id();
    \Drupal::service('decreto_organisation.organisation')->setSelectedOrganisation($organisationId);

    // Invalidating user tags.
    Cache::invalidateTags(array('user:' . \Drupal::currentUser()->id()));

    // Invalidating meeting tags.
    Cache::invalidateTags([ContentService::CACHE_ID_DECRETO_MEETING_COUNTERS]);

    // Invalidating memo tags.
    Cache::invalidateTags([ContentService::CACHE_ID_DECRETO_MEMO_COUNTERS]);

    // Invalidating department tags.
    Cache::invalidateTags([DepartmentService::CACHE_ID_DECRETO_DEPARTMENT_COUNTERS]);

    $url = Url::fromRoute('<front>');
    $response = new RedirectResponse($url->toString());

    return $response;
  }

}
