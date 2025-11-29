// plugins/design/js/inspector.layout.js
(function () {
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  function init(api, root = document) {
    if (!api) return;

    const controls = {
      layoutBtns: $$(".layout-preset", root),
      alignMain: $("#alignMain", root),
      alignCross: $("#alignCross", root),
      gap: $("#gap", root),

      // padding
      padT: $("#padT", root),
      padR: $("#padR", root),
      padB: $("#padB", root),
      padL: $("#padL", root),
      padLink: $("#padLink", root),

      // margin (outer)
      marT: $("#marT", root),
      marR: $("#marR", root),
      marB: $("#marB", root),
      marL: $("#marL", root),
      marLink: $("#marLink", root),

      // grid
      gridCols: $("#gridCols", root),
      gridGap: $("#gridGap", root),
      gridRow: $("#gridRow", root),
    };

    const upd = (fn) => api.updateSelected(fn);

    function setActiveLayoutButton(mode) {
      if (!controls.layoutBtns) return;
      controls.layoutBtns.forEach((btn) => {
        if (btn.dataset.layout === mode) btn.classList.add("active");
        else btn.classList.remove("active");
      });

      if (controls.gridRow) {
        controls.gridRow.style.display = mode === "grid" ? "grid" : "none";
      }
    }

    // ===== СИНХРОНІЗАЦІЯ КОЛИ МИ ВИБИРАЄМО ІНШИЙ БЛОК =====
    api.subscribeSelection((b) => {
      if (!b) return;

      // ПРЕСЕТ РОЗМІТКИ
      let layoutPreset = "stack";
      if (b.display === "grid") {
        layoutPreset = "grid";
      } else if (b.display === "flex" && b.dir === "row") {
        layoutPreset = "row";
      } else {
        layoutPreset = "stack";
      }
      setActiveLayoutButton(layoutPreset);

      // ВИРІВНЮВАННЯ
      if (controls.alignMain) {
        controls.alignMain.value = b.justify || "flex-start";
      }
      if (controls.alignCross) {
        controls.alignCross.value = b.align || "stretch";
      }

      // GAP
      if (controls.gap) {
        controls.gap.value = b.gap ?? 0;
      }

      // PADDING
      const p = b.padding || { t: 0, r: 0, b: 0, l: 0 };
      controls.padT && (controls.padT.value = p.t ?? 0);
      controls.padR && (controls.padR.value = p.r ?? 0);
      controls.padB && (controls.padB.value = p.b ?? 0);
      controls.padL && (controls.padL.value = p.l ?? 0);

      const samePad = p.t === p.r && p.t === p.b && p.t === p.l;
      if (controls.padLink) {
        controls.padLink.classList.toggle("active", samePad);
      }

      // OUTER MARGIN
      const m = b.outerMargin || { t: 0, r: 0, b: 0, l: 0 };
      controls.marT && (controls.marT.value = m.t ?? 0);
      controls.marR && (controls.marR.value = m.r ?? 0);
      controls.marB && (controls.marB.value = m.b ?? 0);
      controls.marL && (controls.marL.value = m.l ?? 0);

      const sameMar = m.t === m.r && m.t === m.b && m.t === m.l;
      if (controls.marLink) {
        controls.marLink.classList.toggle("active", sameMar);
      }

      // GRID
      const g = b.grid || {};
      if (controls.gridCols) controls.gridCols.value = g.cols ?? 2;
      if (controls.gridGap) controls.gridGap.value = g.gap ?? 16;
    });

    // ===== ЛОГІКА КЕРУВАННЯ =====

    // 1) Пресети розташування: stack / row / grid
    if (controls.layoutBtns) {
      controls.layoutBtns.forEach((btn) => {
        btn.addEventListener("click", () => {
          const mode = btn.dataset.layout;
          setActiveLayoutButton(mode);

          upd((b) => {
            if (mode === "stack") {
              b.display = "flex";
              b.dir = "column";
            } else if (mode === "row") {
              b.display = "flex";
              b.dir = "row";
            } else if (mode === "grid") {
              b.display = "grid";
              b.grid = b.grid || {};
              if (b.grid.cols == null) b.grid.cols = 2;
              if (b.grid.gap == null) b.grid.gap = b.gap ?? 16;
            }

            if (!b.justify) b.justify = "flex-start";
            if (!b.align) b.align = "stretch";
          });
        });
      });
    }

    // 2) Вирівнювання
    controls.alignMain &&
      controls.alignMain.addEventListener("change", () => {
        const v = controls.alignMain.value;
        upd((b) => {
          b.justify = v;
        });
      });

    controls.alignCross &&
      controls.alignCross.addEventListener("change", () => {
        const v = controls.alignCross.value;
        upd((b) => {
          b.align = v;
        });
      });

    // 3) GAP
    controls.gap &&
      controls.gap.addEventListener("input", () => {
        const v = +controls.gap.value || 0;
        upd((b) => {
          b.gap = v;
          if (b.display === "grid") {
            b.grid = b.grid || {};
            b.grid.gap = v;
          }
        });
      });

    // 4) PADDING (з урахуванням "🔗")
    ["padT", "padR", "padB", "padL"].forEach((key) => {
      const el = controls[key];
      if (!el) return;

      el.addEventListener("input", () => {
        const linkOn =
          controls.padLink &&
          controls.padLink.classList.contains("active");

        let t = +controls.padT.value || 0;
        let r = +controls.padR.value || 0;
        let btm = +controls.padB.value || 0;
        let l = +controls.padL.value || 0;

        if (linkOn) {
          const v = +el.value || 0;
          t = r = btm = l = v;
          controls.padT.value =
            controls.padR.value =
            controls.padB.value =
            controls.padL.value =
            v;
        }

        upd((b) => {
          b.padding = b.padding || { t: 0, r: 0, b: 0, l: 0 };
          b.padding.t = t;
          b.padding.r = r;
          b.padding.b = btm;
          b.padding.l = l;
        });
      });
    });

    // клік по "🔗" для padding
    if (controls.padLink) {
      controls.padLink.addEventListener("click", () => {
        const willOn = !controls.padLink.classList.contains("active");
        controls.padLink.classList.toggle("active", willOn);
        if (!willOn) return;

        const v = +controls.padT.value || 0;
        controls.padR.value =
          controls.padB.value =
          controls.padL.value =
          v;

        upd((b) => {
          b.padding = b.padding || { t: 0, r: 0, b: 0, l: 0 };
          b.padding.t = b.padding.r = b.padding.b = b.padding.l = v;
        });
      });
    }

    // 5) OUTER MARGIN (з урахуванням "🔗")
    ["marT", "marR", "marB", "marL"].forEach((key) => {
      const el = controls[key];
      if (!el) return;

      el.addEventListener("input", () => {
        const linkOn =
          controls.marLink &&
          controls.marLink.classList.contains("active");

        let t = +controls.marT.value || 0;
        let r = +controls.marR.value || 0;
        let btm = +controls.marB.value || 0;
        let l = +controls.marL.value || 0;

        if (linkOn) {
          const v = +el.value || 0;
          t = r = btm = l = v;
          controls.marT.value =
            controls.marR.value =
            controls.marB.value =
            controls.marL.value =
            v;
        }

        api.updateSelected((b) => {
          b.outerMargin = b.outerMargin || { t: 0, r: 0, b: 0, l: 0 };
          b.outerMargin.t = t;
          b.outerMargin.r = r;
          b.outerMargin.b = btm;
          b.outerMargin.l = l;
        });
      });
    });

    // клік по "🔗" для margin
    if (controls.marLink) {
      controls.marLink.addEventListener("click", () => {
        const willOn = !controls.marLink.classList.contains("active");
        controls.marLink.classList.toggle("active", willOn);
        if (!willOn) return;

        const v = +controls.marT.value || 0;
        controls.marR.value =
          controls.marB.value =
          controls.marL.value =
          v;

        api.updateSelected((b) => {
          b.outerMargin = b.outerMargin || { t: 0, r: 0, b: 0, l: 0 };
          b.outerMargin.t =
            b.outerMargin.r =
            b.outerMargin.b =
            b.outerMargin.l =
            v;
        });
      });
    }

    // 6) GRID: колонки + gap
    controls.gridCols &&
      controls.gridCols.addEventListener("input", () => {
        const v = Math.max(1, +controls.gridCols.value || 2);
        upd((b) => {
          b.grid = b.grid || {};
          b.grid.cols = v;
          b.display = "grid";
        });
      });

    controls.gridGap &&
      controls.gridGap.addEventListener("input", () => {
        const v = Math.max(0, +controls.gridGap.value || 0);
        upd((b) => {
          b.grid = b.grid || {};
          b.grid.gap = v;
          b.gap = v;
        });
      });
  }

  window.STInspectorLayout = { init };
})();
