<?php

namespace Drupal\decreto_organisation\Form;

use Drupal\Core\Entity\ContentEntityInterface;
use Drupal\Core\Form\FormStateInterface;
use Drupal\decreto_content_modify\Form\AjaxDeleteFormBase;
use Drupal\decreto_department\Entity\DecretoDepartment;
use Drupal\decreto_location\Entity\DecretoLocation;
use Drupal\decreto_organisation\Entity\DecretoOrganisation;

/**
 * Class OrganisationDeleteForm.
 *
 * @package Drupal\decreto_organisation\Form
 */
class OrganisationDeleteForm extends AjaxDeleteFormBase {

  /**
   * {@inheritdoc}
   */
  public function getFormId() {
    return 'decreto-organisation-delete-form';
  }

  /**
   * {@inheritdoc}
   */
  public function buildForm(array $form, FormStateInterface $form_state, ContentEntityInterface $organisation = NULL) {
    $decretoOrganisation = new DecretoOrganisation($organisation);

    $dependentEntities = [];

    // Adding departments.
    $departments = $decretoOrganisation->getDepartments();
    foreach ($departments as $department) {
      $dependentEntities[] = [
        'url' => $department->toUrl()->toString(),
        'label' => $department->label(),
      ];

      // Adding departments meetings.
      $decretoDepartment = new DecretoDepartment($department);
      $meetings = $decretoDepartment->getMeetings();
      foreach ($meetings as $meeting) {
        $dependentEntities[] = [
          'url' => $meeting->toUrl()->toString(),
          'label' => $meeting->label(),
        ];
      }
    }

    // Adding locations.
    $locations = $decretoOrganisation->getLocations();
    foreach ($locations as $location) {
      $dependentEntities[] = [
        'url' => $location->toUrl()->toString(),
        'label' => $location->label(),
      ];

      // Adding location meetings.
      $decretoLocation = new DecretoLocation($location);
      $meetings = $decretoLocation->getMeetings();
      foreach ($meetings as $meeting) {
        $dependentEntities[] = [
          'url' => $meeting->toUrl()->toString(),
          'label' => $meeting->label(),
        ];
      }
    }

    $form['#dependent_entities'] = $dependentEntities;

    return parent::buildForm($form, $form_state, $organisation);
  }

}
