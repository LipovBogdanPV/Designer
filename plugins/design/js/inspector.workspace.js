// plugins/design/js/inspector.workspace.js
(function () {
  const $ = (sel, root = document) => root.querySelector(sel);

  function init(api, root = document) {
    if (!api) return;

    const rootEl = document.documentElement;

    const controls = {
      wsColor: $("#workspaceColor", root),
      safeBottom: $("#safeBottom", root),
      dndEnable: $("#dndEnable", root),

      containerRow: $("#wsContainerRow", root),
      createBtn: $("#wsCreateContainer", root),
      maxWidthRow: $("#wsMaxWidthRow", root),
      maxWidth: $("#wsMaxWidth", root),
      paddingRow: $("#wsPaddingRow", root),
      padding: $("#wsPadding", root),
    };

    // ----- helpers

    function getState() {
      return api.getState ? api.getState() : { rootBlocks: [], selectedId: null };
    }

    function getRootBlock() {
      const st = getState();
      const roots = st.rootBlocks || [];
      return roots[0] || null;
    }

    function refreshWorkspaceUI(selectedBlock) {
      const st = getState();
      const roots = st.rootBlocks || [];
      const hasAny = roots.length > 0;
      const rootBlock = roots[0] || null;
      const isRootSelected =
        selectedBlock && rootBlock && selectedBlock.id === rootBlock.id;

      // кнопка "створити контейнер" — тільки якщо взагалі немає блоків
      if (controls.containerRow)
        controls.containerRow.style.display = hasAny ? "none" : "flex";

      // налаштування контейнера — тільки якщо вибрано кореневий блок
      if (controls.maxWidthRow)
        controls.maxWidthRow.style.display = isRootSelected ? "grid" : "none";
      if (controls.paddingRow)
        controls.paddingRow.style.display = isRootSelected ? "grid" : "none";

      if (isRootSelected && rootBlock) {
        // maxWidth
        if (controls.maxWidth) {
          const mw = (rootBlock.maxWidth || "").replace("px", "");
          controls.maxWidth.value = mw || "";
        }
        // беремо верхній паддінг як базу
        if (controls.padding) {
          const p = rootBlock.padding || {};
          const pt = p.t ?? 0;
          controls.padding.value = pt;
        }
      }
    }

    // ----- первинна привʼязка значень із CSS

    if (controls.wsColor) {
      const cssCol =
        getComputedStyle(rootEl).getPropertyValue("--workspace").trim() ||
        "#020617";
      controls.wsColor.value = cssCol.startsWith("#") ? cssCol : "#020617";
    }
    if (controls.safeBottom) {
      const cssSB =
        parseInt(
          getComputedStyle(rootEl).getPropertyValue("--safe-bottom"),
          10
        ) || 72;
      controls.safeBottom.value = cssSB;
    }

    // ----- підписки core → оновлення UI

    api.subscribeSelection((b) => {
      refreshWorkspaceUI(b || null);
    });

    api.subscribeChange((/* blocks, sel */) => {
      // на випадок, якщо структура змінилася (додали/видалили root)
      refreshWorkspaceUI(api.getSelected ? api.getSelected() : null);
    });

    // ----- події

    // колір полотна
    controls.wsColor &&
      controls.wsColor.addEventListener("input", () => {
        const v = controls.wsColor.value || "#020617";
        rootEl.style.setProperty("--workspace", v);
      });

    // нижнє поле
    controls.safeBottom &&
      controls.safeBottom.addEventListener("input", () => {
        const v = Math.max(0, Number(controls.safeBottom.value) || 0);
        rootEl.style.setProperty("--safe-bottom", v + "px");
      });

    // вмикання/вимикання перетягування блоків
    controls.dndEnable &&
      controls.dndEnable.addEventListener("change", () => {
        const enabled = !!controls.dndEnable.checked;
        // глобальний флаг — core.js в attachDragHandle перевіряє його
        window.ST_DESIGN_DND_ENABLED = enabled;
      });

    // створити головний контейнер (коли проект пустий)
    controls.createBtn &&
      controls.createBtn.addEventListener("click", (e) => {
        e.preventDefault();
        const st = getState();
        const roots = st.rootBlocks || [];
        if (roots.length > 0) return; // вже є щось

        if (!api.addRoot || !api.updateSelected) return;

        // додаємо кореневий блок
        api.addRoot();
        // після addRoot новий блок уже вибраний → налаштовуємо як контейнер
        api.updateSelected((b) => {
          b.display = "flex";
          b.dir = "column";
          b.gap = 24;
          b.maxWidth = ""; // full width
          b.padding = { t: 24, r: 24, b: 24, l: 24 };
        });
      });

    // зміна макс. ширини контейнера
    controls.maxWidth &&
      controls.maxWidth.addEventListener("change", () => {
        const v = controls.maxWidth.value;
        api.updateSelected((b) => {
          // працюємо тільки якщо це root-контейнер (перевірка в refreshWorkspaceUI)
          b.maxWidth = v ? v + "px" : "";
        });
      });

    // зміна паддінга контейнера
    controls.padding &&
      controls.padding.addEventListener("input", () => {
        const v = Math.max(0, Number(controls.padding.value) || 0);
        api.updateSelected((b) => {
          b.padding = b.padding || { t: 0, r: 0, b: 0, l: 0 };
          b.padding.t = b.padding.r = b.padding.b = b.padding.l = v;
        });
      });

    // початкове оновлення
    refreshWorkspaceUI(api.getSelected ? api.getSelected() : null);

    console.log("[design:workspace] Робоче середовище ініціалізовано");
  }

  window.STInspectorWorkspace = { init };
})();
