// Shared thumbnail drawing, used by BOTH the live builder (builder.js) and the
// template preview cards in the rail — so the previews render dynamically from
// the same code and always match output.
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

  // Opaque bounding box of a logo's artwork, so transparent padding around the
  // mark (e.g. a logo saved on a square canvas) doesn't shove it off the
  // top-left anchor or shrink it. Cached on the image; falls back to the full
  // frame if the canvas is tainted (e.g. a cross-origin preview over file://).
  function logoBBox(img) {
    if (img._bbox) return img._bbox;
    var full = { x: 0, y: 0, w: img.width, h: img.height };
    var c = document.createElement("canvas");
    c.width = img.width;
    c.height = img.height;
    var cx = c.getContext("2d");
    cx.drawImage(img, 0, 0);
    try {
      var d = cx.getImageData(0, 0, c.width, c.height).data;
      var minX = c.width, minY = c.height, maxX = -1, maxY = -1;
      for (var y = 0; y < c.height; y++) {
        for (var x = 0; x < c.width; x++) {
          if (d[(y * c.width + x) * 4 + 3] > 8) {
            if (x < minX) minX = x;
            if (x > maxX) maxX = x;
            if (y < minY) minY = y;
            if (y > maxY) maxY = y;
          }
        }
      }
      img._bbox =
        maxX >= minX
          ? { x: minX, y: minY, w: maxX - minX + 1, h: maxY - minY + 1 }
          : full;
    } catch (e) {
      img._bbox = full;
    }
    return img._bbox;
  }

  // --- Logo halo -------------------------------------------------------
  // The mark reads on ANY background without a visible plate: a soft dark drop
  // shadow gives depth on light/busy imagery, and a soft white rim lifts it off
  // dark imagery. The rim is built from the mark's OUTER silhouette (internal
  // holes filled first), so a logo with negative space — letter counters, a
  // ring, a seal — shows the background through those gaps instead of a white
  // glow. The crisp mark is stamped exactly once so its anti-aliased edges stay
  // soft. `stroke` (from ?logoStroke=) thickens the white rim for busy imagery.
  //
  // The composited sprite is cached per (logo, box, stroke): draw() runs on
  // every keystroke but the logo art doesn't change, so this stays one blit per
  // frame.
  var logoSpriteCache = {};
  var logoIdSeq = 0;

  function newCanvas(w, h) {
    var c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    return c;
  }

  // White copy of the mark's silhouette with internal holes filled, so a rim
  // built from it only surrounds the outer contour. A hole is a transparent
  // pixel a flood fill from the border can't reach.
  function outerFilled(mark, W, H) {
    var alpha;
    try {
      alpha = mark.getContext("2d").getImageData(0, 0, W, H).data;
    } catch (e) {
      return mark; // tainted (file://): fall back to the mark, holes and all
    }
    var N = W * H;
    var reach = new Uint8Array(N);
    var stack = [];
    function consider(i) {
      if (i < 0 || i >= N || reach[i] || alpha[i * 4 + 3] > 20) return;
      reach[i] = 1;
      stack.push(i);
    }
    var x, y;
    for (x = 0; x < W; x++) {
      consider(x);
      consider((H - 1) * W + x);
    }
    for (y = 0; y < H; y++) {
      consider(y * W);
      consider(y * W + W - 1);
    }
    while (stack.length) {
      var i = stack.pop();
      x = i % W;
      y = (i - x) / W;
      if (x > 0) consider(i - 1);
      if (x < W - 1) consider(i + 1);
      if (y > 0) consider(i - W);
      if (y < H - 1) consider(i + W);
    }
    var out = newCanvas(W, H);
    var octx = out.getContext("2d");
    var od = octx.createImageData(W, H);
    var o = od.data;
    for (var p = 0; p < N; p++) {
      var ma = alpha[p * 4 + 3];
      // Keep the mark's own anti-aliased alpha on the outer edge (so the rim
      // stays smooth, not jagged), and fill enclosed holes solid.
      var a = ma <= 20 && reach[p] === 0 ? 255 : ma;
      if (a > 0) {
        o[p * 4] = 255;
        o[p * 4 + 1] = 255;
        o[p * 4 + 2] = 255;
        o[p * 4 + 3] = a;
      }
    }
    octx.putImageData(od, 0, 0);
    return out;
  }

  // Blurred single-color glow of `src` with NO source pixels (drawn far
  // off-canvas so only its shadow lands), erased inside `clip` so the glow only
  // surrounds the outer contour.
  function glowBand(src, clip, blur, color, offsetY, W, H) {
    var c = newCanvas(W, H);
    var g = c.getContext("2d");
    g.shadowColor = color;
    g.shadowBlur = blur;
    g.shadowOffsetX = W + 400;
    g.shadowOffsetY = offsetY || 0;
    g.drawImage(src, -(W + 400), 0);
    g.shadowColor = "transparent";
    g.globalCompositeOperation = "destination-out";
    g.drawImage(clip, 0, 0);
    return c;
  }

  function buildLogoSprite(img, bb, box, stroke) {
    var scale = Math.min(box / bb.w, box / bb.h);
    var w = Math.max(1, Math.round(bb.w * scale));
    var h = Math.max(1, Math.round(bb.h * scale));
    // A white rim is opt-in (templates set ?logoStroke= for busy backgrounds);
    // there is no default outline.
    var rim = stroke > 0 ? stroke : 0;
    var whiteBlur = 2.5 + rim;
    var darkBlur = 6;
    var pad = Math.ceil(Math.max(rim > 0 ? whiteBlur : 0, darkBlur)) + 4;
    var W = w + pad * 2;
    var H = h + pad * 2;

    var mark = newCanvas(W, H);
    var mctx = mark.getContext("2d");
    mctx.imageSmoothingEnabled = true;
    mctx.imageSmoothingQuality = "high";
    mctx.drawImage(img, bb.x, bb.y, bb.w, bb.h, pad, pad, w, h);
    var filled = outerFilled(mark, W, H);

    var sprite = newCanvas(W, H);
    var s = sprite.getContext("2d");
    // 1. soft dark drop shadow, outside the mark only (always)
    s.globalAlpha = 0.45;
    s.drawImage(glowBand(filled, filled, darkBlur, "rgba(0,0,0,1)", 1, W, H), 0, 0);
    s.globalAlpha = 1;
    // 2. soft white rim, outside the mark only — ONLY when an outline was asked
    // for (two passes for presence)
    if (rim > 0) {
      s.drawImage(glowBand(filled, filled, whiteBlur, "rgba(255,255,255,1)", 0, W, H), 0, 0);
      s.drawImage(glowBand(filled, filled, whiteBlur, "rgba(255,255,255,1)", 0, W, H), 0, 0);
    }
    // 3. crisp mark, stamped once so its AA edges survive
    s.drawImage(mark, 0, 0);

    return { canvas: sprite, pad: pad };
  }

  // Fit the whole logo inside a box (no cropping), anchored near the top-left.
  function drawLogo(ctx, img, box, stroke) {
    if (!img) return;
    if (!img._logoId) img._logoId = ++logoIdSeq;
    var key = img._logoId + "|" + box + "|" + (stroke || 0);
    var sprite = logoSpriteCache[key];
    if (!sprite) {
      sprite = buildLogoSprite(img, logoBBox(img), box, stroke);
      logoSpriteCache[key] = sprite;
    }
    ctx.drawImage(sprite.canvas, 8 - sprite.pad, 8 - sprite.pad);
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
    drawLogo(ctx, cfg.logoImage, 120 * (cfg.logoScale || 1), cfg.logoStroke || 0);
  }

  function paintGroup(ctx, cfg) {
    ctx.clearRect(0, 0, 400, 400);
    drawTitle(ctx, cfg.title || "", cfg.titleColor, GROUP_TITLE);
    drawBackground(ctx, cfg.bgImage, 1, 400, 400);
    drawLogo(ctx, cfg.logoImage, 100 * (cfg.logoScale || 1), cfg.logoStroke || 0);
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
      logoStroke: parseFloat(p.get("logoStroke")) || 0,
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
