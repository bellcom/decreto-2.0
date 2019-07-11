<?php

namespace Drupal\decreto_content_modify\Form;

use Drupal\Core\Ajax\AjaxResponse;
use Drupal\Core\Ajax\AppendCommand;
use Drupal\Core\Ajax\CloseModalDialogCommand;
use Drupal\Core\Ajax\HtmlCommand;
use Drupal\Core\Ajax\InvokeCommand;
use Drupal\Core\Form\FormBase;
use Drupal\Core\Form\FormStateInterface;
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
  protected $node;
  protected $isNew;

  /**
   * {@inheritdoc}
   */
  public function buildForm(array $form, FormStateInterface $form_state, NodeInterface $node = NULL) {
    $this->node = $node;

    $form['#attached']['library'][] = 'decreto_content_modify/meeting-edit';

    $form['#prefix'] = '<div id="decreto-content-modify-bp-edit-form">';
    $form['#suffix'] = '</div>';
    $form['title'] = [
      '#type' => 'textfield',
      '#placeholder' => $this->t('Title'),
      '#required' => TRUE,
    ];

    $form['closed'] = [
      '#type' => 'checkbox',
      '#title' => $this->t('Closed'),
    ];

    // Group submit handlers in an actions element with a key of "actions" so
    // that it gets styled correctly, and so that other modules may add actions
    // to the form.
    $form['actions'] = [
      '#type' => 'actions',
    ];

    // Add a submit button that handles the submission of the form.
    $form['actions']['submit'] = [
      '#type' => 'submit',
      '#value' => $this->t('Save'),
      '#ajax' => [
        'callback' => '::ajaxSubmitForm',
        'event' => 'click',
      ],
    ];

    //loading node values
    if ($node) {
      $form['title']['#default_value'] = $node->getTitle();
      $form['closed']['#default_value'] = $node->get('field_decreto_bp_closed')->value;
    }

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
    $title = $form_state->getValue('title');
    $closed = $form_state->getValue('closed');

    if (!$this->node) {
      $this->node = Node::create(array(
        'type' => 'decreto_bullet_point',
        'title' => $title,
        'status' => 1,
        'field_decreto_bp_closed' => [
          'value' => $closed,
        ]
      ));
    }
    else {
      $node = $this->node;
      $this->node->title = $title;
      $this->node->field_decreto_bp_closed = [
        'value' => $closed
      ];
    }

    $this->isNew = $this->node->save();
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
   */
  public function ajaxSubmitForm(array &$form, FormStateInterface $form_state) {
    // We begin building a new ajax reponse.
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
      $nid = $this->node->id();
      $render_bullet_point = CommonFormUtils::buildSingleBulletPointContainer(array(), $nid, FALSE);

      //is new
      if ($this->isNew == SAVED_NEW) {
        $response->addCommand(new AppendCommand('#js-bps-container', $render_bullet_point));
        $response->addCommand(new InvokeCommand('#js-bp-nids', 'appendValue', array($nid)));
      }
      else {
        $response->addCommand(new HtmlCommand("#js-bp-$nid-container", $render_bullet_point));
      }

      $response->addCommand(new CloseModalDialogCommand());
    }

    // @TODO Add redirect action.
    return $response;
  }
}


