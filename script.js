// Wait until the document is fully loaded
document.addEventListener("DOMContentLoaded", function () {
  const players = document.querySelectorAll('.custom-audio-player');
  
  // Loop through all audio players on the page
  players.forEach((player) => {
      const audio = player.querySelector('audio');
      const playButton = player.querySelector('.play-button');
      const progressBar = player.querySelector('.progress-bar');
      const progressFill = player.querySelector('.progress-fill');
      
      // Play/Pause functionality
      playButton.addEventListener('click', () => {
          if (audio.paused) {
              audio.play();
              playButton.textContent = "Pause";
          } else {
              audio.pause();
              playButton.textContent = "Play";
          }
      });

      // Update progress bar as the audio plays
      audio.addEventListener('timeupdate', () => {
          const progress = (audio.currentTime / audio.duration) * 100;
          progressFill.style.width = `${progress}%`;
      });

      // Change audio position when clicking the progress bar
      progressBar.addEventListener('click', (e) => {
          const clickPosition = e.offsetX;
          const progressBarWidth = progressBar.offsetWidth;
          const newTime = (clickPosition / progressBarWidth) * audio.duration;
          audio.currentTime = newTime;
      });
  });
});
