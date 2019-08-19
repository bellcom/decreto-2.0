/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
(function ($) {
    Drupal.behaviors.decretoAnnotator = {
        attach: function (context, settings) {
            jQuery('.bulletpoint--attachment .bulletpoint__content').once('decreto-annotator').each(function (index) {
                //TODO: bug in touch plugin, submitted https://github.com/aron/annotator.touch.js/issues/13
//               jQuery('#'+this.getAttribute('id')).annotator().annotator('addPlugin', 'Touch', {
//                    force: 1,
//                    useHighlighter: location.search.indexOf('highlighter') > -1,
//                });
                var id = jQuery(this).parents('.bulletpoint').data('decreto-node-id');

                jQuery(this).annotator().annotator('addPlugin', 'Store', {
                    // The endpoint of the store on your server.
                    prefix: drupalSettings.path.baseUrl,
                    annotationData: {
                        'bpa_id': id,
                    },
                    loadFromSearch: {
                        'bpa_id': id,
                    },
                    urls: {
                        create: 'annotator/create',
                        read: 'annotator/read/:id',
                        update: 'annotator/update/:id',
                        destroy: 'annotator/delete/:id',
                        search: 'annotator/search'
                    }
                });
            });
        }
    };
})(jQuery);

