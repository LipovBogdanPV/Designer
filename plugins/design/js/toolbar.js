// plugins/design/js/toolbar.js
(function () {
  const $ = (sel, root = document) => root.querySelector(sel);

  function initToolbar(host, api) {
    if (!host || !api) return;

    const addRootBtn = $("#add-root", host);
    const addChildBtn = $("#add-child", host);
    const dupBtn = $("#dup", host);
    const delBtn = $("#del", host);
    const selLabel = $("#selLabel", host);

    addRootBtn && addRootBtn.addEventListener("click", () => api.addRoot());
    addChildBtn && addChildBtn.addEventListener("click", () => api.addChild());
    dupBtn && dupBtn.addEventListener("click", () => api.duplicate());
    delBtn && delBtn.addEventListener("click", () => api.deleteSelected());

    api.subscribeSelection((sel) => {
      if (!selLabel) return;
      selLabel.textContent = sel ? `ID: ${sel.id}` : "Немає вибору";
    });

    // hotkey Delete
    document.addEventListener("keydown", (e) => {
      if (
        (e.key === "Delete" || e.key === "Backspace") &&
        !["INPUT", "TEXTAREA", "SELECT"].includes(
          document.activeElement?.tagName
        )
      ) {
        e.preventDefault();
        api.deleteSelected();
      }
    });
  }

  window.STDesignToolbar = { init: initToolbar };
})();
