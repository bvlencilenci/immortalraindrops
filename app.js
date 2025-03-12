import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc } from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";

// Your Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyCt3InzocitfJcKken1EYLJbihwBECtYcI",
  authDomain: "immortal-raindops-databa.firebaseapp.com",
  databaseURL: "https://immortal-raindops-databa-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "immortal-raindops-databa",
  storageBucket: "immortal-raindops-databa.firebasestorage.app",
  messagingSenderId: "1098265239221",
  appId: "1:1098265239221:web:a039a4802a6d6133df28fc",
  measurementId: "G-RQGZEWFS6F"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);

// Handle Form Submission
document.getElementById("beatForm").addEventListener("submit", async (e) => {
    e.preventDefault();

    const beatName = document.getElementById("beatName").value;
    const beatPrice = document.getElementById("beatPrice").value;
    const imageFile = document.getElementById("imageFile").files[0];
    const audioFile = document.getElementById("audioFile").files[0];

    if (!beatName || !beatPrice || !imageFile || !audioFile) {
        alert("All fields are required!");
        return;
    }

    try {
        // Upload image
        const imageRef = ref(storage, `images/${imageFile.name}`);
        await uploadBytes(imageRef, imageFile);
        const imageUrl = await getDownloadURL(imageRef);

        // Upload audio
        const audioRef = ref(storage, `audio/${audioFile.name}`);
        await uploadBytes(audioRef, audioFile);
        const audioUrl = await getDownloadURL(audioRef);

        // Store metadata in Firestore
        const beatDoc = await addDoc(collection(db, "beats"), {
            name: beatName,
            price: parseFloat(beatPrice),
            imageUrl,
            audioUrl,
            timestamp: new Date()
        });

        alert("Beat uploaded successfully!");
        document.getElementById("beatForm").reset();
    } catch (error) {
        console.error("Upload failed:", error);
        alert("Error uploading beat!");
    }
});
console.error("Upload failed:", error.message);
