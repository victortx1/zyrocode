// loja.js
import { auth, db } from "../firebase.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  doc,
  getDoc,
  updateDoc,
  arrayUnion,
  increment,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

let userData = null;

const ITEMS = {
  items: [
    { id: "heart_pack", icon: "❤️", name: "+5 Vidas", desc: "Recarregue seus corações", price: 80, action: "vidas" },
    { id: "heart_pack3", icon: "💖", name: "+10 Vidas", desc: "Pacote econômico de vidas", price: 140, action: "vidas10" },
    { id: "rename", icon: "✏️", name: "Trocar Nome", desc: "Mude seu nome de usuário", price: 150, action: "rename" },
    { id: "streak_shield", icon: "🛡️", name: "Streak Shield", desc: "Protege sua streak por 1 dia", price: 100, action: "shield" },
    { id: "vip_pass", icon: "✨", name: "VIP Zyro", desc: "Selo VIP e destaque no perfil por 30 dias", price: 900, action: "vip" }
  ],
  chars: [
    { id: "dev_iniciante", icon: "👨‍💻", name: "Dev Iniciante", desc: "Ponto de partida de todo dev", price: 0, action: "char" },
    { id: "dev_ninja",     icon: "🥷",  name: "Dev Ninja",     desc: "Rápido e silencioso no código", price: 200, action: "char" },
    { id: "dev_robo",      icon: "🤖",  name: "Dev Robô",      desc: "Preciso como uma máquina", price: 300, action: "char" },
    { id: "dev_hacker",    icon: "🕵️",  name: "Dev Hacker",    desc: "Vê o que os outros não veem", price: 400, action: "char" },
    { id: "dev_mestre",    icon: "🧙",  name: "Dev Mestre",    desc: "O ápice da jornada Zyro", price: 600, action: "char" }
  ],
  boost: [
    { id: "xp_boost", icon: "⚡", name: "XP x2", desc: "Dobra seu XP por 24h", price: 250, action: "boost_xp" },
    { id: "coin_boost", icon: "🪙", name: "Moedas x2", desc: "Dobra moedas por 24h", price: 200, action: "boost_coin" }
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
  ]
  ,
  avatars: [
    { id: "avatar_default", icon: "👤", name: "Avatar Padrão", desc: "Avatar padrão", price: 0, rarity: "common", action: "avatar" },
    { id: "dev_laranja", icon: "🧑‍💻", name: "Dev Laranja", desc: "Estilo laranja Zyro", price: 150, rarity: "uncommon", action: "avatar" },
    { id: "hacker_preto", icon: "🕶️", name: "Hacker Preto", desc: "Look misterioso", price: 250, rarity: "rare", action: "avatar" },
    { id: "fogo_code", icon: "🔥", name: "Fogo Code", desc: "Fúria flamejante", price: 350, rarity: "epic", action: "avatar" },
    { id: "ruby_dev", icon: "💎", name: "Ruby Dev", desc: "Toque rubi", price: 500, rarity: "legendary", action: "avatar" },
    { id: "mestre_zyro", icon: "👑", name: "Mestre Zyro", desc: "Avatar de mestre", price: 800, rarity: "mythic", action: "avatar" }
  ]
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

function isVipActive() {
  const value = userData.vipUntil;
  if (!value) return false;

  const date = value.seconds ? new Date(value.seconds * 1000) : new Date(value);
  return date.getTime() > Date.now();
}

function isOwned(item) {
  if (item.price === 0) return true;
  if (CONSUMABLE_ACTIONS.has(item.action)) return false;
  if (item.action === "banner") return (userData.ownedBanners || []).includes(item.id);
  if (item.action === "avatar") return (userData.ownedAvatars || []).includes(item.id);
  if (item.action === "char") return (userData.inventario || []).includes(item.id);
  if (item.action === "vip") return isVipActive() || (userData.ownedSpecials || []).includes(item.id);
  return getAllOwnedItems().includes(item.id);
}

function isEquipped(item) {
  if (item.action === "char") return userData.personagemSelecionado === item.id;
  if (item.action === "banner") return (userData.equippedBanner || "orange_default") === item.id;
  if (item.action === "avatar") return (userData.equippedAvatar || "avatar_default") === item.id;
  return false;
}

function syncCoins() {
  document.getElementById("coinDisplay").textContent = userData.moedas || 0;
}

onAuthStateChanged(auth, async user => {
  const isGuest = localStorage.getItem("zyroGuest") === "true";
  
  if (!user && !isGuest) { window.location.href = "../login/login.html"; return; }
  
  if (isGuest) {
    userData = {
      uid: "guest",
      nome: localStorage.getItem("zyroUserName") || "Visitante",
      moedas: 100,
      inventario: ["dev_iniciante"],
      personagemSelecionado: "dev_iniciante"
    };
  } else {
    const snap = await getDoc(doc(db, "users", user.uid));
    if (!snap.exists()) { window.location.href = "../login/login.html"; return; }
    userData = { ...snap.data(), uid: user.uid };
  }
  
  document.getElementById("coinDisplay").textContent = userData.moedas || 0;
  setupTabs();
  const initialTab = localStorage.getItem('openShopTab') || (location.hash ? location.hash.replace('#','') : 'items');
  // Clear stored tab after using
  localStorage.removeItem('openShopTab');
  // ensure active class on matching tab button
  document.querySelectorAll('.shop-tab').forEach(t => t.classList.remove('active'));
  const tabBtn = document.querySelector(`.shop-tab[data-tab="${initialTab}"]`);
  if (tabBtn) tabBtn.classList.add('active');
  renderShop(initialTab);
});

function setupTabs() {
  document.querySelectorAll(".shop-tab").forEach(tab => {
    tab.addEventListener("click", () => {
      document.querySelectorAll(".shop-tab").forEach(t => t.classList.remove("active"));
      tab.classList.add("active");
      renderShop(tab.dataset.tab);
    });
  });
}

function renderShop(tab) {
  const content = document.getElementById("shopContent");
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

  content.innerHTML = `<div class="shop-grid">${items.map(item => {
    const isChar = item.action === "char";
    const isBanner = item.action === "banner";
    const isAvatar = item.action === "avatar";
    const owned = isOwned(item);
    const equippedNow = isEquipped(item);
    const canAfford = (userData.moedas || 0) >= item.price;
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

    // Special rendering for avatars (circular preview)
    if (isAvatar) {
      return `
      <div class="shop-item ${equippedNow ? 'equipped' : owned ? 'owned' : ''}" style="display:flex;flex-direction:column;align-items:center;padding:16px;">
        <div class="avatar-preview">${item.icon}</div>
        <div class="item-name">${item.name}</div>
        <div class="item-desc">${item.desc}</div>
        <div class="item-price">${item.price > 0 ? "🪙 " + item.price : "Grátis"}</div>
        <button class="btn-buy ${btnClass}" data-id="${item.id}" ${disabled ? "disabled" : ""} style="margin-top:8px;">${btnText}</button>
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
  
  const itemList = tab === "my-banners" ? ITEMS.banners : ITEMS[tab];
  const item = itemList?.find(i => i.id === itemId);
  if (!item) return;

  const ref = doc(db, "users", userData.uid);
  const owned = isOwned(item);
  const consumable = CONSUMABLE_ACTIONS.has(item.action);

  if (owned && !consumable && !["char", "banner", "avatar"].includes(item.action)) {
    showToast("Você já possui esse item.");
    return;
  }

  if (!owned && (userData.moedas || 0) < item.price) {
    alert("Moedas insuficientes!");
    return;
  }

  const updates = {
    updatedAt: serverTimestamp()
  };

  if (!owned && item.price > 0) {
    updates.moedas = increment(-item.price);
  }

  if (!owned && item.action === "char") {
    updates.inventario = arrayUnion(item.id);
  }

  if (!owned && item.action === "banner") {
    updates.ownedBanners = arrayUnion(item.id);
  }

  if (!owned && item.action === "avatar") {
    updates.ownedAvatars = arrayUnion(item.id);
  }

  if (item.action === "char") {
    updates.personagemSelecionado = item.id;
  }

  if (item.action === "banner") {
    updates.equippedBanner = item.id;
  }

  if (item.action === "avatar") {
    updates.equippedAvatar = item.id;
  }

  if (item.action === "vidas") {
    updates.vidas = Math.min(5, (userData.vidas ?? 5) + 5);
  }

  if (item.action === "vidas10") {
    updates.vidas = Math.min(5, (userData.vidas ?? 5) + 10);
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

  await updateDoc(ref, updates);

  if (!owned && item.price > 0) userData.moedas = (userData.moedas || 0) - item.price;
  if (!owned && item.action === "char") userData.inventario = [...new Set([...(userData.inventario || []), item.id])];
  if (!owned && item.action === "banner") userData.ownedBanners = [...new Set([...(userData.ownedBanners || []), item.id])];
  if (!owned && item.action === "avatar") userData.ownedAvatars = [...new Set([...(userData.ownedAvatars || []), item.id])];
  if (item.action === "char") userData.personagemSelecionado = item.id;
  if (item.action === "banner") userData.equippedBanner = item.id;
  if (item.action === "avatar") userData.equippedAvatar = item.id;
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

  syncCoins();
  renderShop(tab);
  showToast(owned ? `✨ ${item.name} equipado!` : `✅ ${item.name} comprado!`);
}

function showToast(msg) {
  const t = document.createElement("div");
  t.style.cssText = "position:fixed;bottom:90px;left:50%;transform:translateX(-50%);background:#10b981;color:#fff;padding:10px 20px;border-radius:100px;font-size:13px;font-weight:600;z-index:999;animation:fadeIn .3s;";
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 2500);
}
