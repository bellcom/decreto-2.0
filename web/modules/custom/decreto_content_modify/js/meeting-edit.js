(function ($, Drupal, drupalSettings) {
  'use strict';

  Drupal.behaviors.decretoContentModifyLinkStartEndDates = {
    attach: function (context, settings) {

      // Attaching behaviour only start date is shown once.
      // That prevents end date being instantly update on page load.
      $('.js-form-type-bootstrap-date-time.js-form-item-start-date input').on("dp.show", function (show_event) {
        $('.js-form-type-bootstrap-date-time.js-form-item-start-date input').not('.decretoContentModifyLinkStartEndDates-processed').on("dp.change", function (e) {
          $('.js-form-type-bootstrap-date-time.js-form-item-end-date input').datetimepicker({
            format: drupalSettings.decreto_bootstrap_datetimepicker.datetime_js_format,
            showTodayButton: true,
            showClose: true
          });
          $('.js-form-type-bootstrap-date-time.js-form-item-end-date input').data("DateTimePicker").date(moment(e.date).add(1, 'hours'));
        });
        $('.js-form-type-bootstrap-date-time.js-form-item-start-date input').addClass('decretoContentModifyLinkStartEndDates-processed');
      });


    }
  };
})(jQuery, Drupal, drupalSettings);
