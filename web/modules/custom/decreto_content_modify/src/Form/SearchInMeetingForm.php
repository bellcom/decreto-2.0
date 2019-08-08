<?php

namespace Drupal\decreto_content_modify\Form;

use Drupal\Core\Ajax\AjaxResponse;
use Drupal\Core\Ajax\InvokeCommand;
use Drupal\Core\Form\FormBase;
use Drupal\Core\Form\FormStateInterface;
use Drupal\node\NodeInterface;
use Drupal\search_api\Entity\Index;

class SearchInMeetingForm extends FormBase {

  protected $meeting;

  /**
   * Returns a unique string identifying the form.
   *
   * The returned ID should be a unique string that can be a valid PHP function
   * name, since it's used in hook implementation names such as
   * hook_form_FORM_ID_alter().
   *
   * @return string
   *   The unique string identifying the form.
   */
  public function getFormId() {
    return 'decreto-content-modify-search-in-meeting-form';
  }

  /**
   * Form constructor.
   *
   * @param array $form
   *   An associative array containing the structure of the form.
   * @param \Drupal\Core\Form\FormStateInterface $form_state
   *   The current state of the form.
   * @param \Drupal\node\NodeInterface $meeting
   *   The meeting node.
   *
   * @return array
   *   The form structure.
   */
  public function buildForm(array $form, FormStateInterface $form_state, NodeInterface $meeting = NULL) {
    $this->meeting = $meeting;

    // Attempting to get search param.
    $searchParam = \Drupal::request()->query->get('s');

    //TODO: adding class .poppy only to have position relative - needed for proper help icon positioning.
    $form['#prefix'] = '<div id="' . $this->getFormId() . '" class="poppy">';
    $form['#suffix'] = '</div>';

    // Adding help message.
    $form[] = \Drupal::service('decreto_help.message')
      ->getMessageMarkup('meetings_search_in_meeting_form');

    // Details.
    $form[] = [
      '#markup' => '<h4><strong>' . $this->t('Filter bullet points') . '</strong></h4>',
    ];

    // Free text search field.
    $form['s'] = [
      '#type' => 'textfield',
      '#title' => $this->t('Free text'),
      '#default_value' => $searchParam,
    ];

    // Form actions START.
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
    // Form actions END.

    if ($searchParam) {
      $form['#attached']['library'][] = 'decreto_content_modify/search-in-meeting-init';
    }

    return $form;
  }

  /**
   * Form submission handler.
   *
   * @param array $form
   *   An associative array containing the structure of the form.
   * @param \Drupal\Core\Form\FormStateInterface $form_state
   *   The current state of the form.
   */
  public function submitForm(array &$form, FormStateInterface $form_state) {
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

    // Perform request to Solr.
    $searchParam = $form_state->getValue('s');
    $ids = $this->performSearch($searchParam);

    // Create selector for jQuery.
    $jquerySelector = '';
    foreach ($ids as $id) {
      $jquerySelector .= "article[data-decreto-node-id=$id],";
    }
    if (!empty($jquerySelector)) {
      // Removing coma in the end of the string.
      $jquerySelector = substr($jquerySelector, 0, -1);
    }

    // Hide all elements.
    $response->addCommand(new InvokeCommand(".decreto-bullet-point.teaser, .decreto-bullet-point-attachment.teaser", 'addClass', array('hidden')));
    // Show only those that were returned by search index.
    $response->addCommand(new InvokeCommand($jquerySelector, 'removeClass', array('hidden')));

    return $response;
  }

  /**
   * Performs the search query against decreto_meeting_contents_index index.
   *
   * @param string $searchParam
   *   Searching parameters.
   *
   * @return array
   *   List of BP, BPA where the match has been found. Parent BP of BPA is also
   *   added to the list to ensure that BPA is visible with it's context.
   */
  private function performSearch($searchParam) {
    $index = Index::load('decreto_meeting_contents_index');
    $query = $index->query();

    // Change the parse mode for the search.
    $parse_mode = \Drupal::service('plugin.manager.search_api.parse_mode')
      ->createInstance('direct');
    $parse_mode->setConjunction('OR');
    $query->setParseMode($parse_mode);

    // Set fulltext search keywords.
    if (!empty($searchParam)) {
      $query->keys($searchParam);
    }

    // Filter by meeting id, that is a field added in
    // decreto_content_modify_search_api_solr_documents_alter() to both BP and
    // BPA.
    $query->addCondition('meeting_nid', $this->meeting->id());

    // Execute the search.
    $results = $query->execute();

    $matchItemsIds = [];

    $resultItems = $results->getResultItems();
    foreach ($resultItems as $itemKey => $item) {
      // Adding item ID to match array.
      preg_match("/^entity:node\/(\d*):\w*$/", $itemKey, $matches);
      if (!empty($matches)) {
        $matchItemsIds[] = $matches[1];
      }

      // If type of the found item is decreto_bullet_point_attachment, add
      // related BP ID as well.
      $typeField = $item->getFields()['type'];
      $type = reset($typeField->getValues());
      if ($type == 'decreto_bullet_point_attachment') {
        $bpNidField = $item->getFields()['bp_nid'];
        $bpNid = reset($bpNidField->getValues());
        $matchItemsIds[] = $bpNid;
      }
    }

    // Removing duplicates.
    $matchItemsIds = array_unique($matchItemsIds);

    return $matchItemsIds;
  }

}
