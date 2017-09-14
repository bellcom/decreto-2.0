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

    Drupal.behaviors.bootstrap_multiselect = {
        attach: function (context, settings) {
            var defaultTitle = 'Select';
            $('.bootstrap-multiselect', context).once('bootstrap_multiselect').multiselect({
                buttonText: function (options, select) {
                    if (options.length === 0) {
                        if ($(select).data('multiselect-title')) {
                            return $(select).data('multiselect-title');
                        }
                        return defaultTitle;
                    }
                    else if (options.length > 1) {
                        return 'Multiple selected';
                    }
                    else {
                        var labels = [];
                        options.each(function () {
                            if ($(this).attr('label') !== undefined) {
                                labels.push($(this).attr('label'));
                            }
                            else {
                                labels.push($(this).html());
                            }
                        });
                        return labels.join(', ') + '';
                    }
                }
            });
        }
    }

    Drupal.behaviors.main_container_offset = {
        attach: function (context, settings) {
            //offsetting main-container__content
            var height = $('.main-container__header', context).height();
            $('.main-container__content', context).css('margin-top', height > 0 ? height : 0);

            $(window).once('main_container_offset').resize(function () {
                var height = $('.main-container__header', context).height();
                $('.main-container__content', context).css('margin-top', height > 0 ? height : 0);
            });
        }
    }
    /*-------------------------------------fgewg---------------------------*/
   
})(jQuery, Drupal);


jQuery(document).ready(function($){


$(".btn-primary").click(function(){
    $(this).toggleClass("down"); 
});
});
/*------------------------njhdbh*/
jQuery(document).ready(function($){


$("#toggle-menu-trigger").click(function(){
    $('.toggle-menu-container').toggleClass('containerClose');
    $('#superfish-main li').toggleClass('closeContainerMenuItems');
    $('#toggle-menu-trigger').toggleClass("rotated");
    $('#toggle-menu-trigger').toggleClass("visible");
    $('.container-fluid').toggleClass('move');

});
});
/*----------------------------                          */

/*------------------subIndicatorsMainMenuForDesktop-------------*/
jQuery(document).ready(function($){

$(".sf-sub-indicator").click(function(){
    
    $('.sf-depth-1 .sf-depth-2 > a').toggleClass("open");
    $('.sf-sub-indicator').toggleClass("rotate");
});
});

/*----------------------------toggleClassMeetingsForParticipants------------*/
jQuery(document).ready(function($){

$('#info .field--name-field-decreto-meet-partic .field--label').on('click', function() {
    $('#info .col-xs-7 #Participants').animate({
        'height': 'toggle'
    },0); });
});
/*----------------------------toggleClassMeetingsForDescription------------*/
jQuery(document).ready(function($){

$('#info .field--type-text-with-summary').on('click', function() {
    $('#info .col-xs-7 #Description').animate({
        'height': 'toggle'
    }, 0); });
});