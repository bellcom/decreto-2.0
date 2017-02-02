/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
(function ($, Drupal) {
    Drupal.behaviors.main_menu = {
        attach: function (context, settings) {
            //main menu
            $('#toggle-menu-trigger', context).once('toggle-main-menu').click(function () {
                var toggle_menu_container = $(context).find('.toggle-menu-container');
                toggle_menu_container.toggleClass('collapsed');

                if (toggle_menu_container.hasClass('collapsed')) {
                    $.cookie('toggle_main_menu', 'collapsed');
                } else {
                    $.removeCookie('toggle_main_menu');
                }

            });
        }
    }
})(jQuery, Drupal);
