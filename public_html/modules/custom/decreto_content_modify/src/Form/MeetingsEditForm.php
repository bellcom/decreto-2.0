<?php
/**
 * @file
 * Contains \Drupal\decreto_content_modify\Form\MeetingsEditForm.
 */

namespace Drupal\decreto_content_modify\Form;

use Drupal\node\Entity\Node;
use Drupal\Core\Url;
use Drupal\Core\Form\FormBase;
use Drupal\Core\Form\FormStateInterface;
use Drupal\Core\Field\Plugin\Field\FieldFormatter;

/**
 * Implements an example form.
 */
class MeetingsEditForm extends FormBase {

  /**
   * {@inheritdoc}
   */
  public function getFormId() {
    return 'example_form';
  }

  /**
   * {@inheritdoc}
   */
  public function buildForm(array $form, FormStateInterface $form_state) {
    $form['#attached']['library'][] = 'core/drupal.ajax';
    $form['#attached']['library'][] = 'core/drupal.dialog';
    $form['#attached']['library'][] = 'core/drupal.dialog.ajax';
    $form['#attached']['library'][] = 'decreto_content_modify/meeting-edit';

    $form['title'] = array(
      '#type' => 'textfield',
      '#placeholder' => $this->t('Title'),
    );

    $form = CommonFormUtils::buildBulletPointsContainer($form);

    $form['add_bp'] = [
      '#title' => $this->t('Add new bullet point'),
      '#type' => 'link',
      '#url' => Url::fromRoute('decreto_content_modify.bps_add', array('node' => null)),
      '#attributes' => array(
        'class' => array('use-ajax'),
        'data-dialog-type' => 'modal',
      ),
    ];

    $form['message'] = [
      '#type' => 'container',
      '#attributes' => ['id' => 'fapi-example-message'],
    ];

    $form['actions']['#type'] = 'actions';
    $form['actions']['submit'] = array(
      '#type' => 'submit',
      '#value' => $this->t('Save'),
      '#button_type' => 'primary',
    );
    return $form;
  }

  /**
   * {@inheritdoc}
   */
  public function validateForm(array &$form, FormStateInterface $form_state) {
  }

  /**
   * {@inheritdoc}
   */
  public function submitForm(array &$form, FormStateInterface $form_state) {
    $title = $form_state->getValue('title');
    $bp_nids = explode(',', $form_state->getValue('bp_nids'));

    $field_decreto_meet_bps = array();
    foreach ($bp_nids as $bp_nid) {
      $field_decreto_meet_bps[]['target_id'] = $bp_nid;
    }

    $node = Node::create(array(
      'type' => 'decreto_meeting',
      'title' => $title,
      'status' => 1,
      'field_decreto_meet_bps' => $field_decreto_meet_bps
    ));

    $node->save();

    //drupal_set_message($this->t('Your phone number is @number', array('@number' => $form_state->getValue('phone_number'))));
  }
}