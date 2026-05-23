// loja.js
import { auth, db } from "../firebase.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  doc,
  getDoc,
  updateDoc,
  setDoc,
  arrayUnion,
  increment,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { syncLeaderboard } from "../js/leaderboard-sync.js";
import { purchaseShopItem as purchaseShopItemCloud, applyUserPatch } from "../js/game-api.js";

let userData = null;

const DEFAULT_BANNER_ID = "zyro-code";
const MAX_LIVES = 5;
const MAX_LIVES_PACK_10 = 15;

function normalizeBannerId(id) {
  if (!id || id === "orange_default") return DEFAULT_BANNER_ID;
  return id;
}

function normalizeAvatarId(id) {
  if (id === "Astro") return "astro";
  if (id === "avatar_default") return "google";
  return id;
}

const PROFILE_AVATARS = [
  {
    id: "google",
    name: "Foto do Google",
    desc: "Use automaticamente sua foto do Google",
    price: 0,
    rarity: "common",
    type: "google",
    action: "avatar",
    free: true
  },
  {
    id: "raposa",
    name: "Raposa Dev",
    desc: "Raposa Dev ",
    image: "../assets/avatars/favicon.png",
    price: 250,
    rarity: "common",
    type: "image",
    action: "avatar"
  },
  {
    id: "astro",
    name: "Astro Dev",
    desc: "Astro da Programação",
    image: "../assets/avatars/astro.jpg",
    price: 300,
    rarity: "common",
    type: "image",
    action: "avatar"
  },
  {
    id: "Dev",
    name: "Dev",
    desc: "Desenvolvedor Cansado",
    image: "../assets/avatars/dev.jpg",
    price: 300,
    rarity: "special",
    type: "image",
    action: "avatar"
  },
  {
    id: "Raposa da Copa",
    name: "Raposa da Copa",
    desc: "Look de raposa com estilo de copa",
    image: "../assets/avatars/raposadacopa.jpg",
    price: 450,
    rarity: "rare",
    type: "image",
    action: "avatar"
  },
  {
    id: "Tirados",
    name: "Tirados",
    desc: "Bob esponja e Patrick",
    image: "../assets/avatars/tirados.webp",
    price: 400,
    rarity: "rare",
    type: "image",
    action: "avatar"
  },
  {
    id: "Neymar",
    name: "Neymar Jr",
    desc: "Look de Neymar Jr com hexa",
    image: "../assets/avatars/neymarc.png",
    price: 550,
    rarity: "rare",
    type: "image",
    action: "avatar"
  },
  
];

const ITEMS = {
  items: [
    { id: "heart_pack", icon: "❤️", name: "+5 Vidas", desc: "Recarregue seus corações", price: 80, action: "vidas" },
    { id: "heart_pack3", icon: "💖", name: "+10 Vidas", desc: "Pacote econômico de vidas", price: 140, action: "vidas10" },
    { id: "streak_shield", icon: "🛡️", name: "Streak Shield", desc: "Protege sua streak por 1 dia", price: 350, action: "shield" },
    { id: "rename", icon: "✏️", name: "Trocar Nome", desc: "Mude seu nome de usuário", price: 950, action: "rename" },
  ],
  chars: [
    { id: "dev_iniciante", icon: "👨‍💻", name: "Dev Estudante", desc: "Todo grande dev começou quebrando código e aprendendo com os erros.", price: 0, action: "char" },
    { id: "dev_ninja",     icon: "👨‍💻",  name: "Dev Estagiário",     desc: "Aprendendo rápido, codando mais rápido ainda.", price: 0, action: "char" },
    { id: "dev_robo",      icon: "🤴",  name: "Dev Junior",      desc: "Transformando café e bugs em experiência.", price: 0, action: "char" },
    { id: "dev_hacker",    icon: "🕵️",  name: "Dev Pleno",    desc: "Experiência suficiente pra resolver o caos em silêncio.", price: 0, action: "char" },
    { id: "dev_mestre",    icon: "🧙",  name: "Dev Senior",    desc: "Onde os problemas acabam e as soluções começam.", price: 0, action: "char" }
  ],
  boost: [
    { id: "xp_boost", icon: "⚡", name: "XP x2", desc: "Dobra seu XP por 24h", price: 250, action: "boost_xp" },
    { id: "coin_boost", icon: "📀", name: "Moedas x2", desc: "Dobra moedas por 24h", price: 200, action: "boost_coin" }
  ]
  ,
  banners: [
    { id: "zyro-code", name: "Zyro Code", desc: "Banner padrão com imagem", price: 0, image: "../assets/banners/zyrocode.png", rarity: "common", action: "banner" },
    { id: "american", name: "American", desc: "Imagem american programing", price: 250, image: "../assets/banners/americancode.png", rarity: "uncommon", action: "banner" },
    { id: "francecode", name: "France Code", desc: "Imagem francesa de programação", price: 300, image: "../assets/banners/francecode.png", rarity: "uncommon", action: "banner" },
    { id: "zyro-dev", name: "Zyro Dev", desc: "Imagem de Zyro Dev", price: 450, image: "../assets/banners/zyrodev.png", rarity: "uncommon", action: "banner" },
    { id: "linguagens", name: "Linguagens", desc: "Imagem de linguagens de programação", price: 600, image: "../assets/banners/linguagens.png", rarity: "rare", action: "banner" },
    { id: "itau", name: "Itau", desc: "Imagem do Itau", price: 700, image: "../assets/banners/itau.png", rarity: "legendary", action: "banner" },
    { id: "spot", name: "Spot", desc: "Imagem do Spotify", price: 750, image: "../assets/banners/spot.png", rarity: "mythic", action: "banner" },
    { id: "neymar", name: "Neymar Jr", desc: "Imagem de Neymar Jr e seleção BR", price: 1000, image: "../assets/banners/neymar.png", rarity: "uncommon", action: "banner" }
  ],
  avatars: PROFILE_AVATARS
};

const CONSUMABLE_ACTIONS = new Set(["vidas", "vidas10", "rename", "shield", "boost_xp", "boost_coin"]);

function getAllOwnedItems() {
  return [
    ...(userData.inventario || []),
    ...(userData.ownedBanners || []),
    ...(userData.ownedAvatars || []),
    ...(userData.ownedSpecials || [])
  ];
}

function getSelectedAvatarId(data) {
  const selected = data?.selectedAvatar || data?.equippedAvatar || data?.selectedAvatar || 'google';
  return normalizeAvatarId(selected);
}

function isOwned(item) {
  if (!userData) return item.price === 0;
  if (item.price === 0) return true;
  if (item.action === 'banner') return (userData.ownedBanners || []).includes(item.id);
  if (item.action === 'avatar') return item.id === 'google' || (userData.ownedAvatars || []).includes(item.id);
  if (item.action === 'char') return (userData.inventario || []).includes(item.id);
  if (item.action === 'vip') return userData.vip || (userData.ownedSpecials || []).includes(item.id);
  return (getAllOwnedItems() || []).includes(item.id);
}

function isEquipped(item) {
  if (!userData) return false;
  if (item.action === 'char') return userData.personagemSelecionado === item.id;
  if (item.action === 'banner') return normalizeBannerId(userData.equippedBanner) === item.id;
  if (item.action === 'avatar') return getSelectedAvatarId(userData) === item.id;
  return false;
}

function isVipActive() {
  const value = userData.vipUntil;
  if (!value) return false;

  const date = value.seconds ? new Date(value.seconds * 1000) : new Date(value);
  return date.getTime() > Date.now();
}

function syncCoins() {
  const disp = document.getElementById("coinDisplay");
  if (!disp) return;
  const coins = userData ? (userData.moedas ?? userData.coins ?? userData.xpCoins ?? 0) : 0;
  disp.textContent = coins;
}

function setupTabs() {
  document.querySelectorAll('.shop-tab').forEach(t => t.addEventListener('click', () => {
    document.querySelectorAll('.shop-tab').forEach(x => x.classList.remove('active'));
    t.classList.add('active');
    renderShop(t.dataset.tab);
  }));
}

onAuthStateChanged(auth, async (user) => {
  try {
    const isGuest = localStorage.getItem('zyroGuest') === 'true';
    if (!user && !isGuest) { window.location.href = "../login/login.html"; return; }

    if (isGuest) {
      userData = { uid: 'guest', nome: localStorage.getItem('zyroUserName') || 'Visitante', moedas: 100, inventario: ['dev_iniciante'], personagemSelecionado: 'dev_iniciante' };
      setupTabs();
      const initialTab = localStorage.getItem('openShopTab') || (location.hash ? location.hash.replace('#','') : 'items');
      localStorage.removeItem('openShopTab');
      renderShop(initialTab);
      return;
    }

    const snap = await getDoc(doc(db, 'users', user.uid));
    if (!snap.exists()) { window.location.href = "../login/login.html"; return; }
    userData = { ...snap.data(), uid: user.uid };
    syncCoins();
    setupTabs();
    const initialTab = localStorage.getItem('openShopTab') || (location.hash ? location.hash.replace('#','') : 'items');
    localStorage.removeItem('openShopTab');
    renderShop(initialTab);
  } catch (error) {
    console.error('ERRO LOJA:', error);
  }
});
function renderShop(tab) {
  const content = document.getElementById("shopContent");
  if (!content) {
    console.error("Loja: elemento shopContent não encontrado.");
    return;
  }

  const coins = Number(userData.moedas || 0);
  const items = tab === "my-banners"
    ? ITEMS.banners.filter((item) => isOwned(item))
    : ITEMS[tab] || [];

  if (tab === "my-banners" && !items.length) {
    content.innerHTML = `
      <div class="shop-empty-state">
        <h3>Você ainda não comprou banners.</h3>
        <p>Abra a categoria Banners para desbloquear imagens novas para o perfil.</p>
      </div>
    `;
    return;
  }

  const shopGridClass = tab === "avatars" ? "shop-grid avatars" : "shop-grid";
  content.innerHTML = `<div class="${shopGridClass}">${items.map(item => {
    const isChar = item.action === "char";
    const isBanner = item.action === "banner";
    const isAvatar = item.action === "avatar";
    const owned = isOwned(item);
    const equippedNow = isEquipped(item);
    const canAfford = coins >= item.price;
    const consumable = CONSUMABLE_ACTIONS.has(item.action);

    let btnText = "🪙 " + (item.price === 0 ? "Grátis" : item.price);
    let btnClass = "btn-buy";
    let disabled = !canAfford;

    if (equippedNow) { btnText = "✓ Equipado"; btnClass = "btn-buy equipped-btn"; disabled = true; }
    else if (isChar && owned) { btnText = "Equipar"; btnClass = "btn-buy owned-btn"; disabled = false; }
    else if (isBanner && owned) { btnText = "Equipar"; btnClass = "btn-buy owned-btn"; disabled = false; }
    else if (isAvatar && owned) { btnText = "Equipar"; btnClass = "btn-buy owned-btn"; disabled = false; }
    else if (owned && !consumable) {
      btnText = "✓ Ativo"; btnClass = "btn-buy owned-btn"; disabled = true;
    }

    // Special rendering for banners (preview stripe)
    if (isBanner) {
      return `
      <div class="shop-item ${equippedNow ? 'equipped' : owned ? 'owned' : ''}" style="padding:0;overflow:hidden;">
        <img class="banner-shop-preview" src="${item.image}" alt="${item.name}">
        <div style="padding:12px;text-align:left;">
          <div class="item-name">${item.name}</div>
          <div class="item-desc">${item.desc}</div>
          <div class="item-price">${item.price > 0 ? "🪙 " + item.price : "Grátis"}</div>
          <button class="btn-buy ${btnClass}" data-id="${item.id}" ${disabled ? "disabled" : ""}>${btnText}</button>
        </div>
      </div>`;
    }

    // Special rendering for avatars (premium profile cards)
    if (isAvatar) {
      const avatarPreview = item.type === "google"
        ? userData.photoURL
          ? `<img src="${userData.photoURL}" alt="Foto do Google" class="avatar-shop-img">`
          : `<div class="avatar-placeholder">G</div>`
        : `<img src="${item.image}" alt="${item.name}" class="avatar-shop-img">`;

      const statusLabel = equippedNow ? "Equipado" : owned ? "Comprado" : "";

      return `
      <div class="shop-item avatar-card ${equippedNow ? 'equipped' : owned ? 'owned' : ''}">
        <div class="avatar-image-wrap ${item.type === "google" ? 'avatar-google' : ''}">
          ${avatarPreview}
        </div>
        <div class="item-name">${item.name}</div>
        <div class="item-desc">${item.desc}</div>
        <div class="item-meta">
          <span class="rarity-badge ${item.rarity}">${item.rarity || 'common'}</span>
          <span class="item-price">${item.price > 0 ? "🪙 " + item.price : "Grátis"}</span>
        </div>
        ${statusLabel ? `<div class="avatar-status">${statusLabel}</div>` : ""}
        <button class="btn-buy ${btnClass}" data-id="${item.id}" ${disabled ? "disabled" : ""}>${btnText}</button>
      </div>`;
    }

    return `
      <div class="shop-item ${equippedNow ? 'equipped' : owned ? 'owned' : ''}">
        <span class="item-icon">${item.icon || ''}</span>
        <div class="item-name">${item.name}</div>
        <div class="item-desc">${item.desc}</div>
        <div class="item-price">${item.price > 0 ? "🪙 " + item.price : "Grátis"}</div>
        <button class="btn-buy ${btnClass}" data-id="${item.id}" ${disabled ? "disabled" : ""}>${btnText}</button>
      </div>`;
  }).join("")}</div>`;

  content.querySelectorAll(".btn-buy").forEach(btn => {
    btn.addEventListener("click", () => handleBuy(btn.dataset.id, tab));
  });
}

async function handleBuy(itemId, tab) {
  if (userData.uid === "guest") {
    alert("❌ Visitantes não podem comprar. Faça login para ter acesso à loja completa!");
    return;
  }

  // Fallback para múltiplos nomes de campo de moedas
  const coins = Number(userData.coins ?? userData.moedas ?? userData.xpCoins ?? userData.coinsLocal ?? 0);

  const itemList = tab === "my-banners" ? ITEMS.banners : ITEMS[tab] || [
    ...ITEMS.items,
    ...ITEMS.chars,
    ...ITEMS.avatars,
    ...ITEMS.banners,
    ...ITEMS.boost
  ];
  const item = itemList.find(i => i.id === itemId);
  if (!item) {
    console.error("ERRO COMPRA REAL: item não encontrado", itemId);
    return;
  }

  const owned = isOwned(item);
  const consumable = CONSUMABLE_ACTIONS.has(item.action);

  if (owned && !consumable && !["char", "banner", "avatar"].includes(item.action)) {
    showToast("Você já possui esse item.");
    return;
  }

  if (!owned && coins < item.price) {
    alert("Moedas insuficientes!");
    return;
  }

  // Tenta cloud function primeiro
  try {
    const cloudResult = await purchaseShopItemCloud({ itemId, tab });
    if (cloudResult?.user) {
      applyUserPatch(userData, cloudResult.user);
      syncCoins();
      renderShop(tab);
      showToast(owned ? `✨ ${item.name} equipado!` : `✅ ${item.name} comprado!`);
      return;
    }
  } catch (error) {
    console.error("ERRO COMPRA REAL:", error.code, error.message, error);
    console.warn("Cloud falhou, tentando fluxo legado...");
    if (error?.code === "functions/failed-precondition") {
      alert("Moedas insuficientes!");
      return;
    }
  }

  // ===== FLUXO DEFENSIVO DE FALLBACK =====
  const ref = doc(db, "users", userData.uid);

  try {
    // PASSO 1: Verificar se documento existe
    const docSnap = await getDoc(ref);
    console.log("Documento existe?", docSnap.exists());

    // PASSO 2: Se não existe, criar com estrutura base
    if (!docSnap.exists()) {
      console.warn("Documento não existe. Criando com estrutura base...");
      const baseDoc = {
        uid: userData.uid,
        email: userData.email || "",
        moedas: userData.moedas || 0,
        coins: userData.coins || 0,
        xp: userData.xp || 0,
        nivel: userData.nivel || 1,
        vidas: userData.vidas || 5,
        ownedItems: [],
        ownedBanners: [],
        ownedAvatars: [],
        ownedCharacters: [],
        inventario: userData.inventario || [],
        personagemSelecionado: userData.personagemSelecionado || "dev_iniciante",
        equippedBanner: userData.equippedBanner || "zyro-code",
        selectedAvatar: userData.selectedAvatar || "google",
        updatedAt: serverTimestamp()
      };
      await setDoc(ref, baseDoc);
      console.log("Documento criado com base.");
    }

    // PASSO 3: Preparar updates defensivos
    const updates = { updatedAt: serverTimestamp() };

    // Detectar qual campo de moedas usar
    const coinFields = ["coins", "moedas", "xpCoins", "coinsLocal"];
    const coinField = coinFields.find(f => f in userData) || "moedas";
    console.log("Campo de moedas detectado:", coinField, "valor:", coins);

    // PASSO 4: Desconto de moedas
    if (!owned && item.price > 0) {
      const newCoins = coins - Math.abs(Number(item.price || 0));
      updates[coinField] = newCoins > 0 ? newCoins : 0;
      console.log("Novo saldo de moedas:", updates[coinField]);
    }

    // PASSO 5: Atualizar arrays de propriedade
    if (!owned && item.action === "char") {
      updates.inventario = arrayUnion(item.id);
      updates.ownedCharacters = arrayUnion(item.id);
      console.log("Adicionado personagem:", item.id);
    }

    if (!owned && item.action === "banner") {
      updates.ownedBanners = arrayUnion(item.id);
      console.log("Adicionado banner:", item.id);
    }

    if (!owned && item.action === "avatar") {
      updates.ownedAvatars = arrayUnion(item.id);
      updates.selectedAvatar = item.id;
      updates.equippedAvatar = item.id;
      console.log("Adicionado avatar:", item.id);
    }

    // PASSO 6: Equipar item
    if (item.action === "char") updates.personagemSelecionado = item.id;
    if (item.action === "banner") updates.equippedBanner = item.id;

    // PASSO 7: Itens consumíveis
    if (item.action === "vidas") {
      updates.vidas = Math.min(MAX_LIVES, (userData.vidas ?? 5) + 5);
      console.log("Vidas atualizadas para:", updates.vidas);
    }
    if (item.action === "vidas10") {
      updates.vidas = Math.min(MAX_LIVES_PACK_10, (userData.vidas ?? 5) + 10);
      console.log("Vidas atualizadas para:", updates.vidas);
    }

    if (item.action === "rename") {
      updates.temTrocaNome = true;
      updates.renameTokens = increment(1);
      updates.consumables = arrayUnion(item.id);
    }

    if (item.action === "shield") {
      updates.streakShield = increment(1);
      updates.consumables = arrayUnion(item.id);
    }

    if (item.action === "boost_xp" || item.action === "boost_coin") {
      const until = new Date(Date.now() + 86400000);
      updates[`${item.action}_until`] = until;
      updates.consumables = arrayUnion(item.id);
    }

    if (item.action === "vip") {
      const vipUntil = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      updates.vip = true;
      updates.vipUntil = vipUntil;
      updates.ownedSpecials = arrayUnion(item.id);
    }

    if (!owned) updates.purchasedItems = arrayUnion(item.id);

    // PASSO 8: Salvar com merge para não deletar campos existentes
    console.log("Salvando updates com merge:", updates);
    await setDoc(ref, updates, { merge: true });
    console.log("Compra salva com sucesso!");

    // PASSO 9: Atualizar userData em memória
    if (!owned && item.price > 0) {
      userData[coinField] = (userData[coinField] || 0) - item.price;
      userData.moedas = userData[coinField];
    }

    if (!owned && item.action === "char") {
      userData.inventario = [...new Set([...(userData.inventario || []), item.id])];
    }

    if (!owned && item.action === "banner") {
      userData.ownedBanners = [...new Set([...(userData.ownedBanners || []), item.id])];
    }

    if (item.action === "avatar") {
      userData.ownedAvatars = [...new Set([...(userData.ownedAvatars || []), item.id])];
    }

    if (item.action === "char") userData.personagemSelecionado = item.id;
    if (item.action === "banner") userData.equippedBanner = item.id;
    if (item.action === "avatar") {
      userData.selectedAvatar = item.id;
      userData.equippedAvatar = item.id;
    }

    if (item.action === "vidas") userData.vidas = updates.vidas;
    if (item.action === "vidas10") userData.vidas = updates.vidas;

    if (item.action === "rename") {
      userData.temTrocaNome = true;
      userData.renameTokens = (userData.renameTokens || 0) + 1;
    }

    if (item.action === "shield") userData.streakShield = (userData.streakShield || 0) + 1;

    if (item.action === "vip") {
      userData.vip = true;
      userData.vipUntil = updates.vipUntil;
      userData.ownedSpecials = [...new Set([...(userData.ownedSpecials || []), item.id])];
    }

    // PASSO 10: Atualizar leaderboard (não bloqueia se falhar)
    try {
      await syncLeaderboard(userData.uid, userData);
    } catch (leaderboardError) {
      console.warn("Leaderboard não sincronizou, mas compra foi salva:", leaderboardError);
    }

    // PASSO 11: Atualizar UI
    syncCoins();
    renderShop(tab);
    showToast(owned ? `✨ ${item.name} equipado!` : `✅ ${item.name} comprado!`);

  } catch (error) {
    console.error("ERRO COMPRA REAL:", error.code, error.message, error);
    console.error("Stack:", error.stack);
    alert("Erro ao salvar a compra. Veja o console para mais detalhes.");
  }
}

function showToast(msg) {
  const t = document.createElement("div");
  t.style.cssText = "position:fixed;bottom:90px;left:50%;transform:translateX(-50%);background:#10b981;color:#fff;padding:10px 20px;border-radius:100px;font-size:13px;font-weight:600;z-index:999;animation:fadeIn .3s;";
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 2500);
}
