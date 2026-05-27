import { auth, db } from "../firebase.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  doc,
  getDoc,
  onSnapshot,
  serverTimestamp,
  setDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const STORAGE_KEY = "zyro_preferences";
const LEGACY_KEYS = {
  theme: "zyro_theme",
  language: "zyro_language",
  sfxEnabled: "zyro_sounds",
  vibrationEnabled: "zyro_vibration",
  reducedMotion: "zyro_performance",
  musicChoice: "zyro_music",
  country: "zyroCountry",
  countryCode: "zyroCountryCode",
  countryName: "zyroCountryName",
  countryFlag: "zyroCountryFlag",
  selectedBanner: "zyroEquippedBanner",
  selectedAvatar: "zyroSelectedAvatar"
};

const DEFAULTS = {
  language: "pt",
  theme: "dark",
  primaryColor: "#ff7b00",
  primaryColor2: "#ffd36a",
  musicEnabled: false,
  musicChoice: "none",
  musicVolume: 0.28,
  sfxEnabled: true,
  vibrationEnabled: true,
  reducedMotion: false,
  country: "br",
  countryName: "Brasil",
  countryFlag: "🇧🇷",
  selectedBanner: "zyro-code",
  selectedAvatar: "google"
};

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

export const ZYRO_I18N = {
  pt: {
    "app.name": "ZYRO",
    "app.suffix": "CODE",
    "title.lobby": "ZYRO CODE — Lobby",
    "common.back": "← Voltar",
    "common.loading": "Carregando...",
    "common.save": "Salvar",
    "common.saved_settings": "Configurações salvas com sucesso!",
    "nav.map": "Mapa",
    "nav.missions": "Missões",
    "nav.ranking": "Ranking",
    "nav.shop": "Loja",
    "nav.profile": "Perfil",
    "lobby.modules_title": "Módulos Zyro",
    "lobby.courses": "Cursos",
    "lobby.modules_desc": "Escolha um módulo, avance pelos cursos e conclua as aulas com 5 respostas corretas.",
    "profile.title": "Perfil",
    "profile.loading": "Carregando perfil...",
    "profile.preferences_title": "Preferências do usuário",
    "profile.preferences_desc": "Ajuste sua bandeira e acesse a loja para trocar foto ou banner.",
    "profile.country": "Bandeira",
    "profile.level": "Nível",
    "profile.xp": "XP",
    "profile.league": "Liga",
    "profile.followers": "Seguidores",
    "profile.saved": "Preferências salvas com sucesso!",
    "profile.country_updated": "País atualizado para {flag} {name}",
    "profile.country_error": "Erro ao salvar país",
    "profile.choose_country": "Escolha seu país",
    "shop.title": "Loja",
    "shop.desc": "Gaste suas moedas com sabedoria!",
    "shop.items": "Itens",
    "shop.characters": "Personagens",
    "shop.avatars": "Fotos de Perfil",
    "shop.banners": "Banners",
    "shop.my_banners": "Meus Banners",
    "shop.boosts": "Boosts",
    "ranking.title": "🏆 Ranking Global",
    "ranking.desc": "Top 50 usuários por XP e high score. Cada jogador aparece apenas uma vez.",
    "missions.title": "🎯 Missões Diárias",
    "missions.desc": "Resetam todo dia à meia-noite",
    "settings.menu": "Menu de configurações",
    "settings.config": "Configurações ZYRO CODE",
    "settings.back": "Perfil",
    "settings.profile": "Perfil",
    "settings.notifications": "Notificações",
    "settings.courses": "Cursos",
    "settings.social": "Contas em redes sociais",
    "settings.privacy": "Privacidade",
    "settings.help": "Central de Ajuda",
    "settings.comments": "Fazer comentários",
    "settings.logout": "Sair",
    "prefs.title": "Preferências",
    "prefs.headline": "Personalize seu ZYRO CODE",
    "prefs.description": "Ajuste o visual, som, idioma e desempenho do aplicativo.",
    "prefs.theme": "Tema",
    "prefs.color": "Cor principal",
    "prefs.shortcuts": "Áudio e interação",
    "prefs.language": "Idioma",
    "theme.light": "Claro",
    "theme.dark": "Escuro",
    "sound.label": "Efeitos sonoros",
    "music.enabled": "Música de fundo",
    "music.volume": "Volume",
    "music.label": "Música do app",
    "music.none": "Nenhuma",
    "music.1": "Música 1",
    "music.2": "Música 2",
    "music.3": "Música 3",
    "vibration.label": "Vibração",
    "performance.label": "Animações reduzidas",
    "save.button": "Salvar configurações",
    "help.title": "Precisa de suporte?",
    "privacy.title": "Seus dados, suas regras",
    "comments.title": "Envie sua opinião",
    "notifications.title": "Controle o que chega até você",
    "courses.title": "Ajuste o seu conteúdo",
    "social.title": "Conecte suas contas",
    "achievements.title": "Conquistas"
    ,"login.tagline": "Aprenda programação do zero jogando",
    "login.create": "Crie sua conta grátis",
    "login.subtitle": "Entre com Google e comece sua jornada de programação",
    "login.google": "Entrar com Google",
    "login.or": "ou",
    "login.guest": "Explorar como visitante",
    "login.logout": "Sair"
    ,"onboarding.of": "de",
    "onboarding.welcome": "Bem-vindo ao ZYRO CODE!",
    "onboarding.prev": "← Anterior",
    "onboarding.next": "Próximo →",
    "onboarding.saving": "Salvando seu perfil..."
  },
  en: {
    "app.name": "ZYRO",
    "app.suffix": "CODE",
    "title.lobby": "ZYRO CODE — Lobby",
    "common.back": "← Back",
    "common.loading": "Loading...",
    "common.save": "Save",
    "common.saved_settings": "Settings saved successfully!",
    "nav.map": "Map",
    "nav.missions": "Missions",
    "nav.ranking": "Ranking",
    "nav.shop": "Shop",
    "nav.profile": "Profile",
    "lobby.modules_title": "Zyro Modules",
    "lobby.courses": "Courses",
    "lobby.modules_desc": "Choose a module, advance through courses and finish lessons with 5 correct answers.",
    "profile.title": "Profile",
    "profile.loading": "Loading profile...",
    "profile.preferences_title": "User preferences",
    "profile.preferences_desc": "Adjust your flag and open the shop to change photo or banner.",
    "profile.country": "Flag",
    "profile.level": "Level",
    "profile.xp": "XP",
    "profile.league": "League",
    "profile.followers": "Followers",
    "profile.saved": "Preferences saved successfully!",
    "profile.country_updated": "Country updated to {flag} {name}",
    "profile.country_error": "Error saving country",
    "profile.choose_country": "Choose your country",
    "shop.title": "Shop",
    "shop.desc": "Spend your coins wisely!",
    "shop.items": "Items",
    "shop.characters": "Characters",
    "shop.avatars": "Profile Photos",
    "shop.banners": "Banners",
    "shop.my_banners": "My Banners",
    "shop.boosts": "Boosts",
    "ranking.title": "🏆 Global Ranking",
    "ranking.desc": "Top 50 users by XP and high score. Each player appears only once.",
    "missions.title": "🎯 Daily Missions",
    "missions.desc": "Resets every day at midnight",
    "settings.menu": "Settings menu",
    "settings.config": "ZYRO CODE Settings",
    "settings.back": "Profile",
    "settings.profile": "Profile",
    "settings.notifications": "Notifications",
    "settings.courses": "Courses",
    "settings.social": "Social accounts",
    "settings.privacy": "Privacy",
    "settings.help": "Help Center",
    "settings.comments": "Send feedback",
    "settings.logout": "Log out",
    "prefs.title": "Preferences",
    "prefs.headline": "Personalize your ZYRO CODE",
    "prefs.description": "Adjust visual, sound, language and performance settings.",
    "prefs.theme": "Theme",
    "prefs.color": "Primary color",
    "prefs.shortcuts": "Audio and interaction",
    "prefs.language": "Language",
    "theme.light": "Light",
    "theme.dark": "Dark",
    "sound.label": "Sound effects",
    "music.enabled": "Background music",
    "music.volume": "Volume",
    "music.label": "App music",
    "music.none": "None",
    "music.1": "Music 1",
    "music.2": "Music 2",
    "music.3": "Music 3",
    "vibration.label": "Vibration",
    "performance.label": "Reduced motion",
    "save.button": "Save settings",
    "help.title": "Need support?",
    "privacy.title": "Your data, your rules",
    "comments.title": "Send your feedback",
    "notifications.title": "Control what reaches you",
    "courses.title": "Adjust your content",
    "social.title": "Connect your accounts",
    "achievements.title": "Achievements"
    ,"login.tagline": "Learn programming from zero by playing",
    "login.create": "Create your free account",
    "login.subtitle": "Sign in with Google and start your programming journey",
    "login.google": "Sign in with Google",
    "login.or": "or",
    "login.guest": "Explore as guest",
    "login.logout": "Log out"
    ,"onboarding.of": "of",
    "onboarding.welcome": "Welcome to ZYRO CODE!",
    "onboarding.prev": "← Previous",
    "onboarding.next": "Next →",
    "onboarding.saving": "Saving your profile..."
  },
  es: {
    "app.name": "ZYRO",
    "app.suffix": "CODE",
    "title.lobby": "ZYRO CODE — Lobby",
    "common.back": "← Volver",
    "common.loading": "Cargando...",
    "common.save": "Guardar",
    "common.saved_settings": "¡Configuración guardada con éxito!",
    "nav.map": "Mapa",
    "nav.missions": "Misiones",
    "nav.ranking": "Ranking",
    "nav.shop": "Tienda",
    "nav.profile": "Perfil",
    "lobby.modules_title": "Módulos Zyro",
    "lobby.courses": "Cursos",
    "lobby.modules_desc": "Elige un módulo, avanza por los cursos y completa las lecciones con 5 respuestas correctas.",
    "profile.title": "Perfil",
    "profile.loading": "Cargando perfil...",
    "profile.preferences_title": "Preferencias del usuario",
    "profile.preferences_desc": "Ajusta tu bandera y abre la tienda para cambiar foto o banner.",
    "profile.country": "Bandera",
    "profile.level": "Nivel",
    "profile.xp": "XP",
    "profile.league": "Liga",
    "profile.followers": "Seguidores",
    "profile.saved": "¡Preferencias guardadas con éxito!",
    "profile.country_updated": "País actualizado a {flag} {name}",
    "profile.country_error": "Error al guardar país",
    "profile.choose_country": "Elige tu país",
    "shop.title": "Tienda",
    "shop.desc": "¡Gasta tus monedas con sabiduría!",
    "shop.items": "Artículos",
    "shop.characters": "Personajes",
    "shop.avatars": "Fotos de Perfil",
    "shop.banners": "Banners",
    "shop.my_banners": "Mis Banners",
    "shop.boosts": "Boosts",
    "ranking.title": "🏆 Ranking Global",
    "ranking.desc": "Top 50 usuarios por XP y high score. Cada jugador aparece solo una vez.",
    "missions.title": "🎯 Misiones Diarias",
    "missions.desc": "Se reinician todos los días a medianoche",
    "settings.menu": "Menú de configuración",
    "settings.config": "Configuración ZYRO CODE",
    "settings.back": "Perfil",
    "settings.profile": "Perfil",
    "settings.notifications": "Notificaciones",
    "settings.courses": "Cursos",
    "settings.social": "Cuentas sociales",
    "settings.privacy": "Privacidad",
    "settings.help": "Centro de ayuda",
    "settings.comments": "Enviar comentarios",
    "settings.logout": "Salir",
    "prefs.title": "Preferencias",
    "prefs.headline": "Personaliza tu ZYRO CODE",
    "prefs.description": "Ajusta visuales, sonido, idioma y rendimiento.",
    "prefs.theme": "Tema",
    "prefs.color": "Color principal",
    "prefs.shortcuts": "Audio e interacción",
    "prefs.language": "Idioma",
    "theme.light": "Claro",
    "theme.dark": "Oscuro",
    "sound.label": "Efectos de sonido",
    "music.enabled": "Música de fondo",
    "music.volume": "Volumen",
    "music.label": "Música de la app",
    "music.none": "Ninguna",
    "music.1": "Música 1",
    "music.2": "Música 2",
    "music.3": "Música 3",
    "vibration.label": "Vibración",
    "performance.label": "Animaciones reducidas",
    "save.button": "Guardar configuración",
    "help.title": "¿Necesitas soporte?",
    "privacy.title": "Tus datos, tus reglas",
    "comments.title": "Envía tu opinión",
    "notifications.title": "Controla lo que te llega",
    "courses.title": "Ajusta tu contenido",
    "social.title": "Conecta tus cuentas",
    "achievements.title": "Logros"
    ,"login.tagline": "Aprende programación desde cero jugando",
    "login.create": "Crea tu cuenta gratis",
    "login.subtitle": "Entra con Google y empieza tu camino de programación",
    "login.google": "Entrar con Google",
    "login.or": "o",
    "login.guest": "Explorar como visitante",
    "login.logout": "Salir"
    ,"onboarding.of": "de",
    "onboarding.welcome": "¡Bienvenido a ZYRO CODE!",
    "onboarding.prev": "← Anterior",
    "onboarding.next": "Siguiente →",
    "onboarding.saving": "Guardando tu perfil..."
  }
};

window.ZYRO_I18N = ZYRO_I18N;

const rel = (path) => {
  const depth = Math.max(0, location.pathname.split("/").filter(Boolean).length - 1);
  return `${"../".repeat(depth)}${path}`;
};

const MUSIC_FILES = {
  none: null,
  music1: rel("assets/audio/music1.mp3"),
  music2: rel("assets/audio/music2.mp3"),
  music3: rel("assets/audio/music3.mp3")
};
const CLICK_AUDIO_FILE = rel("assets/audio/click.mp3");

let preferences = readLocalPreferences();
let currentUser = null;
let unsubscribeUser = null;
let audio = null;
let clickAudio = null;
let lastClickSoundAt = 0;
let applyingRemote = false;
let achievementGroups = window.ZYRO_ACHIEVEMENT_GROUPS || [];

function coerceBool(value, fallback) {
  if (value === undefined || value === null || value === "") return fallback;
  if (typeof value === "boolean") return value;
  return String(value) === "true";
}

function normalizePreferencePatch(raw = {}) {
  const patch = { ...raw };
  if (patch.lang && !patch.language) patch.language = patch.lang;
  if (patch.sounds !== undefined && patch.sfxEnabled === undefined) patch.sfxEnabled = patch.sounds;
  if (patch.vibration !== undefined && patch.vibrationEnabled === undefined) patch.vibrationEnabled = patch.vibration;
  if (patch.performance !== undefined && patch.reducedMotion === undefined) patch.reducedMotion = patch.performance;
  if (patch.equippedBanner && !patch.selectedBanner) patch.selectedBanner = patch.equippedBanner;
  if (patch.equippedAvatar && !patch.selectedAvatar) patch.selectedAvatar = patch.equippedAvatar;

  const countryCode = patch.countryCode || patch.country;
  if (countryCode && COUNTRIES[countryCode]) {
    patch.country = countryCode;
    patch.countryName = patch.countryName || COUNTRIES[countryCode].name;
    patch.countryFlag = patch.countryFlag || COUNTRIES[countryCode].flag;
  }

  return patch;
}

function readJson(key) {
  try {
    return JSON.parse(localStorage.getItem(key) || "{}");
  } catch {
    return {};
  }
}

function readLocalPreferences() {
  const stored = normalizePreferencePatch(readJson(STORAGE_KEY));
  const legacy = normalizePreferencePatch({
    theme: localStorage.getItem(LEGACY_KEYS.theme),
    language: localStorage.getItem(LEGACY_KEYS.language),
    sfxEnabled: localStorage.getItem(LEGACY_KEYS.sfxEnabled),
    vibrationEnabled: localStorage.getItem(LEGACY_KEYS.vibrationEnabled),
    reducedMotion: localStorage.getItem(LEGACY_KEYS.reducedMotion),
    musicChoice: localStorage.getItem(LEGACY_KEYS.musicChoice),
    country: localStorage.getItem(LEGACY_KEYS.country) || localStorage.getItem(LEGACY_KEYS.countryCode),
    countryName: localStorage.getItem(LEGACY_KEYS.countryName),
    countryFlag: localStorage.getItem(LEGACY_KEYS.countryFlag),
    selectedBanner: localStorage.getItem(LEGACY_KEYS.selectedBanner),
    selectedAvatar: localStorage.getItem(LEGACY_KEYS.selectedAvatar)
  });

  const merged = { ...DEFAULTS, ...legacy, ...stored };
  merged.sfxEnabled = coerceBool(merged.sfxEnabled, DEFAULTS.sfxEnabled);
  merged.vibrationEnabled = coerceBool(merged.vibrationEnabled, DEFAULTS.vibrationEnabled);
  merged.reducedMotion = coerceBool(merged.reducedMotion, DEFAULTS.reducedMotion);
  merged.musicEnabled = coerceBool(merged.musicEnabled, DEFAULTS.musicEnabled);
  merged.musicVolume = Math.min(1, Math.max(0, Number(merged.musicVolume ?? DEFAULTS.musicVolume)));
  return merged;
}

function writeLocal(next) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  localStorage.setItem(LEGACY_KEYS.theme, next.theme);
  localStorage.setItem(LEGACY_KEYS.language, next.language);
  localStorage.setItem(LEGACY_KEYS.sfxEnabled, String(next.sfxEnabled));
  localStorage.setItem(LEGACY_KEYS.vibrationEnabled, String(next.vibrationEnabled));
  localStorage.setItem(LEGACY_KEYS.reducedMotion, String(next.reducedMotion));
  localStorage.setItem(LEGACY_KEYS.musicChoice, next.musicChoice || "none");
  localStorage.setItem(LEGACY_KEYS.country, next.country);
  localStorage.setItem(LEGACY_KEYS.countryCode, next.country);
  localStorage.setItem(LEGACY_KEYS.countryName, next.countryName);
  localStorage.setItem(LEGACY_KEYS.countryFlag, next.countryFlag);
  localStorage.setItem(LEGACY_KEYS.selectedBanner, next.selectedBanner);
  localStorage.setItem(LEGACY_KEYS.selectedAvatar, next.selectedAvatar);
}

function t(key, params = {}) {
  const dict = ZYRO_I18N[preferences.language] || ZYRO_I18N.pt;
  let text = dict[key] || ZYRO_I18N.pt[key] || key;
  for (const [name, value] of Object.entries(params)) {
    text = text.replace(new RegExp(`{${name}}`, "g"), value);
  }
  return text;
}

function ensureGlobalCss() {
  if (document.getElementById("zyro-global-preferences-style")) return;
  const style = document.createElement("style");
  style.id = "zyro-global-preferences-style";
  style.textContent = `
    :root {
      --app-bg: #050505;
      --app-card: #121212;
      --app-text: #f8f8f8;
      --app-muted: rgba(255,255,255,.58);
      --app-primary: #ff7b00;
      --app-primary-2: #ffd36a;
    }
    html.theme-light {
      --app-bg: #f7f7f9;
      --app-card: #ffffff;
      --app-text: #101014;
      --app-muted: rgba(16,16,20,.62);
    }
    html.theme-dark {
      --app-bg: #050505;
      --app-card: #121212;
      --app-text: #f8f8f8;
      --app-muted: rgba(255,255,255,.58);
    }
    body {
      color: var(--app-text);
      accent-color: var(--app-primary);
    }
    html.theme-light body {
      background: var(--app-bg);
      color: var(--app-text);
    }
    html.reduced-motion *,
    html.reduced-motion *::before,
    html.reduced-motion *::after {
      animation-duration: .001ms !important;
      animation-iteration-count: 1 !important;
      scroll-behavior: auto !important;
      transition-duration: .001ms !important;
    }
  `;
  document.head.appendChild(style);
}

function setClasses() {
  const root = document.documentElement;
  const body = document.body;
  root.classList.remove("theme-dark", "theme-light", "lang-pt", "lang-en", "lang-es", "reduced-motion");
  root.classList.add(preferences.theme === "light" ? "theme-light" : "theme-dark");
  root.classList.add(`lang-${preferences.language || "pt"}`);
  root.classList.toggle("reduced-motion", Boolean(preferences.reducedMotion));
  root.lang = preferences.language === "en" ? "en" : preferences.language === "es" ? "es" : "pt-BR";

  if (body) {
    body.classList.remove("theme-dark", "theme-light", "lang-pt", "lang-en", "lang-es", "reduced-motion", "performance-mode");
    body.classList.add(preferences.theme === "light" ? "theme-light" : "theme-dark");
    body.classList.add(`lang-${preferences.language || "pt"}`);
    body.classList.toggle("reduced-motion", Boolean(preferences.reducedMotion));
    body.classList.toggle("performance-mode", Boolean(preferences.reducedMotion));
  }
}

function setVariables() {
  const root = document.documentElement;
  root.style.setProperty("--app-primary", preferences.primaryColor || DEFAULTS.primaryColor);
  root.style.setProperty("--app-primary-2", preferences.primaryColor2 || DEFAULTS.primaryColor2);
  root.style.setProperty("--app-bg", preferences.theme === "light" ? "#f7f7f9" : "#050505");
  root.style.setProperty("--app-card", preferences.theme === "light" ? "#ffffff" : "#121212");
  root.style.setProperty("--app-text", preferences.theme === "light" ? "#101014" : "#f8f8f8");
  root.style.setProperty("--app-muted", preferences.theme === "light" ? "rgba(16,16,20,.62)" : "rgba(255,255,255,.58)");
  root.style.setProperty("--orange", preferences.primaryColor || DEFAULTS.primaryColor);
  root.style.setProperty("--accent", preferences.primaryColor || DEFAULTS.primaryColor);
}

function applyTranslations(root = document) {
  const dict = ZYRO_I18N[preferences.language] || ZYRO_I18N.pt;
  root.querySelectorAll?.("[data-i18n]").forEach((el) => {
    const key = el.getAttribute("data-i18n");
    const attr = el.getAttribute("data-i18n-attr") || "textContent";
    const text = dict[key] || ZYRO_I18N.pt[key];
    if (!text) {
      if (attr === "textContent" && !el.dataset.i18nOriginal) el.dataset.i18nOriginal = el.textContent;
      return;
    }
    if (attr === "textContent") el.textContent = text;
    else el.setAttribute(attr, text);
  });
}

function playMusic() {
  if (!preferences.musicEnabled || preferences.musicChoice === "none") {
    if (audio) audio.pause();
    return;
  }

  const src = MUSIC_FILES[preferences.musicChoice] || MUSIC_FILES.music1;
  if (!src) return;

  if (!audio || audio.dataset.src !== src) {
    if (audio) audio.pause();
    audio = new Audio(src);
    audio.dataset.src = src;
    audio.loop = true;
    audio.preload = "auto";
  }

  audio.volume = Math.min(1, Math.max(0, Number(preferences.musicVolume || 0)));
  audio.play().catch(() => {
    const resume = () => {
      audio?.play().catch(() => {});
      window.removeEventListener("pointerdown", resume);
      window.removeEventListener("keydown", resume);
    };
    window.addEventListener("pointerdown", resume, { once: true });
    window.addEventListener("keydown", resume, { once: true });
  });
}

function playClick() {
  if (!preferences.sfxEnabled) return;
  const now = performance.now();
  if (now - lastClickSoundAt < 80) return;
  lastClickSoundAt = now;

  if (!clickAudio) {
    clickAudio = new Audio(CLICK_AUDIO_FILE);
    clickAudio.preload = "auto";
  }

  try {
    clickAudio.currentTime = 0;
    clickAudio.volume = Math.min(1, Math.max(0, Number(preferences.musicVolume || 0.28)));
    clickAudio.play().catch(() => playClickFallback());
  } catch {
    playClickFallback();
  }
}

function playClickFallback() {
  if (!preferences.sfxEnabled) return;
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = 520;
    gain.gain.value = Math.min(0.08, Math.max(0, Number(preferences.musicVolume || 0.28) * 0.18));
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.08);
    osc.stop(ctx.currentTime + 0.09);
  } catch {}
}

function vibrate(pattern = 50) {
  try {
    if (preferences.vibrationEnabled && navigator.vibrate) navigator.vibrate(pattern);
  } catch {}
}

function wireInteractions() {
  if (wireInteractions.done) return;
  wireInteractions.done = true;
  const selector = [
    "button",
    "a",
    ".nav-item",
    ".bottom-nav a",
    ".card",
    ".shop-item",
    ".achievement-card",
    ".achievement-tile",
    "input[type='checkbox']",
    "select"
  ].join(",");

  document.addEventListener("click", (event) => {
    const target = event.target.closest(selector);
    if (!target) return;
    playClick();
    vibrate(35);
  }, true);
}

function wireTranslationObserver() {
  if (wireTranslationObserver.done) return;
  wireTranslationObserver.done = true;
  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (node.nodeType !== Node.ELEMENT_NODE) continue;
        if (node.matches?.("[data-i18n]") || node.querySelector?.("[data-i18n]")) {
          applyTranslations(node.matches?.("[data-i18n]") ? node.parentElement || document : node);
        }
      }
    }
  });
  observer.observe(document.documentElement, { childList: true, subtree: true });
}

function applyPreferences({ notify = true } = {}) {
  ensureGlobalCss();
  setClasses();
  setVariables();
  applyTranslations();
  playMusic();
  writeLocal(preferences);
  if (notify) {
    window.dispatchEvent(new CustomEvent("zyro:preferences-changed", { detail: { preferences: { ...preferences } } }));
  }
}

function mergePreferences(patch = {}, options = {}) {
  const normalized = normalizePreferencePatch(patch);
  preferences = { ...preferences, ...normalized };
  if (COUNTRIES[preferences.country]) {
    preferences.countryName = COUNTRIES[preferences.country].name;
    preferences.countryFlag = COUNTRIES[preferences.country].flag;
  }
  applyPreferences(options);
  return preferences;
}

async function saveRemote(next) {
  if (!currentUser || localStorage.getItem("zyroGuest") === "true") return;

  const payload = {
    preferences: next,
    country: next.country,
    countryCode: next.country,
    countryName: next.countryName,
    countryFlag: next.countryFlag,
    selectedBanner: next.selectedBanner,
    equippedBanner: next.selectedBanner,
    selectedAvatar: next.selectedAvatar,
    equippedAvatar: next.selectedAvatar,
    updatedAt: serverTimestamp()
  };

  await setDoc(doc(db, "users", currentUser.uid), payload, { merge: true });

  const playerRef = doc(db, "players", currentUser.uid);
  const playerSnap = await getDoc(playerRef).catch(() => null);
  if (playerSnap?.exists()) {
    await setDoc(playerRef, { preferences: next, updatedAt: serverTimestamp() }, { merge: true });
  }
}

async function updatePreferences(patch = {}, options = {}) {
  mergePreferences(patch);
  if (!options.localOnly) await saveRemote(preferences);
  return preferences;
}

function normalizeUserData(data = {}) {
  return normalizePreferencePatch({
    ...(data.preferences || {}),
    country: data.countryCode || data.country,
    countryName: data.countryName,
    countryFlag: data.countryFlag,
    selectedBanner: data.selectedBanner || data.equippedBanner,
    selectedAvatar: data.selectedAvatar || data.equippedAvatar
  });
}

function watchUser(uid) {
  if (unsubscribeUser) unsubscribeUser();
  unsubscribeUser = onSnapshot(doc(db, "users", uid), (snap) => {
    if (!snap.exists()) return;
    window.ZyroPlayerData = { uid, ...snap.data() };
    window.dispatchEvent(new CustomEvent("zyro:player-data-changed", { detail: { playerData: window.ZyroPlayerData } }));
    applyingRemote = true;
    mergePreferences(normalizeUserData(snap.data()));
    applyingRemote = false;
  }, (error) => console.warn("ZyroPrefs user listener error", error));
}

async function loadUserPreferences(user) {
  const userSnap = await getDoc(doc(db, "users", user.uid)).catch(() => null);
  if (userSnap?.exists()) {
    window.ZyroPlayerData = { uid: user.uid, ...userSnap.data() };
    window.dispatchEvent(new CustomEvent("zyro:player-data-changed", { detail: { playerData: window.ZyroPlayerData } }));
    mergePreferences(normalizeUserData(userSnap.data()), { notify: false });
  }

  const playerSnap = await getDoc(doc(db, "players", user.uid)).catch(() => null);
  if (playerSnap?.exists()) mergePreferences(normalizePreferencePatch(playerSnap.data().preferences || {}), { notify: false });

  applyPreferences();
  watchUser(user.uid);
}

function initAuth() {
  onAuthStateChanged(auth, async (user) => {
    currentUser = user;
    if (unsubscribeUser) {
      unsubscribeUser();
      unsubscribeUser = null;
    }

    if (!user || localStorage.getItem("zyroGuest") === "true") {
      mergePreferences(readLocalPreferences());
      return;
    }

    try {
      await loadUserPreferences(user);
    } catch (error) {
      console.warn("ZyroPrefs Firebase load error", error);
      mergePreferences(readLocalPreferences());
    }
  });
}

function showGlobalToast(message) {
  let toast = document.getElementById("zyro-global-toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "zyro-global-toast";
    toast.style.cssText = "position:fixed;left:50%;bottom:24px;transform:translateX(-50%) translateY(10px);z-index:9999;background:rgba(17,17,17,.96);color:#fff;border:1px solid var(--app-primary);border-radius:14px;padding:13px 18px;font:700 14px/1.3 'DM Sans',sans-serif;opacity:0;transition:.2s;pointer-events:none;text-align:center;max-width:min(92vw,420px)";
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.style.opacity = "1";
  toast.style.transform = "translateX(-50%) translateY(0)";
  clearTimeout(showGlobalToast.timer);
  showGlobalToast.timer = setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateX(-50%) translateY(10px)";
  }, 2400);
}

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function registerAchievements(groups = []) {
  achievementGroups = Array.isArray(groups) ? groups : [];
  window.ZYRO_ACHIEVEMENT_GROUPS = achievementGroups;
}

function getAchievementItems() {
  return achievementGroups.flatMap((group) => group.items || []);
}

function renderAchievementsPreview(playerData = {}) {
  const container = document.getElementById("achievementsPreview") || document.querySelector(".achievements-scroll");
  if (!container) return;

  const unlocked = {
    novo_membro: true,
    ...(playerData.achievements || {})
  };

  const items = getAchievementItems().slice(0, 8);
  container.innerHTML = items.map((item) => {
    const isUnlocked = Boolean(unlocked[item.id]);
    const image = item.image || "";

    return `
      <article class="achievement-card ${isUnlocked ? "unlocked" : "locked"}" data-achievement-id="${escapeHtml(item.id)}">
        ${isUnlocked ? "" : '<span class="lock-badge" aria-label="Bloqueada">🔒</span>'}
        <div class="achievement-art">
          <img class="achievement-img" src="${escapeHtml(image)}" alt="${escapeHtml(item.title)}" loading="lazy">
        </div>
        <div class="achievement-title">${escapeHtml(item.title)}</div>
        <div class="achievement-desc">${escapeHtml(item.desc)}</div>
      </article>
    `;
  }).join("");
}

window.ZyroPrefs = {
  init: () => applyPreferences(),
  t,
  countries: COUNTRIES,
  getState: () => ({ ...preferences }),
  getPreferences: () => ({ ...preferences }),
  update: updatePreferences,
  save: updatePreferences,
  showToast: showGlobalToast,
  registerAchievements,
  renderAchievementsPreview,
  applyTranslations,
  applyTheme: (theme) => updatePreferences({ theme }),
  setLanguage: (language) => updatePreferences({ language }),
  setMusicChoice: (musicChoice) => updatePreferences({ musicChoice, musicEnabled: musicChoice !== "none" }),
  setMusicEnabled: (musicEnabled) => updatePreferences({ musicEnabled }),
  setMusicVolume: (musicVolume) => updatePreferences({ musicVolume }),
  setSounds: (sfxEnabled) => updatePreferences({ sfxEnabled }),
  setSoundsEnabled: (sfxEnabled) => updatePreferences({ sfxEnabled }),
  setVibration: (vibrationEnabled) => updatePreferences({ vibrationEnabled }),
  setVibrationEnabled: (vibrationEnabled) => updatePreferences({ vibrationEnabled }),
  applyPerformance: (reducedMotion) => updatePreferences({ reducedMotion }),
  applyPerformanceMode: (reducedMotion) => updatePreferences({ reducedMotion }),
  setCountry: (country) => updatePreferences({ country }),
  setCosmetics: ({ selectedBanner, selectedAvatar } = {}) => updatePreferences({ selectedBanner, selectedAvatar })
};

window.setZyroLanguage = window.ZyroPrefs.setLanguage;
window.zyroVibrate = vibrate;
window.zyroPlayClick = playClick;
window.zyroPlaySfx = playClick;
window.renderAchievementsPreview = renderAchievementsPreview;

window.addEventListener("storage", (event) => {
  if (event.key !== STORAGE_KEY || applyingRemote) return;
  mergePreferences(readLocalPreferences());
});

function init() {
  applyPreferences({ notify: false });
  wireInteractions();
  wireTranslationObserver();
  initAuth();
  window.dispatchEvent(new CustomEvent("zyro:preferences-ready", { detail: { preferences: { ...preferences } } }));
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init, { once: true });
} else {
  init();
}
