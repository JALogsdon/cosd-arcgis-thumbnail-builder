document.addEventListener("DOMContentLoaded", function () {
  var btn = document.getElementById("theme-toggle");
  if (!btn) return;

  // Initialize from localStorage, falling back to system preference
  var stored = localStorage.getItem("theme");
  var prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  var useDark = stored ? stored === "dark" : prefersDark;

  if (useDark) document.body.classList.add("dark-mode");
  updateIcon(useDark);

  btn.addEventListener("click", function (e) {
    e.preventDefault();
    var nowDark = document.body.classList.toggle("dark-mode");
    localStorage.setItem("theme", nowDark ? "dark" : "light");
    updateIcon(nowDark);
  });

  function updateIcon(dark) {
    var icon = btn.querySelector(".material-icons");
    if (icon) icon.textContent = dark ? "light_mode" : "dark_mode";
  }
});
