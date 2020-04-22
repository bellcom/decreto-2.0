<?php

namespace Drupal\decreto_content_modify\Form;

use Drupal\Core\Form\ConfigFormBase;
use Drupal\Core\Form\FormStateInterface;

/**
 * Form to configure Decreto meeting notifications.
 */
class MeetingNotificationsSettingsForm extends ConfigFormBase {

  /**
   * Name of the config.
   *
   * @var string
   */
  public static $configName = 'decreto_content_modify.meeting_notifications';

  /**
   * {@inheritdoc}
   */
  public function getFormId() {
    return 'decreto_content_modify.meeting_notifications';
  }

  /**
   * {@inheritdoc}
   */
  protected function getEditableConfigNames() {
    return [self::$configName];
  }

  /**
   * {@inheritdoc}
   */
  public function buildForm(array $form, FormStateInterface $form_state) {
    $config = $this->config(self::$configName);

    // Meeting notification - User added.
    $form['meeting_notification_user_added'] = [
      '#type' => 'details',
      '#title' => $this->t('User is added to a meeting'),
      '#description' => $this->t('Notification that is sent to a user when user is added to a meeting'),
    ];
    $form['meeting_notification_user_added']['user_added_notification_subject'] = [
      '#type' => 'textfield',
      '#title' => $this->t('Subject'),
      '#default_value' => $config->get('user_added_notification_subject'),
      '#maxlength' => 180,
    ];
    $form['meeting_notification_user_added']['user_added_notification_body'] = [
      '#type' => 'textarea',
      '#title' => $this->t('Body'),
      '#default_value' => $config->get('user_added_notification_body'),
      '#rows' => 3,
    ];
    // Add the token tree UI.
    $form['meeting_notification_user_added']['token_tree'] = [
      '#theme' => 'token_tree_link',
      '#token_types' => ['decreto_meeting', 'user'],
      '#show_restricted' => TRUE,
      '#show_nested' => TRUE,
      '#weight' => 90,
    ];

    // Meeting notification - User removed.
    $form['meeting_notification_user_removed'] = [
      '#type' => 'details',
      '#title' => $this->t('User is removed from a meeting'),
      '#description' => $this->t('Notification that is sent to a user when user is removed from a meeting'),
    ];
    $form['meeting_notification_user_removed']['user_removed_notification_subject'] = [
      '#type' => 'textfield',
      '#title' => $this->t('Subject'),
      '#default_value' => $config->get('user_removed_notification_subject'),
      '#maxlength' => 180,
    ];
    $form['meeting_notification_user_removed']['user_removed_notification_body'] = [
      '#type' => 'textarea',
      '#title' => $this->t('Body'),
      '#default_value' => $config->get('user_removed_notification_body'),
      '#rows' => 3,
    ];
    // Add the token tree UI.
    $form['meeting_notification_user_removed']['token_tree'] = [
      '#theme' => 'token_tree_link',
      '#token_types' => ['decreto_meeting', 'user'],
      '#show_restricted' => TRUE,
      '#show_nested' => TRUE,
      '#weight' => 90,
    ];

    // Meeting notification - Meeting type updated.
    $form['meeting_notification_meeting_type_updated'] = [
      '#type' => 'details',
      '#title' => $this->t('Meeting type is updated'),
      '#description' => $this->t('Notification that is sent to a user when meeting type is updated'),
    ];
    $form['meeting_notification_meeting_type_updated']['meeting_type_updated_notification_subject'] = [
      '#type' => 'textfield',
      '#title' => $this->t('Subject'),
      '#default_value' => $config->get('meeting_type_updated_notification_subject'),
      '#maxlength' => 180,
    ];
    $form['meeting_notification_meeting_type_updated']['meeting_type_updated_notification_body'] = [
      '#type' => 'textarea',
      '#title' => $this->t('Body'),
      '#default_value' => $config->get('meeting_type_updated_notification_body'),
      '#rows' => 3,
    ];
    // Add the token tree UI.
    $form['meeting_notification_meeting_type_updated']['token_tree'] = [
      '#theme' => 'token_tree_link',
      '#token_types' => ['decreto_meeting', 'user'],
      '#show_restricted' => TRUE,
      '#show_nested' => TRUE,
      '#weight' => 90,
    ];

    return parent::buildForm($form, $form_state);
  }

  /**
   * {@inheritdoc}
   */
  public function submitForm(array &$form, FormStateInterface $form_state) {
    parent::submitForm($form, $form_state);

    $this->config(self::$configName)
      ->set('user_added_notification_subject', $form_state->getValue('user_added_notification_subject'))
      ->set('user_added_notification_body', $form_state->getValue('user_added_notification_body'))
      ->set('user_removed_notification_subject', $form_state->getValue('user_removed_notification_subject'))
      ->set('user_removed_notification_body', $form_state->getValue('user_removed_notification_body'))
      ->set('meeting_type_updated_notification_subject', $form_state->getValue('meeting_type_updated_notification_subject'))
      ->set('meeting_type_updated_notification_body', $form_state->getValue('meeting_type_updated_notification_body'))
      ->save();
  }

}
