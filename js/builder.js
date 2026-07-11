// Shared builder logic for BOTH the item thumbnail (index.html, #edit-canvas)
// and the group thumbnail (group.html, #group-canvas). The two pages were
// near-identical clones that drifted apart and reproduced the same bugs; this
// single module drives whichever canvas is present so they can't diverge.
//
// Depends on js/thumbnail.js (window.Thumb) for the actual drawing, the
// materialize-colorpicker jQuery plugin for the color inputs, and Materialize
// for the select/toast widgets.
(function () {
  "use strict";

  var isGroup = !!document.querySelector("#group-canvas");
  var canvas = document.querySelector(isGroup ? "#group-canvas" : "#edit-canvas");
  if (!canvas) {
    throw new Error("builder.js loaded on a page without a builder canvas");
  }
  canvas.width = isGroup ? 400 : 600;
  canvas.height = 400;
  var ctx = canvas.getContext("2d");
  var paint = isGroup ? Thumb.paintGroup : Thumb.paintItem;
  var downloadSuffix = isGroup ? "group-thumbnail" : "thumbnail";

  // City of San Diego theme, loaded when the page opens with no query params.
  // Relative paths so the default resolves same-origin everywhere (live site,
  // localhost, file://) — that also lets the browser reuse the one download the
  // template preview cards already made instead of fetching a second copy.
  var DEFAULTS = {
    title: "San Diego Geospatial Services",
    background: "./img/background/cosd_background.jpg",
    logo: "./img/logo/cosd_logo.png",
  };

  // Logo size multiplier and white-outline width, set from ?logoScale= /
  // ?logoStroke= so a template can render a detailed badge larger and legible.
  var logoScale = 1;
  var logoStroke = 0;

  // ---- Image slots -----------------------------------------------------
  // Each slot owns its cached Image plus a sequence token: a slow URL load
  // that resolves after a newer upload is ignored, so it can't clobber the
  // newer image. The visible URL field is the single source of truth for what
  // Copy link serializes — uploads clear it (a local file can't travel in a
  // URL), so the shared link never points at an image the sharer replaced.
  var slots = {
    background: {
      img: null,
      seq: 0,
      fileEl: document.querySelector("#background"),
      urlEl: document.querySelector("#background-url"),
      pathEl: null,
      defaultUrl: DEFAULTS.background,
    },
    logo: {
      img: null,
      seq: 0,
      fileEl: document.querySelector("#logo"),
      urlEl: document.querySelector("#logo-url"),
      pathEl: null,
      defaultUrl: DEFAULTS.logo,
    },
  };
  // Materialize renders a read-only ".file-path" text box next to each file
  // button; find the one that belongs to each slot so we can clear it on reset.
  Object.keys(slots).forEach(function (name) {
    var f = slots[name].fileEl;
    var wrap = f && f.closest(".file-field");
    slots[name].pathEl = wrap ? wrap.querySelector(".file-path") : null;
  });

  var announce = (function () {
    var t;
    return function () {
      clearTimeout(t);
      t = setTimeout(function () {
        var s = document.getElementById("canvas-status");
        if (s) s.textContent = "Thumbnail preview updated.";
      }, 700);
    };
  })();

  function currentCategory() {
    var select = document.querySelector("#category");
    if (!select) return "";
    if (select.value === "__custom__") {
      var custom = document.querySelector("#custom-category");
      return custom ? custom.value || "" : "";
    }
    return select.value;
  }

  function draw() {
    var cfg = {
      title: document.querySelector("#title").value,
      titleColor: $("#title-color").colorpicker("getValue"),
      bgImage: slots.background.img,
      logoImage: slots.logo.img,
      logoScale: logoScale,
      logoStroke: logoStroke,
    };
    if (!isGroup) {
      cfg.category = currentCategory();
      cfg.categoryColor = $("#category-color").colorpicker("getValue");
    }
    paint(ctx, cfg);
    announce();
  }

  // Same-origin images never taint the canvas, so only cross-origin URLs need
  // the CORS attribute (which also keeps the request mode matching the preview
  // fetch so the browser can reuse a single download).
  function isCrossOrigin(url) {
    try {
      return new URL(url, location.href).origin !== location.origin;
    } catch (e) {
      return false;
    }
  }

  function loadFromUrl(name, url) {
    var slot = slots[name];
    var token = ++slot.seq;
    var img = new Image();
    if (isCrossOrigin(url)) img.crossOrigin = "Anonymous";
    img.onload = function () {
      if (token !== slot.seq) return; // a newer load superseded this one
      slot.img = img;
      draw();
    };
    img.onerror = function () {
      if (token !== slot.seq) return;
      toast(
        "Couldn't load that image URL — it may block cross-origin access. Try uploading the file instead.",
      );
    };
    img.src = url;
  }

  function loadFromFile(name, file) {
    var slot = slots[name];
    var token = ++slot.seq;
    // A local file can't be represented as a shareable URL; clear the URL field
    // now (not after decode) so Copy link stays honest the instant a file is
    // chosen, regardless of how long the image takes to load.
    if (slot.urlEl) slot.urlEl.value = "";
    var reader = new FileReader();
    reader.onload = function () {
      var img = new Image();
      img.onload = function () {
        if (token !== slot.seq) return;
        slot.img = img;
        draw();
      };
      img.onerror = function () {
        if (token !== slot.seq) return;
        toast("That file doesn't look like a supported image (PNG, JPEG, GIF).");
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  }

  function clearImage(name) {
    var slot = slots[name];
    slot.seq++;
    slot.img = null;
    draw();
  }

  // ---- Init ------------------------------------------------------------
  document.addEventListener("DOMContentLoaded", function () {
    $("#title-color").colorpicker({ component: ".btn" }).on("changeColor", draw);
    wireHex("#title-color", "#title-hex");
    if (!isGroup) {
      $("#category-color")
        .colorpicker({ component: ".btn" })
        .on("changeColor", draw);
      wireHex("#category-color", "#category-hex");
    }

    var titleInput = document.querySelector("#title");
    titleInput.addEventListener("input", draw);

    // Sidebar category (item only)
    var select = document.getElementById("category");
    if (select) {
      var customWrapper = document.getElementById("custom-category-wrapper");
      var customInput = document.getElementById("custom-category");
      select.addEventListener("change", function () {
        customWrapper.classList.toggle("hidden", this.value !== "__custom__");
        draw();
      });
      customInput.addEventListener("input", draw);
    }

    // File uploads
    Object.keys(slots).forEach(function (name) {
      var slot = slots[name];
      if (slot.fileEl) {
        slot.fileEl.addEventListener("change", function () {
          if (this.files && this.files[0]) loadFromFile(name, this.files[0]);
        });
      }
      // Visible "or paste an image URL" field
      if (slot.urlEl) {
        slot.urlEl.addEventListener("change", function () {
          var v = this.value.trim();
          if (slot.fileEl) {
            slot.fileEl.value = "";
            if (slot.pathEl) slot.pathEl.value = "";
          }
          if (v) loadFromUrl(name, v);
          else clearImage(name);
        });
      }
    });

    // Drag-and-drop an image straight onto the preview (background is the
    // common intent). The whole preview column is the drop target.
    setupDragAndDrop();

    // Whole template card is clickable, and up/down cues show scroll room.
    setupTemplateCards();
    setupRailScrollIndicators();

    // ---- Query params ----
    logoScale = parseFloat(param("logoScale")) || 1;
    logoStroke = parseFloat(param("logoStroke")) || 0;

    setColor("#title-color", param("titleColor"), "rgba(0,152,219,0.9)"); // cerulean
    if (!isGroup) {
      setColor("#category-color", param("sidebarColor"), "rgba(255,160,47,0.9)"); // sunshade
    }

    titleInput.value = param("title") != null ? param("title") : DEFAULTS.title;

    if (!isGroup && param("category") != null) applyCategory(param("category"));

    initSlot("background");
    initSlot("logo");

    if (select) M.FormSelect.init(document.querySelectorAll("select"));
    M.updateTextFields();
    draw();

    // Download — filename derived from the title
    document
      .querySelector("#download-image")
      .addEventListener("click", function (e) {
        try {
          this.href = canvas.toDataURL("image/png");
          this.download = downloadName(downloadSuffix);
        } catch (err) {
          // A cross-origin background/logo without CORS headers taints the
          // canvas and blocks export. Tell the user how to recover.
          e.preventDefault();
          toast(
            "Couldn't export the image. If you set a background or logo by URL, upload the file instead.",
          );
        }
      });

    // Copy a shareable link reproducing the current text/colors/category and
    // any image URLs (uploaded files can't travel in a URL).
    var copyBtn = document.querySelector("#copy-link");
    if (copyBtn) {
      copyBtn.addEventListener("click", function () {
        var url = buildShareUrl();
        var uploaded =
          (slots.background.img && !slots.background.urlEl.value.trim()) ||
          (slots.logo.img && !slots.logo.urlEl.value.trim());
        var note = uploaded
          ? " (uploaded images can't travel in a link — only text, colors, and image URLs were included)"
          : "";
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(url).then(
            function () {
              toast("Shareable link copied to clipboard." + note);
            },
            function () {
              promptCopy(url);
            },
          );
        } else {
          promptCopy(url);
        }
      });
    }

    // Reset back to the branded first-load state (not a blank canvas).
    var resetBtn = document.querySelector("#reset");
    if (resetBtn) {
      resetBtn.addEventListener("click", function () {
        titleInput.value = DEFAULTS.title;
        if (select) {
          select.value = select.options[0].value;
          document.getElementById("custom-category-wrapper").classList.add("hidden");
          document.getElementById("custom-category").value = "";
          M.FormSelect.init(select);
        }
        $("#title-color").colorpicker("setValue", "rgba(0,152,219,0.9)");
        if (!isGroup)
          $("#category-color").colorpicker("setValue", "rgba(255,160,47,0.9)");
        logoScale = 1;
        logoStroke = 0;
        Object.keys(slots).forEach(function (name) {
          var slot = slots[name];
          if (slot.fileEl) slot.fileEl.value = "";
          if (slot.pathEl) slot.pathEl.value = "";
          slot.urlEl.value = "";
          loadFromUrl(name, slot.defaultUrl); // silent brand default
        });
        M.updateTextFields();
        draw();
      });
    }
  });

  // Load a slot's initial image: an explicit ?param wins and is shown in the
  // field (so it travels in a shared link); otherwise the brand default loads
  // silently with the field left empty.
  function initSlot(name) {
    var slot = slots[name];
    var p = param(name); // "background" / "logo"
    if (p != null) {
      slot.urlEl.value = p;
      loadFromUrl(name, p);
    } else {
      slot.urlEl.value = "";
      loadFromUrl(name, slot.defaultUrl);
    }
  }

  function applyCategory(value) {
    var select = document.getElementById("category");
    var match = Array.from(select.options).find(function (opt) {
      return opt.value.toLowerCase() === value.toLowerCase();
    });
    if (match) {
      match.selected = true;
    } else {
      select.value = "__custom__";
      document.getElementById("custom-category-wrapper").classList.remove("hidden");
      document.getElementById("custom-category").value = value;
    }
  }

  function setColor(pickerSel, paramVal, fallback) {
    $(pickerSel).colorpicker(
      "setValue",
      paramVal ? "rgba(" + paramVal + ")" : fallback,
    );
  }

  function setupDragAndDrop() {
    var zone = canvas.closest(".col") || canvas.parentNode;
    if (!zone) return;
    ["dragenter", "dragover"].forEach(function (ev) {
      zone.addEventListener(ev, function (e) {
        e.preventDefault();
        zone.classList.add("drag-over");
      });
    });
    ["dragleave", "drop"].forEach(function (ev) {
      zone.addEventListener(ev, function (e) {
        e.preventDefault();
        if (ev === "dragleave" && zone.contains(e.relatedTarget)) return;
        zone.classList.remove("drag-over");
      });
    });
    zone.addEventListener("drop", function (e) {
      var file = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
      if (!file) return;
      if (!/^image\//.test(file.type)) {
        toast("Drop an image file (PNG, JPEG, GIF).");
        return;
      }
      if (slots.background.fileEl) slots.background.fileEl.value = "";
      loadFromFile("background", file);
      toast("Background set from dropped image.");
    });
  }

  // Make the whole template card clickable (not just the "Use this template"
  // text). Real clicks/keyboard activation on the link behave normally; a click
  // anywhere else on the card navigates to the same template URL.
  function setupTemplateCards() {
    var cards = document.querySelectorAll(".rail-cards .card");
    Array.prototype.forEach.call(cards, function (card) {
      var a = card.querySelector(".card-action a");
      if (!a) return;
      card.addEventListener("click", function (e) {
        if (e.target.closest("a")) return; // the link itself handles its click
        window.location.href = a.href;
      });
    });
  }

  // Toggle "more above / more below" cues on the rail so a first-time visitor
  // knows the template list scrolls. Injects two sticky chevron hints into the
  // scroll container and updates them on scroll/resize (and after the previews
  // paint, which changes the scroll height).
  function setupRailScrollIndicators() {
    var rail = document.querySelector(".template-rail");
    var cards = rail && rail.querySelector(".rail-cards");
    if (!rail || !cards) return;

    function hint(cls, glyph) {
      var el = document.createElement("div");
      el.className = "rail-hint " + cls;
      el.setAttribute("aria-hidden", "true");
      var i = document.createElement("i");
      i.className = "material-icons";
      i.textContent = glyph;
      el.appendChild(i);
      return el;
    }
    var up = hint("rail-hint-up", "keyboard_arrow_up");
    var down = hint("rail-hint-down", "keyboard_arrow_down");
    cards.insertBefore(up, cards.firstChild);
    cards.appendChild(down);

    function update() {
      var top = cards.scrollTop;
      var max = cards.scrollHeight - cards.clientHeight;
      rail.classList.toggle("more-above", top > 2);
      rail.classList.toggle("more-below", max > 2 && top < max - 2);
    }
    cards.addEventListener("scroll", update);
    window.addEventListener("resize", update);
    update();
    // Previews paint asynchronously and grow the scroll height; re-check.
    setTimeout(update, 400);
    setTimeout(update, 1200);
  }

  // ---- Query param (URLSearchParams never throws on malformed % escapes,
  // unlike decodeURIComponent, so one bad char in a shared link can't abort
  // page init). Returns the decoded value, or null when absent. ----
  function param(name) {
    return new URLSearchParams(location.search).get(name);
  }

  // ---- Hex <-> rgba helpers ----
  function rgbaToHex(value) {
    var m = /rgba?\(([^)]+)\)/.exec(value || "");
    if (m) {
      var p = m[1].split(",");
      return "#" + hx(p[0]) + hx(p[1]) + hx(p[2]);
    }
    var h = /^#?([0-9a-f]{6})$/i.exec((value || "").trim());
    return h ? "#" + h[1].toLowerCase() : "";
  }

  function hx(n) {
    n = Math.max(0, Math.min(255, parseInt(n, 10) || 0));
    return ("0" + n.toString(16)).slice(-2);
  }

  function setPickerFromHex(pickerSel, hex) {
    hex = (hex || "").replace("#", "");
    if (!/^[0-9a-f]{6}$/i.test(hex)) return;
    var cur = $(pickerSel).colorpicker("getValue");
    var am = /rgba?\([^,]+,[^,]+,[^,]+,\s*([\d.]+)\)/.exec(cur || "");
    var alpha = am ? am[1] : "1";
    var n = parseInt(hex, 16);
    $(pickerSel).colorpicker(
      "setValue",
      "rgba(" +
        ((n >> 16) & 255) +
        "," +
        ((n >> 8) & 255) +
        "," +
        (n & 255) +
        "," +
        alpha +
        ")",
    );
  }

  function wireHex(pickerSel, hexSel) {
    var hexEl = document.querySelector(hexSel);
    if (!hexEl) return;
    $(pickerSel).on("changeColor", function () {
      if (document.activeElement !== hexEl) {
        hexEl.value = rgbaToHex($(pickerSel).colorpicker("getValue"));
      }
    });
    hexEl.addEventListener("input", function () {
      setPickerFromHex(pickerSel, this.value);
    });
  }

  function downloadName(suffix) {
    var t = (document.querySelector("#title").value || "").trim();
    var safe = t
      .replace(/[^\w-]+/g, "_")
      .replace(/_+/g, "_")
      .replace(/^_+|_+$/g, "");
    return (safe ? safe + "_" : "") + suffix + ".png";
  }

  function buildShareUrl() {
    var params = new URLSearchParams();
    var title = document.querySelector("#title").value;
    if (title) params.set("title", title);

    var tc = rgbaToParam($("#title-color").colorpicker("getValue"));
    if (tc) params.set("titleColor", tc);
    if (!isGroup) {
      var sc = rgbaToParam($("#category-color").colorpicker("getValue"));
      if (sc) params.set("sidebarColor", sc);
      var category = currentCategory();
      if (category) params.set("category", category);
    }

    var bgUrl = slots.background.urlEl.value.trim();
    if (bgUrl) params.set("background", bgUrl);
    var logoUrl = slots.logo.urlEl.value.trim();
    if (logoUrl) params.set("logo", logoUrl);
    if (logoScale !== 1) params.set("logoScale", logoScale);
    if (logoStroke !== 0) params.set("logoStroke", logoStroke);

    // Split off any existing query/hash so this also works over file://
    // (where location.origin is the string "null").
    return location.href.split(/[?#]/)[0] + "?" + params.toString();
  }

  function rgbaToParam(value) {
    if (!value) return "";
    var m = /rgba?\(([^)]+)\)/.exec(value);
    if (m) {
      return m[1]
        .split(",")
        .map(function (s) {
          return s.trim();
        })
        .join(",");
    }
    var hex = /^#?([0-9a-f]{6})$/i.exec(value.trim());
    if (hex) {
      var n = parseInt(hex[1], 16);
      return [(n >> 16) & 255, (n >> 8) & 255, n & 255].join(",");
    }
    return "";
  }

  function toast(msg) {
    if (window.M && M.toast) M.toast({ html: msg, displayLength: 5000 });
    else alert(msg);
  }

  function promptCopy(url) {
    window.prompt("Copy this shareable link:", url);
  }
})();
