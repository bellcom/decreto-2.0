<?php

namespace Drupal\decreto_department\Form;

/**
 * @file
 * Contains \Drupal\decreto_department\Form\DepartmentUserAddForm.
 */

use Drupal\Core\Entity\ContentEntityInterface;
use Drupal\Core\Form\FormStateInterface;
use Drupal\decreto_user\Form\UserEditForm;

/**
 * Department user create form.
 */
class DepartmentUserAddForm extends UserEditForm {

  /**
   * {@inheritdoc}
   */
  public function getFormId() {
    return 'decreto-department-user-add-form';
  }

  /**
   * {@inheritdoc}
   */
  public function buildForm(array $form, FormStateInterface $form_state, ContentEntityInterface $department = NULL, ContentEntityInterface $user = NULL) {
    $form = parent::buildForm($form, $form_state);
    $form['departments']['#default_value'] = [$department->id() => $department->id()];

    // Setting parent the as department, so that redirect happens to department
    // page.
    $this->parent = $department;

    return $form;
  }

}
