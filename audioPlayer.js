document.addEventListener('DOMContentLoaded', function () {
  // Loop through all audio players
  for (let i = 1; i <= 12; i++) {
      const audioPlayer = document.getElementById(`audio${i}`);
      const playPauseBtn = document.getElementById(`playPauseBtn${i}`);
      const seekBar = document.getElementById(`seekBar${i}`);
      const currentTime = document.getElementById(`current-time${i}`);
      const duration = document.getElementById(`duration${i}`);
      
      // Update duration display when audio metadata is loaded
      audioPlayer.addEventListener('loadedmetadata', function () {
          const durationFormatted = formatTime(audioPlayer.duration);
          duration.textContent = durationFormatted;
      });

      // Play/Pause button functionality
      playPauseBtn.addEventListener('click', function () {
          if (audioPlayer.paused) {
              audioPlayer.play();
              playPauseBtn.textContent = 'Pause';
          } else {
              audioPlayer.pause();
              playPauseBtn.textContent = 'Play';
          }
      });

      // Update seek bar as audio plays
      audioPlayer.addEventListener('timeupdate', function () {
          const currentTimeFormatted = formatTime(audioPlayer.currentTime);
          currentTime.textContent = currentTimeFormatted;

          const progress = (audioPlayer.currentTime / audioPlayer.duration) * 100;
          seekBar.style.background = `linear-gradient(to right, #bf3636cb ${progress}%, #ddd ${progress}%)`;  // Fill up the progress bar without showing thumb
      });

      // Optional: Allow clicking on the progress bar to seek
      seekBar.addEventListener('click', function (e) {
          const rect = seekBar.getBoundingClientRect();
          const offsetX = e.clientX - rect.left;
          const newTime = (offsetX / rect.width) * audioPlayer.duration;
          audioPlayer.currentTime = newTime;
      });
  }

  // Format time as mm:ss
  function formatTime(seconds) {
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = Math.floor(seconds % 60);
      return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
  }
});
