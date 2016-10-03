/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
jQuery(function($) { 
  $("#menu li.has-children").each(function( index ){
      $(this).children(":first").attr('href', '#');
  });
  var getBrowserWidth = function(){
    if(window.innerWidth < 768){
        // Extra Small Device
        return "xs";
    } else if(window.innerWidth < 991){
        // Small Device
        return "sm";
    } else if(window.innerWidth < 1199){
        // Medium Device
        return "md";
    } else {
        // Large Device
        return "lg";
    }
};
$( document ).ready(function() {
if (getBrowserWidth()=='xs'){
   $('#menu').removeClass('desktop-menu tablet-menu').addClass('phone-menu')   
 }
if (getBrowserWidth()=='sm'){
   $('#menu').removeClass('desktop-menu phone-menu').addClass('tablet-menu')
   $(".tablet-menu  li.has-children ul").addClass('sidebar');
   $(".tablet-menu li.has-children li").addClass('list-group-item');
   $("#organisation-switch li.has-children li").addClass('list-group-item');
 }
 if (getBrowserWidth()=='md' || getBrowserWidth()=='lg'){
   $('#menu').removeClass('tablet-menu phone-menu').addClass('desktop-menu')
   $(".desktop-menu  ul li.has-children ul").removeClass('sidebar');
   $(".desktop-menu  ul li.has-children li").removeClass('list-group-item');
   $("#organisation-switch li.has-children li").removeClass('list-group-item');
 }
});
    $('#main_menu_toggle_button').click(function() {
        $("#main_menu ul li.has-children ul").toggleClass('sidebar');
        $(".desktop-menu  li.has-children li").toggleClass('list-group-item');
        if ($(this).children('span').hasClass('glyphicon-chevron-left')){
          $(this).children('span').removeClass('glyphicon-chevron-left').addClass('glyphicon-chevron-right');           
          $('.sidebar-first').removeClass('col-md-3').addClass('col-md-2');
          $('#main_menu').parent('aside').removeClass('col-md-3').addClass('col-md-2');          
          $('.top-content').removeClass('col-md-7').addClass('col-md-8');         
          if ($('.region-sidebar-second').length>0)
            $('.main-content').parent('section').removeClass('col-md-6').addClass('col-md-7');
          else 
            $('.main-content').parent('section').removeClass('col-md-9').addClass('col-md-10');
        }
        else {
         $(this).children('span').removeClass('glyphicon-chevron-right').addClass('glyphicon-chevron-left');
         $('.sidebar-first').removeClass('col-md-2').addClass('col-md-3');
         $('#main_menu').parent('aside').removeClass('col-md-2').addClass('col-md-3');
         $('.top-content').removeClass('col-md-9').addClass('col-md-7');
         if ($('.region-sidebar-second').length>0)
            $('.main-content').parent('section').removeClass('col-md-7').addClass('col-md-6');
          else 
            $('.main-content').parent('section').removeClass('col-md-10').addClass('col-md-9');
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

