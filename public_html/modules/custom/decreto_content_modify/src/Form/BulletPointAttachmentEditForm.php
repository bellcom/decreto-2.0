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
class BulletPointAttachmentEditForm extends FormBase {
  protected $parent;

  protected $node;

  /**
   * {@inheritdoc}
   */
  public function buildForm(array $form, FormStateInterface $form_state, NodeInterface $bullet_point = null, NodeInterface $node = null) {
    $this->parent = $bullet_point;
    if ($node) {
      $this->node = $node;
    }

    $form['#attached']['library'][] = 'decreto_content_modify/meeting-edit';

    $form['#prefix'] = '<div id="decreto-content-modify-bpa-edit-form">';
    $form['#suffix'] = '</div>';
    $form['title'] = [
      '#type' => 'textfield',
      '#placeholder' => $this->t('Title'),
      '#required' => TRUE,
    ];

    // tabs
    $form[]['#markup'] = '<ul class="nav nav-tabs">';
    $form[]['#markup'] = '<li role="select_type" class="active">
                          <a href="#custom_text" aria-controls="custom_text" role="tab" data-toggle="tab">'
                          . $this->t('Custom text')
                          . '</a></li>';
    $form[]['#markup'] = '<li role="select_type">
                          <a href="#upload_file" aria-controls="upload_file" role="tab" data-toggle="tab">'
                          . $this->t('Upload file')
                          . '</a></li>';
    $form[]['#markup'] = '</ul>';//<ul class="nav nav-tabs">

    //tab content
    $form[]['#markup'] = '<div class="tab-content">';
    //custom_text
    $form['body'] = array(
      '#prefix' => '<div role="tabpanel" class="tab-pane active" id="custom_text">',
      '#type' => 'text_format',
      '#format'=> 'basic_html',
      '#suffix' => '</div>',//<div role="tabpanel" class="tab-pane active" id="custom_text">
    );

    //upload file
    $form[]['#markup'] = '<div role="tabpanel" class="tab-pane" id="upload_file">';

//    $form['file'] = array(
//      '#type' => 'plupload',
//      '#title' => $this->t('Upload files'),
//      '#autoupload' => TRUE,
//      '#upload_validators' => array(
//        'file_validate_extensions' => array('txt pdf doc docx html'),
//        //TODO: add limit to single file
//        //'my_custom_file_validator' => array('some validation criteria'),
//      ),
//      '#plupload_settings' => array(
//        'runtimes' => 'html5',
//        'chunk_size' => '1mb',
//      ),
//    );

    $form['file'] = array(
      //'#title' => $this->t('Open description'),
      '#type' => 'managed_file',
      '#upload_location' => 'public://',
      '#default_value' => NULL,
      '#upload_validators' => array(
        'file_validate_extensions' => array('txt pdf doc docx html'),
      )
    );

    $form['convert_to_pdf'] = [
      '#type' => 'checkbox',
      '#title' => $this->t('Convert to PDF')// . ' not implemented',
    ];

    $form['convert_to_html'] = [
      '#type' => 'checkbox',
      '#title' => $this->t('Convert to HTML')// . ' not implemented',
    ];

    $form[]['#markup'] = '</div>';//<div role="tabpanel" class="tab-pane" id="upload_file">
    $form[]['#markup'] = '</div>';//<div class="tab-content">


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
    return 'decreto-content-modify-bpa-edit-form';
  }

  /**
   * {@inheritdoc}
   */
  public function submitForm(array &$form, FormStateInterface $form_state) {
    $title = $form_state->getValue('title');
    $body = $form_state->getValue('body');
    $file_field = $form_state->getValue('file');
    $bpa_file = null;
    $bpa_html = null;

    if ($file_field) {
      $file = File::load(array_pop($file_field));

      if ($file->getMimeType() == 'text/html') {
        $bpa_html = $file;
      }
      else {
        $bpa_file = $file;
      }
    }

    if (!$this->node) {
      $this->node = Node::create([
        'type' => 'decreto_bullet_point_attachment',
        'title' => $title,
        'body' => $body,
        'status' => 1,
        'field_decreto_bpa_file' => ($bpa_file)? ['target_id' => $bpa_file->id()] : null,
        'field_decreto_bpa_html' => ($bpa_html)? ['target_id' => $bpa_html->id()] : null,
      ]);
    } else {
      $this->node->title = $title;
      $this->node->body = $body;
      if ($bpa_file) {
        $this->node->field_decreto_bpa_file->setValue(['target_id' => $bpa_file->id()]);
      }
      if ($bpa_html) {
        $this->node->field_decreto_bpa_html->setValue(['target_id' => $bpa_html->id()]);
      }
    }

    if ($this->node->save() == SAVED_NEW) {
      //updating parent
      $this->parent->field_decreto_bp_bpas->appendItem($this->node->id());
      $this->parent->save();
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
      $response->addCommand(new HtmlCommand('#decreto-content-modify-bpa-edit-form', $form));
    }
    else {
      $bp_nid = $this->parent->id();
      //reloadind bullet point
      $render_bullet_point = CommonFormUtils::buildSingleBulletPointContainer(array(), $bp_nid, true);

      //replacing old bullet point with refreshed bullet point
      $response->addCommand(new HtmlCommand("#js-bp-$bp_nid-container", $render_bullet_point));
      $response->addCommand(new CloseModalDialogCommand());
    }
    return $response;
  }
}


