/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
(function($) {
    Drupal.behaviors.decretoAnnotator = {
        attach: function(context, settings) {
            jQuery('.decreto-bullet-point-attachment .content').each(function(index) {
                jQuery('#'+this.getAttribute('id')).annotator().annotator('addPlugin', 'Store', {
                    // The endpoint of the store on your server.
                    prefix: drupalSettings.path.baseUrl,
                    annotationData: {
                        'bilag_id': this.getAttribute('id').replace('bpa-content-', ''),
                    },
                    loadFromSearch: {
                        'bilag_id': this.getAttribute('id').replace('bpa-content-', ''),
                    },
                    urls: {
                        create: 'annotator/create',
                        read: 'annotator/read/:id',
                        update: 'annotator/update/:id',
                        destroy: 'annotator/delete/:id',
                        search: 'annotator/search'
                    }
                });
            }
            );


        }
    };
})(jQuery);

