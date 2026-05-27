const btnBack = document.getElementById("btnBack");
const submitBtn = document.getElementById("submitBtn");
const toast = document.getElementById("toast");
const feedbackText = document.getElementById("feedbackText");
const ratingButtons = document.querySelectorAll(".rating-button");
const selectedRating = document.getElementById("selectedRating");
const feedbackLength = document.getElementById("feedbackLength");

let currentRating = 4;

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toast.classList.remove("show"), 2200);
}

function updateRating(value) {
  currentRating = value;
  ratingButtons.forEach((button) => {
    button.classList.toggle("active", Number(button.dataset.rating) === value);
  });
  selectedRating.textContent = `Avaliação selecionada: ${value}`;
}

function updateFeedbackCount() {
  const length = feedbackText.value.length;
  feedbackLength.textContent = `${length} / 360 caracteres`;
}

btnBack.addEventListener("click", () => {
  window.location.href = "configuracoes.html";
});

ratingButtons.forEach((button) => {
  button.addEventListener("click", () => {
    updateRating(Number(button.dataset.rating));
  });
});

feedbackText.addEventListener("input", () => {
  updateFeedbackCount();
});

submitBtn.addEventListener("click", () => {
  const message = feedbackText.value.trim();
  if (!message) {
    showToast("Escreva um comentário antes de enviar.");
    return;
  }
  localStorage.setItem("zyroComment", JSON.stringify({ rating: currentRating, message, date: new Date().toISOString() }));
  showToast("Comentário enviado. Obrigado pela contribuição!");
  feedbackText.value = "";
  updateFeedbackCount();
});

window.addEventListener("DOMContentLoaded", () => {
  updateRating(currentRating);
  updateFeedbackCount();
});
