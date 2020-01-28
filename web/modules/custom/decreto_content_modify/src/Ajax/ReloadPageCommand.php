<?php

namespace Drupal\decreto_content_modify\Ajax;

use Drupal\Core\Ajax\CommandInterface;

/**
 * Class ReloadPageCommand.
 */
class ReloadPageCommand implements CommandInterface {

  /**
   * Render custom ajax command.
   *
   * @return ajax
   *   Command function.
   */
  public function render() {
    return [
      'command' => 'reloadPage',
      'message' => 'Reload page',
    ];
  }

}
