// plugins/design/js/inspector.border.js
(function () {
  const $ = (sel, root = document) => root.querySelector(sel);

  function init(api, root = document) {
    if (!api) return;

    const c = {
      enable: $("#cornersEnable", root),
      body: $("#cornersBody", root),

      radiusMode: $("#radiusMode", root),
      rAll: $("#rAllVal", root),
      rTL: $("#rTL", root),
      rTR: $("#rTR", root),
      rBL: $("#rBL", root),
      rBR: $("#rBR", root),
      rD1A: $("#rD1A", root),
      rD1B: $("#rD1B", root),
      rD2A: $("#rD2A", root),
      rD2B: $("#rD2B", root),

      bWidth: $("#bWidth", root),
      bStyle: $("#bStyle", root),
      bColor: $("#bColor", root),
      bAlpha: $("#bAlpha", root),
      bBlur: $("#bBlur", root),
    };

    const radiusBlocks = {
      all: $("#rAll", root),
      per: $("#rPer", root),
      diag1: $("#rDiag1", root),
      diag2: $("#rDiag2", root),
    };

    const upd = (fn) => api.updateSelected(fn);

    function setRadiusModeUI(mode) {
      Object.entries(radiusBlocks).forEach(([key, el]) => {
        if (!el) return;
        el.style.display = key === mode ? "block" : "none";
      });
    }

    function toggleBody(on) {
      if (!c.body) return;
      c.body.style.opacity = on ? "1" : "0.4";
      c.body.style.pointerEvents = on ? "auto" : "none";
    }

    // ===== СИНХРОНІЗАЦІЯ ПРИ ВИБОРІ БЛОКУ =====
    api.subscribeSelection((b) => {
      if (!b) return;
      const s = b.style || {};
      const r = s.radius || {};
      const br = s.border || {};

      const enabled = !!s.cornersOn;
      if (c.enable) c.enable.checked = enabled;
      toggleBody(enabled);

      const mode = r.mode || "all";
      if (c.radiusMode) c.radiusMode.value = mode;
      setRadiusModeUI(mode);

      if (c.rAll) c.rAll.value = r.all ?? 0;
      if (c.rTL) c.rTL.value = r.tl ?? 0;
      if (c.rTR) c.rTR.value = r.tr ?? 0;
      if (c.rBL) c.rBL.value = r.bl ?? 0;
      if (c.rBR) c.rBR.value = r.br ?? 0;
      if (c.rD1A) c.rD1A.value = r.d1a ?? 0;
      if (c.rD1B) c.rD1B.value = r.d1b ?? 0;
      if (c.rD2A) c.rD2A.value = r.d2a ?? 0;
      if (c.rD2B) c.rD2B.value = r.d2b ?? 0;

      if (c.bWidth) c.bWidth.value = br.width ?? 0;
      if (c.bStyle) c.bStyle.value = br.style || "solid";
      if (c.bColor) c.bColor.value = br.color || "#ffffff";
      if (c.bAlpha) c.bAlpha.value = br.alpha ?? 1;
      if (c.bBlur) c.bBlur.value = br.soft ?? 0;
    });

    // ===== ЛОГІКА КЕРУВАННЯ =====

    // 🔘 Увімк / вимкнути кути та бордер
    if (c.enable) {
      c.enable.addEventListener("change", () => {
        const on = c.enable.checked;

        upd((b) => {
          b.style = b.style || {};
          b.style.cornersOn = on;

          // Якщо вимкнули — повністю скидаємо кути / бордер / тіні
          if (!on) {
            b.style.radius = {
              mode: "all",
              all: 0,
              tl: 0,
              tr: 0,
              bl: 0,
              br: 0,
              d1a: 0,
              d1b: 0,
              d2a: 0,
              d2b: 0,
            };

            b.style.border = {
              width: 0,
              style: "solid",
              color: "#334155",
              alpha: 1,
              soft: 0,
            };

            b.style.shadow = {
              x: 0,
              y: 0,
              blur: 0,
              spread: 0,
              color: "#000000",
              alpha: 0,
              inset: {
                x: 0,
                y: 0,
                blur: 0,
                spread: 0,
                color: "#000000",
                alpha: 0,
              },
            };
          }
        });

        toggleBody(on);
      });
    }

    // Режим радіусів
    c.radiusMode &&
      c.radiusMode.addEventListener("change", () => {
        const mode = c.radiusMode.value;
        setRadiusModeUI(mode);
        upd((b) => {
          b.style = b.style || {};
          b.style.cornersOn = true; // якщо юзер лізе в радіуси — автоматично вмикаємо
          b.style.radius = b.style.radius || {};
          b.style.radius.mode = mode;
        });
      });

    // Один радіус для всіх
    c.rAll &&
      c.rAll.addEventListener("input", () => {
        const v = +c.rAll.value || 0;
        upd((b) => {
          b.style = b.style || {};
          b.style.cornersOn = true;
          const r = (b.style.radius = b.style.radius || {});
          r.mode = r.mode || "all";
          r.all = v;
        });
      });

    // Окремі кути
    ["rTL", "rTR", "rBL", "rBR"].forEach((id) => {
      const el = c[id];
      if (!el) return;
      el.addEventListener("input", () => {
        upd((b) => {
          b.style = b.style || {};
          b.style.cornersOn = true;
          const r = (b.style.radius = b.style.radius || {});
          r.mode = "per";
          r.tl = +c.rTL.value || 0;
          r.tr = +c.rTR.value || 0;
          r.bl = +c.rBL.value || 0;
          r.br = +c.rBR.value || 0;
        });
      });
    });

    // Діагоналі
    c.rD1A &&
      c.rD1A.addEventListener("input", () => {
        const v = +c.rD1A.value || 0;
        upd((b) => {
          b.style = b.style || {};
          b.style.cornersOn = true;
          const r = (b.style.radius = b.style.radius || {});
          r.mode = "diag1";
          r.d1a = v;
        });
      });

    c.rD1B &&
      c.rD1B.addEventListener("input", () => {
        const v = +c.rD1B.value || 0;
        upd((b) => {
          b.style = b.style || {};
          b.style.cornersOn = true;
          const r = (b.style.radius = b.style.radius || {});
          r.mode = "diag1";
          r.d1b = v;
        });
      });

    c.rD2A &&
      c.rD2A.addEventListener("input", () => {
        const v = +c.rD2A.value || 0;
        upd((b) => {
          b.style = b.style || {};
          b.style.cornersOn = true;
          const r = (b.style.radius = b.style.radius || {});
          r.mode = "diag2";
          r.d2a = v;
        });
      });

    c.rD2B &&
      c.rD2B.addEventListener("input", () => {
        const v = +c.rD2B.value || 0;
        upd((b) => {
          b.style = b.style || {};
          b.style.cornersOn = true;
          const r = (b.style.radius = b.style.radius || {});
          r.mode = "diag2";
          r.d2b = v;
        });
      });

    // Бордер
    c.bWidth &&
      c.bWidth.addEventListener("input", () => {
        const w = +c.bWidth.value || 0;
        upd((b) => {
          b.style = b.style || {};
          b.style.cornersOn = true;
          b.style.border = b.style.border || {};
          b.style.border.width = w;
        });
      });

    c.bStyle &&
      c.bStyle.addEventListener("change", () => {
        const v = c.bStyle.value;
        upd((b) => {
          b.style = b.style || {};
          b.style.cornersOn = true;
          b.style.border = b.style.border || {};
          b.style.border.style = v;
        });
      });

    c.bColor &&
      c.bColor.addEventListener("input", () => {
        const v = c.bColor.value;
        upd((b) => {
          b.style = b.style || {};
          b.style.cornersOn = true;
          b.style.border = b.style.border || {};
          b.style.border.color = v;
        });
      });

    c.bAlpha &&
      c.bAlpha.addEventListener("input", () => {
        const v = +c.bAlpha.value || 0;
        upd((b) => {
          b.style = b.style || {};
          b.style.cornersOn = true;
          b.style.border = b.style.border || {};
          b.style.border.alpha = v;
        });
      });

    c.bBlur &&
      c.bBlur.addEventListener("input", () => {
        const v = +c.bBlur.value || 0;
        upd((b) => {
          b.style = b.style || {};
          b.style.cornersOn = true;
          b.style.border = b.style.border || {};
          b.style.border.soft = v;
        });
      });
  }

  window.STInspectorBorder = { init };
})();
