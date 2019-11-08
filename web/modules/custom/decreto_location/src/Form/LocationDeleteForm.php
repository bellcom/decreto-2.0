<?php

namespace Drupal\decreto_location\Form;

use Drupal\Core\Entity\ContentEntityInterface;
use Drupal\Core\Form\FormStateInterface;
use Drupal\decreto_content_modify\Form\AjaxDeleteFormBase;
use Drupal\decreto_location\Entity\DecretoLocation;

/**
 * Class LocationDeleteForm.
 *
 * @package Drupal\decreto_department\Form
 */
class LocationDeleteForm extends AjaxDeleteFormBase {

  /**
   * {@inheritdoc}
   */
  public function getFormId() {
    return 'decreto-location-delete-form';
  }

  /**
   * {@inheritdoc}
   */
  public function buildForm(array $form, FormStateInterface $form_state, ContentEntityInterface $location = NULL) {
    $decretoLocation = new DecretoLocation($location);
    $meetings = $decretoLocation->getMeetings();

    $dependentEntities = [];
    foreach ($meetings as $meeting) {
      $dependentEntities[] = [
        'url' => $meeting->toUrl()->toString(),
        'label' => $meeting->label(),
      ];
    }

    $form['#dependent_entities'] = $dependentEntities;

    return parent::buildForm($form, $form_state, $location);
  }

}
