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

    $('#decreto-notifications-popup').load('ajax/notifications-popup');
    $('#decreto-notes-popup').load('ajax/notes-popup');
    $('#decreto-memos-popup').load('ajax/memos-popup');
});
