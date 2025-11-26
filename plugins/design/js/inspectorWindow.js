(function (global) {
  const LS_OPEN = "insp:open"; // '1' | '0'
  const LS_SIDE = "insp:side"; // 'right' | 'left'

  function $(sel, root = document) {
    return root.querySelector(sel);
  }

  function persistOpen(v) {
    try {
      localStorage.setItem(LS_OPEN, v ? "1" : "0");
    } catch { }
  }
  function restoreOpen() {
    try {
      return localStorage.getItem(LS_OPEN) !== "0";
    } catch {
      return true;
    }
  }

  function persistSide(side) {
    try {
      localStorage.setItem(LS_SIDE, side);
    } catch { }
  }
  function restoreSide() {
    try {
      return localStorage.getItem(LS_SIDE) || "right";
    } catch {
      return "right";
    }
  }

  async function fetchHTML(url) {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) throw new Error(`Інспектор HTML не знайдено за ${url}`);
    return await res.text();
  }

  function ensureOpenButton(toolbar, onClick) {
    let btn = toolbar.querySelector("#open-inspector");
    if (!btn) {
      btn = document.createElement("button");
      btn.id = "open-inspector";
      btn.className = "btn ghost";
      btn.textContent = "Відкрити інспектор";
      btn.addEventListener("click", onClick);
      const tail = toolbar.querySelector(".small");
      toolbar.insertBefore(btn, tail || null);
    }
    return btn;
  }
  function removeOpenButton(toolbar) {
    const btn = toolbar && toolbar.querySelector("#open-inspector");
    if (btn) btn.remove();
  }

  function moveTo(slot, panel) {
    if (!slot || !panel) return;
    // не дублюємо — переносимо існуючий вузол:
    slot.appendChild(panel);
  }

  function applyState(app, side, open) {
    app.classList.toggle("insp-left", side === "left");
    app.classList.toggle("insp-closed", !open);
  }

  async function initInspector(opts) {
    const {
      rightSlotSel = "#right",
      leftSlotSel = "#left",
      appSel = ".st-app",
      toolbarSel = ".toolbar",
      htmlUrl = "plugins/design/assets/inspector.html",
    } = opts || {};

    const app = $(appSel);
    const toolbar = $(toolbarSel);
    const right = $(rightSlotSel) || $(".right"); // запасний варіант
    const left = $(leftSlotSel);

    if (!app || !toolbar || !right || !left) {
      console.warn("[InspectorWindow] Не знайдено необхідні контейнери");
      return;
    }

    // Завантажуємо HTML і вставляємо у #right (дефолт)
    const html = await fetchHTML(htmlUrl);
    right.innerHTML = html;

    const panel = right.firstElementChild || right; // кореневий вузол інспектора
    const btnMove = panel.querySelector(
      '[data-action="move"], #move-inspector'
    );
    const btnClose = panel.querySelector('[data-action="close"], [data-close]');

    // Відновлюємо стан
    let side = restoreSide(); // 'right' | 'left'
    let open = restoreOpen(); // true | false

    // Початкове розміщення
    if (side === "left") moveTo(left, panel);
    else moveTo(right, panel);
    applyState(app, side, open);

    // Якщо закрито — показуємо кнопку відкриття в тулбарі
    if (!open) {
      ensureOpenButton(toolbar, () => {
        open = true;
        persistOpen(open);
        removeOpenButton(toolbar);
        applyState(app, side, open);
      });
    } else {
      removeOpenButton(toolbar);
    }

    // Обробники
    if (btnMove) {
      btnMove.addEventListener("click", () => {
        side = side === "left" ? "right" : "left";
        persistSide(side);

        if (side === "left") moveTo(left, panel);
        else moveTo(right, panel);

        // Якщо було закрито — все одно залишаємо закритим, тільки переносимо
        applyState(app, side, open);
      });
    }

    if (btnClose) {
      btnClose.addEventListener("click", () => {
        open = false;
        persistOpen(open);
        applyState(app, side, open);
        ensureOpenButton(toolbar, () => {
          open = true;
          persistOpen(open);
          removeOpenButton(toolbar);
          applyState(app, side, open);
        });
      });
    }

    // Експорт «на всяк» (можеш дергати з index.js)
    return {
      open() {
        if (!open) {
          open = true;
          persistOpen(open);
          removeOpenButton(toolbar);
          applyState(app, side, open);
        }
      },
      close() {
        if (open) {
          open = false;
          persistOpen(open);
          ensureOpenButton(toolbar, () => this.open());
          applyState(app, side, open);
        }
      },
      setSide(s) {
        side = s === "left" ? "left" : "right";
        persistSide(side);
        side === "left" ? moveTo(left, panel) : moveTo(right, panel);
        applyState(app, side, open);
      },
      destroy() {
        removeOpenButton(toolbar); /* залишаємо DOM як є */
      },
    };
  }

  global.InspectorWindow = { init: initInspector };
})(window);
(() => {
  const app = document.querySelector(".st-app");
  const slotLeft = document.getElementById("left");
  const slotRight = document.getElementById("right");

  // простенький API для твоєї кнопки «Перемістити/Закрити/Відкрити»
  window.InspectorSlots = {
    mountRight(htmlFragment) {
      // вставляємо інспектор у правий слот і перемикаємо класи
      if (slotRight && htmlFragment && !slotRight.firstChild) {
        slotRight.appendChild(htmlFragment);
      }
      app.classList.remove("insp-left", "insp-closed");
      app.classList.add("insp-right");
    },

    mountLeft(htmlFragment) {
      if (slotLeft && htmlFragment && !slotLeft.firstChild) {
        slotLeft.appendChild(htmlFragment);
      }
      app.classList.remove("insp-right", "insp-closed");
      app.classList.add("insp-left");
    },
    moveTo(side) {
      if (side === "left") {
        app.classList.remove("insp-right", "insp-closed");
        app.classList.add("insp-left");
      } else if (side === "right") {
        app.classList.remove("insp-left", "insp-closed");
        app.classList.add("insp-right");
      }
    },
    close() {
      app.classList.remove("insp-left", "insp-right");
      app.classList.add("insp-closed");
    },
    open(side = "right") {
      app.classList.remove("insp-closed");
      this.moveTo(side);
    },
    // опціонально: прибрати інспектор зі слотів (наприклад при unmount плагіна)
    clear() {
      if (slotLeft) slotLeft.innerHTML = "";
      if (slotRight) slotRight.innerHTML = "";
      this.close();
    },
  };
})();
