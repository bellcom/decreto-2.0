<?php

namespace Drupal\decreto_content_modify\Form;

use Drupal\Core\Form\FormStateInterface;
use Drupal\decreto_content_modify\Entity\DecretoBulletPoint;
use Drupal\decreto_content_modify\Entity\DecretoBulletPointAttachment;
use Drupal\decreto_pdf2htmlex\Utils\DecretoPdf2htmlexUtils as DecretoHTMLUtils;
use Drupal\decreto_pdf_conversion_manager\Utils\DecretoPdfConversionManagerUtils as DecretoPDFUtils;
use Drupal\node\Entity\Node;
use Drupal\node\NodeInterface;

/**
 * Implements the Memos add / edit form.
 *
 * @see \Drupal\Core\Form\FormBase
 */
class MemosEditForm extends AjaxFormBase {

  protected $bulletPoint;
  protected $memos;

  /**
   * {@inheritdoc}
   */
  public function getFormId() {
    return 'decreto-content-modify-memos-edit-form';
  }

  /**
   * {@inheritdoc}
   */
  public function buildForm(array $form, FormStateInterface $form_state, NodeInterface $bullet_point = NULL) {
    if (empty($bullet_point) || $bullet_point->getType() != 'decreto_bullet_point') {
      return $form;
    }

    $this->bulletPoint = $bullet_point;

    // Saving meeting for redirect purposes.
    $decretoBP = new DecretoBulletPoint($bullet_point);
    $meeting = $decretoBP->getMeeting();
    $this->parent = $meeting;

    // Getting list of existing memos.
    $this->memos = $decretoBP->getMemos();

    // Memos container.
    $form['memos_container'] = [
      '#type' => 'container',
      '#prefix' => '<div id="js-memos-container-wrapper">',
      '#suffix' => '</div>',
      '#tree' => TRUE,
    ];

    $counter = $form_state->get('counter');
    if (empty($counter) || $counter < 1) {
      // This is a first load of form, we load all memos if present.
      // If no memos present, we start from 1.
      if (!empty($this->memos)) {
        $counter = count($this->memos);
      }
      else {
        $counter = 1;
      }

      $form_state->set('counter', $counter);
    }

    for ($i = 0; $i < $counter; $i++) {
      $memos_container = [
        '#type' => 'container',
        '#prefix' => '<div class="form-group">',
        '#suffix' => '</div>',
      ];

      // Title.
      $memos_container['title'] = [
        '#type' => 'textfield',
        '#placeholder' => $this->t('Title'),
        '#required' => TRUE,
      ];

      // Body.
      $memos_container['body'] = [
        '#type' => 'text_format',
        '#format' => 'basic_html',
        '#allowed_formats' => ['basic_html'],
      ];

      if ($counter > 1) {
        $memos_container['delete'] = [
          '#name' => 'edit-memo-index-delete-' . $i,
          '#value' => t('Delete'),
          '#memo_index' => $i,
          '#ajax' => [
            'wrapper' => 'js-memos-container-wrapper',
            'callback' => '::ajaxMemos',
            'event' => 'click',
          ],
          '#submit' => ['::submitDelete'],
          '#type' => 'submit',
          '#limit_validation_errors' => [],
        ];
      }
      $form['memos_container'][] = $memos_container;
    }

    $form['add-more'] = [
      '#value' => t('Add'),
      '#name' => 'add more',
      '#ajax' => [
        'wrapper' => 'js-memos-container-wrapper',
        'callback' => '::ajaxMemos',
        'event' => 'click',
      ],
      '#submit' => ['::submitAddMore'],
      '#type' => 'submit',
      '#limit_validation_errors' => [],
    ];

    // Populate values.
    $form = $this->populateFormData($form, $form_state);

    $form = parent::buildForm($form, $form_state);

    return $form;
  }

  /**
   * Populates form with data from bullet point.
   *
   * @param array $form
   *   Render array representing from.
   * @param \Drupal\Core\Form\FormStateInterface $form_state
   *   Current form state.
   *
   * @return array
   *   Form array with filled data.
   */
  private function populateFormData(array $form, FormStateInterface $form_state) {
    if (!empty($this->memos)) {
      $i = 0;
      foreach ($this->memos as $memo) {
        $form['memos_container'][$i]['title']['#default_value'] = $memo->getTitle();
        $form['memos_container'][$i]['body']['#default_value'] = $memo->body->value;
        // Adding back reference to the node.
        $form['memos_container'][$i]['#memo_nid'] = $memo->id();
        $i++;
      }
    }

    return $form;
  }

  /**
   * {@inheritdoc}
   */
  public function submitForm(array &$form, FormStateInterface $form_state) {
    // Getting values.
    $memos_container = $form_state->getValue('memos_container');

    // Processing memos.
    foreach ($memos_container as $delta => $memo_container) {
      $title = $memo_container['title'];
      $body = $memo_container['body'];

      // Is existing memo?
      if ($memo_nid = $form['memos_container'][$delta]['#memo_nid']) {
        $memo = $this->memos[$memo_nid];
        $memo->title = $title;
        $memo->body = $body;

        // Unsetting the memo from list.
        unset($this->memos[$memo_nid]);
      }
      // Creating new memo.
      else {
        $memo = Node::create(array(
          'type' => 'decreto_memo',
          'status' => 1,
          'title' => $title,
          'body' => $body,
          'field_decreto_memo_bp' => [
            'target_id' => $this->bulletPoint->id(),
          ],
        ));
      }

      $memo->save();
    }

    // If we have some memos left in the list, this means they were removed.
    // Delete those nodes.
    foreach ($this->memos as $memo) {
      $memo->delete();
    }
  }

  /**
   * Ajax callback that increase amount of memos.
   *
   * @param array $form
   *   The Form API form.
   * @param \Drupal\Core\Form\FormStateInterface $form_state
   *   The FormState object.
   *
   * @return array
   *   The Form API form.
   */
  public function submitAddMore(array $form, FormStateInterface $form_state) {
    $counter = $form_state->get('counter');
    $form_state->set('counter', $counter + 1);
    $form_state->setRebuild();
    return $form;
  }

  /**
   * Ajax callback that reduce amount of files.
   *
   * @param array $form
   *   The Form API form.
   * @param \Drupal\Core\Form\FormStateInterface $form_state
   *   The FormState object.
   *
   * @return array
   *   The Form API form.
   */
  public function submitDelete(array $form, FormStateInterface $form_state) {
    $triggering_element = $form_state->getTriggeringElement();

    // Saving user input for future.
    $user_input = $form_state->getUserInput();

    // Unsetting memo that is deleted.
    unset($user_input['memos_container'][$triggering_element['#memo_index']]);
    $user_input['memos_container'] = array_values($user_input['memos_container']);

    // Reusing saved user input for future.
    $form_state->setUserInput($user_input);

    // Updating counter.
    $counter = $form_state->get('counter');
    $form_state->set('counter', $counter - 1);

    $form_state->setRebuild();
    return $form;
  }

  /**
   * Ajax memo container update function.
   *
   * @param array $form
   *   Form API form.
   * @param \Drupal\Core\Form\FormStateInterface $form_state
   *   Form API form.
   *
   * @return array
   *   Form array.
   */
  public function ajaxMemos(array $form, FormStateInterface $form_state) {
    return $form['memos_container'];
  }

}
