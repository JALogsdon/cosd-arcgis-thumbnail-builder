document.addEventListener("DOMContentLoaded", function () {
  // Initialize the mobile side navigation (requires Materialize JS).
  if (window.M && M.Sidenav) {
    M.Sidenav.init(document.querySelectorAll(".sidenav"));
  }

  // Support more than one toggle (top bar + mobile sidenav) without
  // relying on a duplicate element id.
  var toggles = document.querySelectorAll("[data-theme-toggle]");
  if (!toggles.length) return;

  // The inline <head> script already applied the saved/URL/system theme to
  // <html> before paint (no flash). Sync the UI to that state, but DON'T
  // persist here: writing on load would freeze a system-derived theme as an
  // explicit choice, so a later OS theme change (or someone else's ?theme=
  // link) would no longer take effect. Persist only on an explicit toggle,
  // or when the URL explicitly asked for a theme.
  var root = document.documentElement;
  var dark = root.classList.contains("dark-mode");
  updateIcons(dark);
  syncThemeLinks(dark);
  var urlTheme = null;
  try {
    urlTheme = new URLSearchParams(location.search).get("theme");
  } catch (e) {}
  if (urlTheme === "dark" || urlTheme === "light") saveTheme(dark);

  function toggleTheme(e) {
    e.preventDefault();
    var nowDark = root.classList.toggle("dark-mode");
    saveTheme(nowDark);
    updateIcons(nowDark);
    syncThemeLinks(nowDark);
  }

  toggles.forEach(function (btn) {
    btn.addEventListener("click", toggleTheme);
    // The toggle is an <a role="button">; native links activate on Enter but
    // not Space. role=button promises Space works, so handle it here.
    btn.addEventListener("keydown", function (e) {
      if (e.key === " " || e.key === "Spacebar") toggleTheme(e);
    });
  });

  // Keep other already-open tabs/pages in sync when the theme changes.
  window.addEventListener("storage", function (e) {
    if (e.key !== "theme") return;
    var d = e.newValue === "dark";
    root.classList.toggle("dark-mode", d);
    updateIcons(d);
    syncThemeLinks(d);
  });

  function saveTheme(d) {
    // Works over http(s); harmless (and may no-op) where storage is blocked.
    try {
      localStorage.setItem("theme", d ? "dark" : "light");
    } catch (e) {}
  }

  function updateIcons(d) {
    toggles.forEach(function (btn) {
      var icon = btn.querySelector(".material-icons");
      if (icon) icon.textContent = d ? "light_mode" : "dark_mode";
      // Announce state to assistive tech and keep the label accurate.
      btn.setAttribute("aria-pressed", d ? "true" : "false");
      btn.setAttribute("aria-label", d ? "Switch to light mode" : "Switch to dark mode");
    });
  }

  // Stamp ?theme= onto internal nav links so the choice rides along when you
  // click between pages — this is what makes it persist even when localStorage
  // isn't shared (e.g. Firefox opening the files directly via file://).
  function syncThemeLinks(d) {
    var theme = d ? "dark" : "light";
    var pages = ["index.html", "viewer.html", "group.html", "help.html"];
    var links = document.querySelectorAll("nav a[href], .sidenav a[href]");
    links.forEach(function (a) {
      var href = a.getAttribute("href");
      if (!href || href.charAt(0) === "#") return;
      var hashIdx = href.indexOf("#");
      var hash = hashIdx >= 0 ? href.slice(hashIdx) : "";
      var noHash = hashIdx >= 0 ? href.slice(0, hashIdx) : href;
      var qIdx = noHash.indexOf("?");
      var path = qIdx >= 0 ? noHash.slice(0, qIdx) : noHash;
      var query = qIdx >= 0 ? noHash.slice(qIdx + 1) : "";
      var base = path.replace(/^\.\//, "");
      var internal = pages.some(function (name) {
        return base === name || base.endsWith("/" + name);
      });
      if (!internal) return;
      var sp = new URLSearchParams(query);
      sp.set("theme", theme);
      a.setAttribute("href", path + "?" + sp.toString() + hash);
    });
  }
});
