<?php

namespace Drupal\decreto_location\Form;

/**
 * @file
 * Contains \Drupal\decreto_location\Form\LocationEditForm.
 */

use Drupal\Core\Entity\ContentEntityInterface;
use Drupal\Core\Form\FormStateInterface;
use Drupal\decreto_content_modify\Form\AjaxFormBase;
use Drupal\decreto_location\Entity\DecretoLocation;
use Drupal\decreto_organisation\Entity\DecretoOrganisation;
use Drupal\decreto_user\Entity\DecretoUser;
use Drupal\node\Entity\Node;
use Drupal\taxonomy\Entity\Term;
use Drupal\taxonomy\TermInterface;
use Drupal\user\Entity\User;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

/**
 * Location create or edit form.
 */
class LocationEditForm extends AjaxFormBase {

  /**
   * Returns the title for the form.
   *
   * @param \Drupal\taxonomy\TermInterface $location
   *   Location term, can be null.
   *
   * @return \Drupal\Core\StringTranslation\TranslatableMarkup
   *   Title for the form.
   */
  public function getTitle(TermInterface $location = NULL) {
    if ($location) {
      return $this->t('Edit location @label', ['@label' => $location->label()]);
    }
    else {
      return $this->t('Create location');
    }
  }

  /**
   * {@inheritdoc}
   */
  public function getFormId() {
    return 'decreto-location-edit-form';
  }

  /**
   * {@inheritdoc}
   */
  public function buildForm(array $form, FormStateInterface $form_state, ContentEntityInterface $location = NULL) {
    if ($location) {
      if ($location->bundle() != 'decreto_tax_location') {
        throw new NotFoundHttpException();
      }
      $this->entity = $location;
      // Setting parent the as location, so that redirect happens to location
      // page.
      $this->parent = $location;
    }

    // Adding help message.
    $form[] = \Drupal::service('decreto_help.message')->getMessageMarkup('location_create_edit_form');

    // Details.
    $form[] = [
      '#markup' => '<h4><strong>' . $this->t('Details') . '</strong></h4>',
    ];

    // Name.
    $form['name'] = [
      '#type' => 'textfield',
      '#placeholder' => $this->t('Name'),
      '#title' => $this->t('Name'),
      '#required' => TRUE,
    ];

    // Organisation.
    $organisationNids = \Drupal::entityQuery('node')
      ->condition('status', 1)
      ->condition('type', 'decreto_organisation')
      ->execute();
    $organisations = Node::loadMultiple($organisationNids);
    $organisationsList = [];
    foreach ($organisations as $organisation) {
      $organisationsList[$organisation->id()] = $organisation->getTitle();
    }

    $form['organisation'] = [
      '#type' => 'select',
      '#title' => $this->t('Name'),
      '#required' => TRUE,
      '#options' => $organisationsList
    ];

    if ($location) {
      $form = $this->populateFormData($form, $form_state, $location);
    }

    $form = parent::buildForm($form, $form_state);

    return $form;
  }

  /**
   * Populates meeting form with data from real meeting.
   *
   * @param array $form
   *   Render array representing from.
   * @param \Drupal\Core\Form\FormStateInterface $form_state
   *   Current form state.
   * @param \Drupal\taxonomy\TermInterface $location
   *   Location term.
   *
   * @return array
   *   Form array with appended page.
   *
   * @throws \Drupal\Core\TypedData\Exception\MissingDataException
   */
  public function populateFormData(array $form, FormStateInterface $form_state, TermInterface $location) {
    $form['name']['#default_value'] = $location->getName();
    $decretoLocation = new DecretoLocation($location);
    $form['organisation']['#default_value'] = $decretoLocation->getOrganisation(FALSE);
    $form['organisation']['#attributes'] = ['disabled' => 'disabled'];

    return $form;
  }

  /**
   * {@inheritdoc}
   */
  public function submitForm(array &$form, FormStateInterface $form_state) {
    $name = $form_state->getValue('name');
    $currentOrganisationId = \Drupal::service('decreto_organisation.organisation')->getSelectedOrganisation(FALSE);

    if (!$this->entity) {
      $this->entity = Term::create([
        'vid' => 'decreto_tax_location',
        'name' => $name,
        'field_decreto_loc_org' => ['target_id' => $currentOrganisationId],
      ]);
    }
    else {
      $this->entity->name = $name;
    }

    $this->entity->save();
    // Setting parent the as location, so that redirect happens to location
    // page.
    $this->parent = $this->entity;
  }

}
