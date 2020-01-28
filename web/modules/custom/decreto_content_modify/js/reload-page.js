/**
 * @file
 */

(function ($, Drupal) {
  Drupal.AjaxCommands.prototype.reloadPage = function (ajax, response, status) {
    window.location.reload();
  }

})(jQuery, Drupal);
