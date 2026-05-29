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
  // <html> before paint (no flash). Sync everything to that state.
  var root = document.documentElement;
  var dark = root.classList.contains("dark-mode");
  updateIcons(dark);
  syncThemeLinks(dark);
  saveTheme(dark);

  toggles.forEach(function (btn) {
    btn.addEventListener("click", function (e) {
      e.preventDefault();
      var nowDark = root.classList.toggle("dark-mode");
      saveTheme(nowDark);
      updateIcons(nowDark);
      syncThemeLinks(nowDark);
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
