<?php

namespace Drupal\decreto_content_modify\Form;

use Drupal\Core\Ajax\AjaxResponse;
use Drupal\Core\Ajax\AppendCommand;
use Drupal\Core\Ajax\CloseModalDialogCommand;
use Drupal\Core\Ajax\HtmlCommand;
use Drupal\Core\Ajax\InvokeCommand;
use Drupal\Core\Ajax\RedirectCommand;
use Drupal\Core\Form\FormBase;
use Drupal\Core\Form\FormStateInterface;
use Drupal\decreto_content_modify\Utils\DecretoContentModifyUtils;
use Drupal\node\Entity\Node;
use Drupal\node\NodeInterface;

/**
 * Implements the ModalForm form controller.
 *
 * This example demonstrates implementation of a form that is designed to be
 * used as a modal form.  To properly display the modal the link presented by
 * the \Drupal\fapi_example\Controller\Page page controller loads the Drupal
 * dialog and ajax libraries.  The submit handler in this class returns ajax
 * commands to replace text in the calling page after submission .
 *
 * @see \Drupal\Core\Form\FormBase
 */
class BulletPointEditForm extends FormBase {
  /**
   * Bullet point node.
   *
   * @var NodeInterface $bullet_point
   */
  protected $bullet_point;
  protected $isNew;

  /**
   * {@inheritdoc}
   */
  public function buildForm(array $form, FormStateInterface $form_state, NodeInterface $bullet_point = NULL) {
    if (empty($bullet_point) || $bullet_point->getType() != 'decreto_bullet_point') {
      return $form;
    }

    $this->bullet_point = $bullet_point;
    $form['#prefix'] = '<div id="decreto-content-modify-bp-edit-form">';
    $form['#suffix'] = '</div>';
    $form['title'] = [
      '#type' => 'textfield',
      '#placeholder' => $this->t('Title'),
      '#required' => TRUE,
      '#default_value' => $bullet_point->getTitle(),
    ];

    $form['closed'] = [
      '#type' => 'checkbox',
      '#title' => $this->t('Closed'),
      '#default_value' => $bullet_point->get('field_decreto_bp_closed')->value,
      '#prefix' => '<div class="form-inline form-item">',
    ];

    $form['personal'] = [
      '#type' => 'checkbox',
      '#title' => $this->t('Personal'),
      '#default_value' => $bullet_point->get('field_decreto_bp_personal')->value,
      '#suffix' => '</div>',
    ];

    // Group submit handlers in an actions element with a key of "actions" so
    // that it gets styled correctly, and so that other modules may add actions
    // to the form.
    $form['actions'] = [
      '#type' => 'actions',
    ];

    $form['actions']['submit'] = [
      '#type' => 'submit',
      '#value' => $this->t('Save'),
      '#ajax' => [
        'callback' => '::ajaxSubmitForm',
        'event' => 'click',
      ],
    ];

    return $form;
  }

  /**
   * {@inheritdoc}
   */
  public function getFormId() {
    return 'decreto-content-modify-bp-edit-form';
  }

  /**
   * {@inheritdoc}
   */
  public function submitForm(array &$form, FormStateInterface $form_state) {
    if (!empty($this->bullet_point)) {
      $this->bullet_point->title = $form_state->getValue('title');;
      $this->bullet_point->field_decreto_bp_closed = [
        'value' => $form_state->getValue('closed')
      ];
      $this->bullet_point->field_decreto_bp_personal = [
        'value' => $form_state->getValue('personal')
      ];
      $this->bullet_point->save();
    }
  }

  /**
   * Implements the sumbit handler for the ajax call.
   *
   * @param array $form
   *   Render array representing from.
   * @param \Drupal\Core\Form\FormStateInterface $form_state
   *   Current form state.
   *
   * @return \Drupal\Core\Ajax\AjaxResponse
   *   Array of ajax commands to execute on submit of the modal form.
   *
   * @throws
   */
  public function ajaxSubmitForm(array &$form, FormStateInterface $form_state) {
    $response = new AjaxResponse();
    if ($form_state->getErrors()) {
      unset($form['#prefix']);
      unset($form['#suffix']);
      $form['status_messages'] = [
        '#type' => 'status_messages',
        '#weight' => -10,
      ];
      $response->addCommand(new HtmlCommand('#decreto-content-modify-bp-edit-form', $form));
    }
    else {
      $response->addCommand(new CloseModalDialogCommand());
      /** @var NodeInterface $meeting */
      $meeting = DecretoContentModifyUtils::getRelatedNodes($this->bullet_point, 'decreto_meeting');
      if (!empty($meeting)) {
        $response->addCommand(new RedirectCommand($meeting->toUrl()->toString()));
      }
    }

    return $response;
  }
}


