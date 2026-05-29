document.addEventListener("DOMContentLoaded", function () {
  // Initialize the mobile side navigation (requires Materialize JS).
  if (window.M && M.Sidenav) {
    M.Sidenav.init(document.querySelectorAll(".sidenav"));
  }

  // Support more than one toggle (top bar + mobile sidenav) without
  // relying on a duplicate element id.
  var toggles = document.querySelectorAll("[data-theme-toggle]");
  if (!toggles.length) return;

  // The inline <head> script already applied the saved/system theme to
  // <html> before paint (no flash). Here we just sync the icons and wire
  // up the toggles.
  var root = document.documentElement;
  updateIcons(root.classList.contains("dark-mode"));

  toggles.forEach(function (btn) {
    btn.addEventListener("click", function (e) {
      e.preventDefault();
      var nowDark = root.classList.toggle("dark-mode");
      localStorage.setItem("theme", nowDark ? "dark" : "light");
      updateIcons(nowDark);
    });
  });

  // Keep other already-open tabs/pages in sync when the theme changes.
  window.addEventListener("storage", function (e) {
    if (e.key !== "theme") return;
    var dark = e.newValue === "dark";
    root.classList.toggle("dark-mode", dark);
    updateIcons(dark);
  });

  function updateIcons(dark) {
    toggles.forEach(function (btn) {
      var icon = btn.querySelector(".material-icons");
      if (icon) icon.textContent = dark ? "light_mode" : "dark_mode";
    });
  }
});
