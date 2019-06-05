<?php

namespace Drupal\decreto_notification\Plugin\Notifier;

use Drupal\decreto_notification\Entity\Notification;
use Drupal\message_notify\Plugin\Notifier\MessageNotifierBase;

/**
 * Decreto notifier.
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
    return Notification::create([
      'body' => $this->message->getText(),
      'uid' => $this->message->getOwnerId(),
      'mid' => $this->message->original_message->id()
    ])->save();
  }

}
