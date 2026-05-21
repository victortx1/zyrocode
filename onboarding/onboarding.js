import { auth, db } from "../firebase.js";

import {
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
  doc,
  setDoc,
  getDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// ========================================
// QUESTIONS DATA
// ========================================

const QUESTIONS = [
  {
    id: "nickname",
    type: "text",
    title: "Como devo te chamar?",
    subtitle: "Use seu apelido favorito",
    placeholder: "Digite seu apelido...",
    messages: [
      "Qual é seu apelido favorito?",
      "Que nome você gostaria de usar?"
    ]
  },
  {
    id: "motivation",
    type: "choice",
    title: "O que te motiva a aprender programação?",
    subtitle: "Escolha a opção que mais se encaixa",
    messages: [
      "Me conte o que te inspira!",
      "Qual é sua principal motivação?"
    ],
    options: [
      { id: "professional", label: "Quero me tornar um desenvolvedor profissional" },
      { id: "fun", label: "Só para me divertir" },
      { id: "career", label: "Para progredir na minha carreira atual" },
      { id: "create", label: "Para criar aplicativos, sites ou ferramentas internas" },
      { id: "other", label: "Tenho um motivo diferente" }
    ]
  },
  {
    id: "occupation",
    type: "choice",
    title: "Qual opção descreve você melhor?",
    subtitle: "Sua situação profissional ou acadêmica",
    messages: [
      "Me fale sobre você!",
      "Qual é sua situação atual?"
    ],
    options: [
      { id: "high_school", label: "Estudante do ensino médio" },
      { id: "university", label: "Estudante universitário" },
      { id: "employed", label: "Empregado" },
      { id: "freelancer", label: "Trabalhador por conta própria" },
      { id: "other", label: "Nenhuma dessas" }
    ]
  },
  {
    id: "interestPath",
    type: "choice",
    title: "O que você acha mais interessante?",
    subtitle: "Qual área te atrai mais",
    messages: [
      "Qual área te interessa?",
      "Qual é seu foco?"
    ],
    options: [
      { id: "web", label: "Criação de aplicativos web" },
      { id: "games", label: "Jogos de construção" },
      { id: "data", label: "Analisando dados" },
      { id: "ai", label: "Trabalhando com IA" },
      { id: "problem", label: "Resolver problemas" },
      { id: "unsure", label: "Eu não tenho certeza" }
    ]
  },
  {
    id: "experienceLevel",
    type: "choice",
    title: "Qual seu nível atual?",
    subtitle: "Sua experiência com programação",
    messages: [
      "Qual é sua experiência?",
      "Já têm feito algo com código?"
    ],
    options: [
      { id: "never", label: "Nunca programei" },
      { id: "basics", label: "Sei o básico" },
      { id: "projects", label: "Já fiz alguns projetos" },
      { id: "professional", label: "Quero me profissionalizar" }
    ]
  },
  {
    id: "studyGoal",
    type: "choice",
    title: "Qual sua meta de estudo?",
    subtitle: "Quanto tempo você quer dedicar diariamente",
    messages: [
      "Qual é seu objetivo?",
      "Quanto tempo você tem?"
    ],
    options: [
      { id: "10min", label: "10 minutos por dia" },
      { id: "20min", label: "20 minutos por dia" },
      { id: "30min", label: "30 minutos por dia" },
      { id: "1hour", label: "1 hora por dia" }
    ]
  },
  {
    id: "country",
    type: "select",
    title: "Qual país você mora?",
    subtitle: "Selecione seu país de residência",
    messages: [
      "De onde você é?",
      "Qual é seu país?"
    ],
    options: [
      { id: "br", label: "Brasil" },
      { id: "pt", label: "Portugal" },
      { id: "us", label: "Estados Unidos" },
      { id: "mx", label: "México" },
      { id: "ar", label: "Argentina" },
      { id: "co", label: "Colômbia" },
      { id: "cl", label: "Chile" },
      { id: "pe", label: "Peru" },
      { id: "ve", label: "Venezuela" },
      { id: "ec", label: "Equador" },
      { id: "bo", label: "Bolívia" },
      { id: "py", label: "Paraguai" },
      { id: "uy", label: "Uruguai" },
      { id: "es", label: "Espanha" },
      { id: "fr", label: "França" },
      { id: "de", label: "Alemanha" },
      { id: "it", label: "Itália" },
      { id: "uk", label: "Reino Unido" },
      { id: "ca", label: "Canadá" },
      { id: "au", label: "Austrália" },
      { id: "jp", label: "Japão" },
      { id: "in", label: "Índia" },
      { id: "other", label: "Outro" }
    ]
  }
];

// ========================================
// STATE MANAGEMENT
// ========================================

let currentStep = 0;
let answers = {};
let currentUser = null;

// ========================================
// DOM ELEMENTS
// ========================================

const progressFill = document.getElementById("progressFill");
const progressStep = document.getElementById("progressStep");
const progressTotal = document.getElementById("progressTotal");
const robotBubble = document.getElementById("robotBubble");
const questionCard = document.getElementById("questionCard");
const btnNext = document.getElementById("btnNext");
const btnPrev = document.getElementById("btnPrev");
const loadingOverlay = document.getElementById("loadingOverlay");

// ========================================
// INITIALIZATION
// ========================================

progressTotal.textContent = QUESTIONS.length;

// Check if user is logged in
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "../login/login.html";
    return;
  }

  currentUser = user;

  // Check if onboarding is already completed
  const userDoc = await getDoc(doc(db, "users", user.uid));
  if (userDoc.exists() && userDoc.data().onboardingCompleted === true) {
    window.location.href = "../perfil/perfil.html";
    return;
  }

  // Start onboarding
  renderQuestion(0);
});

// ========================================
// RENDER QUESTION
// ========================================

function renderQuestion(stepIndex) {
  currentStep = stepIndex;
  const question = QUESTIONS[stepIndex];

  // Update progress
  const progress = ((stepIndex + 1) / QUESTIONS.length) * 100;
  progressFill.style.width = progress + "%";
  progressStep.textContent = stepIndex + 1;

  // Update robot message
  const messageIndex = Math.floor(Math.random() * question.messages.length);
  robotBubble.textContent = question.messages[messageIndex];

  // Render question based on type
  let content = `
    <div class="question-title">${question.title}</div>
    ${question.subtitle ? `<div class="question-subtitle">${question.subtitle}</div>` : ""}
  `;

  if (question.type === "text") {
    content += `
      <input
        type="text"
        class="text-input-field"
        id="answerInput"
        placeholder="${question.placeholder}"
        value="${answers[question.id] || ""}"
        autocomplete="off"
      />
    `;
  } else if (question.type === "choice") {
    content += `<div class="options-container">`;
    question.options.forEach((option) => {
      const isSelected = answers[question.id] === option.id;
      content += `
        <button
          class="option-btn ${isSelected ? "selected" : ""}"
          data-value="${option.id}"
          data-label="${option.label}"
        >
          <span class="option-text">${option.label}</span>
        </button>
      `;
    });
    content += `</div>`;
  } else if (question.type === "select") {
    content += `<select class="select-field" id="answerSelect">`;
    content += `<option value="">Escolha uma opção...</option>`;
    question.options.forEach((option) => {
      const isSelected = answers[question.id] === option.id;
      content += `<option value="${option.id}" ${isSelected ? "selected" : ""}>${option.label}</option>`;
    });
    content += `</select>`;
  }

  questionCard.innerHTML = content;

  // Attach event listeners
  if (question.type === "text") {
    const input = document.getElementById("answerInput");
    input.focus();
    input.addEventListener("input", (e) => {
      answers[question.id] = e.target.value.trim();
    });
  } else if (question.type === "choice") {
    const buttons = document.querySelectorAll(".option-btn");
    buttons.forEach((btn) => {
      btn.addEventListener("click", () => {
        buttons.forEach((b) => b.classList.remove("selected"));
        btn.classList.add("selected");
        answers[question.id] = btn.dataset.value;
      });
    });
  } else if (question.type === "select") {
    const select = document.getElementById("answerSelect");
    select.addEventListener("change", (e) => {
      answers[question.id] = e.target.value;
    });
  }

  // Update buttons visibility
  btnPrev.style.display = stepIndex > 0 ? "block" : "none";
  btnNext.textContent = stepIndex === QUESTIONS.length - 1 ? "Finalizar ✨" : "Próximo →";
}

// ========================================
// BUTTON HANDLERS
// ========================================

btnNext.addEventListener("click", async () => {
  const question = QUESTIONS[currentStep];

  // Validate answer
  if (!answers[question.id]) {
    alert("Por favor, responda a pergunta antes de continuar.");
    return;
  }

  if (currentStep === QUESTIONS.length - 1) {
    // Last question - save to Firestore
    await saveOnboarding();
  } else {
    // Next question
    renderQuestion(currentStep + 1);
  }
});

btnPrev.addEventListener("click", () => {
  if (currentStep > 0) {
    renderQuestion(currentStep - 1);
  }
});

// ========================================
// SAVE ONBOARDING TO FIRESTORE
// ========================================

async function saveOnboarding() {
  if (!currentUser) return;

  loadingOverlay.style.display = "flex";

  try {
    // Generate profileNumber (starting from 100000)
    const profileNumber = Math.floor(Math.random() * 900000) + 100000;

    // Get displayName from answers or user data
    const displayName = answers.nickname || currentUser.displayName || "Dev Zyro";

    // Prepare user data
    const userData = {
      uid: currentUser.uid,
      email: currentUser.email || "",
      photoURL: currentUser.photoURL || "",
      displayName: displayName,
      name: currentUser.displayName || "Dev Zyro",
      nickname: answers.nickname,
      motivation: answers.motivation,
      occupation: answers.occupation,
      interestPath: answers.interestPath,
      experienceLevel: answers.experienceLevel,
      studyGoal: answers.studyGoal,
      country: answers.country,
      profileNumber: profileNumber,
      onboardingCompleted: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      // Keep existing fields for compatibility
      xp: 0,
      moedas: 100,
      nivel: 1,
      streak: 1,
      aulasConcluidas: [],
      personagemSelecionado: "dev_iniciante",
      inventario: ["dev_iniciante"],
      vidas: 5,
      nomeEditado: false,
      trocouNome: false
    };

    // Save to Firestore
    await setDoc(doc(db, "users", currentUser.uid), userData, { merge: true });

    // Wait a moment for visual feedback
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Redirect to profile
    window.location.href = "../perfil/perfil.html";
  } catch (error) {
    console.error("Erro ao salvar onboarding:", error);
    loadingOverlay.style.display = "none";
    alert("Erro ao salvar seu perfil. Tente novamente: " + error.message);
  }
}
