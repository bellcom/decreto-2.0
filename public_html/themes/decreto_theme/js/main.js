/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
jQuery(function($) {

    $('#user_menu_button').click(function() {
        $(this).parent().find('.user-sub-menu').toggle();
    });

    $('#main_menu_toggle_button').click(function() {
        $("#main_menu ul li.has-children ul").toggleClass('sidebar');
        if ($(this).hasClass('glyphicon-chevron-left')){
          $(this).removeClass('glyphicon-chevron-left').addClass('glyphicon-chevron-right');           
          $('.left-sidebar').removeClass('col-sm-3').addClass('col-sm-2');
          $('.top-content').removeClass('col-sm-7').addClass('col-sm-8');
          $('.content').removeClass('col-sm-9').addClass('col-sm-10');
        }
        else {
         $(this).removeClass('glyphicon-chevron-right').addClass('glyphicon-chevron-left');
         $('.left-sidebar').removeClass('col-sm-2').addClass('col-sm-3');
         $('.top-content').removeClass('col-sm-9').addClass('col-sm-7');
         $('.content').removeClass('col-sm-10').addClass('col-sm-9');
        }
            
    });

    $("#main_menu ul li.has-children").hover(
        function() {
          $("#main_menu ul li.has-children").removeClass('hover');
          $(this).addClass('hover');
       }, 
       function() {
        $("#main_menu ul li.has-children").removeClass('hover');
    }


    );
});

