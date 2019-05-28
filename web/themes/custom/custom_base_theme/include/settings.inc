<?php

/**
 * Collect and assemble theme settings.
 *
 * @return array
 */
function _custom_base_theme_collect_theme_settings() {
  $settings = [];

  // Contact information
  $settings['contact_information']['business_owner_name'] = theme_get_setting('business_owner_name');
  $settings['contact_information']['business_startup_year'] = theme_get_setting('business_startup_year');
  $settings['contact_information']['address'] = theme_get_setting('address');
  $settings['contact_information']['zipcode'] = theme_get_setting('zipcode');
  $settings['contact_information']['city'] = theme_get_setting('city');
  $settings['contact_information']['phone_system'] = theme_get_setting('phone_system');
  $settings['contact_information']['phone_readable'] = theme_get_setting('phone_readable');
  $settings['contact_information']['email'] = theme_get_setting('email');
  $settings['contact_information']['working_hours'] = theme_get_setting('working_hours');

  // Social
  $settings['social']['facebook']['active'] = theme_get_setting('facebook');
  $settings['social']['facebook']['url'] = theme_get_setting('facebook_url');
  $settings['social']['facebook']['tooltip'] = theme_get_setting('facebook_tooltip');
  $settings['social']['twitter']['active'] = theme_get_setting('twitter');
  $settings['social']['twitter']['url'] = theme_get_setting('twitter_url');
  $settings['social']['twitter']['tooltip'] = theme_get_setting('twitter_tooltip');
  $settings['social']['googleplus']['active'] = theme_get_setting('googleplus');
  $settings['social']['googleplus']['url'] = theme_get_setting('googleplus_url');
  $settings['social']['googleplus']['tooltip'] = theme_get_setting('googleplus_tooltip');
  $settings['social']['instagram']['active'] = theme_get_setting('instagram');
  $settings['social']['instagram']['url'] = theme_get_setting('instagram_url');
  $settings['social']['instagram']['tooltip'] = theme_get_setting('instagram_tooltip');
  $settings['social']['linkedin']['active'] = theme_get_setting('linkedin');
  $settings['social']['linkedin']['url'] = theme_get_setting('linkedin_url');
  $settings['social']['linkedin']['tooltip'] = theme_get_setting('linkedin_tooltip');
  $settings['social']['pinterest']['active'] = theme_get_setting('pinterest');
  $settings['social']['pinterest']['url'] = theme_get_setting('pinterest_url');
  $settings['social']['pinterest']['tooltip'] = theme_get_setting('pinterest_tooltip');
  $settings['social']['vimeo']['active'] = theme_get_setting('vimeo');
  $settings['social']['vimeo']['url'] = theme_get_setting('vimeo_url');
  $settings['social']['vimeo']['tooltip'] = theme_get_setting('vimeo_tooltip');
  $settings['social']['youtube']['active'] = theme_get_setting('youtube');
  $settings['social']['youtube']['url'] = theme_get_setting('youtube_url');
  $settings['social']['youtube']['tooltip'] = theme_get_setting('youtube_tooltip');
  $settings['social']['github']['active'] = theme_get_setting('github');
  $settings['social']['github']['url'] = theme_get_setting('github_url');
  $settings['social']['github']['tooltip'] = theme_get_setting('github_tooltip');

  return $settings;
}
