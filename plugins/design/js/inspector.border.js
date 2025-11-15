// plugins/design/js/inspector.border.js
(function () {
  const $ = (sel, root = document) => root.querySelector(sel);

  function init(api, root = document) {
    if (!api) return;

    const controls = {
      cornerMode: $("#cornerMode", root),
      radiusMode: $("#radiusMode", root),
      rAllVal: $("#rAllVal", root),
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

    const boxRounded = $("#roundedBox", root);
    const boxChamfer = $("#chamferBox", root);
    const boxPoly = $("#polygonBox", root);
    const boxRAll = $("#rAll", root);
    const boxRPer = $("#rPer", root);
    const boxRDiag1 = $("#rDiag1", root);
    const boxRDiag2 = $("#rDiag2", root);

    const switchRadiusUI = (r) => {
      if (!boxRAll || !boxRPer || !boxRDiag1 || !boxRDiag2) return;
      boxRAll.style.display = r.mode === "all" ? "block" : "none";
      boxRPer.style.display = r.mode === "per" ? "block" : "none";
      boxRDiag1.style.display = r.mode === "diag1" ? "block" : "none";
      boxRDiag2.style.display = r.mode === "diag2" ? "block" : "none";
    };
    const switchCornerBox = (mode) => {
      if (!boxRounded || !boxChamfer || !boxPoly) return;
      boxRounded.style.display = mode === "rounded" ? "block" : "none";
      boxChamfer.style.display = mode === "chamfer" ? "block" : "none";
      boxPoly.style.display = mode === "polygon" ? "block" : "none";
    };

    api.subscribeSelection((b) => {
      if (!b) return;
      const r = b.style.radius;
      const brd = b.style.border;

      controls.cornerMode && (controls.cornerMode.value = "rounded"); // поки що тільки rounded
      controls.radiusMode && (controls.radiusMode.value = r.mode);
      controls.rAllVal && (controls.rAllVal.value = r.all ?? 16);
      controls.rTL && (controls.rTL.value = r.tl ?? 16);
      controls.rTR && (controls.rTR.value = r.tr ?? 16);
      controls.rBL && (controls.rBL.value = r.bl ?? 16);
      controls.rBR && (controls.rBR.value = r.br ?? 16);
      controls.rD1A && (controls.rD1A.value = r.d1a ?? 24);
      controls.rD1B && (controls.rD1B.value = r.d1b ?? 8);
      controls.rD2A && (controls.rD2A.value = r.d2a ?? 24);
      controls.rD2B && (controls.rD2B.value = r.d2b ?? 8);

      controls.bWidth && (controls.bWidth.value = brd.width ?? 1);
      controls.bStyle && (controls.bStyle.value = brd.style || "solid");
      controls.bColor && (controls.bColor.value = brd.color || "#334155");
      controls.bAlpha && (controls.bAlpha.value = brd.alpha ?? 0.4);
      controls.bBlur && (controls.bBlur.value = brd.soft ?? 0);

      switchRadiusUI(r);
      switchCornerBox("rounded");
    });

    const upd = (fn) => api.updateSelected(fn);

    controls.radiusMode &&
      controls.radiusMode.addEventListener("change", () => {
        const v = controls.radiusMode.value;
        upd((b) => {
          b.style.radius.mode = v;
        });
      });

    controls.rAllVal &&
      controls.rAllVal.addEventListener("input", () => {
        const v = +controls.rAllVal.value || 0;
        upd((b) => {
          b.style.radius.all = v;
        });
      });
    controls.rTL &&
      controls.rTL.addEventListener("input", () => {
        const v = +controls.rTL.value || 0;
        upd((b) => {
          b.style.radius.tl = v;
        });
      });
    controls.rTR &&
      controls.rTR.addEventListener("input", () => {
        const v = +controls.rTR.value || 0;
        upd((b) => {
          b.style.radius.tr = v;
        });
      });
    controls.rBL &&
      controls.rBL.addEventListener("input", () => {
        const v = +controls.rBL.value || 0;
        upd((b) => {
          b.style.radius.bl = v;
        });
      });
    controls.rBR &&
      controls.rBR.addEventListener("input", () => {
        const v = +controls.rBR.value || 0;
        upd((b) => {
          b.style.radius.br = v;
        });
      });

    [controls.rD1A, controls.rD1B, controls.rD2A, controls.rD2B].forEach(
      (ctrl, idx) => {
        if (!ctrl) return;
        ctrl.addEventListener("input", () => {
          const v = +ctrl.value || 0;
          upd((b) => {
            if (idx === 0) b.style.radius.d1a = v;
            if (idx === 1) b.style.radius.d1b = v;
            if (idx === 2) b.style.radius.d2a = v;
            if (idx === 3) b.style.radius.d2b = v;
          });
        });
      }
    );

    controls.bWidth &&
      controls.bWidth.addEventListener("input", () => {
        const v = +controls.bWidth.value || 0;
        upd((b) => {
          b.style.border.width = v;
        });
      });
    controls.bStyle &&
      controls.bStyle.addEventListener("change", () => {
        const v = controls.bStyle.value;
        upd((b) => {
          b.style.border.style = v;
        });
      });
    controls.bColor &&
      controls.bColor.addEventListener("input", () => {
        const v = controls.bColor.value;
        upd((b) => {
          b.style.border.color = v;
        });
      });
    controls.bAlpha &&
      controls.bAlpha.addEventListener("input", () => {
        const v = parseFloat(controls.bAlpha.value || "0");
        upd((b) => {
          b.style.border.alpha = v;
        });
      });
    controls.bBlur &&
      controls.bBlur.addEventListener("input", () => {
        const v = +controls.bBlur.value || 0;
        upd((b) => {
          b.style.border.soft = v;
        });
      });
  }

  window.STInspectorBorder = { init };
})();
