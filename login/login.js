import { auth, db, provider } from "../firebase.js";

import {
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
  doc,
  setDoc,
  getDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

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
      onboardingCompleted: false
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

    console.log("DOC EXISTE?", userSnap.exists());
    console.log("ONBOARDING?", data.onboardingCompleted);

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

function isMobile() {
  if (typeof navigator === "undefined") return false;
  return /Mobi|Android|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i.test(navigator.userAgent);
}

function handleAuthError(e) {
  console.error("Firebase Auth error:", e && e.code ? e.code : e, e && e.message ? e.message : e);
  if (!e || !e.code) return;
  switch (e.code) {
    case "auth/unauthorized-domain":
      console.error("Domínio não autorizado. Adicione 'https://victortx1.github.io' nas configurações do Firebase Authentication (Authorized domains).");
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

// Processa resultado de redirect (quando o login foi via signInWithRedirect)
getRedirectResult(auth).then(async (result) => {
  if (result && result.user) {
    try {
      await criarPerfil(result.user);
      await verificarOnboardingERotear(result.user);
    } catch (err) {
      console.error("Erro ao processar redirect result:", err);
    }
  }
}).catch((e) => {
  handleAuthError(e);
});

if (btnGoogle) {
  btnGoogle.addEventListener("click", async () => {
    try {
      localStorage.removeItem("zyroGuest");
      localStorage.removeItem("zyroUserName");

      if (isMobile()) {
        // Mobile: usar redirect (mais compatível com navegadores móveis e WebView)
        await signInWithRedirect(auth, provider);
        // Não há resultado imediato aqui; a página será recarregada e getRedirectResult() acima cuidará do restante.
        return;
      }

      // Desktop: manter o comportamento com popup
      const result = await signInWithPopup(auth, provider);
      if (result && result.user) {
        await criarPerfil(result.user);
        await verificarOnboardingERotear(result.user);
      }
    } catch (e) {
      handleAuthError(e);
      try { console.error("Erro no login Google:", e); } catch (er) {}
      alert("Erro ao entrar com Google: " + (e && e.message ? e.message : e));
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
  const isGuest = localStorage.getItem("zyroGuest") === "true";

  if (isGuest) return;

  if (user) {
    await criarPerfil(user);
    await verificarOnboardingERotear(user);
  }
});