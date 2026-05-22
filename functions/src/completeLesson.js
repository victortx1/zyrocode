const { HttpsError, onCall } = require("firebase-functions/v2/https");
const { db, FieldValue } = require("./admin");
const { logInfo, logError } = require("./logger");
const { writeAuditLog } = require("./audit");
const { syncLeaderboard } = require("./leaderboard");
const {
  getLessonRewards,
  getAchievementIdForCourse,
  isCourseComplete,
  calcNivel
} = require("./catalog");

function pickUserSnapshot(data) {
  return {
    xp: data.xp || 0,
    moedas: data.moedas || 0,
    nivel: data.nivel || 1,
    vidas: data.vidas ?? 5,
    aulasConcluidas: data.aulasConcluidas || [],
    cursosConcluidos: data.cursosConcluidos || [],
    achievements: data.achievements || {},
    lessonProgress: data.lessonProgress || {}
  };
}

async function applyMissionProgress(uid, xpGain, lessonId, acertosSeguidosSession) {
  const missionRef = db.collection("missions").doc(uid);
  const missionSnap = await missionRef.get();
  if (!missionSnap.exists) return;

  const daily = missionSnap.data().daily || {};
  const updates = {};

  if (!daily.completeLesson?.done) updates["daily.completeLesson.progress"] = 1;
  if (!daily.gainXP?.done) {
    updates["daily.gainXP.progress"] = (daily.gainXP?.progress || 0) + xpGain;
  }
  if (!daily.login?.done) updates["daily.login.progress"] = 1;
  if (acertosSeguidosSession >= 5 && !daily.streak5?.done) {
    updates["daily.streak5.progress"] = 5;
  }
  if (lessonId.includes("html-css") && !daily.htmlLesson?.done) {
    updates["daily.htmlLesson.progress"] = 1;
  }

  if (Object.keys(updates).length) {
    await missionRef.update(updates);
  }
}

exports.completeLesson = onCall(
  { region: "southamerica-east1", maxInstances: 20 },
  async (request) => {
    const uid = request.auth?.uid;
    if (!uid) {
      throw new HttpsError("unauthenticated", "Faça login para concluir aulas.");
    }

    const lessonId = String(request.data?.lessonId || "").trim();
    const courseId = String(request.data?.courseId || "").trim();
    const livesLeft = Number(request.data?.livesLeft ?? 5);

    if (!lessonId || !courseId) {
      throw new HttpsError("invalid-argument", "Aula ou curso inválido.");
    }

    if (!Number.isFinite(livesLeft) || livesLeft < 0 || livesLeft > 15) {
      throw new HttpsError("invalid-argument", "Vidas inválidas.");
    }

    const acertosSeguidosSession = Number(request.data?.acertosSeguidosSession || 0);

    try {
      const userRef = db.collection("users").doc(uid);
      const userSnap = await userRef.get();
      if (!userSnap.exists) {
        throw new HttpsError("not-found", "Perfil não encontrado.");
      }

      const user = userSnap.data();
      const aulasConcluidas = user.aulasConcluidas || [];
      const alreadyDone = aulasConcluidas.includes(lessonId);
      const rewards = getLessonRewards(lessonId);
      const xpGain = alreadyDone ? 0 : rewards.xp;
      const coinGain = alreadyDone ? 0 : rewards.moedas;

      const updates = {
        [`lessonProgress.${lessonId}.correctCount`]: 5,
        [`lessonProgress.${lessonId}.currentQIndex`]: 5,
        [`lessonProgress.${lessonId}.completed`]: true,
        vidas: Math.max(0, Math.min(15, livesLeft)),
        ultimoAcesso: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp()
      };

      if (!alreadyDone) {
        updates.xp = FieldValue.increment(xpGain);
        updates.moedas = FieldValue.increment(coinGain);
        updates.aulasConcluidas = FieldValue.arrayUnion(lessonId);
      }

      const completedCourseNow = isCourseComplete(courseId, aulasConcluidas, lessonId);
      if (completedCourseNow) {
        updates.cursosConcluidos = FieldValue.arrayUnion(courseId);
        updates[`achievements.${getAchievementIdForCourse(courseId)}`] = true;
      }

      await userRef.update(updates);

      const newXp = (user.xp || 0) + xpGain;
      const newMoedas = (user.moedas || 0) + coinGain;
      const newNivel = calcNivel(newXp);

      if (newNivel > (user.nivel || 1)) {
        await userRef.update({ nivel: newNivel, updatedAt: FieldValue.serverTimestamp() });
      }

      const freshSnap = await userRef.get();
      const fresh = freshSnap.data();

      await applyMissionProgress(uid, xpGain, lessonId, acertosSeguidosSession);
      await syncLeaderboard(uid, fresh);

      await writeAuditLog(uid, "completeLesson", {
        lessonId,
        courseId,
        xpGain,
        coinGain,
        alreadyDone,
        completedCourseNow
      });

      logInfo("completeLesson", { uid, lessonId, xpGain, coinGain, alreadyDone });

      return {
        ok: true,
        xpGain,
        coinGain,
        alreadyDone,
        completedCourseNow,
        user: pickUserSnapshot(fresh)
      };
    } catch (error) {
      if (error instanceof HttpsError) throw error;
      logError("completeLesson", error, { uid, lessonId });
      throw new HttpsError("internal", "Não foi possível concluir a aula.");
    }
  }
);
