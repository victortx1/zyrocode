import { auth, db } from "../firebase.js";

import {
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  increment
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { syncLeaderboard } from "../js/leaderboard-sync.js";
import { claimMission as claimMissionCloud, applyUserPatch } from "../js/game-api.js";

const DAILY_MISSIONS = [
  { id: "login", icon: "📲", name: "Check-in diário", desc: "Entre no app hoje", goal: 1, rewardXP: 10, rewardCoins: 15, rewardHearts: 0 },
  { id: "completeLesson", icon: "📚", name: "Estudante aplicado", desc: "Complete 1 aula hoje", goal: 1, rewardXP: 30, rewardCoins: 20, rewardHearts: 0 },
  { id: "gainXP", icon: "⚡", name: "Caçador de XP", desc: "Ganhe 50 XP hoje", goal: 50, rewardXP: 20, rewardCoins: 25, rewardHearts: 0 },
  { id: "streak5", icon: "🎯", name: "Precisão total", desc: "Acerte 5 perguntas seguidas", goal: 5, rewardXP: 25, rewardCoins: 30, rewardHearts: 1 },
  { id: "htmlLesson", icon: "🌐", name: "Devzinho HTML", desc: "Complete uma aula de HTML", goal: 1, rewardXP: 20, rewardCoins: 20, rewardHearts: 0 }
];

let userData = null;
let missionData = null;

function createFreshMissions() {
  const today = new Date().toDateString();
  const fresh = { date: today, daily: {} };

  DAILY_MISSIONS.forEach(m => {
    const progress = m.id === "login" ? 1 : 0;
    fresh.daily[m.id] = {
      progress,
      done: progress >= m.goal,
      claimed: false
    };
  });

  return fresh;
}

function showError(msg) {
  const list = document.getElementById("missionsList");
  list.innerHTML = `
    <div style="text-align:center;padding:35px;color:white;">
      <h3>⚠️ Erro nas missões</h3>
      <p>${msg}</p>
    </div>
  `;
}

onAuthStateChanged(auth, async (user) => {
  try {
    const isGuest = localStorage.getItem("zyroGuest") === "true";

    if (!user && !isGuest) {
      window.location.href = "../login/login.html";
      return;
    }

    if (isGuest) {
      userData = {
        uid: "guest",
        nome: "Visitante",
        xp: 0,
        moedas: 100,
        streak: 0,
        vidas: 5
      };

      missionData = createFreshMissions();
      renderMissions("guest");
      return;
    }

    const userSnap = await getDoc(doc(db, "users", user.uid));

    if (!userSnap.exists()) {
      window.location.href = "../login/login.html";
      return;
    }

    userData = { ...userSnap.data(), uid: user.uid };
    await initMissions(user.uid);

  } catch (error) {
    console.error("Erro ao carregar missões:", error);
    showError("Não foi possível carregar as missões.");
  }
});

async function initMissions(uid) {
  const ref = doc(db, "missions", uid);
  const snap = await getDoc(ref);
  const today = new Date().toDateString();

  if (!snap.exists() || snap.data().date !== today) {
    missionData = createFreshMissions();
    await setDoc(ref, missionData);
  } else {
    missionData = snap.data();
  }

  const rem = document.getElementById("streakReminder");
  if (rem && (userData.streak || 0) > 0) {
    rem.textContent = `🔥 Sua streak atual é de ${userData.streak} dias! Não quebre!`;
    rem.classList.add("show");
  }

  renderMissions(uid);
}

function renderMissions(uid) {
  const list = document.getElementById("missionsList");

  if (!missionData) {
    missionData = createFreshMissions();
  }

  const daily = missionData.daily || {};

  list.innerHTML = DAILY_MISSIONS.map(m => {
    const state = daily[m.id] || { progress: 0, done: false, claimed: false };
    state.done = state.progress >= m.goal;

    const pct = Math.min(100, Math.round((state.progress / m.goal) * 100));

    const rewardStr = [
      m.rewardXP ? `+${m.rewardXP} XP` : "",
      m.rewardCoins ? `+${m.rewardCoins} 🪙` : "",
      m.rewardHearts ? `+${m.rewardHearts} ❤️` : ""
    ].filter(Boolean).join("  ");

    return `
      <div class="mission-card ${state.claimed ? "claimed" : state.done ? "done" : ""}">
        <div class="mission-top">
          <div class="mission-icon">${m.icon}</div>
          <div class="mission-info">
            <div class="mission-name">${m.name}</div>
            <div class="mission-desc">${m.desc}</div>
            <div class="mission-reward">${rewardStr}</div>
          </div>
        </div>

        <div class="mission-progress-wrap">
          <div class="mission-prog-label">
            <span>${state.progress} / ${m.goal}</span>
            <span>${pct}%</span>
          </div>
          <div class="mission-prog-track">
            <div class="mission-prog-fill" style="width:${pct}%"></div>
          </div>
        </div>

        ${
          state.claimed
            ? `<div class="mission-done-badge">✅ Recompensa coletada!</div>`
            : state.done
              ? `<button class="btn-claim" data-id="${m.id}">🎁 Coletar recompensa</button>`
              : `<div style="font-size:12px;color:var(--muted);text-align:center;">Continue jogando para completar</div>`
        }
      </div>
    `;
  }).join("");

  list.querySelectorAll(".btn-claim").forEach(btn => {
    btn.addEventListener("click", () => claimMission(btn.dataset.id, uid));
  });
}

async function claimMission(missionId, uid) {
  if (uid === "guest") {
    alert("❌ Visitantes não podem coletar recompensas. Faça login com Google.");
    return;
  }

  const m = DAILY_MISSIONS.find(x => x.id === missionId);
  if (!m) return;

  const state = missionData.daily[missionId];

  if (!state.done || state.claimed) return;

  try {
    const cloudResult = await claimMissionCloud({ missionId });
    if (cloudResult?.user) {
      applyUserPatch(userData, cloudResult.user);
      missionData.daily[missionId].claimed = true;
      renderMissions(uid);
      showToast("🎁 Recompensa coletada!");
      return;
    }
  } catch (error) {
    console.warn("claimMission (cloud) falhou, tentando fluxo legado:", error);
  }

  await updateDoc(doc(db, "missions", uid), {
    [`daily.${missionId}.claimed`]: true
  });

  const updates = {};
  if (m.rewardXP) updates.xp = increment(m.rewardXP);
  if (m.rewardCoins) updates.moedas = increment(m.rewardCoins);
  if (m.rewardHearts) updates.vidas = Math.min(5, (userData.vidas ?? 5) + m.rewardHearts);

  await updateDoc(doc(db, "users", uid), updates);

  userData.xp = (userData.xp || 0) + (m.rewardXP || 0);
  userData.moedas = (userData.moedas || 0) + (m.rewardCoins || 0);
  if (m.rewardHearts) userData.vidas = Math.min(5, (userData.vidas ?? 5) + m.rewardHearts);
  await syncLeaderboard(uid, userData);

  missionData.daily[missionId].claimed = true;
  renderMissions(uid);

  showToast(`🎁 Recompensa coletada!`);
}

function showToast(msg) {
  const t = document.createElement("div");
  t.style.cssText = "position:fixed;bottom:90px;left:50%;transform:translateX(-50%);background:#6c63ff;color:#fff;padding:10px 20px;border-radius:100px;font-size:13px;font-weight:600;z-index:999;white-space:nowrap;";
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 2500);
}