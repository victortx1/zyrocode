const btnBack = document.getElementById("btnBack");
const contactSupport = document.getElementById("contactSupport");
const toast = document.getElementById("toast");

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toast.classList.remove("show"), 2200);
}

btnBack.addEventListener("click", () => {
  window.location.href = "configuracoes.html";
});

contactSupport.addEventListener("click", () => {
  showToast("Abrindo atendimento... Em breve você será redirecionado.");
});
