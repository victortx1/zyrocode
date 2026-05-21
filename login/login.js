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

console.log('[login] login.js carregado', {
  auth: !!auth,
  db: !!db,
  provider: !!provider,
  location: window.location.href
});

let redirectProcessed = false; // evita processar o retorno do redirect mais de uma vez

function isMobile() {
  if (typeof navigator === "undefined") return false;
  return /Mobi|Android|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i.test(navigator.userAgent);
}

function handleAuthError(e) {
  console.error("Firebase Auth error:", e && e.code ? e.code : e, e && e.message ? e.message : e, e && e.stack ? e.stack : "no-stack");
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
console.log('[login] Chamando getRedirectResult() para checar retorno de redirect...');
getRedirectResult(auth).then(async (result) => {
  console.log('[login] getRedirectResult() retornou:', result);
  if (result && result.user) {
    redirectProcessed = true;
    console.log('[login] Usuário retornou via redirect:', result.user);
    try {
      await criarPerfil(result.user);
      console.log('[login] Perfil criado/atualizado via redirect. Redirecionando...');
      await verificarOnboardingERotear(result.user);
    } catch (err) {
      console.error("Erro ao processar redirect result:", err && err.code ? err.code : err, err && err.message ? err.message : err, err && err.stack ? err.stack : 'no-stack');
    }
  } else {
    console.log('[login] getRedirectResult: sem usuário no resultado.');
  }
}).catch((e) => {
  console.error('[login] getRedirectResult() falhou:', e && e.code ? e.code : e, e && e.message ? e.message : e, e && e.stack ? e.stack : 'no-stack');
  handleAuthError(e);
});

if (btnGoogle) {
  btnGoogle.addEventListener("click", async () => {
    console.log('[login] btnGoogle click detectado');
    try {
      localStorage.removeItem("zyroGuest");
      localStorage.removeItem("zyroUserName");

      const mobile = isMobile();
      console.log('[login] isMobile =>', mobile, ' userAgent:', navigator.userAgent);

      if (mobile) {
        console.log('[login] Iniciando signInWithRedirect (mobile)...');
        try {
          await signInWithRedirect(auth, provider);
          console.log('[login] signInWithRedirect chamado com sucesso; aguardando retorno.');
        } catch (err) {
          console.error('[login] Erro ao chamar signInWithRedirect:', err && err.code ? err.code : err, err && err.message ? err.message : err, err && err.stack ? err.stack : 'no-stack');
          handleAuthError(err);
          alert('Erro ao iniciar login por redirect: ' + (err && err.message ? err.message : err));
        }
        return;
      }

      console.log('[login] Iniciando signInWithPopup (desktop)...');
      try {
        const result = await signInWithPopup(auth, provider);
        console.log('[login] signInWithPopup resultado:', result);
        if (result && result.user) {
          await criarPerfil(result.user);
          await verificarOnboardingERotear(result.user);
        }
      } catch (err) {
        console.error('[login] Erro signInWithPopup:', err && err.code ? err.code : err, err && err.message ? err.message : err, err && err.stack ? err.stack : 'no-stack');
        handleAuthError(err);
        alert('Erro ao entrar com Google (popup): ' + (err && err.message ? err.message : err));
      }
    } catch (e) {
      console.error('[login] Erro genérico no clique do login:', e && e.code ? e.code : e, e && e.message ? e.message : e, e && e.stack ? e.stack : 'no-stack');
      handleAuthError(e);
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
  try {
    console.log('[login] onAuthStateChanged fired, user:', user, 'auth.currentUser:', auth.currentUser);
    const isGuest = localStorage.getItem("zyroGuest") === "true";

    if (isGuest) {
      console.log('[login] Usuário é guest, ignorando onAuthStateChanged.');
      return;
    }

    if (user) {
      console.log('[login] Usuário autenticado via onAuthStateChanged:', user);
      // Se já processamos o redirect result, não precisamos duplicar ações.
      if (redirectProcessed) {
        console.log('[login] Redirect já processado; pulando duplicate handling.');
        return;
      }
      try {
        await criarPerfil(user);
        console.log('[login] Perfil criado/atualizado via onAuthStateChanged. Redirecionando...');
        await verificarOnboardingERotear(user);
      } catch (err) {
        console.error('[login] Erro ao processar usuário em onAuthStateChanged:', err && err.code ? err.code : err, err && err.message ? err.message : err, err && err.stack ? err.stack : 'no-stack');
      }
    } else {
      console.log('[login] onAuthStateChanged: nenhum usuário autenticado.');
    }
  } catch (e) {
    console.error('[login] Erro em onAuthStateChanged handler:', e && e.code ? e.code : e, e && e.message ? e.message : e, e && e.stack ? e.stack : 'no-stack');
  }
});