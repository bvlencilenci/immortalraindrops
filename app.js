// Import necessary Firebase modules and the initialized services
import { ref, uploadBytesResumable, getDownloadURL } from "https://www.gstatic.com/firebasejs/9.4.0/firebase-storage.js";
import { collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/9.4.0/firebase-firestore.js";
import { db, storage } from './firebase.js'; // import firebase config

// Function to upload beat data
async function uploadBeatData(beatData, imageFile, audioFile) {
  try {
    // Upload the image to Firebase Storage
    const imageStorageRef = ref(storage, `beats/images/${imageFile.name}`);
    const imageUploadTask = uploadBytesResumable(imageStorageRef, imageFile);

    // Wait for the image upload to complete
    await imageUploadTask;

    // Get the download URL of the uploaded image
    const imageURL = await getDownloadURL(imageStorageRef);

    // Upload the audio to Firebase Storage
    const audioStorageRef = ref(storage, `beats/audio/${audioFile.name}`);
    const audioUploadTask = uploadBytesResumable(audioStorageRef, audioFile);

    // Wait for the audio upload to complete
    await audioUploadTask;

    // Get the download URL of the uploaded audio
    const audioURL = await getDownloadURL(audioStorageRef);

    // Add the beat data to Firestore
    const beatsCollection = collection(db, "beats");
    await addDoc(beatsCollection, {
      name: beatData.name,
      price: beatData.price,
      createdAt: serverTimestamp(),
      image: imageURL,
      audio: audioURL,
    });

    console.log("Beat uploaded successfully!");
  } catch (error) {
    console.error("Error uploading beat: ", error);
  }
}

// Handle form submission
function handleFormSubmit(event) {
  event.preventDefault(); // Prevent the form from refreshing the page

  const beatName = document.getElementById('beatName').value;
  const beatPrice = document.getElementById('beatPrice').value;
  const imageFile = document.getElementById('imageFile').files[0];
  const audioFile = document.getElementById('audioFile').files[0];

  // Ensure files are selected before uploading
  if (imageFile && audioFile) {
    const beatData = {
      name: beatName,
      price: beatPrice
    };

    // Upload beat data
    uploadBeatData(beatData, imageFile, audioFile);
  } else {
    alert("Please select both an image and an audio file.");
  }
}

// Attach event listener to form
document.getElementById('beatForm').addEventListener('submit', handleFormSubmit);
