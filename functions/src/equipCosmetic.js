const { HttpsError, onCall } = require("firebase-functions/v2/https");
const { db, FieldValue } = require("./admin");
const { logInfo, logError } = require("./logger");
const { writeAuditLog } = require("./audit");
const { syncLeaderboard } = require("./leaderboard");
const { getShopItem } = require("./catalog");

const DEFAULT_BANNER_ID = "zyro-code";

function normalizeBannerId(id) {
  if (!id || id === "orange_default") return DEFAULT_BANNER_ID;
  return id;
}

function canEquip(user, type, itemId) {
  if (type === "char") {
    return (user.inventario || []).includes(itemId) || itemId === "dev_iniciante";
  }
  if (type === "banner") {
    const owned = new Set([DEFAULT_BANNER_ID, ...(user.ownedBanners || [])]);
    return owned.has(normalizeBannerId(itemId));
  }
  if (type === "avatar") {
    if (itemId === "google") return true;
    return (user.ownedAvatars || []).includes(itemId);
  }
  return false;
}

exports.equipCosmetic = onCall(
  { region: "southamerica-east1", maxInstances: 20 },
  async (request) => {
    const uid = request.auth?.uid;
    if (!uid) {
      throw new HttpsError("unauthenticated", "Faça login para equipar itens.");
    }

    const type = String(request.data?.type || "").trim();
    const itemId = String(request.data?.itemId || "").trim();

    if (!["char", "banner", "avatar"].includes(type)) {
      throw new HttpsError("invalid-argument", "Tipo de cosmético inválido.");
    }

    if (!itemId) {
      throw new HttpsError("invalid-argument", "Item inválido.");
    }

    const catalogItem = getShopItem(itemId);
    if (catalogItem && catalogItem.action !== type && !(type === "avatar" && itemId === "google")) {
      throw new HttpsError("invalid-argument", "Item não corresponde ao tipo.");
    }

    try {
      const userRef = db.collection("users").doc(uid);
      const userSnap = await userRef.get();
      if (!userSnap.exists) {
        throw new HttpsError("not-found", "Perfil não encontrado.");
      }

      const user = userSnap.data();
      if (!canEquip(user, type, itemId)) {
        throw new HttpsError("permission-denied", "Você ainda não possui este item.");
      }

      const updates = {
        updatedAt: FieldValue.serverTimestamp()
      };

      if (type === "char") updates.personagemSelecionado = itemId;
      if (type === "banner") updates.equippedBanner = normalizeBannerId(itemId);
      if (type === "avatar") {
        updates.selectedAvatar = itemId;
        updates.equippedAvatar = itemId;
      }

      await userRef.update(updates);
      const fresh = (await userRef.get()).data();

      await syncLeaderboard(uid, fresh);
      await writeAuditLog(uid, "equipCosmetic", { type, itemId });
      logInfo("equipCosmetic", { uid, type, itemId });

      return {
        ok: true,
        type,
        itemId,
        user: {
          personagemSelecionado: fresh.personagemSelecionado,
          equippedBanner: fresh.equippedBanner,
          selectedAvatar: fresh.selectedAvatar,
          equippedAvatar: fresh.equippedAvatar
        }
      };
    } catch (error) {
      if (error instanceof HttpsError) throw error;
      logError("equipCosmetic", error, { uid, type, itemId });
      throw new HttpsError("internal", "Não foi possível equipar o item.");
    }
  }
);
