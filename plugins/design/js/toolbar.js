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
      const fsBtn = document.createElement("button");
      fsBtn.type = "button";
      fsBtn.className = "btn icon";
      fsBtn.title = "Прев'ю на весь екран";
      fsBtn.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
          <path fill="currentColor"
            d="M3 3h4v1.5H4.5V7H3V3zm6 0h4v4h-1.5V4.5H9V3zm-5.5 6H3v4h4v-1.5H3.5V9zm8 2.5H9V13h4V9h-1.5v2.5z"/>
        </svg>
      `;
      toolbar.appendChild(fsBtn);

      const canvas = host.querySelector("#canvas");
      let canvasFullscreen = false;

      const applyFullscreen = (state) => {
        canvasFullscreen = state;
        if (canvas) {
          canvas.classList.toggle("st-fullscreen", canvasFullscreen);
        }
        fsBtn.classList.toggle("active", canvasFullscreen);
      };

      fsBtn.addEventListener("click", () => {
        applyFullscreen(!canvasFullscreen);
      });
      // ESC для выхода з fullscreen
      const escHandler = (e) => {
        if (e.key === "Escape" && canvasFullscreen) {
          applyFullscreen(false);
        }
      };
      document.addEventListener("keydown", escHandler);

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
