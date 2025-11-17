(function () {
  const $ = (sel, root = document) => root.querySelector(sel);

  function init(api, root = document) {
    if (!api) return;

    const offsetInput = $("#copyOffset", root);
    const btnInside = $("#copyInside", root);
    const btnOutside = $("#copyOutside", root);

    const getOffset = () => Math.max(0, Number(offsetInput?.value) || 0);

    // вмикаємо / вимикаємо контрол при зміні вибору
    api.subscribeSelection((b) => {
      const disabled = !b;
      if (offsetInput) offsetInput.disabled = disabled;
      if (btnInside) btnInside.disabled = disabled;
      if (btnOutside) btnOutside.disabled = disabled;
    });

    btnInside &&
      btnInside.addEventListener("click", (e) => {
        e.preventDefault();
        const off = getOffset();
        if (api.copyInside) api.copyInside(off);
      });

    btnOutside &&
      btnOutside.addEventListener("click", (e) => {
        e.preventDefault();
        const off = getOffset();
        if (api.copyOutside) api.copyOutside(off);
      });

    console.log("[design:copy] інспектор копіювання ініціалізовано");
  }

  window.STInspectorCopy = { init };
})();
