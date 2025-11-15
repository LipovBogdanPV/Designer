// plugins/design/js/inspector.size.js
(function () {
  const $ = (sel, root = document) => root.querySelector(sel);

  function init(api, root = document) {
    if (!api) return;
    const controls = {
      sizeMode: $("#sizeMode", root),
      sizeVal: $("#sizeVal", root),
      grow: $("#grow", root),
      shrink: $("#shrink", root),
      alignSelf: $("#alignSelf", root),
      minH: $("#minH", root),
      widthPx: $("#widthPx", root),
      fullHeight: $("#fullHeight", root),
      fixedHeight: $("#fixedHeight", root),
      dockWhere: $("#dockWhere", root),
      dockWidth: $("#dockWidth", root),
    };

    api.subscribeSelection((b) => {
      if (!b) return;
      const L = b.layout;
      controls.sizeMode && (controls.sizeMode.value = L.basis.mode);
      controls.sizeVal && (controls.sizeVal.value = L.basis.value || "");
      controls.grow && (controls.grow.checked = !!L.grow);
      controls.shrink && (controls.shrink.checked = !!L.shrink);
      controls.alignSelf && (controls.alignSelf.value = L.alignSelf || "auto");
      controls.minH && (controls.minH.value = L.minHeightPx || "");
      controls.widthPx && (controls.widthPx.value = L.widthPx || "");
      controls.fullHeight && (controls.fullHeight.checked = !!L.fullHeight);
      controls.fixedHeight &&
        (controls.fixedHeight.value = L.fixedHeight || "");
    });

    const upd = (fn) => api.updateSelected(fn);

    controls.sizeMode &&
      controls.sizeMode.addEventListener("change", () => {
        const m = controls.sizeMode.value;
        upd((b) => {
          b.layout.basis.mode = m;
          if (m === "fill") {
            b.layout.grow = 1;
            b.layout.shrink = 1;
            b.layout.basis.value = 0;
          }
        });
      });
    controls.sizeVal &&
      controls.sizeVal.addEventListener("input", () => {
        const v = +controls.sizeVal.value || 0;
        upd((b) => {
          b.layout.basis.value = v;
        });
      });
    controls.grow &&
      controls.grow.addEventListener("change", () => {
        const v = controls.grow.checked ? 1 : 0;
        upd((b) => {
          b.layout.grow = v;
        });
      });
    controls.shrink &&
      controls.shrink.addEventListener("change", () => {
        const v = controls.shrink.checked ? 1 : 0;
        upd((b) => {
          b.layout.shrink = v;
        });
      });
    controls.alignSelf &&
      controls.alignSelf.addEventListener("change", () => {
        const v = controls.alignSelf.value;
        upd((b) => {
          b.layout.alignSelf = v;
        });
      });
    controls.minH &&
      controls.minH.addEventListener("input", () => {
        const v = +controls.minH.value || 0;
        upd((b) => {
          b.layout.minHeightPx = v;
        });
      });
    controls.widthPx &&
      controls.widthPx.addEventListener("input", () => {
        const v = +controls.widthPx.value || 0;
        upd((b) => {
          b.layout.widthPx = v;
        });
      });
    controls.fullHeight &&
      controls.fullHeight.addEventListener("change", () => {
        const v = !!controls.fullHeight.checked;
        upd((b) => {
          b.layout.fullHeight = v;
        });
      });
    controls.fixedHeight &&
      controls.fixedHeight.addEventListener("input", () => {
        const v = +controls.fixedHeight.value || "";
        upd((b) => {
          b.layout.fixedHeight = v;
        });
      });

    // dockWhere / dockWidth залишаю для майбутніх шаблонів
  }

  window.STInspectorSize = { init };
})();
