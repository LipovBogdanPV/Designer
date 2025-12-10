// plugins/design/js/inspector.custom.js
(function () {
    const $ = (sel, root = document) => root.querySelector(sel);

    function init(api, root = document) {
        if (!api) return;

        const field = $("#customCss", root);
        if (!field) return;

        // при старті блокуємо, щоб не редагувати без вибраного блоку
        field.disabled = true;

        // оновлюємо textarea при зміні селекта
        api.subscribeSelection((b) => {
            if (!b) {
                field.value = "";
                field.disabled = true;
                return;
            }
            field.disabled = false;
            field.value = b.customCss || "";
        });

        let timer = null;

        const apply = () => {
            const value = field.value;
            api.updateSelected((blk) => {
                blk.customCss = value;
            });
        };

        // трохи debounce, щоб не спамити updateSelected
        field.addEventListener("input", () => {
            clearTimeout(timer);
            timer = setTimeout(apply, 300);
        });

        field.addEventListener("blur", apply);

        console.log("[design:customCss] інспектор кастомних стилів ініціалізовано");
    }

    window.STInspectorCustomCss = { init };
})();
