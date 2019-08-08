(function ($, Drupal) {
  'use strict';

  Drupal.behaviors.decretoContentModifySearchInMeeting = {
      attach: function (context, settings) {
        jQuery('form.decreto-content-modify-search-in-meeting-form #edit-submit').click();
      }
  };




})(jQuery, Drupal);
