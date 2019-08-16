<?php

namespace Drupal\decreto_content_modify\Form;

use Drupal\Core\Ajax\AjaxResponse;
use Drupal\Core\Ajax\RedirectCommand;
use Drupal\Core\Ajax\ReplaceCommand;
use Drupal\Core\Form\FormBase;
use Drupal\Core\Form\FormStateInterface;
use Drupal\decreto_content_modify\Entity\DecretoBulletPoint;
use Drupal\decreto_content_modify\Entity\DecretoMeeting;
use Drupal\node\Entity\Node;
use Drupal\node\NodeInterface;

/**
 * Provides bullet_points overview form for a taxonomy vocabulary.
 *
 * @internal
 */
class MeetingItemsReorderForm extends FormBase {

  protected $meeting;

  /**
   * {@inheritdoc}
   */
  public function getFormId() {
    return 'decreto-content-modify-meeting-bp-reorder';
  }

  /**
   * Form constructor.
   *
   * Display a tree of all the bullet point and bullet point attachments, with
   * options to reorder elements.
   *
   * @param array $form
   *   An associative array containing the structure of the form.
   * @param \Drupal\Core\Form\FormStateInterface $form_state
   *   The current state of the form.
   * @param \Drupal\node\NodeInterface $meeting
   *   The active meeting.
   *
   * @return array
   *   The form structure.
   *
   * @throws \Drupal\Core\Entity\Exception\UnsupportedEntityTypeDefinitionException
   */
  public function buildForm(array $form, FormStateInterface $form_state, NodeInterface $meeting = NULL) {
    $form['#prefix'] = '<div id="' . $this->getFormId() . '">';
    $form['#suffix'] = '</div>';

    $this->meeting = $meeting;

    $form['items'] = [
      '#type' => 'table',
      '#empty' => $this->t('No items available.'),
      '#header' => [
        'bp' => $this->t('Name'),
        'weight' => $this->t('Weight'),
      ],
      '#attributes' => [
        'id' => 'meeting-items',
      ],
    ];

    $decretoMeeting = new DecretoMeeting($meeting);

    // Composing item list or bullet point and bullet point attachments.
    $items = [];
    foreach ($decretoMeeting->getBulletPoints() as $bp) {
      $bp->depth = 0;
      $bp->parent = 0;

      $items[] = $bp;
      $decretoBP = new DecretoBulletPoint($bp);
      foreach ($decretoBP->getBulletPointAttachments() as $bpa) {
        $bpa->depth = 1;
        $bpa->parent = $bp->id();
        $items[] = $bpa;
      }
    }

    // If this form was already submitted once, it's probably hit a validation
    // error. Ensure the form is rebuilt in the same order as the user
    // submitted.
    $user_input = $form_state->getUserInput();
    if (!empty($user_input) && isset($user_input['items'])) {
      $newItems = [];
      foreach ($user_input['items'] as $key => $userInputItem) {
        $items[$key]->parent = $userInputItem['node']['parent'];
        $items[$key]->depth = $userInputItem['node']['depth'];
        $items[$key]->weight = $userInputItem['weight'];
        $newItems[$key] = $items[$key];
      }

      $items = $newItems;
    }

    // Creating table - START.
    foreach ($items as $key => $item) {
      $form['items'][$key] = [
        'node' => [],
        'weight' => [],
      ];

      $indentation = [];
      if ($item->depth) {
        $indentation = [
          '#theme' => 'indentation',
          '#size' => $item->depth,
        ];
      }
      $form['items'][$key]['node'] = [
        '#prefix' => !empty($indentation) ? \Drupal::service('renderer')->render($indentation) : '',
        '#type' => 'markup',
        '#markup' => $item->label(),
      ];

      if (count($items) > 1) {
        $form['items'][$key]['node']['nid'] = [
          '#type' => 'hidden',
          '#value' => $item->id(),
          '#attributes' => [
            'class' => ['node-id'],
          ],
        ];

        $form['items'][$key]['node']['parent'] = [
          '#type' => 'hidden',
          // Yes, default_value on a hidden. It needs to be changeable by the
          // javascript.
          '#default_value' => $item->parent,
          '#attributes' => [
            'class' => ['node-parent'],
          ],
        ];

        $form['items'][$key]['node']['depth'] = [
          '#type' => 'hidden',
          // Same as above, the depth is modified by javascript, so it's a
          // default_value.
          '#default_value' => $item->depth,
          '#attributes' => [
            'class' => ['node-depth'],
          ],
        ];

        $form['items'][$key]['node']['type'] = [
          '#type' => 'hidden',
          '#default_value' => $item->getType(),
        ];
      }

      $form['items'][$key]['weight'] = [
        '#type' => 'weight',
        '#delta' => count($items),
        '#title' => $this->t('Weight for added node'),
        '#title_display' => 'invisible',
        '#default_value' => isset($item->weight) ? $item->weight : $key,
        '#attributes' => ['class' => ['node-weight']],
      ];
      $form['items'][$key]['#attributes']['class'] = [];
      $form['items'][$key]['#attributes']['class'][] = 'draggable';

      // Making sure the item has proper behaviour - either root of leaf.
      if ($item->getType() == 'decreto_bullet_point') {
        $form['items'][$key]['#attributes']['class'][] = 'tabledrag-root';
      }
      else {
        $form['items'][$key]['#attributes']['class'][] = 'tabledrag-leaf';
      }
    }
    // Creating table - END.

    $form['items']['#tabledrag'][] = [
      'action' => 'match',
      'relationship' => 'parent',
      'group' => 'node-parent',
      'subgroup' => 'node-parent',
      'source' => 'node-id',
      'hidden' => FALSE,
    ];
    $form['items']['#tabledrag'][] = [
      'action' => 'depth',
      'relationship' => 'group',
      'group' => 'node-depth',
      'hidden' => FALSE,
    ];
    $form['items']['#tabledrag'][] = [
      'action' => 'order',
      'relationship' => 'sibling',
      'group' => 'node-weight',
    ];

    if (count($items) > 1) {
      $form['actions'] = ['#type' => 'actions', '#tree' => FALSE];
      $form['actions']['submit'] = [
        '#type' => 'submit',
        '#value' => $this->t('Save'),
        '#button_type' => 'primary',
        '#ajax' => [
          'callback' => '::ajaxSubmitForm',
          'event' => 'click',
        ],
      ];
      $form['actions']['reset'] = [
        '#type' => 'submit',
        '#submit' => ['::submitReset'],
        '#value' => $this->t('Reset'),
        '#limit_validation_errors' => [],
      ];
    }

    return $form;
  }

  /**
   * {@inheritdoc}
   */
  public function validateForm(array &$form, FormStateInterface $form_state) {
    // Getting values.
    $items = $form_state->getValue('items');

    // Setting the error, if any bullet point attachments are set as root
    // elements.
    foreach ($items as $key => $item) {
      if ($item['node']['type'] == 'decreto_bullet_point_attachment') {
        if (!$item['node']['parent']) {
          $form_state->setError($form['items'][$key], $this->t('Bullet point attachment must have parent bullet point'));
          $form['items'][$key]['#attributes']['class'][] = 'danger';
        }
      }
    }
    parent::validateForm($form, $form_state);
  }

  /**
   * Form submission handler.
   *
   * Reorders the bullet point on the meeting, also handles reordering and
   * relocating of bullet point attachments per bullet point.
   *
   * @param array $form
   *   An associative array containing the structure of the form.
   * @param \Drupal\Core\Form\FormStateInterface $form_state
   *   The current state of the form.
   *
   * @throws \Drupal\Core\Entity\EntityStorageException
   * @throws \Drupal\Core\Entity\Exception\UnsupportedEntityTypeDefinitionException
   */
  public function submitForm(array &$form, FormStateInterface $form_state) {
    // Getting value.
    $items = $form_state->getValue('items');
    $bulletPoints = [];
    $bulletPointBpas = [];
    foreach ($items as $item) {
      if ($item['node']['type'] == 'decreto_bullet_point') {
        $bulletPoints[] = $item;
        $bulletPointBpas[$item['node']['nid']] = [];
      }
      else {
        $bulletPointBpas[$item['node']['parent']][] = $item;
      }
    }

    // Sort Bullet points based on weight.
    uasort($bulletPoints, ['Drupal\Component\Utility\SortArray', 'sortByWeightElement']);

    $bulletPointsOrder = [];
    foreach ($bulletPoints as $bpDraggable) {
      $bulletPointsOrder[] = $bpDraggable['node']['nid'];
    }

    // Updating meeting with reordered bullet points list.
    $decretoMeeting = new DecretoMeeting($this->meeting);
    $decretoMeeting->reorderBulletPoints($bulletPointsOrder);

    foreach ($bulletPointBpas as $bpId => $bulletPointAttachments) {
      // Sort Bullet point attachments based on weight.
      uasort($bulletPointAttachments, ['Drupal\Component\Utility\SortArray', 'sortByWeightElement']);

      // Updating bullet point with reordered bullet points attachments list.
      $decretoBP = new DecretoBulletPoint(Node::load($bpId));
      $decretoBP->getEntity()->set('field_decreto_bp_bpas', []);
      foreach ($bulletPointAttachments as $bpaDraggable) {
        $decretoBP->addBulletPointAttachment($bpaDraggable['node']['nid'], FALSE);
      }

      $decretoBP->save();
    }
  }

  /**
   * Redirects to confirmation form for the reset action.
   *
   * @param array $form
   *   Render array representing from.
   * @param \Drupal\Core\Form\FormStateInterface $form_state
   *   Current form state.
   */
  public function submitReset(array &$form, FormStateInterface $form_state) {
    $form_state->setRedirectUrl($this->meeting->toUrl());
  }

  /**
   * Implements the submit handler for the ajax call.
   *
   * @param array $form
   *   Render array representing from.
   * @param \Drupal\Core\Form\FormStateInterface $form_state
   *   Current form state.
   *
   * @return \Drupal\Core\Ajax\AjaxResponse
   *   Array of ajax commands to execute on submit of the modal form.
   */
  public function ajaxSubmitForm(array &$form, FormStateInterface $form_state) {
    $response = new AjaxResponse();

    if ($form_state->getErrors()) {
      // Replacing form to show errors.
      $form['status_messages'] = [
        '#type' => 'status_messages',
        '#weight' => -10,
      ];
      $response->addCommand(new ReplaceCommand('#' . $this->getFormId(), $form));
    }
    else {
      // Closing modal and redirecting to meeting URL.
      $response->addCommand(new RedirectCommand($this->meeting->toUrl()->toString()));
    }

    return $response;
  }

}
