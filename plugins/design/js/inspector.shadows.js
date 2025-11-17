// plugins/design/js/inspector.shadows.js
(function () {
  const $ = (sel, root = document) => root.querySelector(sel);

  function init(api, root = document) {
    if (!api) return;

    const c = {
      shX: $("#shX", root),
      shY: $("#shY", root),
      shBlur: $("#shBlur", root),
      shSpread: $("#shSpread", root),
      shColor: $("#shColor", root),
      shAlpha: $("#shAlpha", root),

      inX: $("#inX", root),
      inY: $("#inY", root),
      inBlur: $("#inBlur", root),
      inSpread: $("#inSpread", root),
      inColor: $("#inColor", root),
      inAlpha: $("#inAlpha", root),
    };

    const num = (v, def = 0) => {
      const n = Number(v);
      return Number.isFinite(n) ? n : def;
    };

    // ---- оновлення контролів при зміні вибраного блоку
    api.subscribeSelection((b) => {
      if (!b) return;

      const s = (b.style && b.style.shadow) || {};
      const i = s.inset || {};

      // outer
      c.shX && (c.shX.value = s.x ?? 0);
      c.shY && (c.shY.value = s.y ?? 0);
      c.shBlur && (c.shBlur.value = s.blur ?? 0);
      c.shSpread && (c.shSpread.value = s.spread ?? 0);
      c.shColor && (c.shColor.value = s.color || "#000000");
      c.shAlpha && (c.shAlpha.value = s.alpha ?? 0.25);

      // inner
      c.inX && (c.inX.value = i.x ?? 0);
      c.inY && (c.inY.value = i.y ?? 0);
      c.inBlur && (c.inBlur.value = i.blur ?? 0);
      c.inSpread && (c.inSpread.value = i.spread ?? 0);
      c.inColor && (c.inColor.value = i.color || "#000000");
      c.inAlpha && (c.inAlpha.value = i.alpha ?? 0);
    });

    const upd = (fn) =>
      api.updateSelected((b) => {
        // гарантуємо, що структура існує
        b.style = b.style || {};
        b.style.shadow = b.style.shadow || {
          x: 0,
          y: 8,
          blur: 24,
          spread: 0,
          color: "#000000",
          alpha: 0.25,
          inset: { x: 0, y: 0, blur: 0, spread: 0, color: "#000000", alpha: 0 },
        };
        b.style.shadow.inset = b.style.shadow.inset || {
          x: 0,
          y: 0,
          blur: 0,
          spread: 0,
          color: "#000000",
          alpha: 0,
        };
        fn(b.style.shadow, b.style.shadow.inset);
      });

    // ---- outer events
    c.shX &&
      c.shX.addEventListener("input", () => {
        const v = num(c.shX.value);
        upd((s) => {
          s.x = v;
        });
      });

    c.shY &&
      c.shY.addEventListener("input", () => {
        const v = num(c.shY.value);
        upd((s) => {
          s.y = v;
        });
      });

    c.shBlur &&
      c.shBlur.addEventListener("input", () => {
        const v = num(c.shBlur.value);
        upd((s) => {
          s.blur = v;
        });
      });

    c.shSpread &&
      c.shSpread.addEventListener("input", () => {
        const v = num(c.shSpread.value);
        upd((s) => {
          s.spread = v;
        });
      });

    c.shColor &&
      c.shColor.addEventListener("input", () => {
        const v = c.shColor.value || "#000000";
        upd((s) => {
          s.color = v;
        });
      });

    c.shAlpha &&
      c.shAlpha.addEventListener("input", () => {
        const v = Number(c.shAlpha.value);
        upd((s) => {
          s.alpha = Number.isFinite(v) ? v : 0;
        });
      });

    // ---- inner (inset) events
    c.inX &&
      c.inX.addEventListener("input", () => {
        const v = num(c.inX.value);
        upd((_, i) => {
          i.x = v;
        });
      });

    c.inY &&
      c.inY.addEventListener("input", () => {
        const v = num(c.inY.value);
        upd((_, i) => {
          i.y = v;
        });
      });

    c.inBlur &&
      c.inBlur.addEventListener("input", () => {
        const v = num(c.inBlur.value);
        upd((_, i) => {
          i.blur = v;
        });
      });

    c.inSpread &&
      c.inSpread.addEventListener("input", () => {
        const v = num(c.inSpread.value);
        upd((_, i) => {
          i.spread = v;
        });
      });

    c.inColor &&
      c.inColor.addEventListener("input", () => {
        const v = c.inColor.value || "#000000";
        upd((_, i) => {
          i.color = v;
        });
      });

    c.inAlpha &&
      c.inAlpha.addEventListener("input", () => {
        const v = Number(c.inAlpha.value);
        upd((_, i) => {
          i.alpha = Number.isFinite(v) ? v : 0;
        });
      });

    console.log("[design:shadows] інспектор тіней ініціалізовано");
  }

  window.STInspectorShadows = { init };
})();
