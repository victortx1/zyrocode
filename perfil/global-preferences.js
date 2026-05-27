/* global-preferences.js
   Controls site-wide preferences: theme, background sound, vibration,
   performance mode, and simple translation system (data-i18n).
   Exposes `window.ZyroPrefs` API for other modules.
*/
(function () {
  const STORAGE_KEYS = {
    theme: 'zyroTheme',
    sounds: 'zyroSounds',
    vibration: 'zyroVibration',
    performance: 'zyroPerformance',
    lang: 'zyroLang'
  };

  const DEFAULTS = {
    theme: 'dark',
    sounds: true,
    vibration: true,
    performance: false,
    lang: 'pt'
  };

  const translations = {
    pt: {
      'prefs.title': 'Preferências',
      'prefs.headline': 'Personalize seu ZYRO CODE',
      'prefs.description': 'Ajuste o visual, som, idioma e desempenho do aplicativo.',
      'prefs.theme': 'Tema',
      'theme.light': 'Branco',
      'theme.dark': 'Preto',
      'prefs.shortcuts': 'Atalhos',
      'sound.label': 'Sons do app',
      'vibration.label': 'Vibração',
      'performance.label': 'Modo desempenho',
      'prefs.language': 'Idioma',
      'save.button': 'Salvar'
    },
    en: {
      'prefs.title': 'Preferences',
      'prefs.headline': 'Personalize your ZYRO CODE',
      'prefs.description': 'Adjust visual, sound, language and performance settings.',
      'prefs.theme': 'Theme',
      'theme.light': 'Light',
      'theme.dark': 'Dark',
      'prefs.shortcuts': 'Shortcuts',
      'sound.label': 'App sounds',
      'vibration.label': 'Vibration',
      'performance.label': 'Performance mode',
      'prefs.language': 'Language',
      'save.button': 'Save'
    },
    es: {
      'prefs.title': 'Preferencias',
      'prefs.headline': 'Personaliza tu ZYRO CODE',
      'prefs.description': 'Ajusta visuales, sonido, idioma y rendimiento.',
      'prefs.theme': 'Tema',
      'theme.light': 'Blanco',
      'theme.dark': 'Negro',
      'prefs.shortcuts': 'Atajos',
      'sound.label': 'Sonidos de la app',
      'vibration.label': 'Vibración',
      'performance.label': 'Modo rendimiento',
      'prefs.language': 'Idioma',
      'save.button': 'Guardar'
    }
  };

  let state = {
    theme: DEFAULTS.theme,
    sounds: DEFAULTS.sounds,
    vibration: DEFAULTS.vibration,
    performance: DEFAULTS.performance,
    lang: DEFAULTS.lang,
    audio: null,
    audioBlocked: false
  };

  function readBoolean(key, fallback) {
    try {
      const v = localStorage.getItem(key);
      if (v === null) return fallback;
      return v === 'true';
    } catch (e) {
      return fallback;
    }
  }

  function loadState() {
    try {
      state.theme = localStorage.getItem(STORAGE_KEYS.theme) || DEFAULTS.theme;
      state.sounds = readBoolean(STORAGE_KEYS.sounds, DEFAULTS.sounds);
      state.vibration = readBoolean(STORAGE_KEYS.vibration, DEFAULTS.vibration);
      state.performance = readBoolean(STORAGE_KEYS.performance, DEFAULTS.performance);
      state.lang = localStorage.getItem(STORAGE_KEYS.lang) || DEFAULTS.lang;
    } catch (e) {
      console.warn('ZyroPrefs: error loading state', e);
    }
  }

  function saveState(key, value) {
    try {
      localStorage.setItem(key, String(value));
    } catch (e) {
      console.warn('ZyroPrefs: failed to save', e);
    }
  }

  function applyTheme(theme) {
    const htmlBody = document.body;
    htmlBody.classList.remove('theme-dark', 'theme-light');
    if (theme === 'light') htmlBody.classList.add('theme-light');
    else htmlBody.classList.add('theme-dark');
    state.theme = theme;
    saveState(STORAGE_KEYS.theme, theme);
  }

  function applyPerformanceMode(enabled) {
    const htmlBody = document.body;
    if (enabled) htmlBody.classList.add('performance-mode');
    else htmlBody.classList.remove('performance-mode');
    state.performance = !!enabled;
    saveState(STORAGE_KEYS.performance, state.performance);
    ensurePerformanceCss();
  }

  function ensurePerformanceCss() {
    if (document.getElementById('zyro-performance-style')) return;
    const css = `
      .performance-mode * { transition-duration: 0s !important; animation-duration: 0s !important; animation-delay: 0s !important; }
      .performance-mode { filter: none !important; }
      .performance-mode * { box-shadow: none !important; }
      .performance-mode .particle, .performance-mode .particles { display: none !important; }
      .performance-mode a:hover, .performance-mode .btn-buy:hover { transform: none !important; }
    `;
    const style = document.createElement('style');
    style.id = 'zyro-performance-style';
    style.appendChild(document.createTextNode(css));
    document.head.appendChild(style);
  }

  function createAudio() {
    if (state.audio) return;
    const audio = new Audio('../assets/audio/background.mp3');
    audio.loop = true;
    audio.preload = 'auto';
    audio.volume = 0.28;
    state.audio = audio;

    audio.play().catch(() => {
      state.audioBlocked = true;
      const resume = () => {
        audio.play().then(() => { state.audioBlocked = false; }).catch(() => { state.audioBlocked = true; });
        window.removeEventListener('pointerdown', resume);
        window.removeEventListener('keydown', resume);
      };
      window.addEventListener('pointerdown', resume, { once: true });
      window.addEventListener('keydown', resume, { once: true });
    });
  }

  function setSoundsEnabled(enabled) {
    state.sounds = !!enabled;
    saveState(STORAGE_KEYS.sounds, state.sounds);
    if (state.sounds) {
      createAudio();
      if (state.audio && !state.audioBlocked) state.audio.play().catch(()=>{});
    } else {
      if (state.audio) state.audio.pause();
    }
  }

  function setVibrationEnabled(enabled) {
    state.vibration = !!enabled;
    saveState(STORAGE_KEYS.vibration, state.vibration);
  }

  function vibrateIfAllowed() {
    try {
      if (state.vibration && navigator && typeof navigator.vibrate === 'function') {
        navigator.vibrate(80);
      }
    } catch (e) { /* ignore */ }
  }

  function setLanguage(lang) {
    state.lang = lang || DEFAULTS.lang;
    saveState(STORAGE_KEYS.lang, state.lang);
    document.documentElement.lang = state.lang;
    translatePage();
  }

  function translatePage() {
    const dict = translations[state.lang] || translations[DEFAULTS.lang];
    document.querySelectorAll('[data-i18n]').forEach((el) => {
      const key = el.getAttribute('data-i18n');
      if (!key) return;
      const text = (dict && dict[key]) ? dict[key] : key;
      el.textContent = text;
    });
  }

  function init() {
    loadState();
    applyTheme(state.theme);
    applyPerformanceMode(state.performance);
    document.documentElement.lang = state.lang;
    translatePage();
    if (state.sounds) setSoundsEnabled(true);
  }

  // Expose API
  window.ZyroPrefs = {
    init,
    applyTheme,
    setSoundsEnabled,
    setVibrationEnabled,
    vibrateIfAllowed,
    applyPerformanceMode,
    setLanguage,
    getState: () => ({ ...state }),
    translations
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();

  // Elements marked with data-vibrate trigger vibration on pointerdown
  document.addEventListener('pointerdown', (ev) => {
    try {
      const el = ev.target instanceof Element ? ev.target.closest('[data-vibrate]') : null;
      if (el) vibrateIfAllowed();
    } catch (e) {}
  });
})();
