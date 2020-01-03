(function() {
  const sidebar = document.querySelector('.layout__sidebar');
  const toggles = document.querySelectorAll('.js-toggle-sidebar');

  const toggleState = () => {
    const currentState = localStorage.getItem('sidebar');

    if (currentState === 'narrow') {
      localStorage.setItem('sidebar', 'wide');
    }
    else {
      localStorage.setItem('sidebar', 'narrow');
    }
  };

  // Add eventlisteners.
  for (var i = 0; i < toggles.length; i++) {
    let toggle = toggles[i];

    toggle.addEventListener('click', e => {
      sidebar.classList.toggle('layout__sidebar--narrow');

      toggleState();
    });
  }

  // On load.
  const currentState = localStorage.getItem('sidebar');

  if (currentState === 'narrow') {
    sidebar.classList.add('layout__sidebar--narrow');
  }
  else {
    sidebar.classList.remove('layout__sidebar--narrow');
  }
})();
