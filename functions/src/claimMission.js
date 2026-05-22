const { HttpsError, onCall } = require("firebase-functions/v2/https");
const { db, FieldValue } = require("./admin");
const { logInfo, logError } = require("./logger");
const { writeAuditLog } = require("./audit");
const { syncLeaderboard } = require("./leaderboard");
const { getMission, calcNivel, MAX_LIVES } = require("./catalog");

function pickUserSnapshot(data) {
  return {
    xp: data.xp || 0,
    moedas: data.moedas || 0,
    nivel: data.nivel || 1,
    vidas: data.vidas ?? 5
  };
}

exports.claimMission = onCall(
  { region: "southamerica-east1", maxInstances: 20 },
  async (request) => {
    const uid = request.auth?.uid;
    if (!uid) {
      throw new HttpsError("unauthenticated", "Faça login para coletar missões.");
    }

    const missionId = String(request.data?.missionId || "").trim();
    const mission = getMission(missionId);
    if (!mission) {
      throw new HttpsError("invalid-argument", "Missão inválida.");
    }

    try {
      const missionRef = db.collection("missions").doc(uid);
      const userRef = db.collection("users").doc(uid);

      const result = await db.runTransaction(async (tx) => {
        const missionSnap = await tx.get(missionRef);
        const userSnap = await tx.get(userRef);

        if (!missionSnap.exists || !userSnap.exists) {
          throw new HttpsError("not-found", "Dados de missão ou perfil não encontrados.");
        }

        const state = missionSnap.data().daily?.[missionId];
        if (!state?.done || state?.claimed) {
          throw new HttpsError("failed-precondition", "Missão não está pronta para coleta.");
        }

        const user = userSnap.data();
        const userUpdates = { updatedAt: FieldValue.serverTimestamp() };

        if (mission.rewardXP) userUpdates.xp = FieldValue.increment(mission.rewardXP);
        if (mission.rewardCoins) userUpdates.moedas = FieldValue.increment(mission.rewardCoins);
        if (mission.rewardHearts) {
          userUpdates.vidas = Math.min(MAX_LIVES, (user.vidas ?? 5) + mission.rewardHearts);
        }

        tx.update(missionRef, { [`daily.${missionId}.claimed`]: true });
        tx.update(userRef, userUpdates);

        return {
          rewardXP: mission.rewardXP || 0,
          rewardCoins: mission.rewardCoins || 0,
          rewardHearts: mission.rewardHearts || 0,
          prevXp: user.xp || 0,
          prevMoedas: user.moedas || 0,
          prevVidas: user.vidas ?? 5
        };
      });

      const freshSnap = await userRef.get();
      let fresh = freshSnap.data();
      const newXp = result.prevXp + result.rewardXP;
      const newNivel = calcNivel(newXp);

      if (newNivel > (fresh.nivel || 1)) {
        await userRef.update({ nivel: newNivel, updatedAt: FieldValue.serverTimestamp() });
        fresh = (await userRef.get()).data();
      }

      await syncLeaderboard(uid, fresh);
      await writeAuditLog(uid, "claimMission", { missionId, ...result });
      logInfo("claimMission", { uid, missionId });

      return {
        ok: true,
        missionId,
        user: pickUserSnapshot(fresh)
      };
    } catch (error) {
      if (error instanceof HttpsError) throw error;
      logError("claimMission", error, { uid, missionId });
      throw new HttpsError("internal", "Não foi possível coletar a missão.");
    }
  }
);
