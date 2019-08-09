jQuery(function($) {
    'use strict';

    // Flexy header
    flexy_header.init();

    $('.sidr-toggle--right').sidr({
        name: 'sidr-main',
        side: 'right',
        renaming: false,
        body: '.layout__wrapper',
        source: '.sidr-source-provider'
    });

    // Enable / disable Bootstrap tooltips, based upon touch events
    if(Modernizr.touchevents) {
        $('[data-toggle="tooltip"]').tooltip('hide');
    }
    else {
        $('[data-toggle="tooltip"]').tooltip();
    }

    // Poppy (popovers).
    $('.poppy-toggle').on('click', function(event) {
        var $element = $(this);
        var $parent = $element.parents('.poppy');

        // Make sure that no other "poppys" are open.
        $('.poppy--open')
            .not($parent)
            .removeClass('poppy--open');

        // Toggle the class on this element.
        $parent.toggleClass('poppy--open');
    });
    $('.poppy').on('click', function(event) {
       event.stopPropagation();
    });
    $('body').on('click', function(event) {
        $('.poppy--open').removeClass('poppy--open');
    });

    // Ajaxi click loader.
    $('[data-ajaxi-source]').on('click', function(event) {
        var $element = $(this);
        var target = $element.attr('data-ajaxi-target');
        var source = $element.attr('data-ajaxi-source');
        var loading = $element.attr('data-ajaxi-loading');

        // Set loading text.
        $(target).html(loading);

        // Load external content.
        $(target).load(source);
    });

    // Meeting agenda bulletpoints collapse toggle callback.
    $('#meeting-agenda-collapse-toggle').on('click', function(event) {
        // If we have any closed BP containers, open ALL first.
        if ($('article.decreto-bullet-point > .area-expand-collapse:not(.in)').length) {
          $('article.decreto-bullet-point > .area-expand-collapse').collapse('show');
        }
        // All BP containers are open, close ALL.
        else {
          $('article.decreto-bullet-point > .area-expand-collapse').collapse('hide');
        }
        event.preventDefault();
    });

    // Bullet point collapse toggle callback.
    $('.bullet-point-toggle').on('click', function(event) {
        var $wrapper = $(this).parents('article:first');
        // Opening BP container.
        $wrapper.find('> .area-expand-collapse').collapse('show');

        // If we have any closed BPA containers, open ALL first.
        if ($wrapper.find('article.decreto-bullet-point-attachment > .area-expand-collapse:not(.in)').length) {
          $wrapper.find('article.decreto-bullet-point-attachment > .area-expand-collapse').collapse('show');
        }
        // All BPA containers are open, close ALL.
        else {
          $wrapper.find('article.decreto-bullet-point-attachment > .area-expand-collapse').collapse('hide');
        }
        event.preventDefault();
    });

  // Switch mode toggle callback.
  $('#meeting-agenda-switch-mode-toggle').on('click', function (event) {
    $('#agenda-overview').toggleClass('hidden');
    $('#agenda-item-reorder').toggleClass('hidden');

    // Resetting search.
    $('.decreto-bullet-point.teaser, .decreto-bullet-point-attachment.teaser').removeClass('hidden');
    $('form.decreto-content-modify-search-in-meeting-form input').val('');

    // Toggle search enabled.
    if ($('#agenda-overview').hasClass('hidden')) {
      $('form.decreto-content-modify-search-in-meeting-form input').attr('disabled', 'disabled')
    }
    else {
      $('form.decreto-content-modify-search-in-meeting-form input').removeAttr('disabled');
    }
    event.preventDefault();
});
