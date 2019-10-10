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
          var $parents = $form.find('.form-type-bootstrap-date-time').parents('.container');

          $wrapper
            .insertAfter($parents.last())
            .prepend($inputs);

          $parents.remove();
        }
      }
  };
})(jQuery, Drupal);
