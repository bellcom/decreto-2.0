<?php

namespace Drupal\decreto_user\Tests;

use Drupal\simpletest\WebTestBase;

/**
 * Provides automated tests for the decreto_user module.
 */
class DecretoUserControllerTest extends WebTestBase {


  /**
   * {@inheritdoc}
   */
  public static function getInfo() {
    return [
      'name' => "decreto_user DecretoUserController's controller functionality",
      'description' => 'Test Unit for module decreto_user and controller DecretoUserController.',
      'group' => 'Other',
    ];
  }

  /**
   * {@inheritdoc}
   */
  public function setUp() {
    parent::setUp();
  }

  /**
   * Tests decreto_user functionality.
   */
  public function testDecretoUserController() {
    // Check that the basic functions of module decreto_user.
    $this->assertEquals(TRUE, TRUE, 'Test Unit Generated via Drupal Console.');
  }

}
