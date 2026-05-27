const STORAGE_KEY = "zyroSocialAccounts";
const btnBack = document.getElementById("btnBack");
const saveBtn = document.getElementById("saveBtn");
const toast = document.getElementById("toast");
const accountButtons = document.querySelectorAll('.account-button');
const autoShare = document.getElementById("autoShare");
const statusList = document.getElementById("statusList");

const DEFAULT_SOCIALS = {
  facebook: false,
  twitter: false,
  instagram: false,
  google: false,
  github: false,
  autoShare: false
};

let socials = { ...DEFAULT_SOCIALS };

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toast.classList.remove("show"), 2200);
}

function loadSocialState() {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    const globalSocials = window.ZyroPrefs?.getPreferences?.().socials || {}; socials = value ? { ...DEFAULT_SOCIALS, ...JSON.parse(value), ...globalSocials } : { ...DEFAULT_SOCIALS, ...globalSocials };
  } catch {
    socials = { ...DEFAULT_SOCIALS };
  }
}

async function saveSocialState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(socials));
  await window.ZyroPrefs?.update?.({ socials }); showToast(window.ZyroPrefs?.t?.("common.saved_settings") || "Configurações salvas com sucesso!");
  renderStatus();
}

function renderStatus() {
  statusList.innerHTML = "";
  Object.keys(socials).forEach((key) => {
    const item = document.createElement("div");
    item.className = "status-item";
    const label = key === "autoShare" ? "Compartilhamento automático" : key.charAt(0).toUpperCase() + key.slice(1);
    item.innerHTML = `<span>${label}</span><strong>${socials[key] ? "Ativado" : "Desativado"}</strong>`;
    statusList.appendChild(item);
  });
}

function initListeners() {
  btnBack.addEventListener("click", () => {
    window.location.href = "configuracoes.html";
  });

  accountButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const account = button.dataset.account;
      socials[account] = !socials[account];
      showToast(`${account.charAt(0).toUpperCase() + account.slice(1)} ${socials[account] ? "conectado" : "desconectado"}`);
      renderStatus();
    });
  });

  autoShare.addEventListener("change", () => {
    socials.autoShare = autoShare.checked;
  });

  saveBtn.addEventListener("click", () => {
    saveSocialState();
  });
}

window.addEventListener("DOMContentLoaded", () => {
  loadSocialState();
  autoShare.checked = socials.autoShare;
  renderStatus();
  initListeners();
});
