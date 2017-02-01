/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
jQuery(function ($) {

    //main menu
    $('#toggle-menu-trigger').click(function () {
        $('.toggle-menu-container').toggleClass('collapsed');
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

