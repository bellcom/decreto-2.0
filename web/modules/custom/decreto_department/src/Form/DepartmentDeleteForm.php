<?php

namespace Drupal\decreto_department\Form;

use Drupal\Core\Entity\ContentEntityInterface;
use Drupal\Core\Form\FormStateInterface;
use Drupal\decreto_content_modify\Form\AjaxDeleteFormBase;
use Drupal\decreto_department\Entity\DecretoDepartment;

/**
 * Class DepartmentDeleteForm.
 *
 * @package Drupal\decreto_department\Form
 */
class DepartmentDeleteForm extends AjaxDeleteFormBase {

  /**
   * {@inheritdoc}
   */
  public function getFormId() {
    return 'decreto-department-delete-form';
  }

  /**
   * {@inheritdoc}
   */
  public function buildForm(array $form, FormStateInterface $form_state, ContentEntityInterface $department = NULL) {
    // Setting parent the as department, so that redirect happens to main page.
    $this->parent = NULL;

    $decretoDepartment = new DecretoDepartment($department);
    $meetings = $decretoDepartment->getMeetings();

    $dependentEntities = [];
    foreach ($meetings as $meeting) {
      $dependentEntities[] = [
        'url' => $meeting->toUrl()->toString(),
        'label' => $meeting->label(),
      ];
    }

    $form['#dependent_entities'] = $dependentEntities;

    return parent::buildForm($form, $form_state, $department);
  }

}
