(function ($, Drupal, drupalSettings) {
  'use strict';

  Drupal.behaviors.decretoContentModifyLinkStartEndDates = {
    attach: function (context, settings) {
      // Attaching behaviour only start date is shown once.
      // That prevents end date being instantly update on page load.
      $('.js-form-type-bootstrap-date-time.js-form-item-start-date input').on("dp.show", function (show_event) {
        $('.js-form-type-bootstrap-date-time.js-form-item-start-date input').not('.decretoContentModifyLinkStartEndDates-processed').on("dp.change", function (e) {
          $('.js-form-type-bootstrap-date-time.js-form-item-end-date input').datetimepicker({
            format: drupalSettings.decreto_bootstrap_datetimepicker.datetime_js_format,
            showTodayButton: true,
            showClose: true
          });
          $('.js-form-type-bootstrap-date-time.js-form-item-end-date input').data("DateTimePicker").date(moment(e.date).add(1, 'hours'));
        });
        $('.js-form-type-bootstrap-date-time.js-form-item-start-date input').addClass('decretoContentModifyLinkStartEndDates-processed');
      });


    }
  };

  Drupal.behaviors.decretoContentModifyParticipantsAdd = {
    attach: function (context, settings) {
      var store = [];
      var checkboxInputs = document.querySelectorAll('.js-checkbox input[type="checkbox"]');
      var searchInput = document.getElementById('meeting-member-filter-input');
      var truncateInternalMembers = document.querySelector('.js-truncate-internal-members');
      var truncateExternalMembers = document.querySelector('.js-truncate-external-members');

      // For some reason Drupal tries to attach the same library multiple times,
      // when in modal (about 20). The first times it's attached to "empty"
      // dom, that has no elements.
      // The little check below ensures that we only attach the behavior, when
      // we have the DOM ready.
      if (!searchInput) {
        return;
      }

      function filterMembers(e) {
        e.preventDefault();

        var hasMatches = false;
        var memberList = document.getElementById('meeting-member-list');
        var noResult = document.querySelector('.js-member-list-no-result');
        var searchQuery = e.target.value;
        var members = memberList.getElementsByClassName('js-meeting-member');
        var regex = new RegExp(searchQuery, 'gi');

        for (i = 0; i < members.length; i++) {
          var member = members[i];
          var name = member.dataset.name;
          var isMatch = (name.match(regex)) ? true : false;

          toggleMember(member, isMatch);
          highlightName(member, searchQuery, name);

          if (isMatch) {
            hasMatches = true;
          }
        }

        if (hasMatches) {
          memberList.classList.remove('hidden');
          noResult.classList.add('hidden');
        } else {
          memberList.classList.add('hidden');
          noResult.classList.remove('hidden');
        }
      }

      function toggleMember(element, isMatch) {
        if (isMatch) {
          element.classList.remove('hidden');
        }
        else {
          element.classList.add('hidden');
        }
      }

      function highlightName(element, searchQuery, name) {
        var wrapper = element.querySelector('.js-member-name-wrapper');
        var regex = new RegExp(searchQuery, 'gi');
        var highlightedName = name.replace(regex, function(str) {
          return '<strong>' + str + '</strong>';
        });

        wrapper.innerHTML = '<div>' + highlightedName + '</div>';
      }

      function handleCheckboxChange(e) {
        buildStore();
        populateMemberBoxes();
      }

      function buildStore() {
        var emptyStore = [];
        var memberList = document.getElementById('meeting-member-list');
        var members = memberList.getElementsByClassName('js-meeting-member');

        for (i = 0; i < members.length; i++) {
          var member = members[i];
          var item = createMemberItem(member);

          emptyStore.push(item);
        }

        mutateStore(emptyStore);
      }

      function createMemberItem(member) {
        var internalCheckbox = member.querySelector('.js-checkbox[data-member-type="internal"] input[type="checkbox"]');
        var externalCheckbox = member.querySelector('.js-checkbox[data-member-type="external"] input[type="checkbox"]');

        return {
          name: member.dataset.name,
          internal: internalCheckbox.checked,
          external: externalCheckbox.checked,
        }
      }

      function mutateStore(mutatedStore) {
        store = mutatedStore;
      }

      function populateMemberBoxes() {
        var internalMembersBox = document.querySelector('.js-members-box[data-member-type="internal"] .boxy__body');
        var externalMembersBox = document.querySelector('.js-members-box[data-member-type="external"] .boxy__body');

        var internalMembersListItems = [];
        var externalMembersListItems = [];

        for (i = 0; i < store.length; i++) {
          var member = store[i];

          if (member.internal) {
            internalMembersListItems.push(createMemberListItem(member));
          }

          if (member.external) {
            externalMembersListItems.push(createMemberListItem(member));
          }
        }

        injectMembersList(internalMembersBox, internalMembersListItems);
        injectMembersList(externalMembersBox, externalMembersListItems);
      }

      function injectMembersList(box, listItems) {
        var noResult = box.querySelector('.js-no-result-text');
        var wrapper = box.querySelector('.js-list-wrapper');

        if (listItems.length > 0) {
          var list = createBoxList(listItems);

          wrapper.innerHTML = '';
          wrapper.appendChild(list);

          // Hide no result text.
          noResult.classList.add('hidden');
          wrapper.classList.remove('hidden');
        } else {

          // Show no result text.
          noResult.classList.remove('hidden');
          wrapper.classList.add('hidden');
        }
      }

      function createBoxList(items) {
        var orderedList = document.createElement('OL');

        for (i = 0; i < items.length; i++) {
          var item = items[i];

          orderedList.appendChild(item);
        }

        return orderedList;
      }

      function createMemberListItem(member) {
        var listItem = document.createElement('li');
        var itemText = document.createTextNode(member.name);

        listItem.appendChild(itemText);

        return listItem;
      }

      function handleTruncateInternalMembers(e) {
        e.preventDefault();

        var checkboxes = document.querySelectorAll('.js-checkbox[data-member-type="internal"] input[type="checkbox"]');

        uncheckAllCheckboxes(checkboxes);

        buildStore();
        populateMemberBoxes();
      }

      function handleTruncateExternalMembers(e) {
        e.preventDefault();

        var checkboxes = document.querySelectorAll('.js-checkbox[data-member-type="external"] input[type="checkbox"]');

        uncheckAllCheckboxes(checkboxes);

        buildStore();
        populateMemberBoxes();
      }

      function uncheckAllCheckboxes(checkboxes) {
        for (i = 0; i < checkboxes.length; i++) {
          var checkbox = checkboxes[i];

          checkbox.checked = false;
        }
      }

      // Add event listeners.
      searchInput.addEventListener('keyup', filterMembers);
      truncateInternalMembers.addEventListener('click', handleTruncateInternalMembers);
      truncateExternalMembers.addEventListener('click', handleTruncateExternalMembers);

      for (var i = 0; i < checkboxInputs.length; i++) {
        var checkboxInput = checkboxInputs[i];

        checkboxInput.addEventListener('change', handleCheckboxChange);
      }

      // Set store on load.
      buildStore();
      populateMemberBoxes();
    }
  };

})(jQuery, Drupal, drupalSettings);
