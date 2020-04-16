<?php

namespace Drupal\decreto_content_modify\Controller;

use Drupal\Core\Controller\ControllerBase;
use Drupal\field\Entity\FieldStorageConfig;
use Drupal\node\NodeInterface;
use Symfony\Component\HttpFoundation\RedirectResponse;

/**
 * Decreto meeting controller.
 */
class MeetingController extends ControllerBase {

  /**
   * Updates meeting type.
   *
   * @param \Drupal\node\NodeInterface $meeting
   *   Decreto notification entity.
   * @param string $type
   *   New type of the meeting.
   *
   * @return \Symfony\Component\HttpFoundation\RedirectResponse
   *   Redirect response to meeting node.
   *
   * @throws \Drupal\Core\Entity\EntityMalformedException
   * @throws \Drupal\Core\Entity\EntityStorageException
   * @throws \Drupal\Core\Entity\Exception\UnsupportedEntityTypeDefinitionException
   */
  public function updateType(NodeInterface $meeting, $type) {
    $type_options = options_allowed_values(FieldStorageConfig::loadByName('node', 'field_decreto_meet_type'));

    if (array_key_exists($type, $type_options)) {
      $meeting->field_decreto_meet_type = $type;
      $meeting->save();

      \Drupal::messenger()->addStatus(t('Meeting type is successfully updated.'));

      /** @var \Drupal\decreto_content_modify\Services\ContentService $contentService */
      $contentService = \Drupal::service('decreto_content_modify.content');
      $contentService->notifyMeetingStatusChanged($meeting);
    }
    else {
      \Drupal::messenger()->addWarning(t('Meeting type could not be updated.'));
    }

    return new RedirectResponse($meeting->toUrl()->toString());
  }

}
