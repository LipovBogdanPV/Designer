// plugins/design/js/templates.js (або встав у свій ui/toolbar файл)
(function () {
    const TPL_KEY = "st:design:templates:v1";

    const $ = (sel, root = document) => root.querySelector(sel);

    function loadTpls() {
        try {
            return JSON.parse(localStorage.getItem(TPL_KEY) || "[]");
        } catch {
            return [];
        }
    }

    function saveTpls(list) {
        localStorage.setItem(TPL_KEY, JSON.stringify(list));
    }

    function uid() {
        return Math.random().toString(36).slice(2, 9);
    }

    function cloneDeep(obj) {
        return JSON.parse(JSON.stringify(obj));
    }

    function assignNewIds(block) {
        // щоб вставка не ламала id та selection
        block.id = uid();
        (block.children || []).forEach(assignNewIds);
        return block;
    }

    function downloadJson(filename, data) {
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(a.href), 500);
    }

    function renderTplList(root) {
        const listEl = $("#tplList", root);
        if (!listEl) return;

        const tpls = loadTpls();

        if (!tpls.length) {
            listEl.innerHTML = `<div class="muted">Немає шаблонів</div>`;
            return;
        }

        listEl.innerHTML = tpls
            .map(
                (t) => `
      <div class="tpl-item" data-id="${t.id}">
        <div class="tpl-title">${escapeHtml(t.name || "Без назви")}</div>
        <div class="tpl-meta">${escapeHtml(t.cat || "")} · ${new Date(t.createdAt).toLocaleString()}</div>
        <div class="tpl-actions">
          <button class="btn small" data-action="apply">Вставити</button>
          <button class="btn small danger" data-action="delete">✕</button>
        </div>
      </div>
    `
            )
            .join("");
    }

    // маленький helper щоб не тягнути XSS у список
    function escapeHtml(s) {
        return String(s ?? "")
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll('"', "&quot;")
            .replaceAll("'", "&#039;");
    }

    function getPayloadByCategory(cat) {
        // cat: section|header|main|footer
        const core = window.STDesignCore;
        if (!core) return null;

        const state = core.getState();
        const selected = core.getSelected();

        if (cat === "section") {
            // зберігаємо ВИБРАНИЙ блок як секцію
            if (!selected) return null;
            return { kind: "block", block: cloneDeep(selected) };
        }

        // header/main/footer — зберігаємо ВСЮ структуру (rootBlocks)
        return { kind: "root", rootBlocks: cloneDeep(state.rootBlocks || []) };
    }

    function applyTemplateToCanvas(tpl) {
        const core = window.STDesignCore;
        if (!core) return;

        if (tpl.payload?.kind === "block") {
            const src = cloneDeep(tpl.payload.block);
            assignNewIds(src);

            const sel = core.getSelected();
            if (sel) {
                // вставляємо як дитину вибраного контейнера
                core.updateSelected((b) => {
                    b.children = b.children || [];
                    b.children.push(src);
                });
            } else {
                // якщо нічого не вибрано — додаємо в root
                const st = core.getState();
                st.rootBlocks.push(src);
                // легкий хак: оновлюємо через updateSelected не вийде
                // тому просто збережемо напряму в storage через core.setStorageKey + localStorage
                // але краще: зроби в core API метод setState(). Якщо немає — вставляй через UI (вибір root).
                // Тут мінімально: додамо root блок через addRoot(), а потім замінимо його children:
                core.addRoot(); // створить пустий root і зробить selected
                core.updateSelected((b) => Object.assign(b, src));
            }
            return;
        }

        if (tpl.payload?.kind === "root") {
            // ⚠️ це замінює весь поточний canvas (header/main/footer — ти сам обираєш part)
            // Найправильніше зробити в core API метод setState(rootBlocks, selectedId).
            // Якщо його немає — робимо через прямий localStorage запис у поточний STORAGE_KEY.
            const keyGuess = localStorageKeyGuessFromCore();
            if (!keyGuess) return;

            localStorage.setItem(
                keyGuess,
                JSON.stringify({ rootBlocks: cloneDeep(tpl.payload.rootBlocks || []), selectedId: null })
            );

            // перерендер: просто перезавантажити сторінку або перемонтувати плагін
            // мінімально: тригернемо hashchange, щоб Design перемонтувався
            window.dispatchEvent(new Event("hashchange"));
            return;
        }
    }

    function localStorageKeyGuessFromCore() {
        // core.js всередині тримає STORAGE_KEY, але назовні ми його не читаємо
        // Тому: збережи його сам у window.ST_DESIGN_STORAGE_KEY, коли ставиш setStorageKey(...)
        // Нижче — беремо звідти:
        return window.ST_DESIGN_STORAGE_KEY || null;
    }

    function mountTemplatesUI(root) {
        const nameEl = $("#tplName", root);
        const catEl = $("#tplCat", root);
        const btnSave = $("#saveTpl", root);
        const btnExport = $("#exportTpl", root);
        const fileImport = $("#importFile", root);
        const listEl = $("#tplList", root);

        if (!btnSave || !btnExport || !fileImport || !listEl) return;

        renderTplList(root);

        btnSave.addEventListener("click", () => {
            const name = (nameEl?.value || "").trim() || "Template " + new Date().toLocaleString();
            const cat = catEl?.value || "section";

            const payload = getPayloadByCategory(cat);
            if (!payload) {
                alert(cat === "section" ? "Спочатку вибери блок (section) для збереження." : "Немає даних для збереження.");
                return;
            }

            const tpls = loadTpls();
            tpls.unshift({
                id: "tpl_" + uid(),
                name,
                cat,
                payload,
                createdAt: Date.now(),
            });
            saveTpls(tpls);
            renderTplList(root);
        });

        btnExport.addEventListener("click", () => {
            const tpls = loadTpls();
            downloadJson("shift-time-templates.json", { version: 1, templates: tpls });
        });

        fileImport.addEventListener("change", async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;

            try {
                const text = await file.text();
                const parsed = JSON.parse(text);

                const incoming = Array.isArray(parsed?.templates) ? parsed.templates : Array.isArray(parsed) ? parsed : null;
                if (!incoming) throw new Error("Невірний формат JSON");

                // merge за id
                const current = loadTpls();
                const map = new Map(current.map((t) => [t.id, t]));
                incoming.forEach((t) => {
                    if (!t?.id) t.id = "tpl_" + uid();
                    map.set(t.id, t);
                });

                const merged = Array.from(map.values()).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
                saveTpls(merged);
                renderTplList(root);

                e.target.value = "";
            } catch (err) {
                console.error(err);
                alert("Не вдалося імпортувати JSON (перевір формат).");
            }
        });

        listEl.addEventListener("click", (e) => {
            const item = e.target.closest(".tpl-item");
            if (!item) return;

            const id = item.dataset.id;
            const action = e.target.closest("button")?.dataset.action;
            if (!id || !action) return;

            const tpls = loadTpls();
            const tpl = tpls.find((t) => t.id === id);
            if (!tpl) return;

            if (action === "apply") {
                applyTemplateToCanvas(tpl);
            }

            if (action === "delete") {
                const ok = confirm(`Видалити шаблон "${tpl.name}"?`);
                if (!ok) return;
                saveTpls(tpls.filter((t) => t.id !== id));
                renderTplList(root);
            }
        });
    }

    // робимо глобально доступним, щоб викликати з design plugin mount
    window.STDesignTemplates = { mountTemplatesUI };
})();
