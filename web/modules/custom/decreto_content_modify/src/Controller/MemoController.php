<?php

namespace Drupal\decreto_content_modify\Controller;

use Drupal\Core\Controller\ControllerBase;
use Symfony\Component\HttpFoundation\Response;

/**
 * Decreto memo controller.
 */
class MemoController extends ControllerBase {

  /**
   * Renders "decreto_memo_popup_embed" display of "decreto_memos" view and
   * returns the result.
   *
   * @return Response
   *   Rendered view.
   */
  public function popupContentRender() {
    $markup = \Drupal::service('renderer')->render(views_embed_view('decreto_memos', 'decreto_memo_popup_embed'));

    // This is the important part, because will render only the TWIG template.
    return new Response($markup);
  }

}