(function ($, Drupal) {
  'use strict';

  Drupal.behaviors.decretoContentModifySearchInMeeting = {
    attach: function (context, settings) {
      $(".decreto-content-modify-search-in-meeting-form").submit(function (e) {
        e.preventDefault();

        var form = $(this);
        var url = form.attr('action');

        $.ajax({
          type: "POST",
          url: url,
          data: form.serialize(),
          success: function (data) {}
        });
      });
    }
  };
})(jQuery, Drupal);
