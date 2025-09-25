
document.addEventListener("DOMContentLoaded", () => {
  // =======================
  // Logout
  // =======================
  const logoutBtn = document.getElementById("logout-btn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      // Logout kembali ke index.html
      window.location.href = "index.html";
    });
  }
});
