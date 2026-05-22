import { auth, db } from "../firebase.js";

import {
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
  doc,
  getDoc,
  updateDoc,
  increment,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { syncLeaderboard } from "../js/leaderboard-sync.js";
import { equipCosmetic as equipCosmeticCloud } from "../js/game-api.js";

const wrap = document.getElementById("perfilWrap");

const DEFAULT_BANNER_ID = "zyro-code";
const NICKNAME_MIN = 2;
const NICKNAME_MAX = 30;
const NICKNAME_PATTERN = /^[\p{L}\p{N}][\p{L}\p{N} _.-]*$/u;

function normalizeBannerId(id) {
  if (!id || id === "orange_default") return DEFAULT_BANNER_ID;
  return id;
}

function normalizeAvatarId(id) {
  if (id === "Astro") return "astro";
  if (id === "avatar_default") return "google";
  return id;
}

function validateNickname(raw) {
  const value = String(raw || "").trim();

  if (value.length < NICKNAME_MIN || value.length > NICKNAME_MAX) {
    return {
      ok: false,
      message: `Apelido deve ter entre ${NICKNAME_MIN} e ${NICKNAME_MAX} caracteres.`
    };
  }

  if (!NICKNAME_PATTERN.test(value)) {
    return {
      ok: false,
      message: "Use apenas letras, números, espaço e os símbolos . _ -"
    };
  }

  return { ok: true, value };
}

const CHARS = {
  dev_iniciante: "👨‍💻",
  dev_ninja: "🥷",
  dev_robo: "🤖",
  dev_hacker: "🕵️",
  dev_mestre: "🧙"
};

const CHAR_NAMES = {
  dev_iniciante: "Dev Iniciante",
  dev_ninja: "Dev Ninja",
  dev_robo: "Dev Robô",
  dev_hacker: "Dev Hacker",
  dev_mestre: "Dev Mestre"
};

const LEVEL_DISPLAY = {
  never: "Dev Iniciante",
  basics: "Dev Aprendiz",
  projects: "Dev Intermediário",
  professional: "Futuro Dev Profissional"
};

const LEAGUES = [
  { name: "Bronze", xp: 0, icon: "♦️" },
  { name: "Prata", xp: 300, icon: "🥈" },
  { name: "Ouro", xp: 700, icon: "🥇" },
  { name: "Platina", xp: 1200, icon: "💠" },
  { name: "Diamante", xp: 1800, icon: "💎" },
  { name: "Ruby", xp: 2600, icon: "♦️" },
  { name: "Safira", xp: 3600, icon: "🔷" },
  { name: "Esmeralda", xp: 4800, icon: "🟢" },
  { name: "Ametista", xp: 6200, icon: "🟣" },
  { name: "Obsidiana", xp: 8000, icon: "⚫" },
  { name: "Cristal", xp: 10000, icon: "🔮" },
  { name: "Neon", xp: 12500, icon: "✨" },
  { name: "Fire", xp: 15500, icon: "🔥" },
  { name: "Code", xp: 19000, icon: "💻" },
  { name: "Hacker", xp: 23000, icon: "🕶️" },
  { name: "Dev", xp: 28000, icon: "👨‍💻" },
  { name: "Elite", xp: 34000, icon: "🏅" },
  { name: "Master", xp: 41000, icon: "🏆" },
  { name: "Grandmaster", xp: 50000, icon: "👑" },
  { name: "Legend", xp: 62000, icon: "🦁" },
  { name: "Mythic", xp: 76000, icon: "🐉" },
  { name: "Omega", xp: 92000, icon: "☄️" },
  { name: "Zyro I", xp: 110000, icon: "⚡" },
  { name: "Zyro II", xp: 132000, icon: "⚡" },
  { name: "Zyro III", xp: 158000, icon: "⚡" },
  { name: "Zyro IV", xp: 188000, icon: "⚡" },
  { name: "Zyro V", xp: 225000, icon: "⚡" },
  { name: "Zyro Pro", xp: 270000, icon: "🚀" },
  { name: "Zyro King", xp: 330000, icon: "👑" },
  { name: "Zyro God", xp: 500000, icon: "🌌" }
];

const PROFILE_BANNERS = [
  {
    id: "zyro-code",
    name: "Zyro code",
    image: "../assets/banners/zyrocode.png"
  },
  {
    id: "american",
    name: "American",
    image: "../assets/banners/americancode.png"
  },
  {
    id: "francecode",
    name: "France Code",
    image: "../assets/banners/francecode.png"
  },
  {
    id: "neymar",
    name: "Neymar Jr",
    image: "../assets/banners/neymar.png"
  },
  {
    id: "zyro-dev",
    name: "Zyro Dev",
    image: "../assets/banners/zyrodev.png"
  },
  {
    id: "linguagens",
    name: "Linguagens",
    image: "../assets/banners/linguagens.png"
  },
  {
    id: "itau",
    name: "Itau",
    image: "../assets/banners/itau.png"
  },
  {
    id: "spot",
    name: "spot",
    image: "../assets/banners/spot.png"
  }
];

const PROFILE_AVATARS = [
  {
    id: "google",
    name: "Foto do Google",
    image: null,
    price: 0,
    rarity: "common",
    type: "google"
  },
  {
    id: "raposa",
    name: "Raposa Dev",
    image: "../assets/avatars/favicon.png",
    price: 250,
    rarity: "rare",
    type: "image"
  },
  {
    id: "astro",
    name: "Astro Dev",
    image: "../assets/avatars/astro.jpg",
    price: 300,
    rarity: "common",
    type: "image"
  },
  {
    id: "Dev",
    name: "Dev",
    image: "../assets/avatars/dev.jpg",
    price: 300,
    rarity: "special",
    type: "image"
  },
  {
    id: "Raposa da Copa",
    name: "Raposa da Copa",
    image: "../assets/avatars/raposadacopa.jpg",
    price: 450,
    rarity: "rare",
    type: "image"
  },
  {
    id: "Tirados",
    name: "Tirados",
    image: "../assets/avatars/tirados.webp",
    price: 400,
    rarity: "rare",
    type: "image"
  },
  {
    id: "Neymar",
    name: "Neymar Jr",
    image: "../assets/avatars/neymarc.png",
    price: 550,
    rarity: "rare",
    type: "image"
  }
];

const AVATAR_MAP = {
  avatar_default: { emoji: "👤", bg: "linear-gradient(135deg,#111,#222)" },
  dev_laranja: { emoji: "🧑‍💻", bg: "linear-gradient(135deg,#ff7b00,#ff9500)" },
  hacker_preto: { emoji: "🕶️", bg: "linear-gradient(135deg,#0b0b0b,#222)" },
  fogo_code: { emoji: "🔥", bg: "linear-gradient(135deg,#ff5a00,#ff2d00)" },
  ruby_dev: { emoji: "💎", bg: "linear-gradient(135deg,#7f1d1d,#ef4444)" },
  mestre_zyro: { emoji: "👑", bg: "linear-gradient(135deg,#000000,#3b3b3b)" }
};

const COUNTRIES = {
  br: { name: "Brasil", flag: "🇧🇷" },
  pt: { name: "Portugal", flag: "🇵🇹" },
  us: { name: "Estados Unidos", flag: "🇺🇸" },
  mx: { name: "México", flag: "🇲🇽" },
  ar: { name: "Argentina", flag: "🇦🇷" },
  co: { name: "Colômbia", flag: "🇨🇴" },
  cl: { name: "Chile", flag: "🇨🇱" },
  pe: { name: "Peru", flag: "🇵🇪" },
  ve: { name: "Venezuela", flag: "🇻🇪" },
  ec: { name: "Equador", flag: "🇪🇨" },
  bo: { name: "Bolívia", flag: "🇧🇴" },
  py: { name: "Paraguai", flag: "🇵🇾" },
  uy: { name: "Uruguai", flag: "🇺🇾" },
  es: { name: "Espanha", flag: "🇪🇸" },
  fr: { name: "França", flag: "🇫🇷" },
  de: { name: "Alemanha", flag: "🇩🇪" },
  it: { name: "Itália", flag: "🇮🇹" },
  uk: { name: "Reino Unido", flag: "🇬🇧" },
  ca: { name: "Canadá", flag: "🇨🇦" },
  au: { name: "Austrália", flag: "🇦🇺" },
  jp: { name: "Japão", flag: "🇯🇵" },
  in: { name: "Índia", flag: "🇮🇳" }
};

const ACHIEVEMENTS = buildAchievements();

function buildAchievements() {
  const base = [
    { id: "novo_membro", icon: "⚡", title: "Novo Membro", desc: "Entrou para a comunidade Zyro Code", image: "" },
    { id: "first_step", icon: "🧑‍💻", title: "Primeiro Passo", desc: "Complete sua primeira aula", image: "" },
    { id: "explorer", icon: "🤠", title: "Explorador", desc: "Complete 5 aulas", image: "" },
    { id: "on_fire", icon: "🔥", title: "Fogo!", desc: "Mantenha 7 dias de sequência", image: "" },
    { id: "dedicated", icon: "🏆", title: "Dedicado", desc: "Complete 20 aulas", image: "" },
    { id: "html_master", icon: "🌐", title: "Mestre HTML", desc: "Termine o módulo HTML", image: "" },
    { id: "xp_strong", icon: "⚡", title: "XP Forte", desc: "Alcance 1000 XP", image: "" }
  ];

  const icons = ["🔥", "⚡", "🏆", "💎", "🚀", "🎯", "👑", "🧠", "💻", "📚", "🛡️", "🌟"];
  const extras = [];

  for (let i = 7; i <= 120; i++) {
    extras.push({
      id: `achievement_${i}`,
      icon: icons[i % icons.length],
      title: `Conquista ${i}`,
      desc: `Complete o desafio especial número ${i}.`,
      image: ""
    });
  }

  return [...base, ...extras];
}

const motivationMap = {
  professional: "Quero me tornar desenvolvedor",
  fun: "Só para me divertir",
  career: "Progredir na carreira",
  create: "Criar aplicativos/sites",
  other: "Outro motivo"
};

const occupationMap = {
  high_school: "Estudante",
  university: "Universitário",
  employed: "Empregado",
  freelancer: "Autônomo",
  other: "Outro"
};

const interestMap = {
  web: "Aplicativos web",
  games: "Jogos",
  data: "Análise de dados",
  ai: "Inteligência Artificial",
  problem: "Resolver problemas",
  unsure: "Não tenho certeza"
};

const experienceMap = {
  never: "Nunca programei",
  basics: "Sei o básico",
  projects: "Já fiz projetos",
  professional: "Quer se profissionalizar"
};

const studyGoalMap = {
  "10min": "10 min/dia",
  "20min": "20 min/dia",
  "30min": "30 min/dia",
  "1hour": "1 hora/dia"
};

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function showToast(message, type = "info", duration = 2800) {
  let toast = document.getElementById("toast-notification");

  if (!toast) {
    toast = document.createElement("div");
    toast.id = "toast-notification";
    toast.className = "toast-notification";
    document.body.appendChild(toast);
  }

  toast.textContent = message;
  toast.className = `toast-notification toast-${type} show`;

  setTimeout(() => {
    toast.classList.remove("show");
  }, duration);
}

function formatJoinDate(data) {
  try {
    if (data.dataEntrada?.seconds) {
      return new Date(data.dataEntrada.seconds * 1000).toLocaleDateString("pt-BR");
    }

    if (data.createdAt?.seconds) {
      return new Date(data.createdAt.seconds * 1000).toLocaleDateString("pt-BR");
    }

    if (data.dataEntrada) {
      return new Date(data.dataEntrada).toLocaleDateString("pt-BR");
    }
  } catch (error) {
    console.warn("Erro ao formatar data:", error);
  }

  return "Data não disponível";
}

function getCountryInfo(data) {
  if (data.country && COUNTRIES[data.country]) return COUNTRIES[data.country];

  if (data.countryFlag) {
    return {
      flag: data.countryFlag,
      name: data.countryName || "País"
    };
  }

  return {
    flag: "🌎",
    name: "Escolher país"
  };
}

function getLeagueByXp(xpValue = 0) {
  const xp = Number(xpValue || 0);
  let selected = LEAGUES[0];

  for (const league of LEAGUES) {
    if (xp >= league.xp) selected = league;
  }

  return selected;
}

function getBannerById(id = DEFAULT_BANNER_ID) {
  const bannerId = normalizeBannerId(id);
  return PROFILE_BANNERS.find((banner) => banner.id === bannerId) || PROFILE_BANNERS[0];
}

function getUnlockedBanners(data) {
  const owned = new Set([DEFAULT_BANNER_ID, ...(data.ownedBanners || [])]);
  if (data.ownedBanners?.includes("orange_default")) owned.add(DEFAULT_BANNER_ID);
  return PROFILE_BANNERS.filter((banner) => owned.has(banner.id));
}

function isVipActive(data) {
  if (!data.vipUntil) return Boolean(data.vip);
  const date = data.vipUntil.seconds ? new Date(data.vipUntil.seconds * 1000) : new Date(data.vipUntil);
  return date.getTime() > Date.now();
}

function getSelectedAvatarId(data) {
  const selected = data.selectedAvatar || data.equippedAvatar || "google";
  return normalizeAvatarId(selected);
}

function getAvatarDefinition(id) {
  return PROFILE_AVATARS.find((avatar) => avatar.id === id) || PROFILE_AVATARS[0];
}

function getAvatarHtml(data) {
  const avatarId = getSelectedAvatarId(data);
  const avatar = getAvatarDefinition(avatarId);
  const photoSource = escapeHtml(data.photoURL || data.foto || "");

  if (avatar.type === "google") {
    if (photoSource) {
      return `<img src="${photoSource}" class="profile-avatar" alt="Foto do Google">`;
    }

    const def = AVATAR_MAP.avatar_default;
    return `
      <div class="profile-avatar-emoji" style="background:${def.bg}">
        ${def.emoji}
      </div>
    `;
  }

  if (avatar.type === "image" && avatar.image) {
    return `<img src="${escapeHtml(avatar.image)}" class="profile-avatar" alt="${escapeHtml(avatar.name)}">`;
  }

  const def = AVATAR_MAP.avatar_default;
  return `
    <div class="profile-avatar-emoji" style="background:${def.bg}">
      ${def.emoji}
    </div>
  `;
}

function showEditNameModal(userData, uid, onSave) {
  const nameChanged = userData.nameChanged || false;
  const renameTokens = Number(userData.renameTokens || 0);
  let modal = document.getElementById("edit-name-modal");

  if (!modal) {
    modal = document.createElement("div");
    modal.id = "edit-name-modal";
    modal.className = "modal";
    document.body.appendChild(modal);
  }

  if (nameChanged && !userData.temTrocaNome && renameTokens <= 0) {
    modal.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
          <h3>Troca de nome bloqueada</h3>
          <button class="modal-close" id="modalClose">×</button>
        </div>

        <p style="color:var(--muted);line-height:1.5;">
          Você já usou sua troca grátis. Para trocar novamente, compre o item
          <strong>Troca de Nome</strong> na loja.
        </p>

        <div class="modal-footer">
          <button class="btn-modal-save" id="modalOk">Entendi</button>
        </div>
      </div>
    `;

    modal.classList.add("active");

    document.getElementById("modalClose").onclick = () => modal.classList.remove("active");
    document.getElementById("modalOk").onclick = () => modal.classList.remove("active");
    return;
  }

  modal.innerHTML = `
    <div class="modal-content">
      <div class="modal-header">
        <h3>Editar apelido</h3>
        <button class="modal-close" id="modalClose">×</button>
      </div>

      <input
        type="text"
        id="editNameInput"
        class="modal-input"
        placeholder="Digite seu novo apelido"
        value="${escapeHtml(userData.nickname || userData.displayName || userData.nome || "")}"
        maxlength="30"
      />

      <div class="modal-footer">
        <button class="btn-modal-cancel" id="modalCancel">Cancelar</button>
        <button class="btn-modal-save" id="modalSave">Salvar</button>
      </div>
    </div>
  `;

  modal.classList.add("active");

  const input = document.getElementById("editNameInput");
  const closeModal = () => modal.classList.remove("active");

  document.getElementById("modalClose").onclick = closeModal;
  document.getElementById("modalCancel").onclick = closeModal;

  document.getElementById("modalSave").onclick = async () => {
    const validation = validateNickname(input.value);

    if (!validation.ok) {
      showToast(validation.message, "warning");
      return;
    }

    closeModal();
    await onSave(validation.value);
  };

  input.focus();
}

function showCountryModal(uid, force = false) {
  let modal = document.getElementById("country-modal");

  if (!modal) {
    modal = document.createElement("div");
    modal.id = "country-modal";
    modal.className = "modal";
    document.body.appendChild(modal);
  }

  modal.innerHTML = `
    <div class="modal-content">
      <div class="modal-header">
        <h3>Escolha seu país</h3>
        ${force ? "" : `<button class="modal-close" id="countryClose">×</button>`}
      </div>

      <p style="color:var(--muted);margin-bottom:16px;">
        Sua bandeira vai aparecer no perfil.
      </p>

      <div class="country-grid">
        ${Object.entries(COUNTRIES).map(([code, item]) => `
          <button class="country-choice" data-code="${code}">
            <span>${item.flag}</span>
            <span>${item.name}</span>
          </button>
        `).join("")}
      </div>
    </div>
  `;

  modal.classList.add("active");

  const closeBtn = document.getElementById("countryClose");
  if (closeBtn) closeBtn.onclick = () => modal.classList.remove("active");

  modal.querySelectorAll(".country-choice").forEach((btn) => {
    btn.onclick = async () => {
      const code = btn.dataset.code;
      const country = COUNTRIES[code];

      try {
        await updateDoc(doc(db, "users", uid), {
          country: code,
          countryName: country.name,
          countryFlag: country.flag,
          updatedAt: serverTimestamp()
        });

        modal.classList.remove("active");

        const snap = await getDoc(doc(db, "users", uid));
        const freshData = snap.data();
        await syncLeaderboard(uid, freshData);
        renderPerfil(freshData, uid, false);

        showToast(`País atualizado para ${country.flag} ${country.name}`, "success");
      } catch (error) {
        console.error("Erro ao salvar país:", error);
        showToast("Erro ao salvar país.", "error");
      }
    };
  });
}

function getAchievementArtHtml(item) {
  if (item.image) {
    return `
      <img
        src="${escapeHtml(item.image)}"
        alt="${escapeHtml(item.title)}"
        class="achievement-img"
        onerror="this.replaceWith(Object.assign(document.createElement('span'), { className: 'achievement-icon-fallback', textContent: '${escapeHtml(item.icon)}' }))"
      />
    `;
  }

  return `<span class="achievement-icon-fallback">${item.icon}</span>`;
}

function showAllAchievementsModal(userAchievements = {}) {
  let modal = document.getElementById("all-achievements-modal");

  if (!modal) {
    modal = document.createElement("div");
    modal.id = "all-achievements-modal";
    modal.className = "modal";
    document.body.appendChild(modal);
  }

  modal.innerHTML = `
    <div class="modal-content achievements-modal-content">
      <div class="modal-header">
        <h3>Todas as conquistas</h3>
        <button class="modal-close" id="closeAllAchievements">×</button>
      </div>

      <p style="color:var(--muted);margin-bottom:16px;">
        São ${ACHIEVEMENTS.length} conquistas para desbloquear.
      </p>

      <div class="all-achievements-grid">
        ${ACHIEVEMENTS.map((a) => `
          <div class="achievement-card ${userAchievements[a.id] ? "unlocked" : "locked"}">
            ${!userAchievements[a.id] ? '<span class="new-badge">BLOQ.</span>' : '<span class="new-badge unlocked-badge">OK</span>'}
            <div class="achievement-art">${getAchievementArtHtml(a)}</div>
            <div class="achievement-title">${a.title}</div>
            <div class="achievement-desc">${a.desc}</div>
          </div>
        `).join("")}
      </div>
    </div>
  `;

  modal.classList.add("active");

  document.getElementById("closeAllAchievements").onclick = () => {
    modal.classList.remove("active");
  };
}

function showBannerModal(data, uid) {
  let modal = document.getElementById("banner-modal");

  if (!modal) {
    modal = document.createElement("div");
    modal.id = "banner-modal";
    modal.className = "modal";
    document.body.appendChild(modal);
  }

  const equippedId = normalizeBannerId(data.equippedBanner);
  const unlockedBanners = getUnlockedBanners(data);

  modal.innerHTML = `
    <div class="modal-content banner-modal-content">
      <div class="modal-header">
        <h3>Meus Banners</h3>
        <button class="modal-close" id="closeBannerModal">×</button>
      </div>

      <p class="banner-modal-text">
        Escolha uma imagem desbloqueada para aparecer no fundo do seu perfil.
      </p>

      <div class="banner-picker-grid">
        ${unlockedBanners.map((banner) => `
          <button class="banner-choice ${equippedId === banner.id ? "equipped" : ""}" data-id="${banner.id}">
            <img src="${escapeHtml(banner.image)}" alt="${escapeHtml(banner.name)}">
            <span>${escapeHtml(banner.name)}</span>
            <strong>${equippedId === banner.id ? "Equipado" : "Equipar"}</strong>
          </button>
        `).join("")}
      </div>

      <a class="banner-store-link" href="../loja/loja.html#banners">Comprar novos banners</a>
    </div>
  `;

  modal.classList.add("active");
  document.getElementById("closeBannerModal").onclick = () => modal.classList.remove("active");

  modal.querySelectorAll(".banner-choice").forEach((button) => {
    button.onclick = async () => {
      const bannerId = button.dataset.id;

      try {
        let applied = false;

        try {
          const cloudResult = await equipCosmeticCloud({ type: "banner", itemId: bannerId });
          if (cloudResult?.user) {
            applied = true;
            modal.classList.remove("active");
            const snap = await getDoc(doc(db, "users", uid));
            const freshData = { ...snap.data(), ...cloudResult.user };
            await syncLeaderboard(uid, freshData);
            renderPerfil(freshData, uid, false);
            showToast("Banner equipado com sucesso.", "success");
          }
        } catch (cloudError) {
          console.warn("equipCosmetic (cloud) falhou, tentando fluxo legado:", cloudError);
        }

        if (applied) return;

        await updateDoc(doc(db, "users", uid), {
          equippedBanner: bannerId,
          updatedAt: serverTimestamp()
        });

        modal.classList.remove("active");

        const snap = await getDoc(doc(db, "users", uid));
        const freshData = snap.data();
        await syncLeaderboard(uid, freshData);
        renderPerfil(freshData, uid, false);
        showToast("Banner equipado com sucesso.", "success");
      } catch (error) {
        console.error("Erro ao equipar banner:", error);
        showToast("Erro ao equipar banner.", "error");
      }
    };
  });
}

function renderPerfil(data, uid, isGuest = false) {
  const displayName = data.nickname || data.displayName || data.nome || "Jogador";
  const personagem = data.personagemSelecionado || "dev_iniciante";
  const country = getCountryInfo(data);
  const joinDate = formatJoinDate(data);
  const equippedBanner = getBannerById(data.equippedBanner);
  const achievements = {
    novo_membro: true,
    ...(data.achievements || {})
  };
  const levelDisplay = LEVEL_DISPLAY[data.experienceLevel] || "Dev Iniciante";
  const league = getLeagueByXp(data.xp || 0);

  wrap.innerHTML = `
    <section class="profile-banner" style="--profile-banner-image:url('${escapeHtml(equippedBanner.image)}')">
      <div class="profile-banner-actions">
        <button id="btnChangeBanner" class="profile-mini-btn">Trocar banner</button>
      </div>

      <div class="profile-avatar-wrap">
        ${getAvatarHtml(data)}
      </div>
    </section>

    <section class="profile-info">
      <div class="profile-name-row">
        <div class="profile-name-box">
          <h1 class="profile-name">
            ${escapeHtml(displayName)}
            ${data.verified === true ? '<span class="verified show">✓</span>' : ""}
          </h1>

          <div class="profile-nick">${escapeHtml(displayName).replace(/\s+/g, "")}</div>

          <div class="profile-date">
            ${isGuest ? "Modo visitante" : `Membro desde ${joinDate}`}
          </div>
        </div>

        <div class="profile-flags">
          <button class="flag-btn" id="btnCountry" title="${escapeHtml(country.name)}">
            ${country.flag}
          </button>
        </div>
      </div>

      <div class="profile-actions-main">
        <button class="add-friend-btn" id="btnAddFriends">
          <span>👥</span>
          <span>Adicionar amigos</span>
        </button>

          <button class="share-btn" id="btnShare" title="Compartilhar perfil">⇧</button>
      </div>

      <div class="profile-divider"></div>
    </section>

    <section class="profile-section">
      <h2 class="section-title">Estatísticas</h2>

      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon">🔥</div>
          <div>
            <div class="stat-value">${Number(data.streak || 0)}</div>
            <div class="stat-label">Sequência diária</div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon">⚡</div>
          <div>
            <div class="stat-value">${Number(data.xp || 0)}</div>
            <div class="stat-label">XP total</div>
          </div>
        </div>

        <div class="stat-card league-card">
          <span class="week-badge">SEMANA 1</span>
          <div class="stat-icon">${league.icon}</div>
          <div>
            <div class="stat-value">${league.name}</div>
            <div class="stat-label">Liga atual</div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon">🏅</div>
          <div>
            <div class="stat-value">${Number(data.top3 || 0)}</div>
            <div class="stat-label">Top 3 finalizações</div>
          </div>
        </div>
      </div>

      <div class="achievements-panel">
        <div class="section-title-row">
          <h2 class="section-title">Conquistas</h2>
          <button class="section-link" id="btnViewAllAchievements">Ver todas</button>
        </div>

        <div class="achievements-scroll">
          ${ACHIEVEMENTS.slice(0, 8).map((item) => `
            <article class="achievement-card ${achievements[item.id] ? "unlocked" : "locked"}">
              ${!achievements[item.id] ? `<span class="new-badge">NOVA</span>` : ""}
              <div class="achievement-art">${getAchievementArtHtml(item)}</div>
              <div class="achievement-title">${item.title}</div>
              <div class="achievement-desc">${item.desc}</div>
            </article>
          `).join("")}
        </div>
      </div>

      <div class="extra-profile">
        ${data.profileNumber ? `
          <div class="extra-card">
            <span class="extra-icon">🔢</span>
            <div>
              <div class="extra-label">Número</div>
              <div class="extra-value">#${data.profileNumber}</div>
            </div>
          </div>
        ` : ""}

        <div class="extra-card" id="countryCard">
          <span class="extra-icon">${country.flag}</span>
          <div>
            <div class="extra-label">País</div>
            <div class="extra-value">${escapeHtml(country.name)}</div>
          </div>
        </div>

        ${isVipActive(data) ? `
          <div class="extra-card special-card">
            <span class="extra-icon">✨</span>
            <div>
              <div class="extra-label">Status</div>
              <div class="extra-value">VIP Zyro</div>
            </div>
          </div>
        ` : ""}

        ${(data.renameTokens || data.temTrocaNome) ? `
          <div class="extra-card special-card">
            <span class="extra-icon">✏️</span>
            <div>
              <div class="extra-label">Inventário</div>
              <div class="extra-value">Troca de nome disponível</div>
            </div>
          </div>
        ` : ""}

        ${data.streakShield ? `
          <div class="extra-card special-card">
            <span class="extra-icon">🛡️</span>
            <div>
              <div class="extra-label">Inventário</div>
              <div class="extra-value">Streak Shield x${Number(data.streakShield || 0)}</div>
            </div>
          </div>
        ` : ""}

        ${data.motivation ? `
          <div class="extra-card">
            <span class="extra-icon">🎯</span>
            <div>
              <div class="extra-label">Motivação</div>
              <div class="extra-value">${motivationMap[data.motivation] || data.motivation}</div>
            </div>
          </div>
        ` : ""}

        ${data.occupation ? `
          <div class="extra-card">
            <span class="extra-icon">💼</span>
            <div>
              <div class="extra-label">Ocupação</div>
              <div class="extra-value">${occupationMap[data.occupation] || data.occupation}</div>
            </div>
          </div>
        ` : ""}

        ${data.interestPath ? `
          <div class="extra-card">
            <span class="extra-icon">⚡</span>
            <div>
              <div class="extra-label">Interesse</div>
              <div class="extra-value">${interestMap[data.interestPath] || data.interestPath}</div>
            </div>
          </div>
        ` : ""}

        ${data.experienceLevel ? `
          <div class="extra-card">
            <span class="extra-icon">📚</span>
            <div>
              <div class="extra-label">Experiência</div>
              <div class="extra-value">${experienceMap[data.experienceLevel] || data.experienceLevel}</div>
            </div>
          </div>
        ` : ""}

        ${data.studyGoal ? `
          <div class="extra-card">
            <span class="extra-icon">⏱️</span>
            <div>
              <div class="extra-label">Meta diária</div>
              <div class="extra-value">${studyGoalMap[data.studyGoal] || data.studyGoal}</div>
            </div>
          </div>
        ` : ""}

        <div class="extra-card">
          <span class="extra-icon">🏅</span>
          <div>
            <div class="extra-label">Nível</div>
            <div class="extra-value">${levelDisplay}</div>
          </div>
        </div>
      </div>

      <div class="character-card">
        <div class="char-icon">${CHARS[personagem] || "👨‍💻"}</div>
        <div>
          <h3>${CHAR_NAMES[personagem] || "Dev Iniciante"}</h3>
          <p>Personagem equipado atualmente</p>
        </div>
      </div>

      <div class="profile-small-actions">
        ${isGuest ? "" : `<button class="profile-action-btn" id="btnEditName">Editar apelido</button>`}
        ${isGuest ? "" : `<button class="profile-action-btn" id="btnChangeAvatar">Trocar foto</button>`}
        <button class="profile-action-btn danger" id="btnSairPerfil">Sair da conta</button>
      </div>
    </section>
  `;

  bindProfileEvents(data, uid, isGuest);

  if (!isGuest && !data.country) {
    setTimeout(() => {
      showCountryModal(uid, true);
    }, 700);
  }
}

function bindProfileEvents(data, uid, isGuest) {
  const btnChangeBanner = document.getElementById("btnChangeBanner");
  if (btnChangeBanner) {
    btnChangeBanner.onclick = () => {
      if (isGuest) return showToast("Faça login para trocar banners.", "warning");
      showBannerModal(data, uid);
    };
  }

  const btnChangeAvatar = document.getElementById("btnChangeAvatar");
  if (btnChangeAvatar) {
    btnChangeAvatar.onclick = () => {
      if (isGuest) return showToast("Faça login para trocar foto.", "warning");
      localStorage.setItem("openShopTab", "avatars");
      window.location.href = "../loja/loja.html#avatars";
    };
  }

  const btnAddFriends = document.getElementById("btnAddFriends");
  if (btnAddFriends) {
    btnAddFriends.onclick = () => {
      showToast("Sistema de amigos em desenvolvimento.", "info");
    };
  }

  const btnShare = document.getElementById("btnShare");
  if (btnShare) {
    btnShare.onclick = async () => {
      try {
        await navigator.clipboard.writeText(window.location.href);
        showToast("Link do perfil copiado.", "success");
      } catch {
        showToast("Não foi possível copiar o link.", "warning");
      }
    };
  }

  const openCountry = () => {
    if (isGuest) return showToast("Faça login para escolher país.", "warning");
    showCountryModal(uid, false);
  };

  const btnCountry = document.getElementById("btnCountry");
  const countryCard = document.getElementById("countryCard");

  if (btnCountry) btnCountry.onclick = openCountry;
  if (countryCard) countryCard.onclick = openCountry;

  const btnEditName = document.getElementById("btnEditName");
  if (btnEditName) {
    btnEditName.onclick = () => {
      showEditNameModal(data, uid, async (newName) => {
        try {
          const updates = {
            nickname: newName,
            displayName: newName,
            updatedAt: serverTimestamp()
          };

          if (!data.nameChanged) {
            updates.nameChanged = true;
            updates.nameChangedAt = serverTimestamp();
          }

          if (data.nameChanged && (data.temTrocaNome || Number(data.renameTokens || 0) > 0)) {
            const remainingTokens = Math.max(0, Number(data.renameTokens || 1) - 1);
            updates.renameTokens = remainingTokens;
            updates.temTrocaNome = remainingTokens > 0;
            updates.lastRenameTokenUsedAt = serverTimestamp();
          }

          await updateDoc(doc(db, "users", uid), updates);

          const snap = await getDoc(doc(db, "users", uid));
          const freshData = snap.data();
          await syncLeaderboard(uid, freshData);
          renderPerfil(freshData, uid, false);

          showToast("Apelido atualizado com sucesso.", "success");
        } catch (error) {
          console.error("Erro ao salvar apelido:", error);
          showToast("Erro ao salvar apelido.", "error");
        }
      });
    };
  }

  const btnViewAllAchievements = document.getElementById("btnViewAllAchievements");
  if (btnViewAllAchievements) {
    btnViewAllAchievements.onclick = () => {
      window.location.href = "conquistas.html";
    };
  }

  const logout = async () => {
    try {
      localStorage.removeItem("zyroGuest");
      localStorage.removeItem("zyroUserName");
      await signOut(auth);
      showToast("Até logo!", "info", 1000);

      setTimeout(() => {
        window.location.href = "../login/login.html";
      }, 1000);
    } catch (error) {
      console.error("Erro ao sair:", error);
      showToast("Erro ao sair.", "error");
    }
  };

  const btnSairPerfil = document.getElementById("btnSairPerfil");
  if (btnSairPerfil) btnSairPerfil.onclick = logout;
}

function showBeginnerGuide() {
  if (window.ZyroGuideStarted) return;
  window.ZyroGuideStarted = true;

  let guide = document.getElementById("beginner-guide");

  if (!guide) {
    guide = document.createElement("div");
    guide.id = "beginner-guide";
    guide.className = "beginner-guide";
    document.body.appendChild(guide);
  }

  guide.innerHTML = `
    <div class="guide-container">
      <div class="guide-robot">🤖</div>
      <div class="guide-bubble">
        <p>Bem-vindo ao seu perfil! Aqui você acompanha XP, conquistas e progresso.</p>
      </div>
      <button class="guide-close" id="guideClose">Entendi</button>
    </div>
  `;

  guide.classList.add("active");

  document.getElementById("guideClose").onclick = async () => {
    guide.classList.remove("active");

    const user = auth.currentUser;
    if (!user) return;

    try {
      await updateDoc(doc(db, "users", user.uid), {
        guideCompleted: true,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error("Erro ao marcar guia:", error);
    }
  };
}

function showError(msg) {
  wrap.innerHTML = `
    <div style="text-align:center;padding:60px 20px;color:white;">
      <h2>Erro no perfil</h2>
      <p style="margin-top:10px;color:rgba(255,255,255,.65);">${escapeHtml(msg)}</p>
      <br>
      <a href="../login/login.html" style="color:#ff7b00;">Voltar para login</a>
    </div>
  `;
}

onAuthStateChanged(auth, async (user) => {
  try {
    const isGuest = localStorage.getItem("zyroGuest") === "true";

    if (isGuest) {
      renderPerfil({
        nome: "Visitante",
        displayName: "Visitante",
        email: "visitante@zyrocode.local",
        xp: 0,
        moedas: 100,
        nivel: 1,
        streak: 0,
        vidas: 5,
        personagemSelecionado: "dev_iniciante",
        aulasConcluidas: [],
        equippedBanner: DEFAULT_BANNER_ID
      }, "guest", true);

      return;
    }

    if (!user) {
      window.location.href = "../login/login.html";
      return;
    }

    const userRef = doc(db, "users", user.uid);
    const snap = await getDoc(userRef);

    if (!snap.exists()) {
      showError("Usuário não encontrado. Saia e entre com Google novamente.");
      return;
    }

    const snapData = snap.data();

    const userData = {
      ...snapData,
      email: snapData.email || user.email,
      photoURL: snapData.photoURL || user.photoURL
    };

    if (userData.onboardingCompleted && !userData.guideCompleted) {
      showBeginnerGuide();
    }

    await syncLeaderboard(user.uid, userData);
    renderPerfil(userData, user.uid, false);
  } catch (error) {
    console.error("Erro no perfil:", error);
    showError("Erro ao carregar perfil. Veja o console.");
  }
});

const btnConfigTop = document.getElementById("btnConfigTop");
if (btnConfigTop) {
  btnConfigTop.onclick = () => {
    window.location.href = "configuracoes.html";
  };
}

async function shareApp() {
  const appUrl = `${window.location.origin}${window.location.pathname.replace(/\/perfil\/perfil\.html$/, "/index.html")}`;
  const shareData = {
    title: "ZYRO CODE",
    text: "Aprenda programação jogando no ZYRO CODE.",
    url: appUrl
  };

  try {
    if (navigator.share) {
      await navigator.share(shareData);
      showToast("App compartilhado.", "success");
      return;
    }

    await copyText(appUrl);
    showToast("Link do app copiado.", "success");
  } catch (error) {
    if (error?.name === "AbortError") return;
    console.error("Erro ao compartilhar app:", error);
    showToast("Não foi possível compartilhar agora.", "warning");
  }
}

async function copyText(text) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const input = document.createElement("textarea");
  input.value = text;
  input.setAttribute("readonly", "");
  input.style.position = "fixed";
  input.style.opacity = "0";
  document.body.appendChild(input);
  input.select();
  document.execCommand("copy");
  input.remove();
}

const btnShareAppTop = document.getElementById("btnShareAppTop");
if (btnShareAppTop) {
  btnShareAppTop.onclick = shareApp;
}
