console.log("[design] index.js завантажений");

(function () {
  // ===== helper: чекати появи елемента в DOM
  const INSP_MIN_W = 350;
  const INSP_MAX_W = 500;
  const INSP_LS_KEY = "st:insp:width";

  function waitFor(sel, root = document, timeout = 7000) {
    const el = root.querySelector(sel);
    if (el) return Promise.resolve(el);

    return new Promise((resolve, reject) => {
      const mo = new MutationObserver(() => {
        const n = root.querySelector(sel);
        if (n) {
          mo.disconnect();
          clearTimeout(t);
          resolve(n);
        }
      });

      mo.observe(root === document ? document.documentElement : root, {
        childList: true,
        subtree: true,
      });

      const t = setTimeout(() => {
        mo.disconnect();
        reject(new Error("timeout " + sel));
      }, timeout);
    });
  }

  // ===== Ініціалізація ресайзу інспектора
  function initInspectorResize(host) {
    const left = host.querySelector(".insp-resizer.left");
    const right = host.querySelector(".insp-resizer.right");

    if (!left && !right) {
      console.warn("[design] insp-resizer elements not found");
      return;
    }
    // відновлюємо значення з localStorage, якщо воно є
    const raw = localStorage.getItem(INSP_LS_KEY);
    const saved = parseInt(raw, 10);

    if (!isNaN(saved) && saved >= INSP_MIN_W && saved <= INSP_MAX_W) {
      document.documentElement.style.setProperty("--insp-w", saved + "px");
    }

    const MIN = 350;
    const MAX = 500;

    const startResize = (side, startX) => {
      const root = document.documentElement;
      const current = parseInt(getComputedStyle(root).getPropertyValue("--insp-w")) || 380;

      const move = (ev) => {
        let w;

        if (side === "left") {
          w = current + (startX - ev.clientX);
        } else {
          w = current + (ev.clientX - startX);
        }

        if (w < MIN) w = MIN;
        if (w > MAX) w = MAX;

        root.style.setProperty("--insp-w", w + "px");
      };

      const up = () => {
        document.removeEventListener("mousemove", move);
        document.removeEventListener("mouseup", up);
        localStorage.setItem("st:insp:width", root.style.getPropertyValue("--insp-w"));
      };

      document.addEventListener("mousemove", move);
      document.addEventListener("mouseup", up);
    };


    left?.addEventListener("mousedown", (e) => startResize("left", e.clientX));
    right?.addEventListener("mousedown", (e) => startResize("right", e.clientX));
  }


  // ===== Головний bootstrap плагіна design
  async function bootstrap() {
    console.log("[design] bootstrap start");

    // 1) чекаємо, поки DOM готовий
    // (на випадок, якщо скрипт підключений без defer)
    if (document.readyState === "loading") {
      await new Promise((res) =>
        window.addEventListener("DOMContentLoaded", res, { once: true })
      );
    }

    // 2) чекаємо основний layout конструктора
    await waitFor(".st-app");
    await waitFor("#right");
    await waitFor("#left");

    const host =
      document.querySelector('[data-plugin="design"] .st-app') ||
      document.querySelector(".st-app");

    if (!host) {
      console.warn("[design] не знайдено .st-app");
      return;
    }

    // 3) підключаємо HTML інспектора у #right / #left
    let inspApi = null;
    if (window.InspectorWindow) {
      inspApi = await window.InspectorWindow.init({
        rightSlotSel: '#right',
        leftSlotSel: '#left',
        appSel: '.st-app[data-plugin="design"]',
        toolbarSel: '.st-app[data-plugin="design"] .st-editor-top .toolbar',
        htmlUrl: "plugins/design/assets/inspector.html",
      });
      console.log("[design] InspectorWindow init OK", inspApi);
    } else {
      console.warn("[design] InspectorWindow не знайдено");
    }

    // 4) монтуємо ядро конструктора
    if (!window.STDesignCore) {
      console.warn("[design] STDesignCore не підключений");
      return;
    }

    // 🆕 читаємо з hash / localStorage яку сторінку треба відкрити
    // формат, наприклад: #/design?site=SITE_ID&page=PAGE_ID
    const params = new URLSearchParams(location.hash.split("?")[1] || "");
    const siteId = params.get("site");
    const part = params.get("part") || "body";
    const pageId = params.get("page") || "page_home";

    if (window.STDesignCore.setStorageKey) {
      if (siteId && part === "header") {
        window.STDesignCore.setStorageKey(`st:design:site:${siteId}:layout:header`);
      } else if (siteId && part === "footer") {
        window.STDesignCore.setStorageKey(`st:design:site:${siteId}:layout:footer`);
      } else if (siteId && pageId) {
        window.STDesignCore.setStorageKey(`st:design:site:${siteId}:page:${pageId}`);
      } else {
        window.STDesignCore.setStorageKey("st:design:blocks:v2");
      }
    }


    const coreApi = window.STDesignCore.mount(host);
    console.log("[design] core mounted", coreApi);

    // 5) тулбар (Нова секція / Вставити / Дублювати / Видалити)
    if (window.STDesignToolbar) {
      window.STDesignToolbar.init(host, coreApi);
    } else {
      console.warn("[design] STDesignToolbar не знайдено");
    }

    // 6) чекаємо, поки в інспекторі зʼявиться .insp-body
    let inspRoot = document.querySelector(".insp-body");
    if (!inspRoot) {
      try {
        inspRoot = await waitFor(".insp-body", host, 7000);
      } catch (e) {
        console.warn("[design] інспектора не знайдено в DOM:", e);
        return;
      }
    }

    // 7) ініціалізуємо модулі інспектора
    if (window.STInspectorLayout) STInspectorLayout.init(coreApi, inspRoot);
    if (window.STInspectorSize) STInspectorSize.init(coreApi, inspRoot);
    if (window.STInspectorBg) STInspectorBg.init(coreApi, inspRoot);
    if (window.STInspectorBorder) STInspectorBorder.init(coreApi, inspRoot);
    if (window.STInspectorShadows) STInspectorShadows.init(coreApi, inspRoot);
    if (window.STInspectorScroll) STInspectorScroll.init(coreApi, inspRoot);
    if (window.STInspectorCopy) STInspectorCopy.init(coreApi, inspRoot);
    if (window.STInspectorWorkspace) STInspectorWorkspace.init(coreApi, inspRoot);
    if (window.STInspectorOverlay) STInspectorOverlay.init(coreApi, inspRoot);
    if (window.STInspectorCustomCss) STInspectorCustomCss.init(coreApi, inspRoot);


    // 5) ресайз інспектора
    initInspectorResize(host);

    console.log("[design] прив’язки інспектора підключені");
  }

  // одразу запускаємо bootstrap
  bootstrap().catch((err) => {
    console.error("[design] помилка bootstrap:", err);
  });
})();
