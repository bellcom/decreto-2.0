(function ($, Drupal, drupalSettings) {
  'use strict';

  Drupal.behaviors.decretoAjaxButtonClickOnEnter = {
    attach: function (context, settings) {
      $('form input, form select').keypress(function (event) {
        if (event.which == 13) {
          event.preventDefault();
          console.log('test1');
          $('button.click-on-enter').click();
        }
      });
    }
  };

})(jQuery, Drupal, drupalSettings);
