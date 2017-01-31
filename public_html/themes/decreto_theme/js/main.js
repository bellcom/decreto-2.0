/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
jQuery(function ($) {

    //main menu
    //alert('her');
    $('#toggle-menu-trigger').click(function () {
        //header-container
        $('.header-container .toggle-menu-left').toggleClass('col-sm-1 col-sm-2');
        $('.header-container .toggle-menu-right').toggleClass('col-sm-9 col-sm-10');

        //main-container
        $('.main-container .toggle-menu-left').toggleClass('col-sm-1 col-sm-2');
        if ($('.main-container .toggle-menu-right').hasClass('col-sm-7') || $('.main-container .toggle-menu-right').hasClass('col-sm-8')) {
            $('.main-container .toggle-menu-right').toggleClass('col-sm-7 col-sm-8');
        }

        if ($('.main-container .toggle-menu-right').hasClass('col-sm-10') || $('.main-container .toggle-menu-right').hasClass('col-sm-11')) {
            $('.main-container .toggle-menu-right').toggleClass('col-sm-10 col-sm-11');
        }
    });

    $("#main_menu ul li.has-children").hover(
        function () {
            $("#main_menu ul li.has-children").removeClass('hover');
            $(this).addClass('hover');
        },
        function () {
            $("#main_menu ul li.has-children").removeClass('hover');
        }
    );
});

