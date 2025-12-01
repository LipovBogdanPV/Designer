// plugins/design/js/inspector.shadows.js
(function () {
  const $ = (sel, root = document) => root.querySelector(sel);

  function init(api, root = document) {
    if (!api) return;

    const c = {
      enable: $("#shadowsEnable", root),
      body: $("#shadowsBody", root),

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

    const upd = (fn) => api.updateSelected(fn);

    function toggleBody(on) {
      if (!c.body) return;
      c.body.style.opacity = on ? "1" : "0.4";
      c.body.style.pointerEvents = on ? "auto" : "none";
    }

    // ===== синхронізація при виборі блоку =====
    api.subscribeSelection((b) => {
      if (!b) return;
      const s = b.style || {};
      const sh = s.shadow || {};
      const ins = sh.inset || {};

      const enabled = !!s.shadowsOn;
      if (c.enable) c.enable.checked = enabled;
      toggleBody(enabled);

      if (c.shX) c.shX.value = sh.x ?? 0;
      if (c.shY) c.shY.value = sh.y ?? 0;
      if (c.shBlur) c.shBlur.value = sh.blur ?? 0;
      if (c.shSpread) c.shSpread.value = sh.spread ?? 0;
      if (c.shColor) c.shColor.value = sh.color || "#000000";
      if (c.shAlpha) c.shAlpha.value = sh.alpha ?? 0;

      if (c.inX) c.inX.value = ins.x ?? 0;
      if (c.inY) c.inY.value = ins.y ?? 0;
      if (c.inBlur) c.inBlur.value = ins.blur ?? 0;
      if (c.inSpread) c.inSpread.value = ins.spread ?? 0;
      if (c.inColor) c.inColor.value = ins.color || "#000000";
      if (c.inAlpha) c.inAlpha.value = ins.alpha ?? 0;
    });

    // ===== логіка керування =====

    // Увімк/вимкнути тіні
    c.enable &&
      c.enable.addEventListener("change", () => {
        const on = c.enable.checked;
        upd((b) => {
          b.style = b.style || {};
          b.style.shadowsOn = on;
        });
        toggleBody(on);
      });

    // Зовнішня тінь: позиція
    c.shX &&
      c.shX.addEventListener("input", () => {
        const v = +c.shX.value || 0;
        upd((b) => {
          b.style = b.style || {};
          b.style.shadow = b.style.shadow || {};
          b.style.shadow.x = v;
        });
      });

    c.shY &&
      c.shY.addEventListener("input", () => {
        const v = +c.shY.value || 0;
        upd((b) => {
          b.style = b.style || {};
          b.style.shadow = b.style.shadow || {};
          b.style.shadow.y = v;
        });
      });

    // Зовнішня тінь: blur / spread
    c.shBlur &&
      c.shBlur.addEventListener("input", () => {
        const v = +c.shBlur.value || 0;
        upd((b) => {
          b.style = b.style || {};
          b.style.shadow = b.style.shadow || {};
          b.style.shadow.blur = v;
        });
      });

    c.shSpread &&
      c.shSpread.addEventListener("input", () => {
        const v = +c.shSpread.value || 0;
        upd((b) => {
          b.style = b.style || {};
          b.style.shadow = b.style.shadow || {};
          b.style.shadow.spread = v;
        });
      });

    // Зовнішня тінь: колір / альфа
    c.shColor &&
      c.shColor.addEventListener("input", () => {
        const v = c.shColor.value;
        upd((b) => {
          b.style = b.style || {};
          b.style.shadow = b.style.shadow || {};
          b.style.shadow.color = v;
        });
      });

    c.shAlpha &&
      c.shAlpha.addEventListener("input", () => {
        const v = +c.shAlpha.value || 0;
        upd((b) => {
          b.style = b.style || {};
          b.style.shadow = b.style.shadow || {};
          b.style.shadow.alpha = v;
        });
      });

    // Внутрішня тінь: позиція
    c.inX &&
      c.inX.addEventListener("input", () => {
        const v = +c.inX.value || 0;
        upd((b) => {
          b.style = b.style || {};
          b.style.shadow = b.style.shadow || {};
          b.style.shadow.inset = b.style.shadow.inset || {};
          b.style.shadow.inset.x = v;
        });
      });

    c.inY &&
      c.inY.addEventListener("input", () => {
        const v = +c.inY.value || 0;
        upd((b) => {
          b.style = b.style || {};
          b.style.shadow = b.style.shadow || {};
          b.style.shadow.inset = b.style.shadow.inset || {};
          b.style.shadow.inset.y = v;
        });
      });

    // Внутрішня тінь: blur / spread
    c.inBlur &&
      c.inBlur.addEventListener("input", () => {
        const v = +c.inBlur.value || 0;
        upd((b) => {
          b.style = b.style || {};
          b.style.shadow = b.style.shadow || {};
          b.style.shadow.inset = b.style.shadow.inset || {};
          b.style.shadow.inset.blur = v;
        });
      });

    c.inSpread &&
      c.inSpread.addEventListener("input", () => {
        const v = +c.inSpread.value || 0;
        upd((b) => {
          b.style = b.style || {};
          b.style.shadow = b.style.shadow || {};
          b.style.shadow.inset = b.style.shadow.inset || {};
          b.style.shadow.inset.spread = v;
        });
      });

    // Внутрішня тінь: колір / альфа
    c.inColor &&
      c.inColor.addEventListener("input", () => {
        const v = c.inColor.value;
        upd((b) => {
          b.style = b.style || {};
          b.style.shadow = b.style.shadow || {};
          b.style.shadow.inset = b.style.shadow.inset || {};
          b.style.shadow.inset.color = v;
        });
      });

    c.inAlpha &&
      c.inAlpha.addEventListener("input", () => {
        const v = +c.inAlpha.value || 0;
        upd((b) => {
          b.style = b.style || {};
          b.style.shadow = b.style.shadow || {};
          b.style.shadow.inset = b.style.shadow.inset || {};
          b.style.shadow.inset.alpha = v;
        });
      });
  }

  window.STInspectorShadows = { init };
})();
