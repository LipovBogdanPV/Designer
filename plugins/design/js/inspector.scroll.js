// plugins/design/js/inspector.scroll.js
(function () {
  const $ = (sel, root = document) => root.querySelector(sel);

  function init(api, root = document) {
    if (!api) return;

    const c = {
      scrollX: $("#scrollX", root),
      scrollY: $("#scrollY", root),
      panEnable: $("#panEnable", root),
      panDir: $("#panDir", root),
      bgFixed: $("#bgFixed", root),

      sbHide: $("#sbHide", root),
      sbThick: $("#sbThick", root),
      sbTrack: $("#sbTrack", root),
      sbThumb: $("#sbThumb", root),
      sbRadius: $("#sbRadius", root),
    };

    const num = (v, def = 0) => {
      const n = Number(v);
      return Number.isFinite(n) ? n : def;
    };

    // ---- оновлюємо інпути при зміні вибраного блоку
    api.subscribeSelection((b) => {
      if (!b) return;
      const s = b.scroll || {};

      c.scrollX && (c.scrollX.checked = !!s.x);
      c.scrollY && (c.scrollY.checked = !!s.y);
      c.panEnable && (c.panEnable.checked = !!s.panEnable);
      c.panDir && (c.panDir.value = s.panDir || "y");
      c.bgFixed && (c.bgFixed.checked = !!s.bgFixed);

      c.sbHide && (c.sbHide.checked = !!s.sbHide);
      c.sbThick && (c.sbThick.value = s.sbThick ?? 8);
      c.sbTrack && (c.sbTrack.value = s.sbTrack || "#020617");
      c.sbThumb && (c.sbThumb.value = s.sbThumb || "#64748b");
      c.sbRadius && (c.sbRadius.value = s.sbRadius ?? 8);
    });

    const upd = (fn) =>
      api.updateSelected((b) => {
        b.scroll = b.scroll || {};
        fn(b.scroll);
      });

    // ---- базові прапорці
    c.scrollX &&
      c.scrollX.addEventListener("change", () => {
        const v = !!c.scrollX.checked;
        upd((s) => {
          s.x = v;
        });
      });

    c.scrollY &&
      c.scrollY.addEventListener("change", () => {
        const v = !!c.scrollY.checked;
        upd((s) => {
          s.y = v;
        });
      });

    c.panEnable &&
      c.panEnable.addEventListener("change", () => {
        const v = !!c.panEnable.checked;
        upd((s) => {
          s.panEnable = v;
        });
      });

    c.panDir &&
      c.panDir.addEventListener("change", () => {
        const v = c.panDir.value || "y";
        upd((s) => {
          s.panDir = v;
        });
      });

    c.bgFixed &&
      c.bgFixed.addEventListener("change", () => {
        const v = !!c.bgFixed.checked;
        upd((s) => {
          s.bgFixed = v;
        });
      });

    // ---- скролбар
    c.sbHide &&
      c.sbHide.addEventListener("change", () => {
        const v = !!c.sbHide.checked;
        upd((s) => {
          s.sbHide = v;
        });
      });

    c.sbThick &&
      c.sbThick.addEventListener("input", () => {
        const v = num(c.sbThick.value, 0);
        upd((s) => {
          s.sbThick = v;
        });
      });

    c.sbTrack &&
      c.sbTrack.addEventListener("input", () => {
        const v = c.sbTrack.value || "#020617";
        upd((s) => {
          s.sbTrack = v;
        });
      });

    c.sbThumb &&
      c.sbThumb.addEventListener("input", () => {
        const v = c.sbThumb.value || "#64748b";
        upd((s) => {
          s.sbThumb = v;
        });
      });

    c.sbRadius &&
      c.sbRadius.addEventListener("input", () => {
        const v = num(c.sbRadius.value, 0);
        upd((s) => {
          s.sbRadius = v;
        });
      });

    console.log("[design:scroll] інспектор прокрутки ініціалізовано");
  }

  window.STInspectorScroll = { init };
})();
