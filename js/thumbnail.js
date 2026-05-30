// Shared thumbnail drawing, used by BOTH the live builders (editCanvas.js,
// groupCanvas.js) and the template preview cards in the rail — so the
// previews render dynamically from the same code and always match output.
//
// Exposes window.Thumb.paintItem(ctx, cfg) and window.Thumb.paintGroup(ctx, cfg)
// where cfg = { title, titleColor, category, categoryColor, bgImage, logoImage }
// (bgImage/logoImage are already-loaded Image objects, or null).
(function () {
  "use strict";

  function setShadow(ctx) {
    ctx.shadowColor = "black";
    ctx.shadowBlur = 10;
    ctx.shadowOffsetX = 3;
    ctx.shadowOffsetY = 3;
  }

  function clearShadow(ctx) {
    ctx.shadowColor = "transparent";
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
  }

  // Center-crop a source image to a target aspect ratio (width / height).
  function coverCrop(img, aspectTarget) {
    var sw = img.width;
    var sh = img.height;
    var sa = sw / sh;
    var w = sw;
    var h = sh;
    var x = 0;
    var y = 0;
    if (sa > aspectTarget) {
      w = sh * aspectTarget;
      x = (sw - w) / 2;
    } else if (sa < aspectTarget) {
      h = sw / aspectTarget;
      y = (sh - h) / 2;
    }
    return { x: x, y: y, w: w, h: h };
  }

  // Wrap text to maxWidth, hard-breaking any single word that is itself
  // wider than maxWidth (so long unbroken strings can't overflow sideways).
  function wrapLines(context, text, maxWidth) {
    var lines = [];
    var words = text.split(/\s+/).filter(Boolean);
    var line = "";
    for (var i = 0; i < words.length; i++) {
      var word = words[i];
      while (context.measureText(word).width > maxWidth && word.length > 1) {
        var k = 1;
        while (
          k < word.length &&
          context.measureText(word.slice(0, k + 1)).width <= maxWidth
        ) {
          k++;
        }
        if (line) {
          lines.push(line);
          line = "";
        }
        lines.push(word.slice(0, k));
        word = word.slice(k);
      }
      var test = line ? line + " " + word : word;
      if (context.measureText(test).width > maxWidth && line) {
        lines.push(line);
        line = word;
      } else {
        line = test;
      }
    }
    if (line) lines.push(line);
    return lines;
  }

  // Largest font size (<= baseSize) whose wrapped lines fit the box.
  function fitText(context, text, maxWidth, maxHeight, baseSize, family) {
    for (var size = baseSize; size >= 12; size -= 2) {
      context.font = size + "px " + family;
      var lines = wrapLines(context, text, maxWidth);
      var lineHeight = Math.round(size * 1.15);
      if (lines.length * lineHeight <= maxHeight) {
        return { size: size, lines: lines, lineHeight: lineHeight };
      }
    }
    context.font = "12px " + family;
    return {
      size: 12,
      lines: wrapLines(context, text, maxWidth),
      lineHeight: 14,
    };
  }

  // Color block + centered, auto-fit white title. geom describes the bar
  // rectangle and the text box (so item and group can share this).
  function drawTitle(ctx, text, color, geom) {
    ctx.fillStyle = color;
    ctx.fillRect(geom.rectX, geom.rectY, geom.rectW, geom.rectH);
    if (!text) return;
    ctx.fillStyle = "rgba(255, 255, 255, 1)";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    setShadow(ctx);
    var fit = fitText(
      ctx,
      text,
      geom.maxWidth,
      geom.height - geom.padBottom,
      geom.base,
      "sans-serif",
    );
    ctx.font = fit.size + "px sans-serif";
    var totalH = fit.lines.length * fit.lineHeight;
    var startY = geom.top + (geom.height - totalH) / 2 + fit.lineHeight / 2;
    for (var i = 0; i < fit.lines.length; i++) {
      ctx.fillText(fit.lines[i], geom.x, startY + i * fit.lineHeight);
    }
    clearShadow(ctx);
  }

  // Item-only vertical sidebar with rotated, centered category text.
  function drawSidebar(ctx, text, color) {
    ctx.fillStyle = color;
    ctx.fillRect(500, 0, 150, 400);
    if (!text) return;
    ctx.save();
    // Pivot at the sidebar's center (x 550, y 200); "middle" baseline so the
    // rotated text is centered across the bar's width.
    ctx.translate(550, 200);
    ctx.rotate(-0.5 * Math.PI);
    ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    var size = 48;
    while (size > 16) {
      ctx.font = size + "px sans-serif";
      if (ctx.measureText(text).width <= 360) break;
      size -= 2;
    }
    ctx.font = size + "px sans-serif";
    setShadow(ctx);
    ctx.fillText(text, 0, 0);
    ctx.restore();
    clearShadow(ctx);
  }

  function drawBackground(ctx, img, aspect, W, H) {
    if (!img) return;
    var c = coverCrop(img, aspect);
    ctx.globalCompositeOperation = "destination-over";
    ctx.drawImage(img, c.x, c.y, c.w, c.h, 0, 0, W, H);
    ctx.globalCompositeOperation = "source-over";
  }

  // Fit the whole logo inside a box (no cropping), anchored top-left, with a
  // soft dark halo so the mark stays legible on any background without a
  // visible plate. Drawn twice to give the halo a little more presence.
  function drawLogo(ctx, img, box) {
    if (!img) return;
    var scale = Math.min(box / img.width, box / img.height);
    var w = img.width * scale;
    var h = img.height * scale;
    ctx.save();
    ctx.shadowColor = "rgba(0, 0, 0, 0.6)";
    ctx.shadowBlur = 5;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    ctx.drawImage(img, 8, 8, w, h);
    ctx.drawImage(img, 8, 8, w, h);
    ctx.restore();
  }

  var ITEM_TITLE = {
    rectX: 0,
    rectY: 300,
    rectW: 500,
    rectH: 120,
    x: 250,
    top: 300,
    height: 100,
    maxWidth: 460,
    base: 30,
    padBottom: 12,
  };
  var GROUP_TITLE = {
    rectX: 0,
    rectY: 320,
    rectW: 400,
    rectH: 80,
    x: 200,
    top: 320,
    height: 80,
    maxWidth: 370,
    base: 28,
    padBottom: 10,
  };

  function paintItem(ctx, cfg) {
    ctx.clearRect(0, 0, 600, 400);
    drawTitle(ctx, cfg.title || "", cfg.titleColor, ITEM_TITLE);
    drawSidebar(ctx, cfg.category || "", cfg.categoryColor);
    drawBackground(ctx, cfg.bgImage, 1.5, 600, 400);
    drawLogo(ctx, cfg.logoImage, 120 * (cfg.logoScale || 1));
  }

  function paintGroup(ctx, cfg) {
    ctx.clearRect(0, 0, 400, 400);
    drawTitle(ctx, cfg.title || "", cfg.titleColor, GROUP_TITLE);
    drawBackground(ctx, cfg.bgImage, 1, 400, 400);
    drawLogo(ctx, cfg.logoImage, 100 * (cfg.logoScale || 1));
  }

  // ---- Template preview cards (rendered from each card's own link) ----

  // Plain image load (no crossOrigin): previews are never exported, so a
  // tainted canvas is fine, and this also loads over file:// without CORS.
  function loadImage(url) {
    return new Promise(function (resolve) {
      if (!url) return resolve(null);
      var img = new Image();
      img.onload = function () {
        resolve(img);
      };
      img.onerror = function () {
        resolve(null);
      };
      img.src = url;
    });
  }

  // Build a draw config from a template card's "Use this template" link.
  function cfgFromHref(href) {
    var p = new URLSearchParams((href || "").split("?")[1] || "");
    return {
      isGroup: /group\.html/i.test(href),
      background: p.get("background"),
      logo: p.get("logo"),
      title: p.get("title") || "",
      titleColor: p.get("titleColor")
        ? "rgba(" + p.get("titleColor") + ")"
        : "rgba(0,152,219,0.9)",
      categoryColor: p.get("sidebarColor")
        ? "rgba(" + p.get("sidebarColor") + ")"
        : "rgba(255,160,47,0.9)",
      category: p.get("category") || "Dashboard",
      logoScale: parseFloat(p.get("logoScale")) || 1,
    };
  }

  function renderPreview(canvas, cfg) {
    var ctx = canvas.getContext("2d");
    Promise.all([loadImage(cfg.background), loadImage(cfg.logo)]).then(
      function (imgs) {
        cfg.bgImage = imgs[0];
        cfg.logoImage = imgs[1];
        if (cfg.isGroup) paintGroup(ctx, cfg);
        else paintItem(ctx, cfg);
      },
    );
  }

  function renderTemplatePreviews() {
    var cards = document.querySelectorAll(".rail-cards .card");
    Array.prototype.forEach.call(cards, function (card) {
      var canvas = card.querySelector("canvas.tpl-preview");
      var link = card.querySelector(".card-action a");
      if (canvas && link) {
        renderPreview(canvas, cfgFromHref(link.getAttribute("href")));
      }
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", renderTemplatePreviews);
  } else {
    renderTemplatePreviews();
  }

  window.Thumb = { paintItem: paintItem, paintGroup: paintGroup };
})();
