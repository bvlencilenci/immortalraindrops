document.addEventListener('DOMContentLoaded', function() {
    const lightModeBtn = document.getElementById('light-mode');
    const darkModeBtn = document.getElementById('dark-mode');
    
    // Check if dark mode is enabled from local storage
    if (localStorage.getItem('theme') === 'dark') {
        document.body.classList.add('dark-mode');
        lightModeBtn.classList.remove('active');
        darkModeBtn.classList.add('active');
    }

    // Toggle light and dark mode
    lightModeBtn.addEventListener('click', function() {
        document.body.classList.remove('dark-mode');
        lightModeBtn.classList.add('active');
        darkModeBtn.classList.remove('active');
        localStorage.setItem('theme', 'light'); // Save preference
    });

    darkModeBtn.addEventListener('click', function() {
        document.body.classList.add('dark-mode');
        lightModeBtn.classList.remove('active');
        darkModeBtn.classList.add('active');
        localStorage.setItem('theme', 'dark'); // Save preference
    });
});
