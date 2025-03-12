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
const modeLinks = document.querySelectorAll('.mode-link');
const body = document.body;

// Check localStorage for saved mode
const savedMode = localStorage.getItem('theme');
if (savedMode === 'dark') {
  body.classList.add('dark-mode');
  document.querySelector('.mode-link[data-theme="dark"]').classList.add('active');
} else {
  body.classList.remove('dark-mode');
  document.querySelector('.mode-link[data-theme="light"]').classList.add('active');
}

// Toggle mode when clicking
modeLinks.forEach(link => {
  link.addEventListener('click', (e) => {
    e.preventDefault();
    const isDarkMode = link.getAttribute('data-theme') === 'dark';

    // Apply mode
    body.classList.toggle('dark-mode', isDarkMode);

    // Save mode to localStorage
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');

    // Update active mode styling
    modeLinks.forEach(l => l.classList.remove('active'));
    link.classList.add('active');
  });
});
