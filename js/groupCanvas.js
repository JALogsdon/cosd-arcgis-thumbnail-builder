var groupCanvas = document.querySelector("#group-canvas");
if (!groupCanvas)
  throw new Error("groupCanvas.js loaded on a page without #group-canvas");
groupCanvas.height = 400;
groupCanvas.width = 400;

var ctx = groupCanvas.getContext("2d");

// Decoded images are cached so draw() (called on every keystroke) only
// redraws — it never re-reads the file or re-decodes the image.
var bgImage = null;
var logoImage = null;
// Logo size multiplier, set from the ?logoScale= param so a template can
// render its logo larger (e.g., the detailed Transportation badge).
var logoScale = 1;
// White outline width (canvas px), set from the ?logoStroke= param for marks
// that need extra separation from busy imagery. 0 = no outline.
var logoStroke = 0;

// City of San Diego theme — loaded by default when the page opens with no
// query params (absolute URLs so they resolve the same locally and live).
var DEFAULTS = {
  title: "San Diego Geospatial Services",
  background:
    "https://jalogsdon.github.io/cosd-arcgis-thumbnail-builder/img/background/cosd_background.png",
  logo: "https://jalogsdon.github.io/cosd-arcgis-thumbnail-builder/img/logo/cosd_logo.png",
};

// Debounced screen-reader announcement so we don't fire on every keystroke.
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

function draw() {
  Thumb.paintGroup(ctx, {
    title: document.querySelector("#title").value,
    titleColor: $("#title-color").colorpicker("getValue"),
    bgImage: bgImage,
    logoImage: logoImage,
    logoScale: logoScale,
    logoStroke: logoStroke,
  });
  announce();
}

// Load an image once (from a File or a URL), cache it via `assign`, then
// redraw. Passing neither clears that image.
function loadImage(file, urlValue, assign) {
  if (file) {
    var reader = new FileReader();
    reader.onload = function () {
      var img = new Image();
      img.onload = function () {
        assign(img);
        draw();
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  } else if (urlValue) {
    var urlImg = new Image();
    urlImg.crossOrigin = "Anonymous";
    urlImg.onload = function () {
      assign(urlImg);
      draw();
    };
    urlImg.onerror = function () {
      toast(
        "Couldn't load that image URL — it may block cross-origin access. Try uploading the file instead.",
      );
    };
    urlImg.src = urlValue;
  } else {
    assign(null);
    draw();
  }
}

document.addEventListener("DOMContentLoaded", function () {
  $("#title-color").colorpicker({ component: ".btn" }).on("changeColor", draw);
  wireHex("#title-color", "#title-hex");

  var titleInput = document.querySelector("#title");
  // "input" (not "keyup") so paste, autofill, and speech input redraw too.
  titleInput.addEventListener("input", draw);

  document.querySelector("#background").addEventListener("change", function () {
    loadImage(this.files[0], null, function (img) {
      bgImage = img;
    });
  });
  document.querySelector("#logo").addEventListener("change", function () {
    loadImage(this.files[0], null, function (img) {
      logoImage = img;
    });
  });

  // Query params
  logoScale = parseFloat(getUrlParameter("logoScale")) || 1;
  logoStroke = parseFloat(getUrlParameter("logoStroke")) || 0;
  if (getUrlParameter("titleColor")) {
    $("#title-color").colorpicker(
      "setValue",
      "rgba(" + getUrlParameter("titleColor") + ")",
    );
  } else {
    $("#title-color").colorpicker("setValue", "rgba(0,152,219,0.9)"); // cerulean
  }
  if (getUrlParameter("title")) {
    titleInput.value = getUrlParameter("title");
  } else {
    titleInput.value = DEFAULTS.title;
  }
  if (getUrlParameter("background")) {
    document.querySelector("#background-url").value =
      getUrlParameter("background");
    loadImage(null, getUrlParameter("background"), function (img) {
      bgImage = img;
    });
  } else {
    document.querySelector("#background-url").value = DEFAULTS.background;
    loadImage(null, DEFAULTS.background, function (img) {
      bgImage = img;
    });
  }
  if (getUrlParameter("logo")) {
    document.querySelector("#logo-url").value = getUrlParameter("logo");
    loadImage(null, getUrlParameter("logo"), function (img) {
      logoImage = img;
    });
  } else {
    document.querySelector("#logo-url").value = DEFAULTS.logo;
    loadImage(null, DEFAULTS.logo, function (img) {
      logoImage = img;
    });
  }

  M.updateTextFields(); // float labels for any prefilled inputs

  draw();

  // Download — filename derived from the title (Title_group-thumbnail.png)
  document
    .querySelector("#download-image")
    .addEventListener("click", function (e) {
      try {
        this.href = groupCanvas.toDataURL("image/png");
        this.download = downloadName("group-thumbnail");
      } catch (err) {
        // A cross-origin background/logo without CORS headers taints the
        // canvas and blocks export. Tell the user how to recover.
        e.preventDefault();
        toast(
          "Couldn't export the image. If you set a background or logo by URL, upload the file instead.",
        );
      }
    });

  // Copy a shareable link that reproduces the current text/color (and any
  // image URLs — uploaded files can't travel in a URL).
  var copyBtn = document.querySelector("#copy-link");
  if (copyBtn) {
    copyBtn.addEventListener("click", function () {
      var url = buildShareUrl();
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(url).then(
          function () {
            toast("Shareable link copied to clipboard.");
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

  // Reset everything back to brand defaults
  var resetBtn = document.querySelector("#reset");
  if (resetBtn) {
    resetBtn.addEventListener("click", function () {
      titleInput.value = "";
      $("#title-color").colorpicker("setValue", "rgba(0,152,219,0.9)");
      document.querySelector("#background").value = "";
      document.querySelector("#background-url").value = "";
      document.querySelector("#logo").value = "";
      document.querySelector("#logo-url").value = "";
      document.querySelectorAll(".file-path").forEach(function (i) {
        i.value = "";
      });
      bgImage = null;
      logoImage = null;
      M.updateTextFields();
      draw();
    });
  }
});

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

// Apply a #rrggbb hex to a picker, preserving its current alpha.
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

// Build "Title_group-thumbnail.png" style filename from the current title.
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

  var bgUrl = document.querySelector("#background-url").value;
  if (bgUrl) params.set("background", bgUrl);
  var logoUrl = document.querySelector("#logo-url").value;
  if (logoUrl) params.set("logo", logoUrl);
  if (logoScale !== 1) params.set("logoScale", logoScale);
  if (logoStroke !== 0) params.set("logoStroke", logoStroke);

  return location.origin + location.pathname + "?" + params.toString();
}

// Normalize a colorpicker value ("rgba(0, 152, 219, 0.9)" or "#0098db")
// into the "r,g,b[,a]" form the query params expect.
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

function getUrlParameter(name) {
  name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
  var regex = new RegExp("[\\?&]" + name + "=([^&#]*)");
  var results = regex.exec(location.search);
  return results === null
    ? false
    : decodeURIComponent(results[1].replace(/\+/g, " "));
}
