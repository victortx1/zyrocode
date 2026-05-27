const STORAGE_KEY = "zyroNotifications";
const btnBack = document.getElementById("btnBack");
const saveBtn = document.getElementById("saveBtn");
const toast = document.getElementById("toast");
const toggles = document.querySelectorAll('.switch-row input');
const quietStart = document.getElementById("quietStart");
const quietEnd = document.getElementById("quietEnd");
const frequency = document.getElementById("notificationFrequency");

const DEFAULT_OPTIONS = {
  pushMessages: true,
  emailNews: false,
  lessonReminders: true,
  courseUpdates: true,
  promoOffers: false,
  quietStart: "22:00",
  quietEnd: "07:00",
  notificationFrequency: "instant"
};

let options = { ...DEFAULT_OPTIONS };

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toast.classList.remove("show"), 2200);
}

function loadOptions() {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    const globalOptions = window.ZyroPrefs?.getPreferences?.().notifications || {}; options = data ? { ...DEFAULT_OPTIONS, ...JSON.parse(data), ...globalOptions } : { ...DEFAULT_OPTIONS, ...globalOptions };
  } catch {
    options = { ...DEFAULT_OPTIONS };
  }
}

async function saveOptions() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(options));
  await window.ZyroPrefs?.update?.({ notifications: options }); showToast(window.ZyroPrefs?.t?.("common.saved_settings") || "Configurações salvas com sucesso!");
}

function populateForm() {
  toggles.forEach((toggle) => {
    const key = toggle.dataset.key;
    toggle.checked = !!options[key];
  });
  quietStart.value = options.quietStart;
  quietEnd.value = options.quietEnd;
  frequency.value = options.notificationFrequency;
}

function initListeners() {
  btnBack.addEventListener("click", () => {
    window.location.href = "configuracoes.html";
  });

  toggles.forEach((toggle) => {
    toggle.addEventListener("change", () => {
      options[toggle.dataset.key] = toggle.checked;
    });
  });

  quietStart.addEventListener("change", () => {
    options.quietStart = quietStart.value;
  });

  quietEnd.addEventListener("change", () => {
    options.quietEnd = quietEnd.value;
  });

  frequency.addEventListener("change", () => {
    options.notificationFrequency = frequency.value;
  });

  saveBtn.addEventListener("click", () => {
    saveOptions();
  });
}

window.addEventListener("DOMContentLoaded", () => {
  loadOptions();
  populateForm();
  initListeners();
});
