/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
jQuery(function($) {

    $('#main_menu_toggle_button').click(function() {
        $("#main_menu ul li.has-children ul").toggleClass('sidebar');
        if ($(this).children('span').hasClass('glyphicon-chevron-left')){
          $(this).children('span').removeClass('glyphicon-chevron-left').addClass('glyphicon-chevron-right');           
          $('.sidebar-first').removeClass('col-sm-3').addClass('col-sm-2');
          $('.top-content').removeClass('col-sm-7').addClass('col-sm-8');
        
          if ($('.region-sidebar-second').length>0)
            $('.main-content').removeClass('col-sm-6').addClass('col-sm-7');
          else 
            $('.main-content').removeClass('col-sm-9').addClass('col-sm-10');
        }
        else {
         $(this).children('span').removeClass('glyphicon-chevron-right').addClass('glyphicon-chevron-left');
         $('.sidebar-first').removeClass('col-sm-2').addClass('col-sm-3');
         $('.top-content').removeClass('col-sm-9').addClass('col-sm-7');
         if ($('.region-sidebar-second').length>0)
            $('.main-content').removeClass('col-sm-7').addClass('col-sm-6');
          else 
            $('.main-content').removeClass('col-sm-10').addClass('col-sm-9');
        }
     return false;  
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

