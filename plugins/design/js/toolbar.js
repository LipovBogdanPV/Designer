//canvas
// plugins/design/js/toolbar.js
(function () {
  window.STDesignToolbar = {
    async init(host, coreApi) {
      const toolbar = host.querySelector(".toolbar");
      if (!toolbar) return;

      const btnAddRoot = toolbar.querySelector("#add-root");
      const btnAddChild = toolbar.querySelector("#add-child");
      const btnDup = toolbar.querySelector("#dup");
      const btnDel = toolbar.querySelector("#del");
      const btnHelp = toolbar.querySelector("#design-help");
      const selLabel = toolbar.querySelector("#selLabel");
      const btnText = host.querySelector("#addText");
      const btnH2 = host.querySelector("#addH2");
      const btnImg = host.querySelector("#addImg");


      // ===== Основні кнопки тулбара =====
      btnAddRoot &&
        btnAddRoot.addEventListener("click", () => coreApi.addRoot());
      btnAddChild &&
        btnAddChild.addEventListener("click", () => coreApi.addChild());
      btnDup && btnDup.addEventListener("click", () => coreApi.duplicate());
      btnDel &&
        btnDel.addEventListener("click", () => coreApi.deleteSelected());
      btnText && btnText.addEventListener("click", () => coreApi.addText());
      btnH2?.addEventListener("click", () => coreApi.addHeading());
      btnImg?.addEventListener("click", () => coreApi.addImage());

      // Підписка на зміну виділення
      coreApi.subscribeSelection &&
        coreApi.subscribeSelection((sel) => {
          if (selLabel) {
            selLabel.textContent = sel ? `ID: ${sel.id}` : "Немає вибору";
          }
        });

      // Hotkey: Delete / Backspace
      const keydownHandler = (e) => {
        if (
          (e.key === "Delete") &&
          !["INPUT", "TEXTAREA", "SELECT"].includes(
            document.activeElement?.tagName
          )
        ) {
          e.preventDefault();
          coreApi.deleteSelected();
        }
      };
      document.addEventListener("keydown", keydownHandler);

      // ===== FULLSCREEN PREVIEW BUTTON =====
      // ===== POPUP PREVIEW (повноекранний перегляд) =====
      const previewBtn = document.createElement("button");
      previewBtn.type = "button";
      previewBtn.className = "btn icon";
      previewBtn.title = "Попередній перегляд сторінки";
      previewBtn.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
          <path fill="currentColor"
            d="M2 3.5A1.5 1.5 0 0 1 3.5 2h9A1.5 1.5 0 0 1 14 3.5v9a.5.5 0 0 1-1 0v-9a.5.5 0 0 0-.5-.5h-9A.5.5 0 0 0 3 3.5v9a.5.5 0 0 1-1 0v-9z"/>
          <path fill="currentColor"
            d="M4.5 5A1.5 1.5 0 0 1 6 3.5h6A1.5 1.5 0 0 1 13.5 5v6A1.5 1.5 0 0 1 12 12.5H6A1.5 1.5 0 0 1 4.5 11V5z"/>
        </svg>
      `;
      toolbar.appendChild(previewBtn);

      let previewMode = false;
      let previewExitBtn = null;

      const applyPreviewMode = (state) => {
        previewMode = state;

        // вішаємо клас на <html>, щоб через CSS сховати редактор
        document.documentElement.classList.toggle(
          "st-design-preview",
          previewMode
        );

        previewBtn.classList.toggle("active", previewMode);

        // створюємо / показуємо кнопку "Назад до редактора"
        if (previewMode) {
          if (!previewExitBtn) {
            previewExitBtn = document.createElement("button");
            previewExitBtn.type = "button";
            previewExitBtn.className = "preview-exit-btn";
            previewExitBtn.innerHTML = `
              <span>← Назад до редактора</span>
            `;
            document.body.appendChild(previewExitBtn);

            previewExitBtn.addEventListener("click", () => {
              applyPreviewMode(false);
            });
          }
          previewExitBtn.style.display = "flex";
        } else if (previewExitBtn) {
          previewExitBtn.style.display = "none";
        }
      };

      previewBtn.addEventListener("click", () => {
        applyPreviewMode(!previewMode);
      });

      // ESC вихід з превʼю
      const escHandler = (e) => {
        if (e.key === "Escape" && previewMode) {
          applyPreviewMode(false);
        }
      };
      document.addEventListener("keydown", escHandler);
      // 
      const btnPreviewPage = document.createElement("button");
      btnPreviewPage.type = "button";
      btnPreviewPage.className = "btn";
      btnPreviewPage.title = "Попередній перегляд сторінки";
      btnPreviewPage.textContent = "Превʼю";
      toolbar.appendChild(btnPreviewPage);

      btnPreviewPage.addEventListener("click", async () => {
        const qs = location.hash.split("?")[1] || ""; // site/page/part з конструктора
        const hashTail = qs ? `#/?${qs}` : "";

        const abs = `${location.origin}/plugins/design/assets/test.html${hashTail}`;
        const rel = `plugins/design/assets/test.html${hashTail}`;

        try {
          // пробуємо absolute
          const r1 = await fetch(abs.split("#")[0], { method: "GET", cache: "no-store" });
          if (r1.ok) return window.open(abs, "_blank");
        } catch { }

        try {
          // fallback relative
          const r2 = await fetch(rel.split("#")[0], { method: "GET", cache: "no-store" });
          if (r2.ok) return window.open(rel, "_blank");
        } catch { }

        alert("Не вдалося завантажити test.html або некоректний шлях до test.html");
      });



      // ===== HELP MODAL =====
      if (btnHelp) {
        try {
          const html = await fetch("plugins/design/assets/help.html").then(
            (r) => {
              if (!r.ok) throw new Error(`HTTP ${r.status}`);
              return r.text();
            }
          );

          const modalBackdrop = document.createElement("div");
          modalBackdrop.id = "design-help-modal";
          modalBackdrop.className = "st-modal-backdrop";
          modalBackdrop.innerHTML = html;
          host.appendChild(modalBackdrop);

          const closeBtn = modalBackdrop.querySelector("[data-close]");
          const openModal = () => modalBackdrop.classList.add("open");
          const closeModal = () => modalBackdrop.classList.remove("open");

          btnHelp.addEventListener("click", openModal);
          closeBtn && closeBtn.addEventListener("click", closeModal);

          modalBackdrop.addEventListener("click", (e) => {
            if (e.target === modalBackdrop) closeModal();
          });

          document.addEventListener("keydown", (e) => {
            if (
              e.key === "Escape" &&
              modalBackdrop.classList.contains("open")
            ) {
              closeModal();
            }
          });
        } catch (err) {
          console.warn("[toolbar] help.html не завантажений:", err);
        }
      }

      // ===== Cleanup (опціонально) =====
      window._STDesignToolbarCleanup = () => {
        document.removeEventListener("keydown", keydownHandler);
        document.removeEventListener("keydown", escHandler);
      };
    },
  };
})();
