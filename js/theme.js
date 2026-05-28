document.addEventListener("DOMContentLoaded", function () {
  // Initialize the mobile side navigation (requires Materialize JS).
  if (window.M && M.Sidenav) {
    M.Sidenav.init(document.querySelectorAll(".sidenav"));
  }

  // Support more than one toggle (top bar + mobile sidenav) without
  // relying on a duplicate element id.
  var toggles = document.querySelectorAll("[data-theme-toggle]");
  if (!toggles.length) return;

  // Initialize from localStorage, falling back to system preference
  var stored = localStorage.getItem("theme");
  var prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  var useDark = stored ? stored === "dark" : prefersDark;

  if (useDark) document.body.classList.add("dark-mode");
  updateIcons(useDark);

  toggles.forEach(function (btn) {
    btn.addEventListener("click", function (e) {
      e.preventDefault();
      var nowDark = document.body.classList.toggle("dark-mode");
      localStorage.setItem("theme", nowDark ? "dark" : "light");
      updateIcons(nowDark);
    });
  });

  function updateIcons(dark) {
    toggles.forEach(function (btn) {
      var icon = btn.querySelector(".material-icons");
      if (icon) icon.textContent = dark ? "light_mode" : "dark_mode";
    });
  }
});
