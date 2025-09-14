// =======================
// Light / Dark Mode
// =======================
document.addEventListener("DOMContentLoaded", () => {
  const themeToggle = document.getElementById("theme-toggle");

  if (themeToggle) {
    // Cek mode tersimpan
    const currentTheme = localStorage.getItem("theme") || "light";
    document.body.classList.toggle("dark-mode", currentTheme === "dark");

    themeToggle.addEventListener("click", () => {
      const isDark = document.body.classList.toggle("dark-mode");
      localStorage.setItem("theme", isDark ? "dark" : "light");
    });
  }

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
