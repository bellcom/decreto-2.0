<?php

namespace Drupal\decreto_notification\Plugin\Notifier;

use Drupal\decreto_content_modify\Entity\DecretoMeeting;
use Drupal\decreto_department\Entity\DecretoDepartment;
use Drupal\decreto_notification\Entity\Notification;
use Drupal\message_notify\Plugin\Notifier\MessageNotifierBase;

/**
 * Decreto notifier.
 *
 * @Notifier(
 *   id = "decreto_notifier",
 *   title = @Translation("Decreto notifier"),
 *   description = @Translation("Send Decreto internal notifications"),
 *   viewModes = {
 *   }
 * )
 */
class NotificationNotifier extends MessageNotifierBase {

  /**
   * {@inheritdoc}
   */
  public function deliver(array $output = []) {
    $text = $this->message->getText();
    if (is_array($text)) {
      $text = reset($text);
    }

    // Getting organisation id.
    $meeting = $this->message->get('field_decreto_notif_meeting')->first()->entity;
    $decretoMeeting = new DecretoMeeting($meeting);
    $department = $decretoMeeting->getDepartment();
    $decretoDepartment = new DecretoDepartment($department);
    $organisationId = $decretoDepartment->getOrganisation(FALSE);

    return Notification::create([
      'body' => strip_tags($text),
      'uid' => $this->message->getOwnerId(),
      'mid' => $this->message->original_message->id(),
      'org_id' => $organisationId,
    ])->save();
  }

}
