function displayBeats() {
    const beats = JSON.parse(localStorage.getItem("beats")) || [];
    const archiveContainer = document.getElementById("archiveContainer");
    archiveContainer.innerHTML = ""; // Clear any existing content

    beats.forEach(beat => {
        const archiveItem = document.createElement("div");
        archiveItem.classList.add("archive-item");

        // Beat Name
        const beatTitle = document.createElement("h2");
        beatTitle.textContent = beat.name;
        archiveItem.appendChild(beatTitle);

        // Beat Image with audio controls
        const beatImageContainer = document.createElement("div");
        beatImageContainer.classList.add("beat-image-container");

        const beatImage = document.createElement("img");
        beatImage.src = beat.imageSrc;
        beatImage.alt = beat.name;
        beatImage.classList.add("beat-image");
        beatImageContainer.appendChild(beatImage);

        // Audio Player Controls on the Image
        const audioControls = document.createElement("div");
        audioControls.classList.add("audio-controls");
        
        // Play Button as a triangle icon
        const playButton = document.createElement("button");
        playButton.classList.add("play-btn");
        playButton.innerHTML = '<i class="fas fa-play"></i>';  // FontAwesome triangle icon
        audioControls.appendChild(playButton);

        const audioProgress = document.createElement("input");
        audioProgress.type = "range";
        audioProgress.classList.add("audio-progress");
        audioProgress.value = 0;
        audioProgress.max = 100;
        audioControls.appendChild(audioProgress);

        beatImageContainer.appendChild(audioControls);
        archiveItem.appendChild(beatImageContainer);

        // Audio Source
        const audio = document.createElement("audio");
        audio.src = beat.audioSrc;
        audio.preload = "metadata";
        beatImageContainer.dataset.audio = audio; // Store the audio in the container for easy access

        // Price
        const priceElement = document.createElement("p");
        priceElement.textContent = `$${beat.price.toFixed(2)}`;
        archiveItem.appendChild(priceElement);

        // Append to archive container
        archiveContainer.appendChild(archiveItem);

        // Add event listeners for play/pause and audio progress
        playButton.addEventListener("click", () => {
            if (audio.paused) {
                audio.play();
                playButton.innerHTML = '<i class="fas fa-pause"></i>'; // Change icon to pause
            } else {
                audio.pause();
                playButton.innerHTML = '<i class="fas fa-play"></i>'; // Change icon back to play
            }
        });

        audio.addEventListener("timeupdate", () => {
            const progress = (audio.currentTime / audio.duration) * 100;
            audioProgress.value = progress;
        });

        audioProgress.addEventListener("input", (event) => {
            const progress = event.target.value;
            audio.currentTime = (audio.duration / 100) * progress;
        });
    });
}

window.onload = displayBeats;
