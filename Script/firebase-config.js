import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';
import { getStorage } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-storage.js';

// Your web app's Firebase configuration
const firebaseConfig = {
        apiKey: "AIzaSyDGZ7K0DaBQx_zdGcLFmtqGO8C2BgBijnM",
        authDomain: "onose-stores.firebaseapp.com",
        projectId: "onose-stores",
        storageBucket: "onose-stores.appspot.com",
        messagingSenderId: "997130682146",
        appId: "1:997130682146:web:a204b121e6ed9123c8af7b"
      
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// Emulator connection disabled for production or non-emulator use
// const isDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
// if (isDevelopment) {
//     try {
//         console.log('Connecting to Firebase emulators...');
//         connectAuthEmulator(auth, 'http://localhost:9099');
//         connectFirestoreEmulator(db, 'localhost', 8081);
//         connectStorageEmulator(storage, 'localhost', 9199);
//         console.log('Successfully connected to Firebase emulators');
//     } catch (error) {
//         console.error('Error connecting to emulators:', error);
//     }
// }

export { app, auth, db, storage }; 