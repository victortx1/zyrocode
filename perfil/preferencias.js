const btnBack = document.getElementById("btnBack");
const saveBtn = document.getElementById("saveBtn");
const toast = document.getElementById("toast");
const themeRadios = document.querySelectorAll('input[name="theme"]');
const prefMusicEnabled = document.getElementById("prefMusicEnabled");
const prefSounds = document.getElementById("prefSounds");
const prefVibration = document.getElementById("prefVibration");
const prefPerformance = document.getElementById("prefPerformance");
const languageSelect = document.getElementById("languageSelect");
const musicSelect = document.getElementById("musicSelect");
const musicVolume = document.getElementById("musicVolume");
const primaryColor = document.getElementById("primaryColor");
const colorPreview = document.getElementById("colorPreview");

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toast.classList.remove("show"), 2400);
}

function getPrefs() {
  return window.ZyroPrefs?.getPreferences?.() || window.ZyroPrefs?.getState?.() || {};
}

function setFormValues() {
  const prefs = getPrefs();
  themeRadios.forEach((radio) => {
    radio.checked = radio.value === (prefs.theme || "dark");
  });

  prefMusicEnabled.checked = Boolean(prefs.musicEnabled);
  prefSounds.checked = prefs.sfxEnabled !== false;
  prefVibration.checked = prefs.vibrationEnabled !== false;
  prefPerformance.checked = Boolean(prefs.reducedMotion);
  languageSelect.value = prefs.language || "pt";
  musicSelect.value = prefs.musicChoice || "none";
  musicVolume.value = String(prefs.musicVolume ?? 0.28);
  primaryColor.value = prefs.primaryColor || "#ff7b00";
  colorPreview.style.background = `linear-gradient(135deg, ${primaryColor.value}, var(--app-primary-2))`;
}

async function updatePrefs(patch) {
  if (!window.ZyroPrefs?.update) return;
  await window.ZyroPrefs.update(patch);
  setFormValues();
}

function initListeners() {
  btnBack.addEventListener("click", () => {
    window.zyroVibrate?.();
    window.location.href = "configuracoes.html";
  });

  themeRadios.forEach((radio) => {
    radio.addEventListener("change", () => updatePrefs({ theme: radio.value }));
  });

  primaryColor.addEventListener("input", () => {
    colorPreview.style.background = `linear-gradient(135deg, ${primaryColor.value}, var(--app-primary-2))`;
    updatePrefs({ primaryColor: primaryColor.value });
  });

  prefMusicEnabled.addEventListener("change", (event) => {
    updatePrefs({ musicEnabled: event.target.checked });
  });

  musicSelect.addEventListener("change", (event) => {
    updatePrefs({
      musicChoice: event.target.value,
      musicEnabled: event.target.value !== "none" && prefMusicEnabled.checked
    });
  });

  musicVolume.addEventListener("input", (event) => {
    updatePrefs({ musicVolume: Number(event.target.value) });
  });

  prefSounds.addEventListener("change", (event) => {
    updatePrefs({ sfxEnabled: event.target.checked });
  });

  prefVibration.addEventListener("change", (event) => {
    updatePrefs({ vibrationEnabled: event.target.checked });
  });

  prefPerformance.addEventListener("change", (event) => {
    updatePrefs({ reducedMotion: event.target.checked });
  });

  languageSelect.addEventListener("change", (event) => {
    updatePrefs({ language: event.target.value });
  });

  saveBtn.addEventListener("click", async () => {
    const prefs = getPrefs();
    await updatePrefs({
      theme: document.querySelector('input[name="theme"]:checked')?.value || prefs.theme || "dark",
      primaryColor: primaryColor.value,
      language: languageSelect.value,
      musicEnabled: prefMusicEnabled.checked,
      musicChoice: musicSelect.value,
      musicVolume: Number(musicVolume.value),
      sfxEnabled: prefSounds.checked,
      vibrationEnabled: prefVibration.checked,
      reducedMotion: prefPerformance.checked
    });

    const message = window.ZyroPrefs?.t?.("common.saved_settings") || "Configurações salvas com sucesso!";
    showToast(message);
    window.ZyroPrefs?.showToast?.(message);
    window.zyroVibrate?.();
  });
}

window.addEventListener("zyro:preferences-ready", setFormValues);
window.addEventListener("zyro:preferences-changed", setFormValues);

window.addEventListener("DOMContentLoaded", () => {
  initListeners();
  setFormValues();
});
