const { HttpsError, onCall } = require("firebase-functions/v2/https");
const { db, FieldValue } = require("./admin");
const { logInfo, logError } = require("./logger");
const { writeAuditLog } = require("./audit");
const { syncLeaderboard } = require("./leaderboard");
const {
  getShopItem,
  CONSUMABLE_ACTIONS,
  MAX_LIVES,
  MAX_LIVES_PACK_10
} = require("./catalog");

function isOwned(user, item) {
  if (item.price === 0 && item.action !== "avatar") return true;
  if (CONSUMABLE_ACTIONS.has(item.action)) return false;
  if (item.action === "banner") return (user.ownedBanners || []).includes(item.id);
  if (item.action === "avatar") return item.id === "google" || (user.ownedAvatars || []).includes(item.id);
  if (item.action === "char") return (user.inventario || []).includes(item.id);
  return false;
}

function pickUserSnapshot(data) {
  return {
    moedas: data.moedas || 0,
    vidas: data.vidas ?? 5,
    inventario: data.inventario || [],
    ownedBanners: data.ownedBanners || [],
    ownedAvatars: data.ownedAvatars || [],
    personagemSelecionado: data.personagemSelecionado || "dev_iniciante",
    selectedAvatar: data.selectedAvatar || "google",
    equippedAvatar: data.equippedAvatar || "",
    equippedBanner: data.equippedBanner || "zyro-code",
    temTrocaNome: data.temTrocaNome || false,
    renameTokens: data.renameTokens || 0,
    streakShield: data.streakShield || 0,
    vip: data.vip || false,
    vipUntil: data.vipUntil || null
  };
}

exports.purchaseShopItem = onCall(
  { region: "southamerica-east1", maxInstances: 20 },
  async (request) => {
    const uid = request.auth?.uid;
    if (!uid) {
      throw new HttpsError("unauthenticated", "Faça login para comprar na loja.");
    }

    const itemId = String(request.data?.itemId || "").trim();
    const tab = String(request.data?.tab || "").trim();
    const item = getShopItem(itemId);

    if (!item || (tab && item.tab !== tab && tab !== "my-banners")) {
      throw new HttpsError("invalid-argument", "Item da loja inválido.");
    }

    try {
      const userRef = db.collection("users").doc(uid);
      const userSnap = await userRef.get();
      if (!userSnap.exists) {
        throw new HttpsError("not-found", "Perfil não encontrado.");
      }

      const user = userSnap.data();
      const owned = isOwned(user, { ...item, id: itemId });
      const consumable = CONSUMABLE_ACTIONS.has(item.action);

      if (owned && !consumable && !["char", "banner", "avatar"].includes(item.action)) {
        throw new HttpsError("already-exists", "Você já possui esse item.");
      }

      if (!owned && (user.moedas || 0) < item.price) {
        throw new HttpsError("failed-precondition", "Moedas insuficientes.");
      }

      const updates = {
        updatedAt: FieldValue.serverTimestamp()
      };

      if (!owned && item.price > 0) {
        updates.moedas = FieldValue.increment(-item.price);
      }

      if (!owned && item.action === "char") {
        updates.inventario = FieldValue.arrayUnion(itemId);
      }
      if (!owned && item.action === "banner") {
        updates.ownedBanners = FieldValue.arrayUnion(itemId);
      }
      if (!owned && item.action === "avatar") {
        updates.ownedAvatars = FieldValue.arrayUnion(itemId);
      }

      if (item.action === "char") updates.personagemSelecionado = itemId;
      if (item.action === "banner") updates.equippedBanner = itemId;
      if (item.action === "avatar") {
        updates.ownedAvatars = FieldValue.arrayUnion(itemId);
        updates.selectedAvatar = itemId;
        updates.equippedAvatar = itemId;
      }

      if (item.action === "vidas") {
        updates.vidas = Math.min(MAX_LIVES, (user.vidas ?? 5) + 5);
      }
      if (item.action === "vidas10") {
        updates.vidas = Math.min(MAX_LIVES_PACK_10, (user.vidas ?? 5) + 10);
      }
      if (item.action === "rename") {
        updates.temTrocaNome = true;
        updates.renameTokens = FieldValue.increment(1);
        updates.consumables = FieldValue.arrayUnion(itemId);
      }
      if (item.action === "shield") {
        updates.streakShield = FieldValue.increment(1);
        updates.consumables = FieldValue.arrayUnion(itemId);
      }
      if (item.action === "boost_xp" || item.action === "boost_coin") {
        const until = new Date(Date.now() + 86400000);
        updates[`${item.action}_until`] = until;
        updates.consumables = FieldValue.arrayUnion(itemId);
      }

      await userRef.update(updates);
      const fresh = (await userRef.get()).data();

      await syncLeaderboard(uid, fresh);
      await writeAuditLog(uid, "purchaseShopItem", { itemId, tab, price: item.price, owned });
      logInfo("purchaseShopItem", { uid, itemId, price: item.price });

      return {
        ok: true,
        itemId,
        equipped: ["char", "banner", "avatar"].includes(item.action),
        user: pickUserSnapshot(fresh)
      };
    } catch (error) {
      if (error instanceof HttpsError) throw error;
      logError("purchaseShopItem", error, { uid, itemId });
      throw new HttpsError("internal", "Não foi possível concluir a compra.");
    }
  }
);
