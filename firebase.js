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

let app = null;
try {
  console.log("[firebase] Inicializando Firebase com authDomain:", firebaseConfig.authDomain);
  app = initializeApp(firebaseConfig);
  console.log("[firebase] Firebase inicializado com sucesso.");
} catch (e) {
  console.error("[firebase] Erro ao inicializar Firebase:", e && e.code ? e.code : e, e && e.message ? e.message : e, e && e.stack ? e.stack : "no-stack");
  throw e;
}

export { app };
export const auth = getAuth(app);
console.log("[firebase] Auth instanciado:", !!auth);
export const db = getFirestore(app);
console.log("[firebase] Firestore instanciado:", !!db);
export const provider = new GoogleAuthProvider();
console.log("[firebase] GoogleAuthProvider criado.");