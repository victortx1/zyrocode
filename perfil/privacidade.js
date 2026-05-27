const STORAGE_KEY = "zyroPrivacySettings";
const btnBack = document.getElementById("btnBack");
const saveBtn = document.getElementById("saveBtn");
const manageSecurity = document.getElementById("manageSecurity");
const toast = document.getElementById("toast");
const toggles = document.querySelectorAll('.switch-row input');

const DEFAULT_PRIVACY = {
  profilePublic: false,
  resultsVisible: true,
  shareAchievements: false,
  personalizedAds: false,
  dataSharing: false,
  locationAccess: false,
  activityHistory: true
};

let privacy = { ...DEFAULT_PRIVACY };

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toast.classList.remove("show"), 2200);
}

function loadPrivacy() {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    const globalPrivacy = window.ZyroPrefs?.getPreferences?.().privacy || {}; privacy = data ? { ...DEFAULT_PRIVACY, ...JSON.parse(data), ...globalPrivacy } : { ...DEFAULT_PRIVACY, ...globalPrivacy };
  } catch {
    privacy = { ...DEFAULT_PRIVACY };
  }
}

async function savePrivacy() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(privacy));
  await window.ZyroPrefs?.update?.({ privacy }); showToast(window.ZyroPrefs?.t?.("common.saved_settings") || "Configurações salvas com sucesso!");
}

function populateForm() {
  toggles.forEach((toggle) => {
    const key = toggle.dataset.key;
    toggle.checked = !!privacy[key];
  });
}

function initListeners() {
  btnBack.addEventListener("click", () => {
    window.location.href = "configuracoes.html";
  });

  toggles.forEach((toggle) => {
    toggle.addEventListener("change", () => {
      privacy[toggle.dataset.key] = toggle.checked;
    });
  });

  saveBtn.addEventListener("click", () => {
    savePrivacy();
  });

  manageSecurity.addEventListener("click", () => {
    showToast("A função de segurança será aberta em breve.");
  });
}

window.addEventListener("DOMContentLoaded", () => {
  loadPrivacy();
  populateForm();
  initListeners();
});
