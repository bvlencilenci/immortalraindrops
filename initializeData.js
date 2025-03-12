// initializeData.js
const beats = [
  {
      name: "Beat 1",
      imageSrc: "images/beat1.jpg",  // Ensure these paths are correct
      audioSrc: "audio/beat1.mp3",
      price: 10.99
  },
  {
      name: "Beat 2",
      imageSrc: "images/beat2.jpg",  // Ensure these paths are correct
      audioSrc: "audio/beat2.mp3",
      price: 12.99
  },
  {
      name: "Beat 3",
      imageSrc: "images/beat3.jpg",  // Ensure these paths are correct
      audioSrc: "audio/beat3.mp3",
      price: 15.49
  }
];

// Store the beats in localStorage
localStorage.setItem("beats", JSON.stringify(beats));
