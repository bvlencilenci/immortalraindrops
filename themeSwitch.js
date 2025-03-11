const modeLinks = document.querySelectorAll('.mode-link');
const body = document.body;

// Function to update the mode
function updateMode(mode) {
    // Remove 'current' class from all links
    modeLinks.forEach(link => link.classList.remove('current'));

    if (mode === 'dark') {
        body.classList.add('dark-mode');
        document.querySelector('[data-mode="dark"]').classList.add('current');
        localStorage.setItem('theme', 'dark');
    } else {
        body.classList.remove('dark-mode');
        document.querySelector('[data-mode="light"]').classList.add('current');
        localStorage.setItem('theme', 'light');
    }
}

// Check stored theme preference
const savedTheme = localStorage.getItem('theme') || 'light';
updateMode(savedTheme);

// Event listener for mode switching
modeLinks.forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        const selectedMode = link.dataset.mode;
        updateMode(selectedMode);
    });
});
