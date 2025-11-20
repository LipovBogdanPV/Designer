// plugins/design/js/inspector.overlay.js
(function () {
  const $ = (sel, root = document) => root.querySelector(sel);

  function init(api, root = document) {
    if (!api) return;

    const controls = {
      topEnable: $("#ovTopEnable", root),
      topColor:  $("#ovTopColor", root),
      topAlpha:  $("#ovTopAlpha", root),
      topH:      $("#ovTopH", root),

      botEnable: $("#ovBotEnable", root),
      botColor:  $("#ovBotColor", root),
      botAlpha:  $("#ovBotAlpha", root),
      botH:      $("#ovBotH", root),
    };

    // невеликий хелпер–дефолт
    function ensureOverlayStruct(b) {
      if (!b.style) b.style = {};
      if (!b.style.overlay) {
        b.style.overlay = {
          top:    { enable: false, color: "#000000", alpha: 0.4, h: 120 },
          bottom: { enable: false, color: "#000000", alpha: 0.4, h: 120 },
        };
      } else {
        b.style.overlay.top = Object.assign(
          { enable: false, color: "#000000", alpha: 0.4, h: 120 },
          b.style.overlay.top || {}
        );
        b.style.overlay.bottom = Object.assign(
          { enable: false, color: "#000000", alpha: 0.4, h: 120 },
          b.style.overlay.bottom || {}
        );
      }
      return b.style.overlay;
    }

    // ==== відображення стану при виборі блоку
    api.subscribeSelection((b) => {
      if (!b) return;
      const ov = ensureOverlayStruct(b);
      const top = ov.top;
      const bot = ov.bottom;

      if (controls.topEnable) controls.topEnable.checked = !!top.enable;
      if (controls.topColor)  controls.topColor.value   = top.color || "#000000";
      if (controls.topAlpha)
        controls.topAlpha.value =
          typeof top.alpha === "number" ? top.alpha : 0.4;
      if (controls.topH)      controls.topH.value       = top.h || 0;

      if (controls.botEnable) controls.botEnable.checked = !!bot.enable;
      if (controls.botColor)  controls.botColor.value   = bot.color || "#000000";
      if (controls.botAlpha)
        controls.botAlpha.value =
          typeof bot.alpha === "number" ? bot.alpha : 0.4;
      if (controls.botH)      controls.botH.value       = bot.h || 0;
    });

    const upd = (fn) =>
      api.updateSelected((b) => {
        const ov = ensureOverlayStruct(b);
        fn(ov);
      });

    // ==== Top
    controls.topEnable &&
      controls.topEnable.addEventListener("change", () => {
        const v = !!controls.topEnable.checked;
        upd((ov) => {
          ov.top.enable = v;
        });
      });

    controls.topColor &&
      controls.topColor.addEventListener("input", () => {
        const v = controls.topColor.value || "#000000";
        upd((ov) => {
          ov.top.color = v;
        });
      });

    controls.topAlpha &&
      controls.topAlpha.addEventListener("input", () => {
        const v = parseFloat(controls.topAlpha.value) || 0;
        upd((ov) => {
          ov.top.alpha = v;
        });
      });

    controls.topH &&
      controls.topH.addEventListener("input", () => {
        const v = parseInt(controls.topH.value, 10) || 0;
        upd((ov) => {
          ov.top.h = v;
        });
      });

    // ==== Bottom
    controls.botEnable &&
      controls.botEnable.addEventListener("change", () => {
        const v = !!controls.botEnable.checked;
        upd((ov) => {
          ov.bottom.enable = v;
        });
      });

    controls.botColor &&
      controls.botColor.addEventListener("input", () => {
        const v = controls.botColor.value || "#000000";
        upd((ov) => {
          ov.bottom.color = v;
        });
      });

    controls.botAlpha &&
      controls.botAlpha.addEventListener("input", () => {
        const v = parseFloat(controls.botAlpha.value) || 0;
        upd((ov) => {
          ov.bottom.alpha = v;
        });
      });

    controls.botH &&
      controls.botH.addEventListener("input", () => {
        const v = parseInt(controls.botH.value, 10) || 0;
        upd((ov) => {
          ov.bottom.h = v;
        });
      });
      console.log("[design:workspace] Робоче середовище Оверлей ініціалізовано");
  }

  window.STInspectorOverlay = { init };
})();
