// ranking.js
import { auth, db } from "../firebase.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const MAX_RANK = 50;

const CHARS = {
  dev_iniciante: "👨‍💻",
  dev_ninja: "🥷",
  dev_robo: "🤖",
  dev_hacker: "🕵️",
  dev_mestre: "🧙"
};

function getRankingAvatarSrc(user) {
  const selectedAvatar = user.selectedAvatar || user.equippedAvatar || "google";
  const normalizedAvatar = selectedAvatar === "avatar_default" ? "google" : selectedAvatar;
  const photoSource = user.photoURL || user.foto || "";
  if (normalizedAvatar === "google") return photoSource;
  return `../assets/avatars/${normalizedAvatar}`; // extension-less base, try common extensions where used
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
  const snap = await getDocs(collection(db, "users"));
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
      ${getRankingAvatarSrc(u) ? `<img src="${getRankingAvatarSrc(u)}.png" onerror="this.onerror=null;this.src='${getRankingAvatarSrc(u)}.jpg'" class="podium-avatar" alt=""/>` : `<div class="podium-emoji">${charEmoji}</div>`}
      <div class="podium-name">${u.nickname || u.displayName || u.nome || "Dev"}</div>
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
      ${getRankingAvatarSrc(u) ? `<img src="${getRankingAvatarSrc(u)}.png" onerror="this.onerror=null;this.src='${getRankingAvatarSrc(u)}.jpg'" class="rank-avatar" alt=""/>` : `<div class="rank-avatar-emoji">${charEmoji}</div>`}
      <div class="rank-info">
        <div class="rank-name">${u.nickname || u.displayName || u.nome || "Dev"} ${u.uid === currentUser?.uid ? "👈" : ""}</div>
        <div class="rank-nivel">Nível ${u.nivel || 1}</div>
      </div>
      <div class="rank-xp">${scoreLabel} ${score}</div>
    </div>`;
  }).join("")}</div>`;

  if (list) {
    list.innerHTML = podiumHTML + restHTML;
  }
}
