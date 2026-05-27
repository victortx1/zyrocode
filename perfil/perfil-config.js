import { auth, db } from "../firebase.js";

import {
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
  doc,
  getDoc,
  updateDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import { syncLeaderboard } from "../js/leaderboard-sync.js";

const btnBack = document.getElementById("btnBack");
const saveBtn = document.getElementById("saveBtn");
const toast = document.getElementById("toast");
const bannerPreview = document.getElementById("bannerPreview");
const avatarPreview = document.getElementById("avatarPreview");
const profileFlag = document.getElementById("profileFlag");
const profileUid = document.getElementById("profileUid");
const profileJoined = document.getElementById("profileJoined");
const profileLevel = document.getElementById("profileLevel");
const profileXp = document.getElementById("profileXp");
const profileLeague = document.getElementById("profileLeague");
const profileFollowers = document.getElementById("profileFollowers");
const selectedCountryFlag = document.getElementById("selectedCountryFlag");
const selectedCountryName = document.getElementById("selectedCountryName");

const DEFAULT_BANNER_ID = "zyro-code";

const COUNTRIES = {
  br: { name: "Brasil", flag: "🇧🇷" },
  us: { name: "Estados Unidos", flag: "🇺🇸" },
  pt: { name: "Portugal", flag: "🇵🇹" },
  es: { name: "Espanha", flag: "🇪🇸" },
  fr: { name: "França", flag: "🇫🇷" },
  de: { name: "Alemanha", flag: "🇩🇪" },
  it: { name: "Itália", flag: "🇮🇹" },
  ar: { name: "Argentina", flag: "🇦🇷" },
  mx: { name: "México", flag: "🇲🇽" },
  jp: { name: "Japão", flag: "🇯🇵" },
  kr: { name: "Coreia do Sul", flag: "🇰🇷" },
  cn: { name: "China", flag: "🇨🇳" },
  uk: { name: "Reino Unido", flag: "🇬🇧" },
  ca: { name: "Canadá", flag: "🇨🇦" },
  ao: { name: "Angola", flag: "🇦🇴" },
  mz: { name: "Moçambique", flag: "🇲🇿" },
  cv: { name: "Cabo Verde", flag: "🇨🇻" }
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

const PROFILE_BANNERS = {
  "zyro-code": "../assets/banners/zyrocode.png",
  american: "../assets/banners/americancode.png",
  francecode: "../assets/banners/francecode.png",
  neymar: "../assets/banners/neymar.png",
  "zyro-dev": "../assets/banners/zyrodev.png",
  linguagens: "../assets/banners/linguagens.png",
  itau: "../assets/banners/itau.png",
  spot: "../assets/banners/spot.png"
};

const PROFILE_AVATARS = {
  raposa: "../assets/avatars/favicon.png",
  astro: "../assets/avatars/astro.jpg",
  Dev: "../assets/avatars/dev.jpg",
  "Raposa da Copa": "../assets/avatars/raposadacopa.jpg",
  Tirados: "../assets/avatars/tirados.webp",
  Neymar: "../assets/avatars/neymarc.png"
};

let currentUser = null;
let currentData = {};
let isGuestMode = false;

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toast.classList.remove("show"), 2600);
}

function formatJoinDate(data) {
  try {
    const rawDate = data.dataEntrada || data.createdAt || data.joinedAt || data.created_at;
    if (rawDate?.seconds) return new Date(rawDate.seconds * 1000).toLocaleDateString("pt-BR");
    if (rawDate) return new Date(rawDate).toLocaleDateString("pt-BR");
  } catch (error) {
    console.warn("Erro ao formatar entrada:", error);
  }

  return "--";
}

function getLeagueByXp(xpValue = 0) {
  const xp = Number(xpValue || 0);
  let selected = LEAGUES[0];

  for (const league of LEAGUES) {
    if (xp >= league.xp) selected = league;
  }

  return selected;
}

function normalizeBannerId(id) {
  if (!id || id === "orange_default") return DEFAULT_BANNER_ID;
  return id;
}

function normalizeAvatarId(id) {
  if (id === "Astro") return "astro";
  if (id === "avatar_default") return "google";
  return id || "google";
}

function getCountryCode(data = {}) {
  if (data.countryCode && COUNTRIES[data.countryCode]) return data.countryCode;
  if (data.country && COUNTRIES[data.country]) return data.country;

  const globalPrefs = window.ZyroPrefs?.getPreferences?.() || window.ZyroPrefs?.getState?.();
  if (globalPrefs?.country && COUNTRIES[globalPrefs.country]) return globalPrefs.country;

  const storedCode = localStorage.getItem("zyroCountryCode") || localStorage.getItem("zyroCountry");
  if (storedCode && COUNTRIES[storedCode]) return storedCode;

  const flag = data.countryFlag || localStorage.getItem("zyroCountryFlag");
  const match = Object.entries(COUNTRIES).find(([, country]) => country.flag === flag);
  return match?.[0] || "br";
}

function getFollowersCount(data = {}) {
  return Number(data.followers ?? data.seguidores ?? data.followersCount ?? data.stats?.followers ?? 0);
}

function populateCountrySelect() {
  profileFlag.innerHTML = Object.entries(COUNTRIES).map(([code, country]) => (
    `<option value="${code}">${country.flag} ${country.name}</option>`
  )).join("");
}

function updateCountryPreview(code) {
  const country = COUNTRIES[code] || COUNTRIES.br;
  selectedCountryFlag.textContent = country.flag;
  selectedCountryName.textContent = country.name;
}

function setBannerPreview(data = {}) {
  const bannerId = normalizeBannerId(data.equippedBanner || data.selectedBanner);
  const image = PROFILE_BANNERS[bannerId] || PROFILE_BANNERS[DEFAULT_BANNER_ID];
  bannerPreview.style.backgroundImage = `url("${image}")`;
}

function setAvatarPreview(data = {}) {
  const avatarId = normalizeAvatarId(data.selectedAvatar || data.equippedAvatar);
  const avatarImage = PROFILE_AVATARS[avatarId];
  const photoSource = data.photoURL || data.foto || "";

  avatarPreview.innerHTML = "";

  if (avatarImage || photoSource) {
    const img = document.createElement("img");
    img.src = avatarImage || photoSource;
    img.alt = "Foto de perfil";
    img.onerror = () => {
      avatarPreview.innerHTML = "";
      avatarPreview.textContent = "👤";
    };
    avatarPreview.appendChild(img);
    return;
  }

  avatarPreview.textContent = "👤";
}

function getGuestData() {
  return {
    uid: "guest",
    displayName: localStorage.getItem("zyroUserName") || "Visitante",
    xp: Number(localStorage.getItem("zyroXp") || 0),
    nivel: Number(localStorage.getItem("zyroNivel") || 1),
    countryCode: localStorage.getItem("zyroCountryCode") || localStorage.getItem("zyroCountry") || "br",
    countryName: localStorage.getItem("zyroCountryName") || "",
    countryFlag: localStorage.getItem("zyroCountryFlag") || "",
    equippedBanner: localStorage.getItem("zyroEquippedBanner") || DEFAULT_BANNER_ID,
    selectedAvatar: localStorage.getItem("zyroSelectedAvatar") || "google",
    joinedAt: localStorage.getItem("zyroJoinedAt") || ""
  };
}

function persistCountryLocal(code) {
  const country = COUNTRIES[code] || COUNTRIES.br;
  localStorage.setItem("zyroCountry", code);
  localStorage.setItem("zyroCountryCode", code);
  localStorage.setItem("zyroCountryName", country.name);
  localStorage.setItem("zyroCountryFlag", country.flag);

  try {
    const stored = JSON.parse(localStorage.getItem("zyroProfile") || "{}");
    localStorage.setItem("zyroProfile", JSON.stringify({
      ...stored,
      country: code,
      countryCode: code,
      countryName: country.name,
      countryFlag: country.flag,
      flag: country.flag
    }));
  } catch {
    localStorage.setItem("zyroProfile", JSON.stringify({
      country: code,
      countryCode: code,
      countryName: country.name,
      countryFlag: country.flag,
      flag: country.flag
    }));
  }
}

function renderData(data = {}, uid = "guest") {
  currentData = { ...data };

  const code = getCountryCode(currentData);
  const league = getLeagueByXp(currentData.xp || 0);

  profileFlag.value = code;
  profileUid.textContent = uid;
  profileJoined.textContent = formatJoinDate(currentData);
  profileLevel.textContent = Number(currentData.nivel || 1);
  profileXp.textContent = Number(currentData.xp || 0);
  profileLeague.textContent = `${league.icon} ${league.name}`;
  profileFollowers.textContent = getFollowersCount(currentData);

  updateCountryPreview(code);
  setBannerPreview(currentData);
  setAvatarPreview(currentData);
}

async function savePreferences() {
  const code = profileFlag.value;
  const country = COUNTRIES[code] || COUNTRIES.br;

  saveBtn.disabled = true;
  saveBtn.textContent = "Salvando...";

  try {
    persistCountryLocal(code);

    if (!isGuestMode && currentUser) {
      await window.ZyroPrefs?.update?.({ country: code });

      const userRef = doc(db, "users", currentUser.uid);
      await updateDoc(userRef, {
        country: code,
        countryCode: code,
        countryName: country.name,
        countryFlag: country.flag,
        updatedAt: serverTimestamp()
      });

      const snap = await getDoc(userRef);
      const freshData = snap.exists() ? snap.data() : { ...currentData };
      await syncLeaderboard(currentUser.uid, freshData);
      renderData(freshData, currentUser.uid);
    } else {
      await window.ZyroPrefs?.update?.({ country: code }, { localOnly: true });

      currentData = {
        ...currentData,
        country: code,
        countryCode: code,
        countryName: country.name,
        countryFlag: country.flag
      };
      renderData(currentData, "guest");
    }

    showToast("Preferências salvas com sucesso!");
  } catch (error) {
    console.error("Erro ao salvar preferências:", error);
    showToast("Não foi possível salvar agora. Tente novamente.");
  } finally {
    saveBtn.disabled = false;
    saveBtn.textContent = "Salvar preferências";
  }
}

btnBack.addEventListener("click", () => {
  window.location.href = "configuracoes.html";
});

profileFlag.addEventListener("change", () => {
  updateCountryPreview(profileFlag.value);
});

saveBtn.addEventListener("click", savePreferences);

populateCountrySelect();

onAuthStateChanged(auth, async (user) => {
  try {
    isGuestMode = localStorage.getItem("zyroGuest") === "true";
    currentUser = user;

    if (isGuestMode) {
      renderData(getGuestData(), "guest");
      return;
    }

    if (!user) {
      window.location.href = "../login/login.html";
      return;
    }

    const snap = await getDoc(doc(db, "users", user.uid));
    if (!snap.exists()) {
      showToast("Usuário não encontrado.");
      return;
    }

    renderData({
      ...snap.data(),
      email: snap.data().email || user.email,
      photoURL: snap.data().photoURL || user.photoURL
    }, user.uid);
  } catch (error) {
    console.error("Erro ao carregar preferências:", error);
    showToast("Erro ao carregar preferências.");
  }
});
