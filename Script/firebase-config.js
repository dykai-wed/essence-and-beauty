import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';

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

export { app, auth, db }; 