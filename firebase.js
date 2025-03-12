// Import necessary Firebase modules (using v9+ modular SDK)
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.4.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/9.4.0/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/9.4.0/firebase-storage.js";

// Your Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCt3InzocitfJcKken1EYLJbihwBECtYcI",
  authDomain: "immortal-raindops-databa.firebaseapp.com",
  projectId: "immortal-raindops-databa",
  storageBucket: "immortal-raindops-databa.firebasestorage.app",
  messagingSenderId: "1098265239221",
  appId: "1:1098265239221:web:a039a4802a6d6133df28fc",
  measurementId: "G-RQGZEWFS6F"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore and Storage using the modular API
const db = getFirestore(app);
const storage = getStorage(app);

// Export the initialized services
export { db, storage };
