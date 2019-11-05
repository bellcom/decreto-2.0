(function ($, Drupal) {
  'use strict';

  Drupal.behaviors.decretoContentModifyQuickSearchList = {
    attach: function (context, settings) {
      var viewDisplayId = settings.quickSearch.viewDisplayId;
      var view = document.querySelector('.view-display-id-' + viewDisplayId);

      if (view) {
        var form = view.querySelector('#quick-search-elements-form');
        var input = view.querySelector('#quick-search-element-input');

        form.addEventListener('submit', filterElements);
        input.addEventListener('keyup', filterElements);
      }

      function filterElements(e) {
        e.preventDefault();

        var searchQuery = input.value;
        var elementsList = view.querySelector('#quick-search-elements-list');
        var elements = elementsList.getElementsByClassName('entity-list');
        var noResult = view.querySelector('.js-quick-search-no-results');
        var regex = new RegExp(searchQuery, 'gi');
        var hasMatches = false;

        // Run through collection of users.
        for (var i = 0; i < elements.length; i++) {
          var element = elements[i];
          var parentNode = element.parentElement;
          var name = element.dataset.quickSearchTitle;

          // Does match search query.
          if (name.match(regex)) {
            parentNode.classList.remove('hidden');
            hasMatches = true;
          }
          // Does not match.
          else {
            parentNode.classList.add('hidden');
          }
        }

        if (hasMatches) {
          elementsList.classList.remove('hidden');
          noResult.classList.add('hidden');
        }
        else {
          elementsList.classList.add('hidden');
          noResult.classList.remove('hidden');
        }
      }
    }
  };

})(jQuery, Drupal);
