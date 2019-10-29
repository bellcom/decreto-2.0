(function ($, Drupal) {
  'use strict';

  Drupal.behaviors.decretoContentModifyRepositionBootstrapDatetime = {
    attach: function (context, settings) {

      // Bootstrap datetime.
      // The module is applying annoying wrapper divs, which we cannot
      // get rid off.
      if ($('form.decreto-content-modify-meeting-edit-form').length > 0) {
        var $form = $('form.decreto-content-modify-meeting-edit-form');
        var $wrapper = $('<div />').addClass('bootstrap-date-time-wrapper');
        var $inputs = $form.find('.form-type-bootstrap-date-time');
        var $parents = $form.find('.form-type-bootstrap-date-time').parents('.container').first();

        $wrapper
          .insertAfter($parents.last())
          .prepend($inputs);

        $parents.remove();
      }
    }
  };

  Drupal.behaviors.decretoContentModifyLinkStartEndDates = {
    attach: function (context, settings) {

      $('.bootstrap-date-time-wrapper .js-form-item-start-date input').on("dp.change", function (e) {
        $('.bootstrap-date-time-wrapper .js-form-item-end-date input').datetimepicker({
          format: 'YYYY-MM-DD HH:mm',
          showTodayButton: true,
          showClose: true
        });
        $('.bootstrap-date-time-wrapper .js-form-item-end-date input').data("DateTimePicker").date(moment(e.date).add(1, 'hours'));
      });

    }
  };

})(jQuery, Drupal);
