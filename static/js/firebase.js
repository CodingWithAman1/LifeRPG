import { initializeApp } from
    "https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js";

import {
    getAuth,
    GoogleAuthProvider
} from
    "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";

import {
    getFirestore
} from
    "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";


// ==========================================
// FIREBASE CONFIG
// ==========================================

const firebaseConfig = {
  apiKey: "AIzaSyCCu30ECJuM6MQiu0dRAxreZ9j-8kGzGU8",
  authDomain: "life-rpg-78b54.firebaseapp.com",
  projectId: "life-rpg-78b54",
  storageBucket: "life-rpg-78b54.firebasestorage.app",
  messagingSenderId: "423386710628",
  appId: "1:423386710628:web:3242df46612973cc205571",
  measurementId: "G-VPPD0FHNX4"
};


// ==========================================
// INITIALIZE
// ==========================================

const app = initializeApp(firebaseConfig);


// ==========================================
// FIREBASE SERVICES
// ==========================================

const auth = getAuth(app);

const db = getFirestore(app);

const googleProvider = new GoogleAuthProvider();


// ==========================================
// EXPORTS
// ==========================================

export {
    auth,
    db,
    googleProvider
};