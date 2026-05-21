import { auth } from "../firebase.js";
import { signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

const btnDone = document.getElementById("btnDone");
const toast = document.getElementById("settingsToast");

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");

  setTimeout(() => {
    toast.classList.remove("show");
  }, 2300);
}

btnDone.onclick = () => {
  window.location.href = "perfil.html";
};

document.querySelectorAll(".settings-item").forEach((item) => {
  item.onclick = async () => {
    const action = item.dataset.action;

    if (action === "profile") {
      window.location.href = "perfil.html";
      return;
    }

    if (action === "feedback") {
      showToast("Comentários em desenvolvimento.");
      return;
    }

    if (action === "logout") {
      try {
        localStorage.removeItem("zyroGuest");
        localStorage.removeItem("zyroUserName");
        await signOut(auth);
        window.location.href = "../login/login.html";
      } catch (error) {
        console.error("Erro ao sair:", error);
        showToast("Erro ao sair da conta.");
      }

      return;
    }

    showToast("Essa seção será liberada em breve.");
  };
});
