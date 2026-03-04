var groupCanvas = document.querySelector("#group-canvas");
if (!groupCanvas) throw new Error("groupCanvas.js loaded on a page without #group-canvas");
groupCanvas.height = 400;
groupCanvas.width = 400;

var ctx = groupCanvas.getContext("2d");

// Title bar component
var titleComponent = {
  properties: {
    text: function () {
      return document.querySelector("#title").value;
    },
    bgColor: function () {
      return $("#title-color").colorpicker("getValue");
    },
  },
  draw: function () {
    this._bg();
    this._text();
  },
  _bg: function () {
    ctx.fillStyle = this.properties.bgColor();
    ctx.fillRect(0, 320, 400, 80);
  },
  _text: function () {
    ctx.fillStyle = "rgba(255, 255, 255, 1)";
    ctx.font = "28px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "top";

    ctx.shadowColor = "black";
    ctx.shadowBlur = 10;
    ctx.shadowOffsetX = 3;
    ctx.shadowOffsetY = 3;

    wrapText(ctx, this.properties.text(), 200, 338, 380, 33);

    ctx.shadowColor = "transparent";
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
  },
};

// Background image component
var backgroundComponent = {
  properties: {
    domId: "#background",
  },
  draw: function () {
    this._addImage();
  },
  _addImage: function () {
    var file = document.querySelector(this.properties.domId).files[0];
    var background = new Image();
    background.crossOrigin = "Anonymous";
    var reader = new FileReader();

    background.onload = function () {
      const srcWidth = background.width;
      const srcHeight = background.height;
      const srcAspect = srcWidth / srcHeight;

      let cropWidth = srcWidth;
      let cropHeight = srcHeight;
      let cropX = 0;
      let cropY = 0;

      if (srcAspect > 1) {
        // Image is too wide — crop sides
        cropWidth = srcHeight;
        cropX = (srcWidth - cropWidth) / 2;
      } else if (srcAspect < 1) {
        // Image is too tall — crop top/bottom
        cropHeight = srcWidth;
        cropY = (srcHeight - cropHeight) / 2;
      }

      ctx.globalCompositeOperation = "destination-over";
      ctx.drawImage(background, cropX, cropY, cropWidth, cropHeight, 0, 0, 400, 400);
      ctx.globalCompositeOperation = "source-over";
    };

    if (file) {
      reader.addEventListener(
        "load",
        function () {
          background.src = reader.result;
        },
        false
      );
      reader.readAsDataURL(file);
    }

    if (!file && document.querySelector("#background-url").value !== "") {
      background.src = document.querySelector("#background-url").value;
    }
  },
};

// Logo component
var logoComponent = {
  properties: {
    domId: "#logo",
  },
  draw: function () {
    this._addImage();
  },
  _addImage: function () {
    var file = document.querySelector(this.properties.domId).files[0];
    var background = new Image();
    background.crossOrigin = "Anonymous";
    var reader = new FileReader();

    background.onload = function () {
      const srcWidth = background.width;
      const srcHeight = background.height;
      const srcAspect = srcWidth / srcHeight;

      let cropWidth = srcWidth;
      let cropHeight = srcHeight;
      let cropX = 0;
      let cropY = 0;

      if (srcAspect > 1) {
        cropWidth = srcHeight;
        cropX = (srcWidth - cropWidth) / 2;
      } else if (srcAspect < 1) {
        cropHeight = srcWidth;
        cropY = (srcHeight - cropHeight) / 2;
      }

      ctx.shadowColor = "black";
      ctx.shadowBlur = 5;
      ctx.shadowOffsetX = 3;
      ctx.shadowOffsetY = 3;

      ctx.drawImage(background, cropX, cropY, cropWidth, cropHeight, 5, 5, 120, 120);

      ctx.shadowColor = "transparent";
      ctx.shadowBlur = 0;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;
    };

    if (file) {
      reader.addEventListener(
        "load",
        function () {
          background.src = reader.result;
        },
        false
      );
      reader.readAsDataURL(file);
    }

    if (!file && document.querySelector("#logo-url").value !== "") {
      background.src = document.querySelector("#logo-url").value;
    }
  },
};

function wrapText(context, text, x, y, maxWidth, lineHeight) {
  var words = text.split(" ");
  var line = "";

  for (var n = 0; n < words.length; n++) {
    var testLine = line + words[n] + " ";
    var metrics = context.measureText(testLine);
    if (metrics.width > maxWidth && n > 0) {
      context.fillText(line, x, y);
      line = words[n] + " ";
      y += lineHeight;
    } else {
      line = testLine;
    }
  }
  context.fillText(line, x, y);
}

function draw() {
  ctx.clearRect(0, 0, groupCanvas.width, groupCanvas.height);
  titleComponent.draw();
  backgroundComponent.draw();
  logoComponent.draw();

  document.getElementById("canvas-status").textContent =
    "Thumbnail updated " + new Date().toLocaleTimeString();
}

document.addEventListener("DOMContentLoaded", function () {
  $("#title-color")
    .colorpicker({
      component: ".btn",
    })
    .on("changeColor", draw);

  document.querySelector("#title").addEventListener("keyup", draw);
  document.querySelector("#background").addEventListener("change", draw);
  document.querySelector("#logo").addEventListener("change", draw);

  // Query param support
  if (getUrlParameter("titleColor")) {
    $("#title-color").colorpicker(
      "setValue",
      "rgba(" + getUrlParameter("titleColor") + ")"
    );
  }
  if (getUrlParameter("title")) {
    $("#title").val(getUrlParameter("title"));
  }
  if (getUrlParameter("background")) {
    $("#background-url").val(getUrlParameter("background"));
  }
  if (getUrlParameter("logo")) {
    $("#logo-url").val(getUrlParameter("logo"));
  }

  draw();

  document
    .querySelector("#download-image")
    .addEventListener("click", function () {
      var img = document.createElement("img");
      img.src = groupCanvas.toDataURL();
      var a = document.createElement("a");
      a.href = img.src;
      a.download = "group-thumbnail.png";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    });
});

function getUrlParameter(name) {
  name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
  var regex = new RegExp("[\\?&]" + name + "=([^&#]*)");
  var results = regex.exec(location.search);
  return results === null
    ? false
    : decodeURIComponent(results[1].replace(/\+/g, " "));
}
