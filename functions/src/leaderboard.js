const { db, FieldValue } = require("./admin");

function buildLeaderboardEntry(userId, data) {
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
    updatedAt: FieldValue.serverTimestamp()
  };

  if (typeof data.highScore === "number") {
    entry.highScore = data.highScore;
  }

  return entry;
}

async function syncLeaderboard(userId, userData) {
  await db.collection("leaderboard").doc(userId).set(
    buildLeaderboardEntry(userId, userData),
    { merge: true }
  );
}

module.exports = { syncLeaderboard, buildLeaderboardEntry };
