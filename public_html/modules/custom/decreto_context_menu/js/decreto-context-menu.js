(function ($) {
    Drupal.behaviors.decretoContextMenu = {
        attach: function (context, settings) {
            if ($('.cd-stretchy-nav').length > 0) {
                var stretchyNavs = $('.cd-stretchy-nav');

                stretchyNavs.each(function () {
                    var stretchyNav = $(this),
                        stretchyNavTrigger = stretchyNav.find('.cd-nav-trigger');

                    stretchyNavTrigger.unbind('click');
                    stretchyNavTrigger.on('click', function (event) {
                        event.preventDefault();
                        stretchyNav.toggleClass('nav-is-visible');
                    });
                });

                $(document).unbind('click', hideMenuOnDocumentClick);
                $(document).bind('click', hideMenuOnDocumentClick);
            }
        }
    };

    var hideMenuOnDocumentClick = function (event) {
        ( !$(event.target).is('.cd-nav-trigger') && !$(event.target).is('.cd-nav-trigger span') ) && $('.cd-stretchy-nav').removeClass('nav-is-visible');
    };
})(jQuery);
