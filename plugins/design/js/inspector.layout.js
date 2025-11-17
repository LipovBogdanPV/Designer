// plugins/design/js/inspector.layout.js
(function () {
  const $ = (sel, root = document) => root.querySelector(sel);

  function init(api, root = document) {
    if (!api) return;
    const controls = {
      display: $("#display", root),
      dir: $("#dir", root),
      justify: $("#justify", root),
      align: $("#align", root),
      gap: $("#gap", root),
      padT: $("#padT", root),
      padR: $("#padR", root),
      padB: $("#padB", root),
      padL: $("#padL", root),
      maxw: $("#maxw", root),
      gridCols: $("#gridCols", root),
      gridGap: $("#gridGap", root),
      marT: $("#marT", root),
      marR: $("#marR", root),
      marB: $("#marB", root),
      marL: $("#marL", root),
    };

    const flexDirRow = $("#flexDirRow", root);
    const flexAlignRow = $("#flexAlignRow", root);
    const gridSetup = $("#gridSetup", root);

    const toggleByDisplay = (b) => {
      if (!flexDirRow || !flexAlignRow || !gridSetup) return;
      const isFlex = b.display === "flex";
      const isGrid = b.display === "grid";
      flexDirRow.style.display = isFlex ? "grid" : "none";
      flexAlignRow.style.display = isFlex ? "grid" : "none";
      gridSetup.style.display = isGrid ? "grid" : "none";
    };

    api.subscribeSelection((b) => {
      if (!b) return;
      controls.display && (controls.display.value = b.display);
      controls.dir && (controls.dir.value = b.dir);
      controls.justify && (controls.justify.value = b.justify);
      controls.align && (controls.align.value = b.align);
      controls.gap && (controls.gap.value = b.gap);
      controls.padT && (controls.padT.value = b.padding.t);
      controls.padR && (controls.padR.value = b.padding.r);
      controls.padB && (controls.padB.value = b.padding.b);
      controls.padL && (controls.padL.value = b.padding.l);
      // margin — теж з дефолтом
      const outer = b.outerMargin || { t: 0, r: 0, b: 0, l: 0 };
      controls.marT && (controls.marT.value = outer.t ?? 0);
      controls.marR && (controls.marR.value = outer.r ?? 0);
      controls.marB && (controls.marB.value = outer.b ?? 0);
      controls.marL && (controls.marL.value = outer.l ?? 0);
      controls.maxw && (controls.maxw.value = b.maxWidth || "");
      controls.gridCols && (controls.gridCols.value = b.grid?.cols ?? 2);
      controls.gridGap && (controls.gridGap.value = b.grid?.gap ?? 16);
      toggleByDisplay(b);
    });

    const upd = (fn) => api.updateSelected(fn);

    controls.display &&
      controls.display.addEventListener("change", () => {
        const v = controls.display.value;
        upd((b) => {
          b.display = v;
        });
      });
    controls.dir &&
      controls.dir.addEventListener("change", () => {
        const v = controls.dir.value;
        upd((b) => {
          b.dir = v;
        });
      });
    controls.justify &&
      controls.justify.addEventListener("change", () => {
        const v = controls.justify.value;
        upd((b) => {
          b.justify = v;
        });
      });
    controls.align &&
      controls.align.addEventListener("change", () => {
        const v = controls.align.value;
        upd((b) => {
          b.align = v;
        });
      });
    controls.gap &&
      controls.gap.addEventListener("input", () => {
        const v = +controls.gap.value || 0;
        upd((b) => {
          b.gap = v;
        });
      });

    ["padT", "padR", "padB", "padL"].forEach((k) => {
      if (!controls[k]) return;
      controls[k].addEventListener("input", () => {
        const t = +controls.padT.value || 0;
        const r = +controls.padR.value || 0;
        const btm = +controls.padB.value || 0;
        const l = +controls.padL.value || 0;
        upd((b) => {
          b.padding.t = t;
          b.padding.r = r;
          b.padding.b = btm;
          b.padding.l = l;
        });
      });
    });
    ["marT", "marR", "marB", "marL"].forEach((k) => {
      if (!controls[k]) return;
      controls[k].addEventListener("input", () => {
        api.updateSelected((b) => {
          b.outerMargin = b.outerMargin || { t: 0, r: 0, b: 0, l: 0 };
          b.outerMargin.t = +controls.marT.value || 0;
          b.outerMargin.r = +controls.marR.value || 0;
          b.outerMargin.b = +controls.marB.value || 0;
          b.outerMargin.l = +controls.marL.value || 0;
        });
      });
    });

    controls.maxw &&
      controls.maxw.addEventListener("change", () => {
        const v = controls.maxw.value;
        upd((b) => {
          b.maxWidth = v;
        });
      });

    controls.gridCols &&
      controls.gridCols.addEventListener("input", () => {
        const v = Math.max(1, +controls.gridCols.value || 2);
        upd((b) => {
          b.grid.cols = v;
        });
      });
    controls.gridGap &&
      controls.gridGap.addEventListener("input", () => {
        const v = Math.max(0, +controls.gridGap.value || 0);
        upd((b) => {
          b.grid.gap = v;
        });
      });
  }

  window.STInspectorLayout = { init };
})();
