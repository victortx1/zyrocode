const STORAGE_KEY = "zyroCourseSettings";
const btnBack = document.getElementById("btnBack");
const saveBtn = document.getElementById("saveBtn");
const toast = document.getElementById("toast");
const toggles = document.querySelectorAll('.switch-row input');
const difficulty = document.getElementById("courseDifficulty");
const dailyTime = document.getElementById("dailyStudyTime");

const DEFAULT_COURSE_SETTINGS = {
  recommendations: true,
  autoProgress: false,
  highlightModules: true,
  quickLessons: false,
  reviewMode: false,
  courseDifficulty: "beginner",
  dailyStudyTime: "30"
};

let courseSettings = { ...DEFAULT_COURSE_SETTINGS };

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toast.classList.remove("show"), 2200);
}

function loadCourseSettings() {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    const globalCourses = window.ZyroPrefs?.getPreferences?.().courses || {}; courseSettings = data ? { ...DEFAULT_COURSE_SETTINGS, ...JSON.parse(data), ...globalCourses } : { ...DEFAULT_COURSE_SETTINGS, ...globalCourses };
  } catch {
    courseSettings = { ...DEFAULT_COURSE_SETTINGS };
  }
}

async function saveCourseSettings() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(courseSettings));
  await window.ZyroPrefs?.update?.({ courses: courseSettings }); showToast(window.ZyroPrefs?.t?.("common.saved_settings") || "Configurações salvas com sucesso!");
}

function populateForm() {
  toggles.forEach((toggle) => {
    const key = toggle.dataset.key;
    toggle.checked = !!courseSettings[key];
  });
  difficulty.value = courseSettings.courseDifficulty;
  dailyTime.value = courseSettings.dailyStudyTime;
}

function initListeners() {
  btnBack.addEventListener("click", () => {
    window.location.href = "configuracoes.html";
  });

  toggles.forEach((toggle) => {
    toggle.addEventListener("change", () => {
      courseSettings[toggle.dataset.key] = toggle.checked;
    });
  });

  difficulty.addEventListener("change", () => {
    courseSettings.courseDifficulty = difficulty.value;
  });

  dailyTime.addEventListener("change", () => {
    courseSettings.dailyStudyTime = dailyTime.value;
  });

  saveBtn.addEventListener("click", () => {
    saveCourseSettings();
  });
}

window.addEventListener("DOMContentLoaded", () => {
  loadCourseSettings();
  populateForm();
  initListeners();
});
