<?php

namespace Drupal\decreto_user\Controller;

use Drupal\Core\Controller\ControllerBase;
use Drupal\Core\Render\RendererInterface;
use Drupal\decreto_help\HelpMessageService;
use Symfony\Component\DependencyInjection\ContainerInterface;

/**
 * Class DecretoUserController.
 */
class DecretoUserController extends ControllerBase {

  /**
   * Renderer interface.
   *
   * @var RendererInterface $renderer;
   */
  private $renderer;

  /**
   * Help message service object.
   *
   * @var HelpMessageService $helpMessageService;
   */
  private $helpMessageService;

  /**
   * DecretoUserController constructor.
   *
   * @param RendererInterface $renderer
   */
  public function __construct(RendererInterface $renderer, HelpMessageService $helpMessageService) {
    $this->renderer = $renderer;
    $this->helpMessageService = $helpMessageService;
  }

  /**
   * {@inheritdoc}
   */
  public static function create(ContainerInterface $container) {
    return new static(
      $container->get('renderer'),
      $container->get('decreto_help.message')
    );
  }

  /**
   * Search popup.
   *
   * @return array
   *   Return search popup render array.
   *
   * @throws
   */
  public function searchPopup() {
    $view = views_embed_view('user_search', 'users_list');
    return [
      '#theme' => 'decreto_user_search_popup',
      '#help_message' => $this->helpMessageService->getMessageMarkup('user_search_popup'),
      '#users_list' => $this->renderer->render($view),
    ];
  }

}
