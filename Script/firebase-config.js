import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js';
import { getAuth, connectAuthEmulator } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js';
import { getFirestore, connectFirestoreEmulator } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';
import { getStorage, connectStorageEmulator } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-storage.js';

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyDvjmkxuHXsUKPO6IN4dKoQCEkE_QCvUYk",
    authDomain: "tailor-3ef72.firebaseapp.com",
    projectId: "tailor-3ef72",
    storageBucket: "tailor-3ef72.firebasestorage.app",
    messagingSenderId: "69355156897",
    appId: "1:69355156897:web:60d73ac3ae11aad47f87e0",
    measurementId: "G-RX8BT206JZ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// Connect to emulators in development
const isDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
if (isDevelopment) {
    try {
        connectAuthEmulator(auth, 'http://localhost:9099');
        connectFirestoreEmulator(db, 'localhost', 8081);
        connectStorageEmulator(storage, 'localhost', 9199);
        console.log('Connected to Firebase emulators');
    } catch (error) {
        console.error('Error connecting to emulators:', error);
    }
}

export { app, auth, db, storage }; 