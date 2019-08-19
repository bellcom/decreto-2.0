var toggleAllButtons = document.querySelectorAll('.js-bulletpoint-toggle-all');
var toggleBulletpointButtons = document.querySelectorAll('.js-bulletpoint-toggle-bulletpoint');
var toggleAttachmentsButtons = document.querySelectorAll('.js-bulletpoint-toggle-attachments');

// Toggle all.
for (var toggleAllButton of toggleAllButtons) {
  toggleAllButton.addEventListener('click', handleToggleAll);
}

function handleToggleAll(event) {
  event.preventDefault();

  var bulletpoints = document.getElementsByClassName('bulletpoint');
  var currentState = toggleAllButton.dataset.currentState;

  if (currentState === 'open') {
    toggleAllButton.dataset.currentState = 'closed';

    for (var bulletpoint of bulletpoints) {
      bulletpoint.classList.remove('bulletpoint--open');
    }
  }
  else {
    toggleAllButton.dataset.currentState = 'open';

    for (var bulletpoint of bulletpoints) {
      bulletpoint.classList.add('bulletpoint--open');
    }
  }
}

// Toggle attachments.
for (var toggleAttachmentButton of toggleAttachmentsButtons) {
  toggleAttachmentButton.addEventListener('click', handleToggleAttachments);
}

function handleToggleAttachments(event) {
  event.preventDefault();

  var element = this;
  var parent = element.closest('.bulletpoint');

  parent.classList.toggle('bulletpoint--open');

  // Run through attachments and toggle them.
  var attachments = parent.querySelectorAll('.bulletpoint--attachment');

  if (parent.classList.contains('bulletpoint--open')) {
    for (var attachment of attachments) {
      attachment.classList.add('bulletpoint--open');
    }
  }
  else {
    for (var attachment of attachments) {
      attachment.classList.remove('bulletpoint--open');
    }
  }
}

// Toggle bulletpoint.
for (var toggleBulletpointButton of toggleBulletpointButtons) {
  toggleBulletpointButton.addEventListener('click', handleToggleBulletpoint);
}

function handleToggleBulletpoint(event) {
  event.preventDefault();

  var element = this;
  var parent = element.closest('.bulletpoint');

  parent.classList.toggle('bulletpoint--open');
}
