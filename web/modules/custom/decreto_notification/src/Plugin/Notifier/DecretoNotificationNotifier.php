<?php

namespace Drupal\decreto_notification\Plugin\Notifier;

use Drupal\Core\Entity\EntityTypeManagerInterface;
use Drupal\Core\Logger\LoggerChannelInterface;
use Drupal\Core\Mail\MailManagerInterface;
use Drupal\Core\Render\RendererInterface;
use Drupal\decreto_notification\Entity\Notification;
use Drupal\message\MessageInterface;
use Drupal\message_notify\Exception\MessageNotifyException;
use Symfony\Component\DependencyInjection\ContainerInterface;
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
class DecretoNotificationNotifier extends MessageNotifierBase {
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
