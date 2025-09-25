document.addEventListener("DOMContentLoaded", function () {
  const form = document.getElementById("loginForm");
  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      const user = document.getElementById("username").value;
      const pass = document.getElementById("password").value;
      if (user === "admin" && pass === "admin123") {
        localStorage.setItem("isLoggedIn", "true");
        window.location.href = "dashboard.html";
      } else {
        document.getElementById("error-msg").innerText = "Invalid username or password.";
      }
    });
  }

  const path = window.location.pathname;
  if (!path.includes("login.html")) {
    const loggedIn = localStorage.getItem("isLoggedIn");
    if (loggedIn !== "true") {
      window.location.href = "login.html";
    }
  }
});
