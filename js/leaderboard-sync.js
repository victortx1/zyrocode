import { db } from "../firebase.js";
import {
  doc,
  setDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

export function buildLeaderboardEntry(userId, data = {}) {
  const entry = {
    uid: userId,
    nickname: data.nickname || "",
    displayName: data.displayName || data.nome || "Dev",
    nome: data.nome || "",
    xp: data.xp || 0,
    nivel: data.nivel || 1,
    photoURL: data.photoURL || data.foto || "",
    foto: data.foto || "",
    selectedAvatar: data.selectedAvatar || data.equippedAvatar || "google",
    equippedAvatar: data.equippedAvatar || "",
    personagemSelecionado: data.personagemSelecionado || "dev_iniciante",
    updatedAt: serverTimestamp()
  };

  if (typeof data.highScore === "number") {
    entry.highScore = data.highScore;
  }

  return entry;
}

export async function syncLeaderboard(userId, data) {
  if (!userId || userId === "guest" || !data) return;

  try {
    await setDoc(
      doc(db, "leaderboard", userId),
      buildLeaderboardEntry(userId, data),
      { merge: true }
    );
  } catch (error) {
    console.warn("Não foi possível sincronizar leaderboard:", error);
  }
}
