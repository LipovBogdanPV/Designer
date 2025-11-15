// plugins/design/js/inspector.bg.js
(function () {
  const $ = (sel, root = document) => root.querySelector(sel);

  function init(api, root = document) {
    if (!api) return;

    const controls = {
      type: $("#bgType", root),
      color: $("#bgColor", root),
      alpha: $("#bgAlpha", root),
      gA: $("#gA", root),
      gAalpha: $("#gAalpha", root),
      gB: $("#gB", root),
      gBalpha: $("#gBalpha", root),
      gAngle: $("#gAngle", root),
      url: $("#bgUrl", root),
      size: $("#bgSize", root),
      pos: $("#bgPos", root),
      overlayColor: $("#bgOverlayColor", root),
      overlayAlpha: $("#bgOverlayAlpha", root),
      gray: $("#bgGray", root),
    };

    const boxColor = $("#bgColorRows", root);
    const boxGrad = $("#bgGradRows", root);
    const boxImg = $("#bgImgRows", root);

    const switchTypeUI = (bg) => {
      if (!boxColor || !boxGrad || !boxImg) return;
      boxColor.style.display = bg.type === "color" ? "block" : "none";
      boxGrad.style.display = bg.type === "gradient" ? "block" : "none";
      boxImg.style.display = bg.type === "image" ? "block" : "none";
    };

    api.subscribeSelection((b) => {
      if (!b) return;
      const bg = b.style.bg;
      controls.type && (controls.type.value = bg.type);
      controls.color && (controls.color.value = bg.color || "#000000");
      controls.alpha && (controls.alpha.value = bg.alpha ?? 1);
      controls.gA && (controls.gA.value = bg.gA || "#000000");
      controls.gAalpha && (controls.gAalpha.value = bg.gAalpha ?? 1);
      controls.gB && (controls.gB.value = bg.gB || "#000000");
      controls.gBalpha && (controls.gBalpha.value = bg.gBalpha ?? 1);
      controls.gAngle && (controls.gAngle.value = bg.angle ?? 135);
      controls.url && (controls.url.value = bg.url || "");
      controls.size && (controls.size.value = bg.size || "cover");
      controls.pos && (controls.pos.value = bg.pos || "center");
      controls.overlayColor &&
        (controls.overlayColor.value = bg.overlayColor || "#000000");
      controls.overlayAlpha &&
        (controls.overlayAlpha.value = bg.overlayAlpha ?? 0.35);
      controls.gray && (controls.gray.value = bg.gray ?? 0);
      switchTypeUI(bg);
    });

    const upd = (fn) => api.updateSelected(fn);

    controls.type &&
      controls.type.addEventListener("change", () => {
        const v = controls.type.value;
        upd((b) => {
          b.style.bg.type = v;
        });
      });

    controls.color &&
      controls.color.addEventListener("input", () => {
        const v = controls.color.value;
        upd((b) => {
          b.style.bg.color = v;
        });
      });
    controls.alpha &&
      controls.alpha.addEventListener("input", () => {
        const v = parseFloat(controls.alpha.value || "1");
        upd((b) => {
          b.style.bg.alpha = v;
        });
      });

    controls.gA &&
      controls.gA.addEventListener("input", () => {
        const v = controls.gA.value;
        upd((b) => {
          b.style.bg.gA = v;
        });
      });
    controls.gAalpha &&
      controls.gAalpha.addEventListener("input", () => {
        const v = parseFloat(controls.gAalpha.value || "1");
        upd((b) => {
          b.style.bg.gAalpha = v;
        });
      });
    controls.gB &&
      controls.gB.addEventListener("input", () => {
        const v = controls.gB.value;
        upd((b) => {
          b.style.bg.gB = v;
        });
      });
    controls.gBalpha &&
      controls.gBalpha.addEventListener("input", () => {
        const v = parseFloat(controls.gBalpha.value || "1");
        upd((b) => {
          b.style.bg.gBalpha = v;
        });
      });
    controls.gAngle &&
      controls.gAngle.addEventListener("input", () => {
        const v = +controls.gAngle.value || 0;
        upd((b) => {
          b.style.bg.angle = v;
        });
      });

    controls.url &&
      controls.url.addEventListener("change", () => {
        const v = controls.url.value.trim();
        upd((b) => {
          b.style.bg.url = v;
        });
      });
    controls.size &&
      controls.size.addEventListener("change", () => {
        const v = controls.size.value;
        upd((b) => {
          b.style.bg.size = v;
        });
      });
    controls.pos &&
      controls.pos.addEventListener("change", () => {
        const v = controls.pos.value;
        upd((b) => {
          b.style.bg.pos = v;
        });
      });
    controls.overlayColor &&
      controls.overlayColor.addEventListener("input", () => {
        const v = controls.overlayColor.value;
        upd((b) => {
          b.style.bg.overlayColor = v;
        });
      });
    controls.overlayAlpha &&
      controls.overlayAlpha.addEventListener("input", () => {
        const v = parseFloat(controls.overlayAlpha.value || "0");
        upd((b) => {
          b.style.bg.overlayAlpha = v;
        });
      });
    controls.gray &&
      controls.gray.addEventListener("input", () => {
        const v = parseFloat(controls.gray.value || "0");
        upd((b) => {
          b.style.bg.gray = v;
        });
      });
  }

  window.STInspectorBg = { init };
})();
