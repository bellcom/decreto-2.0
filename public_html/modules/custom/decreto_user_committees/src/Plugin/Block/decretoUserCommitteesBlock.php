<?php

/**
 * Provides a 'User Committees' Block
 *
 * @Block(
 *   id = "Decreto  User Committees Block",
 *   admin_label = @Translation("Decreto User Committees Block"),
 * )
 */

namespace Drupal\decreto_user_committees\Plugin\Block;

use Drupal\Core\Block\BlockBase;

class decretoUserCommitteesBlock extends BlockBase {
  /**
   * {@inheritdoc}
   */
  public function build() {
    return array(
      '#markup' => $this->get_user_committees(),
    );
  }
  private function get_user_committees(){
  // Load the current user.
  $user = \Drupal\user\Entity\User::load(\Drupal::currentUser()->id());
  $user_committees = $user->get('field_decreto_usr_coms')->getValue();
  $output = "";
  if (isset($user_committees)){
    foreach ($user_committees as $com){
     $term_object = taxonomy_term_load($com['target_id']);
      $term_name = $term_object->get('name')->value;
      $output .= '<a href="/"><b>' . $term_name . '</b><br/></a>';
    }
  }
  return $output;
}
}