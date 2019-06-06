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

        // Make sure that no other windows are open.
        // $('.poppy--open').removeClass('poppy--open');

        // Toggle the class on this element.
        $parent.toggleClass('poppy--open');
    });

    // Ajaxi click loader.
    $('[data-ajaxi-source]').on('click', function(event) {
        var $element = $(this);
        var target = $element.attr('data-ajaxi-target');
        var source = $element.attr('data-ajaxi-source');

        // Load external content.
        $(target).load(source);
    });
});
