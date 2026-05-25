/* js/global-preferences.js
   Global preferences for Zyro Code
   Controls: theme, background music, vibration, performance mode, language (i18n)
   Exposes: window.ZyroPrefs, window.zyroVibrate, window.ZYRO_I18N, window.setZyroLanguage
*/
(function () {
  const STORAGE = {
    theme: 'zyro_theme',
    sounds: 'zyro_sounds',
    vibration: 'zyro_vibration',
    performance: 'zyro_performance',
    lang: 'zyro_language',
    music: 'zyro_music'
  };

  const DEFAULTS = {
    theme: 'dark',
    sounds: true,
    vibration: true,
    performance: false,
    lang: 'pt',
    music: 'none'
  };

  const I18N = {
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
      'save.button': 'Salvar',
      'music.none': 'Nenhuma',
      'music.1': 'Música 1',
      'music.2': 'Música 2',
      'music.3': 'Música 3'
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
      'save.button': 'Save',
      'music.none': 'None',
      'music.1': 'Music 1',
      'music.2': 'Music 2',
      'music.3': 'Music 3'
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
      'save.button': 'Guardar',
      'music.none': 'Ninguna',
      'music.1': 'Música 1',
      'music.2': 'Música 2',
      'music.3': 'Música 3'
    }
  };

  function assetsPath(rel) {
    const segs = location.pathname.split('/').filter(Boolean);
    const prefix = segs.length > 1 ? '../'.repeat(segs.length - 1) : '';
    return prefix + rel;
  }

  const MUSIC_FILES = {
    none: null,
    music1: assetsPath('assets/audio/music1.mp3'),
    music2: assetsPath('assets/audio/music2.mp3'),
    music3: assetsPath('assets/audio/music3.mp3')
  };

  let state = {
    theme: DEFAULTS.theme,
    sounds: DEFAULTS.sounds,
    vibration: DEFAULTS.vibration,
    performance: DEFAULTS.performance,
    lang: DEFAULTS.lang,
    music: DEFAULTS.music,
    audio: null,
    audioBlocked: false
  };

  function readBool(key, fallback) {
    try { const v = localStorage.getItem(key); if (v === null) return fallback; return v === 'true'; } catch { return fallback; }
  }
  function load() {
    try {
      state.theme = localStorage.getItem(STORAGE.theme) || DEFAULTS.theme;
      state.sounds = readBool(STORAGE.sounds, DEFAULTS.sounds);
      state.vibration = readBool(STORAGE.vibration, DEFAULTS.vibration);
      state.performance = readBool(STORAGE.performance, DEFAULTS.performance);
      state.lang = localStorage.getItem(STORAGE.lang) || DEFAULTS.lang;
      state.music = localStorage.getItem(STORAGE.music) || DEFAULTS.music;
    } catch (e) { console.warn('ZyroPrefs load error', e); }
  }

  function save(key, value) { try { localStorage.setItem(key, String(value)); } catch (e) { console.warn('ZyroPrefs save error', e); } }

  function applyTheme(t) {
    document.body.classList.remove('theme-dark','theme-light');
    document.body.classList.add(t === 'light' ? 'theme-light' : 'theme-dark');
    state.theme = t; save(STORAGE.theme, t);
  }

  function applyPerformance(on) {
    if (on) document.body.classList.add('performance-mode'); else document.body.classList.remove('performance-mode');
    state.performance = !!on; save(STORAGE.performance, state.performance);
    ensurePerformanceCss();
  }

  function ensurePerformanceCss(){ if (document.getElementById('zyro-performance-style')) return; const css = `body.performance-mode *{animation:none!important;transition-duration:0.05s!important;box-shadow:none!important;filter:none!important} body.performance-mode .particle, body.performance-mode canvas{display:none!important}`; const s=document.createElement('style'); s.id='zyro-performance-style'; s.appendChild(document.createTextNode(css)); document.head.appendChild(s);} 

  function createAudio(src) {
    if (state.audio) { state.audio.pause(); state.audio = null; }
    if (!src) return;
    const a = new Audio(src);
    a.loop = true; a.preload = 'auto'; a.volume = 0.28; state.audio = a;
    a.play().catch(()=>{
      state.audioBlocked = true;
      const resume = () => { a.play().then(()=>state.audioBlocked=false).catch(()=>state.audioBlocked=true); window.removeEventListener('pointerdown',resume); window.removeEventListener('keydown',resume); };
      window.addEventListener('pointerdown', resume, { once: true }); window.addEventListener('keydown', resume, { once: true });
    });
  }

  function setSounds(on) { state.sounds = !!on; save(STORAGE.sounds, state.sounds); if (state.sounds && state.music && MUSIC_FILES[state.music]) { createAudio(MUSIC_FILES[state.music]); } else { if (state.audio) state.audio.pause(); } }

  function setMusicChoice(choice) { state.music = choice || 'none'; save(STORAGE.music, state.music); if (state.sounds) { const src = MUSIC_FILES[state.music]; if (src) createAudio(src); else if (state.audio) state.audio.pause(); } }

  function setVibration(on) { state.vibration = !!on; save(STORAGE.vibration, state.vibration); }

  window.zyroVibrate = function(pattern = 80) {
    try {
      const enabled = localStorage.getItem(STORAGE.vibration) === 'true';
      if (enabled && navigator && typeof navigator.vibrate === 'function') navigator.vibrate(pattern);
    } catch(e){}
  };

  // i18n
  window.ZYRO_I18N = I18N;
  function applyTranslations(){ const dict = I18N[state.lang] || I18N[DEFAULTS.lang]; document.querySelectorAll('[data-i18n]').forEach(el=>{ const key = el.getAttribute('data-i18n'); if(!key) return; const txt = dict && dict[key] ? dict[key] : key; el.textContent = txt; }); }
  window.setZyroLanguage = function(lang){ state.lang = lang || DEFAULTS.lang; save(STORAGE.lang, state.lang); document.documentElement.lang = state.lang; applyTranslations(); };
  window.applyZyroTranslations = applyTranslations;

  function init(){ load(); applyTheme(state.theme); applyPerformance(state.performance); document.documentElement.lang = state.lang; applyTranslations(); if (state.sounds) { const src = MUSIC_FILES[state.music]; if (src) createAudio(src); } }

  window.ZyroPrefs = {
    init,
    applyTheme,
    applyPerformance,
    setSounds,
    setSoundsEnabled: setSounds,
    setMusicChoice,
    setVibration,
    setVibrationEnabled: setVibration,
    setLanguage: window.setZyroLanguage,
    getState: ()=> ({...state}),
  };
  // backward compat aliases
  window.ZyroPrefs.applyPerformanceMode = window.ZyroPrefs.applyPerformance;
  window.ZyroPrefs.setLanguage = window.ZyroPrefs.setLanguage || window.setZyroLanguage;

  // Auto init
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();

})();
