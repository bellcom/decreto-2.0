<?php

namespace Drupal\decreto_annotator\Controller;

/**
 * @file
 * Contains \Drupal\decreto_annotator\Controller\AnnotatorController.
 */

use Drupal\Core\Controller\ControllerBase;
use Drupal\Core\Url;
use Drupal\decreto_annotator\Entity\Note;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\RedirectResponse;
use Symfony\Component\HttpFoundation\Response;

/**
 * Implements decreto_annotator_note related actions.
 *
 * @package Drupal\decreto_annotator\Controller
 */
class AnnotatorController extends ControllerBase {

  /**
   * Implementation of create note endpoint.
   *
   * Creates a note, saves it in the database and redirects to the read endpoint
   * in order to update a note with generated ID.
   *
   * @return \Symfony\Component\HttpFoundation\JsonResponse
   *   Empty response.
   *
   * @throws \Drupal\Core\Entity\EntityStorageException
   */
  public function annotatorCreate() {
    $note_json = json_decode(file_get_contents('php://input'), TRUE);
    $bpa_id = $note_json['bpa_id'];

    // Filtering on fields - removing those, that are saved separately.
    unset($note_json['bpa_id']);

    $note = Note::create([
      'bpa_id' => $bpa_id,
      'uid' => \Drupal::currentUser()->id(),
      'note_info' => json_encode($note_json),
    ]);
    $note->save();

    $url = Url::fromRoute('decreto_annotator.annotator.read', ['note' => $note->id()]);

    $response = new RedirectResponse($url->toString());
    $response->send();

    return new JsonResponse();
  }

  /**
   * Implementation search note endpoint.
   *
   * Searches notes authored by the current user for a given BPA.
   *
   * @return \Symfony\Component\HttpFoundation\JsonResponse
   *   Array of notes.
   */
  public function annotatorSearch() {
    $query = \Drupal::entityQuery('decreto_annotator_note');
    $query->condition('uid', \Drupal::currentUser()->id(), '=');
    $query->condition('bpa_id', $_GET['bpa_id'], '=');
    $noteIds = $query->execute();

    $notes = Note::loadMultiple($noteIds);

    $notes_array = array('total' => count($notes), "rows" => array());
    foreach ($notes as $note) {
      $note_arr = $note->getNoteInfo();
      $note_arr->id = $note->id();
      $note_arr->user = $note->getOwner()->getAccountName();
      $note_arr->permissions = array();
      $notes_array['rows'][] = $note_arr;
    }
    return new JsonResponse($notes_array);
  }

  /**
   * Implementation of update note endpoint.
   *
   * @param \Drupal\decreto_annotator\Entity\Note $note
   *   Note to be updated.
   *
   * @return \Symfony\Component\HttpFoundation\JsonResponse
   *   Empty response.
   *
   * @throws \Drupal\Core\Entity\EntityStorageException
   */
  public function annotatorUpdate(Note $note) {
    $note_json = json_decode(file_get_contents('php://input'), TRUE);

    // Filtering on fields - removing those, that are saved separately.
    unset($note_json['id']);
    unset($note_json['user']);
    unset($note_json['permissions']);
    unset($note_json['bpa_id']);

    $note->note_info->value = json_encode($note_json);
    $note->save();

    return new JsonResponse();
  }

  /**
   * Implementation of delete note endpoint.
   *
   * @param \Drupal\decreto_annotator\Entity\Note $note
   *   Note to be deleted.
   *
   * @return \Symfony\Component\HttpFoundation\JsonResponse
   *   Empty response.
   *
   * @throws \Drupal\Core\Entity\EntityStorageException
   */
  public function annotatorDelete(Note $note) {
    $note->delete();
    return new JsonResponse();
  }

  /**
   * Implementation of read note endpoint.
   *
   * @param \Drupal\decreto_annotator\Entity\Note $note
   *   Note to be read.
   *
   * @return \Symfony\Component\HttpFoundation\JsonResponse
   *   Note that is read.
   */
  public function annotatorRead(Note $note) {
    $note_arr = $note->getNoteInfo();
    $note_arr->id = $note->id();
    $note_arr->user = $note->getOwner()->getAccountName();
    $note_arr->permissions = array();

    return new JsonResponse($note_arr);
  }

  /**
   * Renders note popup content.
   *
   * Renders "decreto_note_popup_embed" display of "decreto_notes" view and
   * returns the result.
   *
   * @return \Symfony\Component\HttpFoundation\Response
   *   Rendered view.
   */
  public function popupContentRender() {
    $view = views_embed_view('decreto_notes', 'decreto_note_popup_embed');
    $markup = \Drupal::service('renderer')->render($view);

    // This is the important part, because will render only the TWIG template.
    return new Response($markup);
  }

}
