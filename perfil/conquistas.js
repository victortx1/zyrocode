import { auth, db } from "../firebase.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const wrap = document.getElementById("achievementsWrap");
const btnBack = document.getElementById("btnBack");

const ACHIEVEMENT_GROUPS = [
  {
    title: "Recordes pessoais",
    items: [
      {
        id: "novo_membro",
        title: "Novo Membro",
        desc: "Entrou para a comunidade Zyro Code",
        icon: "⚡",
        // Para usar uma imagem própria, coloque o caminho aqui. Ex: "../assets/conquistas/novo-membro.png"
        image: ""
      },
      {
        id: "first_step",
        title: "Primeiro Passo",
        desc: "Complete sua primeira aula",
        icon: "🧑‍💻",
        image: ""
      },
      {
        id: "explorer",
        title: "Explorador",
        desc: "Complete 5 aulas",
        icon: "🤠",
        image: ""
      },
      {
        id: "on_fire",
        title: "Fogo!",
        desc: "Mantenha 7 dias de sequência",
        icon: "🔥",
        image: ""
      },
      {
        id: "dedicated",
        title: "Dedicado",
        desc: "Complete 20 aulas",
        icon: "🏆",
        image: ""
      },
      {
        id: "xp_strong",
        title: "XP Forte",
        desc: "Alcance 1000 XP",
        icon: "⚡",
        image: ""
      }
    ]
  },
  {
    title: "Triunfos",
    items: [
      {
        id: "html_master",
        title: "Mestre HTML",
        desc: "Termine o módulo HTML",
        icon: "🌐",
        image: ""
      },
      {
        id: "css_artist",
        title: "Artista CSS",
        desc: "Termine o módulo CSS",
        icon: "🎨",
        image: ""
      },
      {
        id: "js_spark",
        title: "Faísca JS",
        desc: "Termine o módulo JavaScript",
        icon: "✨",
        image: ""
      },
      {
        id: "mission_runner",
        title: "Corredor de Missões",
        desc: "Complete 10 missões",
        icon: "🎯",
        image: ""
      },
      {
        id: "league_climber",
        title: "Subiu de Liga",
        desc: "Alcance uma liga nova",
        icon: "🥇",
        image: ""
      },
      {
        id: "zyro_legend",
        title: "Lenda Zyro",
        desc: "Alcance 10000 XP",
        icon: "👑",
        image: ""
      }
    ]
  }
];

btnBack.onclick = () => {
  window.location.href = "perfil.html";
};

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function getArtHtml(item) {
  if (item.image) {
    return `
      <img
        src="${escapeHtml(item.image)}"
        alt="${escapeHtml(item.title)}"
        onerror="this.replaceWith(Object.assign(document.createElement('span'), { className: 'achievement-icon-fallback', textContent: '${escapeHtml(item.icon)}' }))"
      />
    `;
  }

  return `<span class="achievement-icon-fallback">${item.icon}</span>`;
}

function renderAchievements(userAchievements = {}) {
  const unlocked = {
    novo_membro: true,
    ...userAchievements
  };

  wrap.innerHTML = ACHIEVEMENT_GROUPS.map((group) => `
    <section class="achievement-category">
      <h2>${escapeHtml(group.title)}</h2>

      <div class="achievement-grid">
        ${group.items.map((item) => {
          const isUnlocked = Boolean(unlocked[item.id]);

          return `
            <article class="achievement-tile ${isUnlocked ? "unlocked" : "locked"}">
              ${isUnlocked ? "" : `<span class="lock-badge">🔒</span>`}
              <div class="achievement-art">${getArtHtml(item)}</div>
              <h3 class="achievement-name">${escapeHtml(item.title)}</h3>
              <p class="achievement-desc">${escapeHtml(item.desc)}</p>
            </article>
          `;
        }).join("")}
      </div>
    </section>
  `).join("");
}

onAuthStateChanged(auth, async (user) => {
  try {
    const isGuest = localStorage.getItem("zyroGuest") === "true";

    if (isGuest) {
      renderAchievements({});
      return;
    }

    if (!user) {
      window.location.href = "../login/login.html";
      return;
    }

    const snap = await getDoc(doc(db, "users", user.uid));
    renderAchievements(snap.exists() ? snap.data().achievements || {} : {});
  } catch (error) {
    console.error("Erro ao carregar conquistas:", error);
    wrap.innerHTML = `<div class="achievements-loading">Erro ao carregar conquistas.</div>`;
  }
});
