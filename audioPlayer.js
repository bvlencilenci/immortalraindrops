// Get elements
const audio = document.getElementById('audio');
const playPauseBtn = document.getElementById('playPauseBtn');
const seekBar = document.getElementById('seekBar');
const currentTimeDisplay = document.getElementById('current-time');
const durationDisplay = document.getElementById('duration');

// Play/Pause functionality
playPauseBtn.addEventListener('click', function() {
  if (audio.paused) {
    audio.play();
    playPauseBtn.textContent = 'Pause';
  } else {
    audio.pause();
    playPauseBtn.textContent = 'Play';
  }
});

// Update the seek bar as the audio plays
audio.addEventListener('timeupdate', function() {
  const currentTime = audio.currentTime;
  const duration = audio.duration;
  const seekValue = (currentTime / duration) * 100;
  seekBar.value = seekValue;

  // Update current time display
  currentTimeDisplay.textContent = formatTime(currentTime);

  // Update duration display
  if (duration) {
    durationDisplay.textContent = formatTime(duration);
  }
});

// Seek bar functionality
seekBar.addEventListener('input', function() {
  const seekTo = (seekBar.value / 100) * audio.duration;
  audio.currentTime = seekTo;
});

// Format time function (minutes:seconds)
function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
}
// Function to handle play/pause and update seek bar
function togglePlayPause(audioId, playPauseBtnId, seekBarId, currentTimeId, durationId) {
  const audio = document.getElementById(audioId);
  const playPauseBtn = document.getElementById(playPauseBtnId);
  const seekBar = document.getElementById(seekBarId);
  const currentTimeDisplay = document.getElementById(currentTimeId);
}
document.querySelectorAll('.play-pause').forEach((button, index) => {
  const audio = document.getElementById(`audio${index + 1}`);
  const playPauseBtn = button;

  playPauseBtn.addEventListener('click', function() {
      if (audio.paused) {
          audio.play();
          playPauseBtn.classList.add('playing');
          playPauseBtn.classList.remove('paused');
      } else {
          audio.pause();
          playPauseBtn.classList.add('paused');
          playPauseBtn.classList.remove('playing');
      }
  });

  // Update play/pause icon based on audio status
  audio.addEventListener('play', function() {
      playPauseBtn.classList.add('playing');
      playPauseBtn.classList.remove('paused');
  });

  audio.addEventListener('pause', function() {
      playPauseBtn.classList.add('paused');
      playPauseBtn.classList.remove('playing');
  });
});
