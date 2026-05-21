import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import {
  getAuth,
  GoogleAuthProvider
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
  getFirestore
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCw4tkCwVh6CWrZBEqawMm-27gYYoyoLo0",
  authDomain: "zyro-code.firebaseapp.com",
  projectId: "zyro-code",
  storageBucket: "zyro-code.firebasestorage.app",
  messagingSenderId: "615037544944",
  appId: "1:615037544944:web:a0ca942a980cb641cb5535"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const provider = new GoogleAuthProvider();