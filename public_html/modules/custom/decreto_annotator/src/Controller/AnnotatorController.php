<?php

/**
 * @file
 * Contains \Drupal\decreto_dashboard\Controller\DashboardController.
 */

namespace Drupal\decreto_annotator\Controller;

use Drupal\Core\Controller\ControllerBase;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\RedirectResponse;
use Drupal\user\Entity\User;

class AnnotatorController extends ControllerBase {

  /**
   * Implementation create note endpoint.
   * Creates a note, saves it in the database and redirects to the read endpoint in order to update a note with generated ID.
   *
   * @return none.
   */
  public function annotatorCreate() {
    $note_json = json_decode(file_get_contents('php://input'), true);
    $bpa_id = $note_json['bpa_id'];

    //filtering on fields - removing those, that are saved separatelly
    unset($note_json['bpa_id']);

    $last_ins_id = \Drupal::database()->insert('decreto_annotator_notes')
      ->fields(array(
        'bpa_id' => $bpa_id,
        'uid' => \Drupal::currentUser()->id(),
        'note_info' => json_encode($note_json),
      ))
      ->execute();
    $response = new RedirectResponse($GLOBALS['base_url'] . '/annotator/read/' . $last_ins_id);
    $response->send();
    //return new JsonResponse();   
  }

  public function annotatorSearch() {

    $query = \Drupal::database()->select('decreto_annotator_notes', 'notes');
    $query->fields('notes');
    $query->condition('uid', \Drupal::currentUser()->id(), '=');
    $query->condition('bpa_id', $_GET['bpa_id'], '=');
    $result = $query->execute()->fetchAll();
    $notes_array = array('total' => count($result), "rows" => array());
    foreach ($result as $row) {
      $note_arr = json_decode($row->note_info);
      $note_arr->id = $row->id;
      $note_arr->user = \Drupal::currentUser()->getAccountName();
      $note_arr->permissions = array();
      $notes_array['rows'][] = $note_arr;
    }
    return new JsonResponse($notes_array);
  }

  /**
   * Implementation update note endpoint.
   * Updates the content of the note.
   *
   * @param int $id the note id
   *
   * @return none.
   */
  public function annotatorUpdate($id) {
    $note_json = json_decode(file_get_contents('php://input'), true);

    //filtering on fields - removing those, that are saved separatelly
    unset($note_json['id']);
    unset($note_json['user']);
    unset($note_json['permissions']);
    unset($note_json['bpa_id']);

    $query = \Drupal::database()->update('decreto_annotator_notes')
      ->fields(array(
        'note_info' => json_encode($note_json),
      ))
      ->condition('id', $id, '=')
      ->execute();

    return new JsonResponse();
  }

  public function annotatorDelete($id) {
    $query = \Drupal::database()->delete('decreto_annotator_notes')
      ->condition('id', $id)
      ->execute();
    
    return new JsonResponse();
  }

  public function annotatorRead($id) {
    $query = \Drupal::database()->select('decreto_annotator_notes', 'notes');
    $query->fields('notes', ['id', 'note_info']);
    $query->condition('uid', \Drupal::currentUser()->id(), '=');
    $query->condition('id', $id, '=');
    $result = $query->execute()->fetchAssoc();

    if (is_array($result)) {
      $note_arr = json_decode($result["note_info"]);
      $note_arr->id = $result['id'];
      $note_arr->user = \Drupal::currentUser()->getAccountName();
      $note_arr->permissions = array();
    }
    return new JsonResponse($note_arr);
  }

}
