import { auth, db } from "./firebase.js";

import {
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
  doc,
  getDoc,
  updateDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const GUIDE_STEPS = [
  {
    step: 1,
    page: "index.html",
    title: "Lobby / Mapa",
    text: "Aqui ficam suas aulas e módulos. Use esta área para começar pelo primeiro módulo e avançar nas fases.",
    target: "#phaseMap",
    continueLabel: "Continuar",
    showPrev: false
  },
  {
    step: 2,
    page: "missoes/missoes.html",
    title: "Missões Diárias",
    text: "As missões renovam todo dia e dão XP, moedas e recompensas. Complete cada missão para progredir mais rápido.",
    target: "#missionsList",
    continueLabel: "Continuar",
    showPrev: true
  },
  {
    step: 3,
    page: "ranking/ranking.html",
    title: "Ranking Global",
    text: "Aqui você compete com outros jogadores. Suba no ranking ganhando XP e mostrando seu progresso.",
    target: "#rankingList",
    continueLabel: "Continuar",
    showPrev: true,
    manualNavigationOnly: true
  },
  {
    step: 4,
    page: "loja/loja.html",
    title: "Loja do ZYRO",
    text: "Nesta loja você pode comprar personagens, itens e personalizar seu perfil com moedas.",
    target: "#shopContent",
    continueLabel: "Continuar",
    showPrev: true
  },
  {
    step: 5,
    page: "perfil/perfil.html",
    title: "Seu Perfil",
    text: "Seu perfil mostra país, nível, XP, moedas, personagem, nome e seus dados de onboarding.",
    target: "#perfilWrap",
    continueLabel: "Continuar",
    showPrev: true
  },
  {
    step: 6,
    page: "index.html",
    title: "Voltar aos estudos",
    text: "Agora volte ao Módulo 1 e comece sua primeira aula. Clique em começar agora para iniciar.",
    target: "#phaseMap",
    continueLabel: "Começar agora",
    showPrev: true,
    final: true
  }
];

const guideState = {
  currentStep: 1,
  userId: null,
  active: false,
  overlay: null,
  highlight: null,
  panel: null
};

function getCurrentPagePath() {
  const path = window.location.pathname.replace(/\\/g, "/");
  if (path.endsWith("/index.html") || path.endsWith("/")) return "index.html";
  if (path.endsWith("/missoes/missoes.html")) return "missoes/missoes.html";
  if (path.endsWith("/ranking/ranking.html")) return "ranking/ranking.html";
  if (path.endsWith("/loja/loja.html")) return "loja/loja.html";
  if (path.endsWith("/perfil/perfil.html")) return "perfil/perfil.html";
  return "";
}

function getStep(stepNumber) {
  return GUIDE_STEPS.find((step) => step.step === stepNumber);
}

function createGuideElements() {
  if (guideState.overlay) return;

  const overlay = document.createElement("div");
  overlay.id = "guideOverlay";
  overlay.className = "guide-overlay";

  const highlight = document.createElement("div");
  highlight.id = "guideHighlight";
  highlight.className = "guide-highlight";

  const panel = document.createElement("div");
  panel.id = "guidePanel";
  panel.className = "guide-panel";
  panel.innerHTML = `
    <div class="guide-header">
      <div class="guide-badge">ZYRO ASSISTENTE</div>
      <button class="guide-skip" id="guideSkip">Pular guia</button>
    </div>
    <div class="guide-body">
      <h2 id="guideTitle"></h2>
      <p id="guideText"></p>
    </div>
    <div class="guide-controls">
      <button class="guide-btn guide-prev" id="guidePrev">Voltar</button>
      <button class="guide-btn guide-next" id="guideNext">Continuar</button>
    </div>
  `;

  overlay.appendChild(highlight);
  overlay.appendChild(panel);
  document.body.appendChild(overlay);

  guideState.overlay = overlay;
  guideState.highlight = highlight;
  guideState.panel = panel;

  document.getElementById("guideSkip").addEventListener("click", async () => {
    await completeGuide();
  });

  document.getElementById("guidePrev").addEventListener("click", async () => {
    await goToStep(guideState.currentStep - 1);
  });

  document.getElementById("guideNext").addEventListener("click", async () => {
    await goToStep(guideState.currentStep + 1);
  });
}

function updateHighlight(targetSelector) {
  const target = document.querySelector(targetSelector);
  const highlight = guideState.highlight;

  if (!target || !highlight) {
    highlight.style.display = "none";
    return;
  }

  target.scrollIntoView({ behavior: "smooth", block: "center", inline: "center" });
  const rect = target.getBoundingClientRect();

  highlight.style.display = "block";
  highlight.style.top = `${rect.top - 12 + window.scrollY}px`;
  highlight.style.left = `${rect.left - 12 + window.scrollX}px`;
  highlight.style.width = `${rect.width + 24}px`;
  highlight.style.height = `${rect.height + 24}px`;
}

function updatePanel(step) {
  if (!guideState.panel) return;

  document.getElementById("guideTitle").textContent = step.title;
  document.getElementById("guideText").textContent = step.text;
  document.getElementById("guidePrev").style.display = step.showPrev ? "inline-flex" : "none";
  document.getElementById("guideNext").textContent = step.continueLabel;

  if (step.final) {
    document.getElementById("guideNext").textContent = step.continueLabel;
  }
}

function showGuide(step) {
  guideState.active = true;
  guideState.currentStep = step.step;
  createGuideElements();
  guideState.overlay.classList.add("active");
  updatePanel(step);
  updateHighlight(step.target);
}

function hideGuide() {
  if (!guideState.overlay) return;
  guideState.active = false;
  guideState.overlay.classList.remove("active");
}

async function saveGuideStep(stepNumber) {
  if (!guideState.userId) return;
  try {
    await updateDoc(doc(db, "users", guideState.userId), {
      guideStep: stepNumber,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error("Erro ao salvar guideStep:", error);
  }
}

async function completeGuide() {
  if (!guideState.userId) return;
  try {
    await updateDoc(doc(db, "users", guideState.userId), {
      guideCompleted: true,
      guideStep: GUIDE_STEPS.length,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error("Erro ao completar guia:", error);
  }
  hideGuide();
}

function getRelativePathForStep(step) {
  return `./${step.page}`;
}

async function goToStep(stepNumber) {
  const step = getStep(stepNumber);
  if (!step) return;

  guideState.currentStep = stepNumber;
  await saveGuideStep(stepNumber);

  const currentPath = getCurrentPagePath();

  if (currentPath !== step.page) {
    if (step.manualNavigationOnly) {
      hideGuide();
      return;
    }
    window.location.href = getRelativePathForStep(step);
    return;
  }

  showGuide(step);
}

async function initGuide(user) {
  guideState.userId = user.uid;

  try {
    const userSnap = await getDoc(doc(db, "users", user.uid));
    if (!userSnap.exists()) return;

    const data = userSnap.data();
    const shouldRunGuide = data.onboardingCompleted === true && data.guideCompleted !== true;
    if (!shouldRunGuide) return;

    const stepNumber = data.guideStep ? data.guideStep : 1;
    const requestedStep = getStep(stepNumber);
    if (!requestedStep) return;

    const currentPath = getCurrentPagePath();
    if (currentPath !== requestedStep.page) {
      await saveGuideStep(stepNumber);
      if (requestedStep.manualNavigationOnly) {
        return;
      }
      window.location.href = getRelativePathForStep(requestedStep);
      return;
    }

    showGuide(requestedStep);
  } catch (error) {
    console.error("Erro ao iniciar guide:", error);
  }
}

onAuthStateChanged(auth, async (user) => {
  if (!user) return;
  await initGuide(user);
});
