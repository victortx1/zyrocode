import { auth } from "../firebase.js";
import { signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

const btnDone = document.getElementById("btnDone");
const logoutButton = document.getElementById("logoutButton");
const toast = document.getElementById("settingsToast");

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => {
    toast.classList.remove("show");
  }, 2200);
}

btnDone.addEventListener("click", () => {
  window.location.href = "perfil.html";
});

logoutButton.addEventListener("click", async () => {
  try {
    localStorage.removeItem("zyroGuest");
    localStorage.removeItem("zyroUserName");
    await signOut(auth);
    window.location.href = "../login/login.html";
  } catch (error) {
    console.error("Erro ao sair:", error);
    showToast("Erro ao sair. Tente novamente.");
  }
});
