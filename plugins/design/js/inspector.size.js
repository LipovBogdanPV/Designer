// plugins/design/js/inspector.size.js
(function () {
  const $ = (sel, root = document) => root.querySelector(sel);

  function init(api, root = document) {
    if (!api) return;

    const controls = {
      widthMode: $("#widthMode", root),
      widthValue: $("#widthValue", root),
      heightMode: $("#heightMode", root),
      heightValue: $("#heightValue", root),
      grow: $("#grow", root),
      shrink: $("#shrink", root),
      alignSelf: $("#alignSelf", root),
      pinEnabled: $("#pinEnabled", root),
      pinSide: $("#pinSide", root),
    };

    const upd = (fn) => api.updateSelected(fn);

    function syncWidthInputs(mode) {
      if (!controls.widthValue) return;
      const disable = mode === "auto" || mode === "fill";
      controls.widthValue.disabled = disable;
      controls.widthValue.placeholder =
        mode === "%" ? "% від контейнера" : "px";
    }

    function syncHeightInputs(mode) {
      if (!controls.heightValue) return;
      const disable = mode === "content" || mode === "screen";
      controls.heightValue.disabled = disable;
      controls.heightValue.placeholder = "px";
    }

    // коли змінюємо вибраний блок — підтягуємо значення в форму
    api.subscribeSelection((b) => {
      if (!b) return;
      const L = b.layout || {};

      // ----- ширина -----
      let wMode = (L.basis && L.basis.mode) || "auto";
      let wVal = (L.basis && L.basis.value) || "";

      if (wMode === "px" && L.widthPx) wVal = L.widthPx;

      if (controls.widthMode) controls.widthMode.value = wMode;
      if (controls.widthValue) controls.widthValue.value = wVal;
      syncWidthInputs(wMode);

      // ----- висота -----
      let hMode = "content";
      let hVal = "";

      if (L.fullHeight) {
        hMode = "screen";
      } else if (L.fixedHeight) {
        hMode = "fixed";
        hVal = L.fixedHeight | 0;
      } else if (L.minHeightPx) {
        hMode = "min";
        hVal = L.minHeightPx | 0;
      }

      if (controls.heightMode) controls.heightMode.value = hMode;
      if (controls.heightValue) controls.heightValue.value = hVal;
      syncHeightInputs(hMode);

      // ----- flex-grow / shrink -----
      if (controls.grow) controls.grow.checked = !!L.grow;
      if (controls.shrink)
        controls.shrink.checked = L.shrink == null ? true : !!L.shrink;

      if (controls.alignSelf)
        controls.alignSelf.value = L.alignSelf || "auto";

      // ----- pin -----
      const pin = L.pin || { enabled: false, side: "top" };
      if (controls.pinEnabled) controls.pinEnabled.checked = !!pin.enabled;
      if (controls.pinSide) controls.pinSide.value = pin.side || "top";
    });

    // ====== обробка подій ======

    // --- ширина ---
    if (controls.widthMode) {
      controls.widthMode.addEventListener("change", () => {
        const mode = controls.widthMode.value;
        syncWidthInputs(mode);
        const val = Number(controls.widthValue?.value || 0) || 0;

        upd((b) => {
          b.layout = b.layout || {};
          const L = b.layout;

          L.basis = L.basis || { mode: "auto", value: 0 };

          if (mode === "auto") {
            L.basis.mode = "auto";
            L.basis.value = 0;
            delete L.widthPx;
          } else if (mode === "fill") {
            L.basis.mode = "fill";
            L.basis.value = 0;
            L.grow = 1;
            if (L.shrink == null) L.shrink = 1;
            delete L.widthPx;
          } else if (mode === "px") {
            L.basis.mode = "px";
            L.basis.value = val;
            L.widthPx = val;
          } else if (mode === "%") {
            L.basis.mode = "%";
            L.basis.value = val;
            delete L.widthPx;
          }
        });
      });
    }

    if (controls.widthValue) {
      controls.widthValue.addEventListener("input", () => {
        const mode = controls.widthMode.value;
        const val = Number(controls.widthValue.value || 0) || 0;
        if (mode === "auto" || mode === "fill") return;

        upd((b) => {
          b.layout = b.layout || {};
          const L = b.layout;
          L.basis = L.basis || { mode: mode, value: 0 };
          L.basis.mode = mode;
          L.basis.value = val;
          if (mode === "px") L.widthPx = val;
        });
      });
    }

    // --- висота ---
    if (controls.heightMode) {
      controls.heightMode.addEventListener("change", () => {
        const mode = controls.heightMode.value;
        syncHeightInputs(mode);
        const val = Number(controls.heightValue?.value || 0) || 0;

        upd((b) => {
          b.layout = b.layout || {};
          const L = b.layout;

          L.fullHeight = false;
          delete L.fixedHeight;
          delete L.minHeightPx;

          if (mode === "content") {
            // все скинули вище
          } else if (mode === "screen") {
            L.fullHeight = true;
          } else if (mode === "fixed") {
            L.fixedHeight = val;
          } else if (mode === "min") {
            L.minHeightPx = val;
          }
        });
      });
    }

    if (controls.heightValue) {
      controls.heightValue.addEventListener("input", () => {
        const mode = controls.heightMode.value;
        const val = Number(controls.heightValue.value || 0) || 0;
        if (mode === "content" || mode === "screen") return;

        upd((b) => {
          b.layout = b.layout || {};
          const L = b.layout;
          if (mode === "fixed") {
            L.fixedHeight = val;
          } else if (mode === "min") {
            L.minHeightPx = val;
          }
        });
      });
    }

    // --- grow/shrink/alignSelf ---
    controls.grow &&
      controls.grow.addEventListener("change", () => {
        const checked = controls.grow.checked;
        upd((b) => {
          b.layout = b.layout || {};
          b.layout.grow = checked ? 1 : 0;
        });
      });

    controls.shrink &&
      controls.shrink.addEventListener("change", () => {
        const checked = controls.shrink.checked;
        upd((b) => {
          b.layout = b.layout || {};
          b.layout.shrink = checked ? 1 : 0;
        });
      });

    controls.alignSelf &&
      controls.alignSelf.addEventListener("change", () => {
        const v = controls.alignSelf.value;
        upd((b) => {
          b.layout = b.layout || {};
          b.layout.alignSelf = v;
        });
      });

    // --- pin (fixed) ---
    if (controls.pinEnabled) {
      controls.pinEnabled.addEventListener("change", () => {
        const enabled = controls.pinEnabled.checked;
        const side = controls.pinSide ? controls.pinSide.value : "top";
        upd((b) => {
          b.layout = b.layout || {};
          b.layout.pin = { enabled, side };
        });
      });
    }

    if (controls.pinSide) {
      controls.pinSide.addEventListener("change", () => {
        const side = controls.pinSide.value;
        const enabled = controls.pinEnabled?.checked;
        upd((b) => {
          b.layout = b.layout || {};
          const pin = b.layout.pin || {};
          pin.side = side;
          if (enabled != null) pin.enabled = enabled;
          b.layout.pin = pin;
        });
      });
    }
  }

  window.STInspectorSize = { init };
})();
