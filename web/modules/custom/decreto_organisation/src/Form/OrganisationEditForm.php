<?php

namespace Drupal\decreto_organisation\Form;

/**
 * @file
 * Contains \Drupal\decreto_organisation\Form\OrganisationEditForm.
 */

use Drupal\Core\Entity\ContentEntityInterface;
use Drupal\Core\Form\FormStateInterface;
use Drupal\datetime\Plugin\Field\FieldType\DateTimeItemInterface;
use Drupal\decreto_content_modify\Form\AjaxFormBase;
use Drupal\decreto_organisation\Entity\DecretoOrganisation;
use Drupal\decreto_user\Entity\DecretoUser;
use Drupal\node\Entity\Node;
use Drupal\node\NodeInterface;
use Drupal\taxonomy\Entity\Term;
use Drupal\taxonomy\TermInterface;
use Drupal\user\Entity\User;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

/**
 * Organisation create or edit form.
 */
class OrganisationEditForm extends AjaxFormBase {
  /**
   * Returns the title for the form.
   *
   * @param \Drupal\node\NodeInterface $organisation
   *   Organisation node, can be null.
   *
   * @return \Drupal\Core\StringTranslation\TranslatableMarkup
   *   Title for the form.
   */
  public function getTitle(NodeInterface $organisation = NULL) {
    if ($organisation) {
      return $this->t('Edit organisation @label', ['@label' => $organisation->label()]);
    }
    else {
      return $this->t('Create organisation');
    }
  }

  /**
   * {@inheritdoc}
   */
  public function getFormId() {
    return 'decreto-organisation-edit-form';
  }

  /**
   * {@inheritdoc}
   */
  public function buildForm(array $form, FormStateInterface $form_state, ContentEntityInterface $organisation = NULL) {
    if ($organisation) {
      if ($organisation->bundle() != 'decreto_organisation') {
        throw new NotFoundHttpException();
      }
      $this->entity = $organisation;
      // Setting parent the as organisation, so that redirect happens to organisation page.
      $this->parent = $organisation;
    }

    // Adding help message.
    $form[] = \Drupal::service('decreto_help.message')->getMessageMarkup('organisation_create_edit_form');

    // Details.
    $form[] = [
      '#markup' => '<h4><strong>' . $this->t('Details') . '</strong></h4>',
    ];

    // Title.
    $form['title'] = [
      '#type' => 'textfield',
      '#placeholder' => $this->t('Title'),
      '#title' => $this->t('Title'),
      '#required' => TRUE,
    ];

    // Members START.
    $form[] = [
      '#markup' => '<h4><strong>' . $this->t('Members') . '</strong></h4>',
    ];
    $form['member-container'] = [
      '#type' => 'container',
      '#prefix' => '<div class="div-table">',
      '#suffix' => '</div>',
    ];
    $form['member-container']['header'] = [
      '#type' => 'container',
      '#attributes' => [
        'class' => ['row'],
      ],
      '#prefix' => '<div class="div-table__thead"><div class="div-table__tr">',
      '#suffix' => '</div></div>',
    ];
    $form['member-container']['header'][] = [
      '#type' => 'html_tag',
      '#tag' => 'div',
      '#value' => $this->t('First and last name'),
      '#attributes' => [
        'class' => ['div-table__th'],
      ],
      '#prefix' => '<div class="col-xs-8">',
      '#suffix' => '</div>',
    ];
    $form['member-container']['header'][] = [
      '#type' => 'html_tag',
      '#tag' => 'div',
      '#value' => $this->t('Attached'),
      '#attributes' => [
        'class' => ['div-table__th'],
      ],
      '#prefix' => '<div class="col-xs-4">',
      '#suffix' => '</div>',
    ];

    $users = [];
    $query = \Drupal::entityQuery('user')
      ->condition('status', 1);
    $users_ids = $query->execute();
    if (!empty($users_ids)) {
      $users = User::loadMultiple($users_ids);
    }

    if (!empty($users)) {
      $form['member-container']['members'] = [
        '#type' => 'container',
        '#tree' => TRUE,
        '#prefix' => '<div class="div-table__tbody">',
        '#suffix' => '</div>',
      ];

      foreach ($users as $user) {
        $user_id = $user->id();
        $form['member-container']['members'][$user_id] = [
          '#type' => 'container',
          '#attributes' => [
            'class' => ['row'],
          ],
          '#prefix' => '<div class="div-table__tr">',
          '#suffix' => '</div>',
        ];
        $form['member-container']['members'][$user_id]['name'] = [
          '#type' => 'html_tag',
          '#tag' => 'div',
          '#value' => $user->label(),
          '#attributes' => [
            'class' => ['div-table__td'],
          ],
          '#prefix' => '<div class="col-xs-8">',
          '#suffix' => '</div>',
        ];
        $form['member-container']['members'][$user_id]['attached'] = [
          '#type' => 'checkbox',
          '#prefix' => '<div class="col-xs-4"><div class="div-table__td">',
          '#suffix' => '</div></div>',
        ];
      }
    }
    // Members END.

    if ($organisation) {
      $form = $this->populateFormData($form, $form_state, $organisation);
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
   * @param \Drupal\node\NodeInterface $organisation
   *   Department term.
   *
   * @return array
   *   Form array with appended page.
   */
  public function populateFormData(array $form, FormStateInterface $form_state, NodeInterface $organisation) {
    $form['title']['#default_value'] = $organisation->getTitle();

    // Fill participants array based on user department attribute.
    $query = \Drupal::entityQuery('user')
      ->condition('status', 1)
      ->condition('field_decreto_usr_orgs', $this->entity->id(), 'IN');
    $users_ids = $query->execute();
    if (!empty($users_ids)) {
      foreach ($users_ids as $user_id) {
        $form['member-container']['members'][$user_id]['attached']['#default_value'] = TRUE;
      }
    }

    return $form;
  }

  /**
   * {@inheritdoc}
   */
  public function submitForm(array &$form, FormStateInterface $form_state) {
    $title = $form_state->getValue('title');

    if (!$this->entity) {
      $this->entity = Node::create([
        'type' => 'decreto_organisation',
        'status' => 1,
        'title' => $title,
      ]);

    }
    else {
      $this->entity->title = $title;
    }

    $this->entity->save();
    // Setting parent the as organisation, so that redirect happens to organisation page.
    $this->parent = $this->entity;

    $attached_users = [];

    // Grab the selected members.
    $members = $form_state->getValue('members');
    foreach ($members as $user_id => $member) {
      if ($member['attached']) {
        $attached_users[$user_id] = $user_id;
      }
    }

    // Find all members that are currently part of this organisation.
    $query = \Drupal::entityQuery('user')
      ->condition('status', 1)
      ->condition('field_decreto_usr_orgs', $this->entity->id(), 'IN');
    $users_ids = $query->execute();
    if (!empty($users_ids)) {
      foreach ($users_ids as $user_id) {
        if (in_array($user_id, $attached_users)) {
          // User is already attached to a department, remove from list.
          unset($attached_users[$user_id]);
        }
        else {
          // User is no longer present in organisation, detach organisation.
          $user = User::load($user_id);
          $decretoUser = new DecretoUser($user);
          $decretoUser->removeOrganisation($this->entity->id());

          // Remove from list.
          unset($attached_users[$user_id]);
        }
      }
    }

    // Attaching organisation to those users that are still in list - new members.
    if (!empty($attached_users)) {
      foreach ($attached_users as $attached_user) {
        $user = User::load($attached_user);
        $decretoUser = new DecretoUser($user);
        $decretoUser->addOrganisation($this->entity->id());
      }
    }
  }

}
