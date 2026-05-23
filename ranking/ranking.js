// ranking.js
import { auth, db } from "../firebase.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  collection,
  doc,
  getDoc,
  getDocs
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { syncLeaderboard } from "../js/leaderboard-sync.js";

const MAX_RANK = 50;

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function getDisplayName(user) {
  return escapeHtml(user.nickname || user.displayName || user.nome || "Dev");
}

const CHARS = {
  dev_iniciante: "👨‍💻",
  dev_ninja: "🥷",
  dev_robo: "🤖",
  dev_hacker: "🕵️",
  dev_mestre: "🧙"
};

function normalizeAvatarId(id) {
  if (id === "Astro") return "astro";
  if (id === "avatar_default") return "google";
  return id;
}

function getRankingAvatarSrc(user) {
  const selectedAvatar = normalizeAvatarId(user.selectedAvatar || user.equippedAvatar || "google");
  const photoSource = user.photoURL || user.foto || "";
  if (selectedAvatar === "google") return photoSource || "";
  return `../assets/avatars/${selectedAvatar}`;
}

function renderRankingAvatar(user, className) {
  const base = getRankingAvatarSrc(user);
  if (!base) {
    const charEmoji = CHARS[user?.personagemSelecionado] || "👨‍💻";
    return `<div class="${className.replace("-avatar", "-avatar-emoji") || "rank-avatar-emoji"}">${charEmoji}</div>`;
  }

  const safeClass = escapeHtml(className);
  const safeBase = escapeHtml(base);
  const isExternal = /^(https?:)?\/\//i.test(base) || /^data:/i.test(base);

  if (isExternal) {
    return `<img src="${safeBase}" onerror="this.onerror=null;this.src='../assets/avatars/favicon.png'" class="${safeClass}" alt="Avatar"/>`;
  }

  if (/\.(png|jpe?g|webp)$/i.test(safeBase)) {
    return `<img src="${safeBase}" onerror="this.onerror=null;this.src='../assets/avatars/favicon.png'" class="${safeClass}" alt="Avatar"/>`;
  }

  return `<img src="${safeBase}.png" onerror="this.onerror=null;this.src='${safeBase}.jpg';this.onerror=null;this.src='../assets/avatars/favicon.png'" class="${safeClass}" alt="Avatar"/>`;
}

let currentUser = null;
let currentIsGuest = false;

onAuthStateChanged(auth, async user => {
  currentIsGuest = localStorage.getItem("zyroGuest") === "true";
  currentUser = user;

  if (!user && !currentIsGuest) {
    window.location.href = "../login/login.html";
    return;
  }

  if (user) {
    try {
      const userSnap = await getDoc(doc(db, "users", user.uid));
      if (userSnap.exists()) {
        await syncLeaderboard(user.uid, userSnap.data());
      }
    } catch (error) {
      console.warn("Não foi possível atualizar entrada do ranking:", error);
    }
  }

  await loadRanking();
});

function getScore(user) {
  if (typeof user.highScore === "number") return user.highScore;
  return user.xp || 0;
}

function dedupeUsers(docs) {
  const uniqueMap = new Map();

  docs.forEach((docSnap) => {
    const data = docSnap.data();
    const uid = data.uid || docSnap.id;
    const score = getScore(data);
    const existing = uniqueMap.get(uid);

    if (score === 0) {
      return;
    }

    if (!existing || score > existing.sortScore) {
      uniqueMap.set(uid, {
        ...data,
        uid,
        docId: docSnap.id,
        sortScore: score
      });
    }
  });

  return Array.from(uniqueMap.values());
}

async function loadRanking() {
  const snap = await getDocs(collection(db, "leaderboard"));
  const allUsers = dedupeUsers(snap.docs);
  const users = allUsers
    .sort((a, b) => getScore(b) - getScore(a))
    .slice(0, MAX_RANK);

  renderRanking(users);
}

function renderRanking(users) {
  const list = document.getElementById("rankingList");
  const countLabel = document.getElementById("rankingCount");

  if (list) list.innerHTML = "";

  if (countLabel) {
    countLabel.textContent = `Top ${users.length}`;
  }

  const top3 = users.slice(0, 3);
  const rest = users.slice(3);

  const medals = ["🥇", "🥈", "🥉"];
  const pClasses = ["p1", "p2", "p3"];
  const podiumOrder = top3.length >= 3 ? [top3[1], top3[0], top3[2]] : top3;
  const podiumIndexes = top3.length >= 3 ? [1, 0, 2] : [0, 1, 2];

  const podiumHTML = `<div class="podium">${podiumOrder.map((u, pi) => {
    const realIndex = podiumIndexes[pi];
    const charEmoji = CHARS[u?.personagemSelecionado] || "👨‍💻";
    if (!u) return "";
    const score = getScore(u);
    const scoreLabel = typeof u.highScore === "number" ? "🏁" : "⚡";
      return `<div class="podium-item ${pClasses[realIndex]} ${u.uid === currentUser?.uid ? 'is-me' : ''}">
      <div class="podium-medal">${medals[realIndex]}</div>
      ${getRankingAvatarSrc(u) ? renderRankingAvatar(u, "podium-avatar") : `<div class="podium-emoji">${charEmoji}</div>`}
      <div class="podium-name">${getDisplayName(u)}</div>
      <div class="podium-xp">${scoreLabel} ${score}</div>
      <div class="podium-block">${realIndex + 1}</div>
    </div>`;
  }).join("")}</div>`;

  const restHTML = `<div class="rank-list">${rest.map((u, i) => {
    const pos = i + 4;
    const charEmoji = CHARS[u.personagemSelecionado] || "👨‍💻";
    const score = getScore(u);
    const scoreLabel = typeof u.highScore === "number" ? "🏁" : "⚡";
    return `<div class="rank-row ${u.uid === currentUser?.uid ? 'is-me' : ''}">
      <div class="rank-pos">${pos}</div>
      ${getRankingAvatarSrc(u) ? renderRankingAvatar(u, "rank-avatar") : `<div class="rank-avatar-emoji">${charEmoji}</div>`}
      <div class="rank-info">
        <div class="rank-name">${getDisplayName(u)} ${u.uid === currentUser?.uid ? "👈" : ""}</div>
        <div class="rank-nivel">Nível ${u.nivel || 1}</div>
      </div>
      <div class="rank-xp">${scoreLabel} ${score}</div>
    </div>`;
  }).join("")}</div>`;

  if (list) {
    list.innerHTML = podiumHTML + restHTML;
  }
}
