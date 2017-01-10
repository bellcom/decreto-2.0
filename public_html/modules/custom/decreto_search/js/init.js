jQuery(function($) {
    var defaultTitle = 'Select';
    $('.bootstrap-multiselect').multiselect({
        buttonText: function(options, select) {
            if (options.length === 0) {
                if ($(select).data('multiselect-title')) {
                    return $(select).data('multiselect-title');
                }
                return defaultTitle;
            }
            else if (options.length > 1) {
                return 'Multiple selected';
            }
            else {
                var labels = [];
                options.each(function() {
                    if ($(this).attr('label') !== undefined) {
                        labels.push($(this).attr('label'));
                    }
                    else {
                        labels.push($(this).html());
                    }
                });
                return labels.join(', ') + '';
            }
        }
    });
});