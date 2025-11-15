(function () {
  const LS_KEY = "builder:ui-settings:v1";
  const NAV_KEY = "builder:nav-order:v1";

  // Значення за замовчуванням (як у твоїй попередній версії)
  const defaults = {
    sidebar: {
      text: "#e5e7eb",
      bg: "#101827",
      hoverBg: "rgba(255,255,255,.06)",
      activeBg: "rgba(109,94,252,.16)",
      borderColor: "#1f2a44",
      borderW: "1px",
      radius: "10px",
      shadow: "none",
      w: "272px",
      wCompact: "72px",
    },
    logo: {
      padX: "12px",
      padY: "14px",
      iconSize: 40,
      wideH: "28px",
      gap: "12px",
      underlineW: "1px",
      underlineColor: "#000000",
    },
    panel: {
      pageBg: "#0f172a",
      bg: "#101827",
      border: "#1f2a44",
      shadow: "none",
      radius: "12px",
      text: "#e5e7eb",
      muted: "#9ca3af",
      fontBase: 14,
    },
    btn: {
      bg: "#1b2336",
      hover: "#1f2937",
      text: "#e5e7eb",
      radius: "8px",
      border: "#1f2a44",
    },
    table: {
      rowHover: "#162036",
      border: "#1f2a44",
      radius: "12px",
      pad: "10px 12px",
    },
  };

  // Допоміжні
  const deepMerge = (a, b) =>
    JSON.parse(
      JSON.stringify(
        Object.assign({}, a, b, {
          sidebar: Object.assign({}, a.sidebar, b.sidebar || {}),
          logo: Object.assign({}, a.logo, b.logo || {}),
          panel: Object.assign({}, a.panel, b.panel || {}),
          btn: Object.assign({}, a.btn, b.btn || {}),
          table: Object.assign({}, a.table, b.table || {}),
        })
      )
    );
  const loadSettings = () => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      return raw ? deepMerge(defaults, JSON.parse(raw)) : defaults;
    } catch {
      return defaults;
    }
  };
  const saveSettings = (cfg) => {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(cfg));
    } catch {}
  };
  const readOrder = () => {
    try {
      return JSON.parse(localStorage.getItem(NAV_KEY) || "[]");
    } catch {
      return [];
    }
  };
  const writeOrder = (order) => {
    try {
      localStorage.setItem(NAV_KEY, JSON.stringify(order));
    } catch {}
  };

  // Застосувати в CSS змінні
  function apply(cfg) {
    const r = document.documentElement.style;
    r.setProperty("--sidebar-text", cfg.sidebar.text);
    r.setProperty("--sidebar-bg", cfg.sidebar.bg);
    r.setProperty("--sidebar-hover", cfg.sidebar.hoverBg);
    r.setProperty("--sidebar-active", cfg.sidebar.activeBg);
    r.setProperty("--sidebar-border", cfg.sidebar.borderColor);
    r.setProperty("--sidebar-border-w", cfg.sidebar.borderW);
    r.setProperty("--sidebar-radius", cfg.sidebar.radius);
    r.setProperty("--sidebar-shadow", cfg.sidebar.shadow);
    r.setProperty("--sidebar-w", cfg.sidebar.w);
    r.setProperty("--sidebar-w-compact", cfg.sidebar.wCompact);
    r.setProperty("--logo-pad-x", cfg.logo.padX);
    r.setProperty("--logo-pad-y", cfg.logo.padY);
    r.setProperty("--logo-icon", cfg.logo.iconSize + "px");
    r.setProperty("--logo-wide-h", cfg.logo.wideH);
    r.setProperty("--logo-gap", cfg.logo.gap);
    r.setProperty("--logo-underline-w", cfg.logo.underlineW);
    r.setProperty("--logo-underline", cfg.logo.underlineColor);
    r.setProperty("--btn-bg", cfg.btn.bg);
    r.setProperty("--btn-hover", cfg.btn.hover);
    r.setProperty("--btn-text", cfg.btn.text);
    r.setProperty("--btn-radius", cfg.btn.radius);
    r.setProperty("--btn-border", cfg.btn.border);
    r.setProperty("--tbl-row-hover", cfg.table.rowHover);
    r.setProperty("--tbl-border", cfg.table.border);
    r.setProperty("--tbl-radius", cfg.table.radius);
    r.setProperty("--tbl-pad", cfg.table.pad);
    // Панелі/картки + типографіка та текст
    r.setProperty("--bg", cfg.panel.pageBg);
    document.body.style.background = cfg.panel.pageBg;
    r.setProperty("--panel-bg", cfg.panel.bg);
    r.setProperty("--panel-border", cfg.panel.border);
    r.setProperty("--panel-shadow", cfg.panel.shadow);
    r.setProperty("--panel-radius", cfg.panel.radius);
    // НОВЕ: кольори тексту (використовуються по всьому UI)
    r.setProperty("--text", cfg.panel.text);
    r.setProperty("--muted", cfg.panel.muted);
    // НОВЕ: базовий розмір шрифту
    document.body.style.fontSize = (Number(cfg.panel.fontBase) || 14) + "px";
  }

  function hydrateForm(host, cfg) {
    host.querySelectorAll("[data-key]").forEach((el) => {
      const path = el.dataset.key.split(".");
      let v = cfg[path[0]][path[1]];
      if (el.type === "number") v = parseInt(v, 10);
      el.value = v;
    });
  }
  function collectForm(host) {
    const out = deepMerge(defaults, {});
    host.querySelectorAll("[data-key]").forEach((el) => {
      const [group, key] = el.dataset.key.split(".");
      out[group][key] = el.type === "number" ? Number(el.value) : el.value;
    });
    return out;
  }
  function downloadJSON(filename, data) {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(
      new Blob([JSON.stringify(data, null, 2)], { type: "application/json" })
    );
    a.download = filename;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }

  // ====== Навігація: рендер списку та DnD ======
  function currentIdsFromManifests() {
    const ms = window.__pluginManifests || [];
    return ms.map((m) => m.id);
  }
  function normalizedOrder() {
    const saved = readOrder();
    const known = new Set(currentIdsFromManifests());
    const out = saved.filter((id) => known.has(id));
    // додати нові, якщо з’явились
    currentIdsFromManifests().forEach((id) => {
      if (!out.includes(id)) out.push(id);
    });
    return out;
  }

  function renderNavList(host) {
    const listEl = host.querySelector("#navList");
    const manifests = window.__pluginManifests || [];
    const ids = normalizedOrder();

    listEl.innerHTML = "";
    ids.forEach((id) => {
      const m = manifests.find((x) => x.id === id);
      const li = document.createElement("li");
      li.dataset.id = id;
      li.draggable = true;
      li.innerHTML = `
        <span class="grab" aria-label="Перетягнути"><i data-lucide="grip-vertical"></i></span>
        <span class="name"><i data-lucide="${m.icon}"></i> ${m.name}</span>
        <span class="id">${id}</span>
      `;
      listEl.appendChild(li);
    });
    if (window.lucide) lucide.createIcons();

    enableDnD(listEl, host); // підключаємо drag&drop
  }

  function enableDnD(listEl, host) {
    let draggingEl = null;

    listEl.addEventListener("dragstart", (e) => {
      const li = e.target.closest("li");
      if (!li) return;
      draggingEl = li;
      li.classList.add("dragging");
      e.dataTransfer.effectAllowed = "move";
      // для Firefox потрібно задати дані
      e.dataTransfer.setData("text/plain", "drag");
    });

    listEl.addEventListener("dragover", (e) => {
      e.preventDefault();
      const after = getDragAfterElement(listEl, e.clientY);
      listEl
        .querySelectorAll("li")
        .forEach((li) => li.classList.remove("drop-before", "drop-after"));
      if (!after) {
        const last = listEl.lastElementChild;
        if (last && last !== draggingEl) last.classList.add("drop-after");
      } else {
        after.classList.add("drop-before");
      }
    });

    listEl.addEventListener("drop", (e) => {
      e.preventDefault();
      const after = getDragAfterElement(listEl, e.clientY);
      listEl
        .querySelectorAll("li")
        .forEach((li) => li.classList.remove("drop-before", "drop-after"));
      if (!draggingEl) return;
      if (!after) listEl.appendChild(draggingEl);
      else listEl.insertBefore(draggingEl, after);
      persistOrder(host);
    });

    listEl.addEventListener("dragend", () => {
      draggingEl?.classList.remove("dragging");
      draggingEl = null;
    });

    function getDragAfterElement(container, y) {
      const els = [...container.querySelectorAll("li:not(.dragging)")];
      let closest = null;
      let closestOffset = Number.NEGATIVE_INFINITY;
      els.forEach((el) => {
        const box = el.getBoundingClientRect();
        const offset = y - (box.top + box.height / 2);
        // шукаємо елемент, найближчий зверху
        if (offset < 0 && offset > closestOffset) {
          closestOffset = offset;
          closest = el;
        }
      });
      return closest;
    }
  }

  function getOrderFromDOM(host) {
    return Array.from(host.querySelectorAll("#navList li")).map(
      (li) => li.dataset.id
    );
  }
  function persistOrder(host) {
    const ids = getOrderFromDOM(host);
    writeOrder(ids);
    // повідомити шаблонізатор — хай перемалює ліве меню
    document.dispatchEvent(
      new CustomEvent("nav:order-changed", { detail: { order: ids } })
    );
  }

  // ====== API плагіна ======
  function mount(host) {
    const cfg = loadSettings();
    apply(cfg);
    hydrateForm(host, cfg);

    // live-апдейт стилів
    host.addEventListener("input", (e) => {
      const t = e.target;
      if (!t.matches("[data-key]")) return;
      const next = collectForm(host);
      apply(next);
    });

    // Кнопки збереження/скидання/експорт/імпорт (включно з порядком меню)
    host.querySelector('[data-act="save"]').addEventListener("click", () => {
      const next = collectForm(host);
      saveSettings(next);
      persistOrder(host);
    });
    host.querySelector('[data-act="reset"]').addEventListener("click", () => {
      hydrateForm(host, defaults);
      apply(defaults);
      saveSettings(defaults);
      // порядок залишаємо як є — щоб випадково не зіпсувати користувачеві
    });
    host.querySelector('[data-act="export"]').addEventListener("click", () => {
      const data = collectForm(host);
      data.navOrder = getOrderFromDOM(host);
      downloadJSON("ui-settings.json", data);
    });
    const file = host.querySelector("#importFile");
    host
      .querySelector('[data-act="import"]')
      .addEventListener("click", () => file.click());
    file.addEventListener("change", async () => {
      const f = file.files[0];
      if (!f) return;
      try {
        const text = await f.text();
        const parsed = JSON.parse(text);
        const data = deepMerge(defaults, parsed);
        hydrateForm(host, data);
        apply(data);
        saveSettings(data);

        if (Array.isArray(parsed.navOrder)) {
          writeOrder(parsed.navOrder);
          document.dispatchEvent(
            new CustomEvent("nav:order-changed", {
              detail: { order: parsed.navOrder },
            })
          );
        }
      } catch {
        alert("Невірний JSON");
      } finally {
        file.value = "";
      }
    });

    // Рендер списку плагінів + DnD
    renderNavList(host);
  }

  function unmount() {}

  window.__plugins = window.__plugins || {};
  window.__plugins["ui-settings"] = { mount, unmount };
})();
