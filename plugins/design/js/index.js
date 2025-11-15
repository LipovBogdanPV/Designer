console.log("[design] index.js завантажений");

(function () {
  // ===== helper: чекати появи елемента в DOM
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
        rightSlotSel: "#right",
        leftSlotSel: "#left",
        appSel: ".st-app",
        toolbarSel: ".toolbar",
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

    console.log("[design] прив’язки інспектора підключені");
  }

  // одразу запускаємо bootstrap
  bootstrap().catch((err) => {
    console.error("[design] помилка bootstrap:", err);
  });
})();
