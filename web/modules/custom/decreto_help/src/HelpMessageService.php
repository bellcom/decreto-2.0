<?php

namespace Drupal\decreto_help;

use Drupal\Core\KeyValueStore\KeyValueFactoryInterface;
use Drupal\Core\KeyValueStore\KeyValueStoreInterface;

/**
 * Class HelpMessageService.
 */
class HelpMessageService {

  /**
   * Messages storage object.
   *
   * @var KeyValueStoreInterface $storage
   */
  protected $storage;

  /**
   * Constructs a HelpMessageService object.
   *
   * @param KeyValueFactoryInterface $keyValueFactory
   *   Key value factory.
   * @throws
   */
  public function __construct(KeyValueFactoryInterface $keyValueFactory) {
    $this->storage = $keyValueFactory->get('decreto_help.messages_settings');
  }

  /**
   * Returns rendered array with message.
   */
  public function getMessageMarkup($message_key) {
    return [
      '#theme' => 'decreto_help_message_popup',
      '#content' => strip_tags($this->getMessage($message_key)),
    ];
  }

  /**
   * Returns help message value.
   */
  public function getMessage($message_key) {
    return $this->storage->get($message_key);
  }

}
