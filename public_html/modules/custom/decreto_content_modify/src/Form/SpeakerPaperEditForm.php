<?php

namespace Drupal\decreto_content_modify\Form;

use Drupal\node\Entity\Node;
use Drupal\node\NodeInterface;
use Drupal\Core\Form\FormBase;
use Drupal\Core\Form\FormStateInterface;
use Drupal\Core\Ajax\AjaxResponse;
use Drupal\Core\Ajax\CloseModalDialogCommand;
use Drupal\Core\Ajax\HtmlCommand;
use Drupal\file\Entity\File;
use Drupal\Core\Ajax\AppendCommand;

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
class SpeakerPaperEditForm extends FormBase {
  protected $bullet_point;  
  protected $node;
  protected $isNew;

  /**
   * {@inheritdoc}
   */
  public function buildForm(array $form, FormStateInterface $form_state, NodeInterface $bullet_point = null, NodeInterface $node = null) {
    $this->bullet_point = $bullet_point;
    if ($node) {
      $this->node = $node;
    }

    //$form['#attached']['library'][] = 'decreto_content_modify/meeting-edit';

    $form['#prefix'] = '<div id="decreto-content-modify-sp-edit-form">';
    $form['#suffix'] = '</div>';
    $form['title'] = [
      '#type' => 'textfield',
      '#placeholder' => $this->t('Title'),
      '#required' => TRUE,
    ];

     //custom_text
    $form['body'] = array(
      '#prefix' => '<div role="tabpanel" class="tab-pane active" id="custom_text">',
      '#type' => 'text_format',
      '#format'=> 'basic_html',
      '#suffix' => '</div>',//<div role="tabpanel" class="tab-pane active" id="custom_text">
    );

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
      $form['body']['#default_value'] = $node->body->value;
    }

    return $form;
  }

  /**
   * {@inheritdoc}
   */
  public function getFormId() {
    return 'decreto-content-modify-sp-edit-form';
  }

  /**
   * {@inheritdoc}
   */
  public function submitForm(array &$form, FormStateInterface $form_state) {
    $title = $form_state->getValue('title');
    $body = $form_state->getValue('body');
  
    if (!$this->node) {
      $this->node = Node::create([
        'type' => 'decreto_speaker_paper',
        'title' => $title,
        'body' => $body,
        'status' => 1,     
      ]);
    } else {
      $this->node->title = $title;
      $this->node->body = $body;
    }
   if ($this->bullet_point)
      $this->node->field_decreto_sp_bp->appendItem($this->bullet_point->id());
    
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
    // At this point the submit handler has fired.
    // Clear the message set by the submit handler.
    //drupal_get_messages();

    // We begin building a new ajax reponse.
    $response = new AjaxResponse();
    if ($form_state->getErrors()) {
      unset($form['#prefix']);
      unset($form['#suffix']);
      $form['status_messages'] = [
        '#type' => 'status_messages',
        '#weight' => -10,
      ];
      $response->addCommand(new HtmlCommand('#decreto-content-modify-sp-edit-form', $form));
    }
    else {
     // $bp_nid = $this->parent->id();
      //reloadind bullet point
      $render_speaker_paper = node_view($this->node);
      if ($this->isNew == SAVED_NEW) {
        $response->addCommand(new AppendCommand('#speaker-papers-container-'.$this->bullet_point->id(), $render_speaker_paper));
      }
      else{
        //replacing old bullet point with refreshed bullet point
        $response->addCommand(new HtmlCommand("#speaker-paper-{$this->node->id()}", $render_speaker_paper));
        //$response->addCommand(new CloseModalDialogCommand());
       }
    $response->addCommand(new CloseModalDialogCommand());
    return $response;
  }
 }
}

