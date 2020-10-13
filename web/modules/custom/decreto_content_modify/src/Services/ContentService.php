<?php

namespace Drupal\decreto_content_modify\Services;

use Drupal\Core\Cache\CacheBackendInterface;
use Drupal\Core\Datetime\DrupalDateTime;
use Drupal\Core\Entity\ContentEntityInterface;
use Drupal\Core\Entity\EntityTypeManagerInterface;
use Drupal\Core\Session\AccountProxyInterface;
use Drupal\datetime\Plugin\Field\FieldType\DateTimeItemInterface;
use Drupal\decreto_content_modify\Entity\DecretoMeeting;
use Drupal\decreto_content_modify\Form\MeetingNotificationsSettingsForm;
use Drupal\decreto_organisation\Entity\DecretoOrganisation;
use Drupal\file\Entity\File;
use Drupal\user\UserInterface;
use Eluceo\iCal\Component\Calendar;
use Eluceo\iCal\Component\Event;
use Eluceo\iCal\Property\Event\Organizer;

/**
 * Decreto content service service.
 */
class ContentService {
  /**
   * Cache ID to be used for meeting counters.
   */
  const CACHE_ID_DECRETO_MEETING_COUNTERS = 'decreto_meeting_counters';

  /**
   * Cache ID to be used for memo counters.
   */
  const CACHE_ID_DECRETO_MEMO_COUNTERS = 'decreto_memo_counters';

  /**
   * The current user.
   *
   * @var \Drupal\Core\Session\AccountProxyInterface
   */
  protected $currentUser;

  /**
   * The node storage.
   *
   * @var \Drupal\Core\Entity\EntityStorageInterface
   */
  protected $nodeStorage;

  /**
   * Constructs a ContentService object.
   *
   * @param \Drupal\Core\Session\AccountProxyInterface $currentUser
   *   The current user.
   * @param \Drupal\Core\Entity\EntityTypeManagerInterface $entityTypeManager
   *   The entity type manager interface.
   *
   * @throws \Drupal\Component\Plugin\Exception\InvalidPluginDefinitionException
   * @throws \Drupal\Component\Plugin\Exception\PluginNotFoundException
   */
  public function __construct(
    AccountProxyInterface $currentUser,
    EntityTypeManagerInterface $entityTypeManager
  ) {
    $this->currentUser = $currentUser;
    $this->nodeStorage = $entityTypeManager->getStorage('node');
  }

  /**
   * Get meetings counter.
   *
   * @return array
   *   array(
   *    'my_org' => current user organisation meetings count
   *    'total' => total meetings count
   *   )
   *
   * @throws \Drupal\Core\Entity\Exception\UnsupportedEntityTypeDefinitionException
   */
  public function getMeetingCounters() {
    $organisation = \Drupal::service('decreto_organisation.organisation')->getSelectedOrganisation();

    $orgCountCid = self::CACHE_ID_DECRETO_MEETING_COUNTERS . ':' . $organisation->id();
    $totalCountCid = self::CACHE_ID_DECRETO_MEETING_COUNTERS;

    $orgCount = NULL;
    if ($cache = \Drupal::cache()
      ->get($orgCountCid)) {
      $orgCount = $cache->data;
    }
    else {
      $now = new DrupalDateTime('now');
      $decretoOrganisation = new DecretoOrganisation($organisation);
      $orgDepartmentsIds = $decretoOrganisation->getDepartments(FALSE);

      if (!empty($orgDepartmentsIds)) {
        $orgCount = $this->nodeStorage->getQuery()
          ->condition('type', 'decreto_meeting')
          ->condition('status', 1)
          ->condition('field_decreto_meet_start_date', $now->format(DateTimeItemInterface::DATETIME_STORAGE_FORMAT), '>=')
          ->condition('field_decreto_meet_department', $orgDepartmentsIds, 'IN')
          ->count()
          ->execute();
      }
      else {
        $orgCount = 0;
      }

      // Caching for 10m = 600 seconds.
      \Drupal::cache()
        ->set($orgCountCid, $orgCount, 600, [$orgCountCid, $totalCountCid]);
    }

    $totalCount = NULL;
    if ($cache = \Drupal::cache()
      ->get($totalCountCid)) {
      $totalCount = $cache->data;
    }
    else {
      $now = new DrupalDateTime('now');

      $totalCount = $this->nodeStorage->getQuery()
        ->condition('type', 'decreto_meeting')
        ->condition('status', 1)
        ->condition('field_decreto_meet_start_date', $now->format(DateTimeItemInterface::DATETIME_STORAGE_FORMAT), '>=')
        ->count()
        ->execute();

      // Caching for 10m = 600 seconds.
      \Drupal::cache()
        ->set($totalCountCid, $totalCount, 600, [$totalCountCid]);
    }

    return [
      'my_org' => $orgCount,
      'total' => $totalCount,
    ];
  }

  /**
   * Get memo counter by user.
   *
   * If user not provided current user info will be returned.
   *
   * @param \Drupal\user\UserInterface $user
   *   User to calculate counters.
   *
   * @return array
   *   array(
   *    'my_org' => current user organisation memos count
   *    'total' => total memos count
   *   )
   */
  public function getMemoCounters(UserInterface $user = NULL) {
    $selectOrganisationId = \Drupal::service('decreto_organisation.organisation')->getSelectedOrganisation(FALSE);

    $uid = $this->currentUser->id();
    if (!empty($user)) {
      $uid = $user->id();
    }

    $orgCountCid = self::CACHE_ID_DECRETO_MEMO_COUNTERS . ':' . $uid . ':' . $selectOrganisationId;
    $totalCountCid = self::CACHE_ID_DECRETO_MEMO_COUNTERS . ':' . $uid;

    $orgCount = NULL;
    if ($cache = \Drupal::cache()
      ->get($orgCountCid)) {
      $orgCount = $cache->data;
    }
    else {
      // Load the heavy calculation on the views API. We know the view
      // calculates the amount correctly.
      $orgCount = count(views_get_view_result('decreto_memos', 'decreto_page_memos'));

      \Drupal::cache()
        ->set($orgCountCid, $orgCount, CacheBackendInterface::CACHE_PERMANENT, [
          self::CACHE_ID_DECRETO_MEMO_COUNTERS,
          $orgCountCid,
          $totalCountCid,
        ]);
    }

    $totalCount = NULL;
    if ($cache = \Drupal::cache()
      ->get($totalCountCid)) {
      $totalCount = $cache->data;
    }
    else {
      $totalCount = $this->nodeStorage->getQuery()
        ->condition('uid', $uid)
        ->condition('type', 'decreto_memo')
        ->count()
        ->execute();
      \Drupal::cache()
        ->set($totalCountCid, $totalCount, CacheBackendInterface::CACHE_PERMANENT, [
          self::CACHE_ID_DECRETO_MEMO_COUNTERS,
          $totalCountCid,
        ]);
    }

    return [
      'my_org' => $orgCount,
      'total' => $totalCount,
    ];
  }

  /**
   * Sends a removed from meeting notification to user.
   *
   * @param \Drupal\user\UserInterface $user
   *   User who shall be notified.
   * @param \Drupal\Core\Entity\ContentEntityInterface $meeting
   *   Meeting - the subject of notification.
   */
  public function notifyAddedToMeeting(UserInterface $user, ContentEntityInterface $meeting) {
    $params['account'] = $user;
    $params['decreto_meeting'] = $meeting;
    $langcode = $user->getPreferredLangcode();

    // Get the custom site notification email to use as the from email address
    // if it has been set.
    $site_mail = \Drupal::config('system.site')->get('mail_notification');
    // If the custom site notification email has not been set, we use the site
    // default for this.
    if (empty($site_mail)) {
      $site_mail = \Drupal::config('system.site')->get('mail');
    }
    if (empty($site_mail)) {
      $site_mail = ini_get('sendmail_from');
    }

    // Adding iCalendar file.
    $mail_config = \Drupal::config(MeetingNotificationsSettingsForm::$configName);
    $attachIcal = $mail_config->get('user_added_notification_attach_ical');
    if ($attachIcal) {
      $icalFile = $this->generateMeetingIcal($meeting);
      $params['files'][] = $icalFile;
    }

    $op = 'decreto_content_user_added_to_meeting';
    $mail = \Drupal::service('plugin.manager.mail')->mail('decreto_content_modify', $op, $user->getEmail(), $langcode, $params, $site_mail);
  }

  /**
   * Sends a removed from meeting notification to user.
   *
   * @param \Drupal\user\UserInterface $user
   *   User who shall be notified.
   * @param \Drupal\Core\Entity\ContentEntityInterface $meeting
   *   Meeting - the subject of notification.
   */
  public function notifyRemovedFromMeeting(UserInterface $user, ContentEntityInterface $meeting) {
    $params['account'] = $user;
    $params['decreto_meeting'] = $meeting;
    $langcode = $user->getPreferredLangcode();

    // Get the custom site notification email to use as the from email address
    // if it has been set.
    $site_mail = \Drupal::config('system.site')->get('mail_notification');
    // If the custom site notification email has not been set, we use the site
    // default for this.
    if (empty($site_mail)) {
      $site_mail = \Drupal::config('system.site')->get('mail');
    }
    if (empty($site_mail)) {
      $site_mail = ini_get('sendmail_from');
    }
    $op = 'decreto_content_user_removed_from_meeting';
    $mail = \Drupal::service('plugin.manager.mail')->mail('decreto_content_modify', $op, $user->getEmail(), $langcode, $params, $site_mail);
  }

  /**
   * Sends a meeting type update notification to all participants.
   *
   * @param \Drupal\Core\Entity\ContentEntityInterface $meeting
   *   Meeting - the subject of notification.
   *
   * @throws \Drupal\Core\Entity\Exception\UnsupportedEntityTypeDefinitionException
   */
  public function notifyMeetingStatusChanged(ContentEntityInterface $meeting) {
    $params['decreto_meeting'] = $meeting;
    // Get the custom site notification email to use as the from email address
    // if it has been set.
    $site_mail = \Drupal::config('system.site')->get('mail_notification');
    // If the custom site notification email has not been set, we use the site
    // default for this.
    if (empty($site_mail)) {
      $site_mail = \Drupal::config('system.site')->get('mail');
    }
    if (empty($site_mail)) {
      $site_mail = ini_get('sendmail_from');
    }

    $op = 'decreto_content_meeting_type_updated';

    $decretoMeeting = new DecretoMeeting($meeting);
    $participants = $decretoMeeting->getParticipants();

    foreach ($participants as $user) {
      $params['account'] = $user;
      $langcode = $user->getPreferredLangcode();

      $mail = \Drupal::service('plugin.manager.mail')->mail('decreto_content_modify', $op, $user->getEmail(), $langcode, $params, $site_mail);
    }
  }

  /**
   * Generates ical file.
   *
   * @param \Drupal\Core\Entity\ContentEntityInterface $meeting
   *   Meeting node.
   *
   * @return string
   *
   * @throws \Drupal\Core\Entity\Exception\UnsupportedEntityTypeDefinitionException
   * @throws \Drupal\Core\TypedData\Exception\MissingDataException
   */

  /**
   * Generates ical file.
   *
   * @param \Drupal\Core\Entity\ContentEntityInterface $meeting
   *   Meeting node.
   *
   * @return object
   *   File object as stdClass.
   *
   * @throws \Drupal\Core\Entity\Exception\UnsupportedEntityTypeDefinitionException
   * @throws \Drupal\Core\TypedData\Exception\MissingDataException
   */
  public function generateMeetingIcal(ContentEntityInterface $meeting) {
    $decretoMeeting = new DecretoMeeting($meeting);
    $site_name = \Drupal::config('system.site')->get('name');
    $meeting_id = $meeting->id();

    // Creating event.
    $vEvent = new Event();
    $vEvent->setSummary($meeting->label());
    $vEvent->setLocation($decretoMeeting->getLocation()->getName());

    $organiser = new Organizer($decretoMeeting->getDepartment()->getName());
    $vEvent->setOrganizer($organiser);

    // Start date.
    if ($fieldStartDate = $meeting->get('field_decreto_meet_start_date')->first()) {
      $start_date = DrupalDateTime::createFromFormat(DateTimeItemInterface::DATETIME_STORAGE_FORMAT, $fieldStartDate->value, new \DateTimeZone(DateTimeItemInterface::STORAGE_TIMEZONE));
      $vEvent->setDtStart($start_date->getPhpDateTime());
    }

    // End date.
    if ($fieldEndDate = $meeting->get('field_decreto_meet_end_date')->first()) {
      $end_date = DrupalDateTime::createFromFormat(DateTimeItemInterface::DATETIME_STORAGE_FORMAT, $fieldEndDate->value, new \DateTimeZone(DateTimeItemInterface::STORAGE_TIMEZONE));
      $vEvent->setDtEnd($end_date->getPhpDateTime());
    }

    // Rendering event.
    $vCalendar = new Calendar($site_name);
    $vCalendar->addComponent($vEvent);
    $iCalContent = $vCalendar->render();

    // Saving event as a file.
    /** @var \Drupal\Core\File\FileSystemInterface $file_system */
    $file_system = \Drupal::service('file_system');

    $uri = $file_system->saveData($iCalContent, "temporary://ical_$meeting_id.ics");

    $file = new \stdClass();
    $file->filename = "ical_$meeting_id.ics";
    $file->uri = $uri;
    $file->filemime = 'text/calendar';

    return $file;
  }

}
