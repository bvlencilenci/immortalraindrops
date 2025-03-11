// themeSwitch.js
document.addEventListener('DOMContentLoaded', function () {
  const modeLinks = document.querySelectorAll('.mode-link');
  
  // Check if there's a saved theme in localStorage
  if (localStorage.getItem('theme') === 'dark') {
      document.body.classList.add('dark-mode');
      document.querySelector('.mode-link[data-mode="dark"]').classList.add('current');
  } else {
      document.body.classList.remove('dark-mode');
      document.querySelector('.mode-link[data-mode="light"]').classList.add('current');
  }

  modeLinks.forEach(link => {
      link.addEventListener('click', function () {
          const mode = link.getAttribute('data-mode');
          
          if (mode === 'dark') {
              document.body.classList.add('dark-mode');
              localStorage.setItem('theme', 'dark');
          } else {
              document.body.classList.remove('dark-mode');
              localStorage.setItem('theme', 'light');
          }

          // Update the 'current' class on mode links
          modeLinks.forEach(link => link.classList.remove('current'));
          link.classList.add('current');
      });
  });
});
