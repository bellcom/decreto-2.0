(function ($, Drupal) {
    'use strict';

    $.fn.appendValue = function(data) {
        if (this.val()) {
            this.val(this.val() + ',')
        }
        this.val(this.val() + data);
    };
    $.fn.removeValue = function(data) {
        if (this.val()) {
            var elements = this.val().split(',');
            var index = elements.indexOf(data);
            if (index > -1) {
                elements.splice(index, 1);
            }
            this.val(elements.join(','));
        }
    };


})(jQuery, Drupal);
