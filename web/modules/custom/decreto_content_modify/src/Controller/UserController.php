<?php

namespace Drupal\decreto_content_modify\Controller;

use Drupal\Core\Controller\ControllerBase;

class UserController extends ControllerBase {

  public function redirectToEditPage() {
    return $this->redirect('entity.user.edit_form', array('user' => \Drupal::currentUser()->id()));
  }
} 