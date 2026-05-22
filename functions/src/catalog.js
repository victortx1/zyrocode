/** Catálogo servidor — espelha recompensas/preços do frontend (app.js, loja.js, missoes.js). */

const LESSONS_PER_COURSE = 4;
const MAX_LIVES = 5;
const MAX_LIVES_PACK_10 = 15;

const DAILY_MISSIONS = {
  login: { goal: 1, rewardXP: 10, rewardCoins: 15, rewardHearts: 0 },
  completeLesson: { goal: 1, rewardXP: 30, rewardCoins: 20, rewardHearts: 0 },
  gainXP: { goal: 50, rewardXP: 20, rewardCoins: 25, rewardHearts: 0 },
  streak5: { goal: 5, rewardXP: 25, rewardCoins: 30, rewardHearts: 1 },
  htmlLesson: { goal: 1, rewardXP: 20, rewardCoins: 20, rewardHearts: 0 }
};

const SHOP_ITEMS = {
  heart_pack: { tab: "items", price: 80, action: "vidas" },
  heart_pack3: { tab: "items", price: 140, action: "vidas10" },
  streak_shield: { tab: "items", price: 350, action: "shield" },
  rename: { tab: "items", price: 950, action: "rename" },
  dev_iniciante: { tab: "chars", price: 0, action: "char" },
  dev_ninja: { tab: "chars", price: 0, action: "char" },
  dev_robo: { tab: "chars", price: 0, action: "char" },
  dev_hacker: { tab: "chars", price: 0, action: "char" },
  dev_mestre: { tab: "chars", price: 0, action: "char" },
  xp_boost: { tab: "boost", price: 250, action: "boost_xp" },
  coin_boost: { tab: "boost", price: 200, action: "boost_coin" },
  "zyro-code": { tab: "banners", price: 0, action: "banner" },
  american: { tab: "banners", price: 250, action: "banner" },
  francecode: { tab: "banners", price: 300, action: "banner" },
  "zyro-dev": { tab: "banners", price: 450, action: "banner" },
  linguagens: { tab: "banners", price: 600, action: "banner" },
  itau: { tab: "banners", price: 700, action: "banner" },
  spot: { tab: "banners", price: 750, action: "banner" },
  neymar: { tab: "banners", price: 1000, action: "banner" },
  google: { tab: "avatars", price: 0, action: "avatar" },
  raposa: { tab: "avatars", price: 250, action: "avatar" },
  astro: { tab: "avatars", price: 300, action: "avatar" },
  Dev: { tab: "avatars", price: 300, action: "avatar" },
  "Raposa da Copa": { tab: "avatars", price: 450, action: "avatar" },
  Tirados: { tab: "avatars", price: 400, action: "avatar" },
  Neymar: { tab: "avatars", price: 550, action: "avatar" }
};

const CONSUMABLE_ACTIONS = new Set(["vidas", "vidas10", "rename", "shield", "boost_xp", "boost_coin"]);

function getLessonRewards(lessonId) {
  const isAdvanced = typeof lessonId === "string" && lessonId.includes("-advanced-");
  return {
    xp: isAdvanced ? 50 : 30,
    moedas: isAdvanced ? 25 : 15
  };
}

function getAchievementIdForCourse(courseId) {
  if (courseId === "html-css-basic") return "html_master";
  if (courseId === "javascript-basic") return "js_spark";
  return `course_${String(courseId).replace(/-/g, "_")}_completed`;
}

function isCourseComplete(courseId, aulasConcluidas, lessonIdJustFinished) {
  const list = Array.isArray(aulasConcluidas) ? [...aulasConcluidas] : [];
  if (lessonIdJustFinished && !list.includes(lessonIdJustFinished)) {
    list.push(lessonIdJustFinished);
  }
  const prefix = `${courseId}-aula-`;
  const doneInCourse = list.filter((id) => typeof id === "string" && id.startsWith(prefix));
  return doneInCourse.length >= LESSONS_PER_COURSE;
}

function getShopItem(itemId) {
  return SHOP_ITEMS[itemId] || null;
}

function getMission(missionId) {
  return DAILY_MISSIONS[missionId] || null;
}

function calcNivel(xp) {
  return Math.floor(Math.max(0, Number(xp) || 0) / 200) + 1;
}

module.exports = {
  MAX_LIVES,
  MAX_LIVES_PACK_10,
  CONSUMABLE_ACTIONS,
  getLessonRewards,
  getAchievementIdForCourse,
  isCourseComplete,
  getShopItem,
  getMission,
  calcNivel
};
