import { auth, db, provider } from "../firebase.js";

import {
  signInWithPopup,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
  doc,
  setDoc,
  getDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { syncLeaderboard } from "../js/leaderboard-sync.js";

async function criarPerfil(user) {
  const ref = doc(db, "users", user.uid);
  const snap = await getDoc(ref);

  if (!snap.exists()) {
    await setDoc(ref, {
      uid: user.uid,
      nome: user.displayName || "Dev Zyro",
      email: user.email || "",
      foto: user.photoURL || "",
      photoURL: user.photoURL || "",
      selectedAvatar: "google",
      ownedAvatars: ["google"],
      displayName: user.displayName || "Dev Zyro",
      xp: 0,
      moedas: 100,
      nivel: 1,
      streak: 1,
      ultimoAcesso: serverTimestamp(),
      dataEntrada: serverTimestamp(),
      aulasConcluidas: [],
      personagemSelecionado: "dev_iniciante",
      inventario: ["dev_iniciante"],
      vidas: 5,
      nomeEditado: false,
      trocouNome: false,
      onboardingCompleted: false,
      equippedBanner: "zyro-code"
    });
    await syncLeaderboard(user.uid, {
      uid: user.uid,
      nome: user.displayName || "Dev Zyro",
      displayName: user.displayName || "Dev Zyro",
      photoURL: user.photoURL || "",
      xp: 0,
      nivel: 1,
      personagemSelecionado: "dev_iniciante"
    });
  } else {
    await setDoc(ref, {
      ultimoAcesso: serverTimestamp()
    }, { merge: true });
  }
}

async function verificarOnboardingERotear(user) {
  if (!user) return;

  try {
    const userRef = doc(db, "users", user.uid);
    const userSnap = await getDoc(userRef);
    const data = userSnap.exists() ? userSnap.data() : {};

    if (!userSnap.exists()) {
      window.location.href = "../onboarding/onboarding.html";
      return;
    }

    if (data.onboardingCompleted !== true) {
      window.location.href = "../onboarding/onboarding.html";
      return;
    }

    window.location.href = "../index.html";
  } catch (error) {
    console.error("Erro ao verificar onboarding:", error);
    alert("Erro ao verificar status. Tente novamente.");
  }
}

const btnGoogle = document.getElementById("btnGoogle");
const btnGuest = document.getElementById("btnGuest");
const btnLogout = document.getElementById("btnLogout");

function showStatus(msg) {
  try {
    let el = document.getElementById("loginStatus");
    if (!el) {
      el = document.createElement("div");
      el.id = "loginStatus";
      el.style.position = "fixed";
      el.style.left = "0";
      el.style.right = "0";
      el.style.top = "0";
      el.style.padding = "12px";
      el.style.background = "rgba(0,0,0,0.85)";
      el.style.color = "#fff";
      el.style.textAlign = "center";
      el.style.zIndex = "9999";
      el.style.fontSize = "16px";
      document.body.appendChild(el);
    }
    el.textContent = msg;
  } catch (e) {
    console.error("Erro ao exibir status de login:", e);
  }
}

function handleAuthError(e) {
  console.error("Firebase Auth error:", e && e.code ? e.code : e, e && e.message ? e.message : e);
  if (!e || !e.code) return;
  switch (e.code) {
    case "auth/unauthorized-domain":
      console.error("Domínio não autorizado. Adicione o domínio nas configurações do Firebase Authentication (Authorized domains).");
      break;
    case "auth/popup-blocked":
      console.error("Popup bloqueado pelo navegador. Permita popups ou tente em modo desktop com signInWithPopup.");
      break;
    case "auth/popup-closed-by-user":
      console.error("Popup fechado pelo usuário antes de concluir o login.");
      break;
    case "auth/network-request-failed":
      console.error("Falha de rede. Verifique sua conexão e tente novamente.");
      break;
    default:
      console.error(e);
  }
}

if (btnGoogle) {
  btnGoogle.addEventListener("click", async (ev) => {
    if (ev && ev.preventDefault) ev.preventDefault();

    try {
      localStorage.removeItem("zyroGuest");
      localStorage.removeItem("zyroUserName");

      const result = await signInWithPopup(auth, provider);
      if (result && result.user) {
        showStatus("Login feito, entrando...");
        await criarPerfil(result.user);
        await verificarOnboardingERotear(result.user);
        return;
      }
    } catch (err) {
      console.error("Erro signInWithPopup:", err && err.code ? err.code : err, err && err.message ? err.message : err);
      handleAuthError(err);
      alert("Erro ao entrar com Google: " + (err && err.message ? err.message : err));
    }
  });
}

if (btnGuest) {
  btnGuest.addEventListener("click", () => {
    localStorage.setItem("zyroGuest", "true");
    localStorage.setItem("zyroUserName", "Visitante");
    window.location.href = "../index.html";
  });
}

if (btnLogout) {
  btnLogout.addEventListener("click", async () => {
    localStorage.removeItem("zyroGuest");
    localStorage.removeItem("zyroUserName");
    await signOut(auth);
    window.location.href = "../login/login.html";
  });
}

onAuthStateChanged(auth, async (user) => {
  try {
    const isGuest = localStorage.getItem("zyroGuest") === "true";

    if (isGuest) {
      return;
    }

    if (user) {
      try {
        await criarPerfil(user);
        await verificarOnboardingERotear(user);
      } catch (err) {
        console.error("Erro ao processar usuário em onAuthStateChanged:", err && err.code ? err.code : err, err && err.message ? err.message : err);
      }
    }
  } catch (e) {
    console.error("Erro em onAuthStateChanged handler:", e && e.code ? e.code : e, e && e.message ? e.message : e);
  }
});
