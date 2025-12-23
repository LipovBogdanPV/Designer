// plugins/sites/js/sites.js
(function () {
    const SITES_KEY = "st:sites:v1";

    // глобальний стан плагіна
    let sitesState = [];   // масив сайтів
    let sitesRoot = null;  // кореневий елемент плагіна (host)

    const $ = (sel, root = document) => root.querySelector(sel);
    const uid = () => Math.random().toString(36).slice(2, 9);

    function writeDesignState(key, rootBlocks) {
        const payload = {
            rootBlocks: rootBlocks || [],
            selectedId: (rootBlocks && rootBlocks[0] && rootBlocks[0].id) ? rootBlocks[0].id : null
        };
        localStorage.setItem(key, JSON.stringify(payload));
    }

    function ensureEmptyDesignState(key) {
        if (localStorage.getItem(key)) return;
        writeDesignState(key, []);
    }


    // ---------- робота з localStorage ----------
    function loadSites() {
        try {
            const raw = localStorage.getItem(SITES_KEY);
            if (!raw) return [];
            return JSON.parse(raw);
        } catch (e) {
            console.warn("[sites] помилка читання localStorage", e);
            return [];
        }
    }

    function saveSites() {
        try {
            localStorage.setItem(SITES_KEY, JSON.stringify(sitesState));
        } catch (e) {
            console.warn("[sites] помилка збереження localStorage", e);
        }
    }

    // ---------- допоміжні ----------
    function findSite(id) {
        return sitesState.find((s) => s.id === id);
    }

    function deleteSite(id) {
        sitesState = sitesState.filter((s) => s.id !== id);
        saveSites();
        if (sitesRoot) {
            renderSitesList(sitesState, sitesRoot);
        }
    }

    function bindDeleteButtons(root) {
        root.querySelectorAll("#sitesList .delete").forEach((btn) => {
            btn.addEventListener("click", (e) => {
                const card = e.currentTarget.closest(".site-card");
                if (!card) return;

                const siteId = card.dataset.id;
                if (!siteId) return;

                const sure = confirm(
                    "Ви впевнені, що хочете видалити цей сайт? Дія незворотня."
                );
                if (!sure) return;

                deleteSite(siteId);
            });
        });
    }

    // ---------- рендер списку сайтів ----------
    function renderSitesList(sites, root) {
        const list = $("#sitesList", root);
        if (!list) return;

        list.innerHTML = "";
        sites.forEach((site) => {
            const div = document.createElement("div");
            div.className = "site-card";
            div.dataset.id = site.id;
            div.innerHTML = `
        <div class="title">${site.name || "Без назви"}</div>
        <div class="meta">${site.pages?.length || 0} сторінок</div>
        <div class="actions">
          <button data-id="${site.id}" data-action="edit" class="btn small">
            Налаштувати
          </button>
          <button class="btn small danger delete" title="Видалити сайт">
            <i data-lucide="trash"></i>
          </button>
        </div>
      `;
            list.appendChild(div);
        });

        if (window.lucide) lucide.createIcons();
        bindDeleteButtons(root);
    }

    // ---------- редактор одного сайту ----------
    function openSiteEditor(site, root) {
        const editor = $("#siteEditor", root);
        const inputName = $("#siteName", root);
        const inputSlug = $("#siteSlug", root);
        const tbody = $("#pagesList", root);
        const nd = $("#netlifyDashboard", root);
        const np = $("#netlifyPublic", root);

        const seo = site.seo || {};

        $("#siteSeoTitle", root).value = seo.title || "";
        $("#siteSeoDescription", root).value = seo.description || "";
        $("#siteSeoKeywords", root).value = seo.keywords || "";
        $("#siteSeoNoIndex", root).checked = !!seo.noIndex;
        $("#siteSeoOgImage", root).value = seo.ogImage || "";
        $("#siteSeoCustomHead", root).value = seo.customHead || "";

        if (!editor) return;

        editor.hidden = false;

        inputName.value = site.name || "";
        inputSlug.value = site.slug || "";
        nd.value = site.netlify?.dashboardUrl || "";
        np.value = site.netlify?.publicUrl || "";

        // рендер сторінок
        tbody.innerHTML = "";
        (site.pages || []).forEach((p) => {
            const tr = document.createElement("tr");
            const inNav = p.inNav !== false; // дефолт: true

            tr.innerHTML = `
                <td><input data-page="${p.id}" data-field="title" value="${p.title}" /></td>
                <td><input data-page="${p.id}" data-field="slug" value="${p.slug}" /></td>

                <td>
                    <label class="nav-toggle">
                    <input type="checkbox" data-page="${p.id}" data-field="inNav" ${inNav ? "checked" : ""}/>
                    <span>Меню</span>
                    </label>
                </td>

                <td>
                    <button class="btn small" data-page="${p.id}" data-action="editPage">Редагувати</button>
                    <button class="btn small danger" data-page="${p.id}" data-action="delPage">✕</button>
                </td>
                `;
            tbody.appendChild(tr);
        });

        editor.dataset.siteId = site.id;
    }

    // ---------- основна ініціалізація плагіна ----------
    function initSitesPlugin(root) {
        if (!root) return;

        sitesRoot = root;
        sitesState = loadSites();

        let currentSite = null;

        const btnCreate = $("#siteCreate", root);
        const btnAddPage = $("#pageAdd", root);
        const btnOpenNetlify = $("#btnOpenNetlify", root);
        const btnOpenPublic = $("#btnOpenPublic", root);
        const siteSeoTitle = $("#siteSeoTitle", root);
        const siteSeoDescription = $("#siteSeoDescription", root);
        const siteSeoKeywords = $("#siteSeoKeywords", root);
        const siteSeoNoIndex = $("#siteSeoNoIndex", root);
        const siteSeoOgImage = $("#siteSeoOgImage", root);
        const siteSeoCustomHead = $("#siteSeoCustomHead", root);

        const pageSeoModal = $("#pageSeoModal", root);
        const pageSeoTitle = $("#pageSeoTitle", root);
        const pageSeoDescription = $("#pageSeoDescription", root);
        const pageSeoKeywords = $("#pageSeoKeywords", root);
        const pageSeoNoIndex = $("#pageSeoNoIndex", root);
        const pageSeoOgImage = $("#pageSeoOgImage", root);
        const pageSeoSave = $("#pageSeoSave", root);
        const pageSeoCancel = $("#pageSeoCancel", root);

        let currentPageSeoId = null;

        renderSitesList(sitesState, root);

        function openPageSeo(page) {
            if (!pageSeoModal) return;
            const seo = page.seo || {};

            pageSeoTitle.value = seo.title || "";
            pageSeoDescription.value = seo.description || "";
            pageSeoKeywords.value = seo.keywords || "";
            pageSeoNoIndex.checked = !!seo.noIndex;
            pageSeoOgImage.value = seo.ogImage || "";

            currentPageSeoId = page.id;
            pageSeoModal.hidden = false;
        }

        function closePageSeo() {
            currentPageSeoId = null;
            if (pageSeoModal) pageSeoModal.hidden = true;
        }


        // Створити сайт
        /*
        btnCreate?.addEventListener("click", () => {
            const site = {
                id: "site_" + uid(),
                name: "Новий сайт",
                slug: "site-" + uid(),
                pages: [
                    {
                        id: "page_home", title: "Головна", slug: "index", seo: {
                            title: "",
                            description: "",
                            keywords: "",
                            noIndex: false,
                            ogImage: "",
                        }
                    },
                ],
                netlify: {},
                seo: {
                    title: "",          // <title> за замовчуванням
                    description: "",    // meta description
                    keywords: "",       // meta keywords (не обов'язково, але можна)
                    noIndex: false,     // <meta name="robots" content="noindex">
                    ogImage: "",        // URL для OpenGraph прев’ю
                    customHead: ""      // довільний HTML у <head>

                }


            };

            sitesState.push(site);
            saveSites();
            renderSitesList(sitesState, root);

            currentSite = site;
            openSiteEditor(site, root);
        });*/

        btnCreate?.addEventListener("click", () => {
            const tplId = ($("#siteTemplate", root)?.value) || "base-01";
            const baseTpl = DESIGN_TEMPLATES["base-01"];
            const tpl = DESIGN_TEMPLATES[tplId] || baseTpl;

            const site = {
                id: "site_" + uid(),
                name: "Новий сайт",
                slug: "site-" + uid(),
                pages: [{ id: "page_home", title: "Головна", slug: "index" }],
                templateId: tplId,
                netlify: {},
            };

            sitesState.push(site);
            saveSites();
            renderSitesList(sitesState, root);

            // ✅ ініціалізуємо Design storage: header/footer + home body
            const siteId = site.id;
            const headerKey = `st:design:site:${siteId}:layout:header`;
            const footerKey = `st:design:site:${siteId}:layout:footer`;
            const homeKey = `st:design:site:${siteId}:page:page_home`;

            const headerBlocks = (tpl.header ?? baseTpl.header) || [];
            const footerBlocks = (tpl.footer ?? baseTpl.footer) || [];
            const homeBlocks = (tpl.home ?? baseTpl.home) || [];

            writeDesignState(headerKey, headerBlocks);
            writeDesignState(footerKey, footerBlocks);
            writeDesignState(homeKey, homeBlocks);

            currentSite = site;
            openSiteEditor(site, root);
        });


        // Клік "Налаштувати" в списку
        $("#sitesList", root)?.addEventListener("click", (e) => {
            const btn = e.target.closest("button[data-action='edit']");
            if (!btn) return;
            const id = btn.dataset.id;
            const site = findSite(id);
            if (!site) return;
            currentSite = site;
            openSiteEditor(site, root);
        });

        // зміна назви / slug сайту
        $("#siteName", root)?.addEventListener("input", (e) => {
            if (!currentSite) return;
            currentSite.name = e.target.value;
            saveSites();
            renderSitesList(sitesState, root);
        });

        $("#siteSlug", root)?.addEventListener("input", (e) => {
            if (!currentSite) return;
            currentSite.slug = e.target.value;
            saveSites();
        });

        // додати сторінку
        btnAddPage?.addEventListener("click", () => {
            if (!currentSite) return;
            const p = {
                id: "page_" + uid(),
                title: "Нова сторінка",
                slug: "page-" + uid(), inNav: true,
            };
            currentSite.pages.push(p);
            saveSites();
            const key = `st:design:site:${currentSite.id}:page:${p.id}`;
            ensureEmptyDesignState(key);
            openSiteEditor(currentSite, root);
        });

        // редагування / видалення сторінок
        $("#pagesList", root)?.addEventListener("click", (e) => {
            if (!currentSite) return;

            const btnEdit = e.target.closest("button[data-action='editPage']");
            const btnDel = e.target.closest("button[data-action='delPage']");

            if (btnDel) {
                const pid = btnDel.dataset.page;
                currentSite.pages = currentSite.pages.filter((p) => p.id !== pid);
                saveSites();
                openSiteEditor(currentSite, root);
            }

            if (btnEdit) {
                const pid = btnEdit.dataset.page;
                // перехід у плагін Design
                location.hash = `#/design?site=${currentSite.id}&page=${pid}&part=body`;
                //location.hash = hash;
            }
        });
        //Клік по кнопці SEO в таблиці сторінок:
        $("#pagesList", root)?.addEventListener("click", (e) => {
            if (!currentSite) return;

            const btnEditSeo = e.target.closest("button[data-action='editPageSeo']");
            const btnEdit = e.target.closest("button[data-action='editPage']");
            const btnDel = e.target.closest("button[data-action='delPage']");

            if (btnEditSeo) {
                const pid = btnEditSeo.dataset.page;
                const page = currentSite.pages.find(p => p.id === pid);
                if (page) openPageSeo(page);
                return;
            }
            if (btnDel) {
                const pid = btnDel.dataset.page;
                currentSite.pages = currentSite.pages.filter((p) => p.id !== pid);
                saveSites();
                openSiteEditor(currentSite, root);
                return;
            }

            if (btnEdit) {
                const pid = btnEdit.dataset.page;
                location.hash = `#/design?site=${currentSite.id}&page=${pid}&part=body`;
                return;
            }

        });
        //Збереження / закриття модалки:
        pageSeoSave?.addEventListener("click", () => {
            if (!currentSite || !currentPageSeoId) return;
            const page = currentSite.pages.find(p => p.id === currentPageSeoId);
            if (!page) return;

            page.seo = page.seo || {};
            page.seo.title = pageSeoTitle.value;
            page.seo.description = pageSeoDescription.value;
            page.seo.keywords = pageSeoKeywords.value;
            page.seo.noIndex = pageSeoNoIndex.checked;
            page.seo.ogImage = pageSeoOgImage.value;

            saveSites();
            closePageSeo();
        });

        pageSeoCancel?.addEventListener("click", closePageSeo);

        // опціонально закриття по кліку на фон модалки
        pageSeoModal?.addEventListener("click", (e) => {
            if (e.target === pageSeoModal) closePageSeo();
        });
        /*Для використання в плагіні Design / Preview або іншому
        const seoSite = site.seo || {};
        const seoPage = page.seo || {};
        
        const title       = seoPage.title       || seoSite.title       || page.title || site.name;
        const description = seoPage.description || seoSite.description || "";
        const keywords    = seoPage.keywords    || seoSite.keywords    || "";
        const noIndex     = seoPage.noIndex ?? seoSite.noIndex ?? false;
        const ogImage     = seoPage.ogImage     || seoSite.ogImage     || "";
        const customHead  = seoSite.customHead  || "";
         */


        // лайв-зміни назв/slug сторінок
        $("#pagesList", root)?.addEventListener("input", (e) => {
            const inp = e.target;
            if (!(inp instanceof HTMLInputElement) || !currentSite) return;
            const pid = inp.dataset.page;
            const field = inp.dataset.field;
            const p = currentSite.pages.find((x) => x.id === pid);
            if (!p || !field) return;
            if (inp.type === "checkbox") {
                p[field] = inp.checked;   // ✅ inNav
            } else {
                p[field] = inp.value;     // ✅ title/slug
            }
            saveSites();
            renderSitesList(sitesState, root);
        });

        // Netlify
        $("#netlifyDashboard", root)?.addEventListener("input", (e) => {
            if (!currentSite) return;
            currentSite.netlify = currentSite.netlify || {};
            currentSite.netlify.dashboardUrl = e.target.value;
            saveSites();
        });

        $("#netlifyPublic", root)?.addEventListener("input", (e) => {
            if (!currentSite) return;
            currentSite.netlify = currentSite.netlify || {};
            currentSite.netlify.publicUrl = e.target.value;
            saveSites();
        });

        btnOpenNetlify?.addEventListener("click", () => {
            if (!currentSite?.netlify?.dashboardUrl) return;
            window.open(currentSite.netlify.dashboardUrl, "_blank");
        });

        btnOpenPublic?.addEventListener("click", () => {
            if (!currentSite?.netlify?.publicUrl) return;
            window.open(currentSite.netlify.publicUrl, "_blank");
        });
        const btnEditHeader = $("#editHeader", root);
        const btnEditFooter = $("#editFooter", root);
        btnEditHeader?.addEventListener("click", () => {
            if (!currentSite) return;
            location.hash = `#/design?site=${currentSite.id}&part=header`;
        });

        btnEditFooter?.addEventListener("click", () => {
            if (!currentSite) return;
            location.hash = `#/design?site=${currentSite.id}&part=footer`;
        });


        console.log("[sites] плагін Sites ініціалізовано");

        const ensureSiteSeo = () => {
            if (!currentSite) return null;
            currentSite.seo = currentSite.seo || {};
            return currentSite.seo;
        };

        siteSeoTitle?.addEventListener("input", (e) => {
            const seo = ensureSiteSeo(); if (!seo) return;
            seo.title = e.target.value;
            saveSites();
        });

        siteSeoDescription?.addEventListener("input", (e) => {
            const seo = ensureSiteSeo(); if (!seo) return;
            seo.description = e.target.value;
            saveSites();
        });

        siteSeoKeywords?.addEventListener("input", (e) => {
            const seo = ensureSiteSeo(); if (!seo) return;
            seo.keywords = e.target.value;
            saveSites();
        });

        siteSeoNoIndex?.addEventListener("change", (e) => {
            const seo = ensureSiteSeo(); if (!seo) return;
            seo.noIndex = e.target.checked;
            saveSites();
        });

        siteSeoOgImage?.addEventListener("input", (e) => {
            const seo = ensureSiteSeo(); if (!seo) return;
            seo.ogImage = e.target.value;
            saveSites();
        });

        siteSeoCustomHead?.addEventListener("input", (e) => {
            const seo = ensureSiteSeo(); if (!seo) return;
            seo.customHead = e.target.value;
            saveSites();
        });

    }

    function createDesignBlock(partial = {}) {
        const base = {
            id: Math.random().toString(36).slice(2, 9),
            kind: "box",
            text: "",
            headingLevel: 2,
            img: { src: "", alt: "" },

            display: "flex",
            dir: "column",
            grid: { cols: 2, gap: 16 },
            justify: "flex-start",
            align: "stretch",
            gap: 16,
            padding: { t: 24, r: 24, b: 24, l: 24 },
            outerMargin: { t: 5, r: 5, b: 5, l: 5 },
            maxWidth: "",

            layout: {
                basis: { mode: "auto", value: 0, unit: "px" },
                grow: 0,
                shrink: 1,
                alignSelf: "auto",
                widthPx: "",
                minHeightPx: 0,
                fullHeight: false,
                fixedHeight: "",
                pin: { enabled: false, side: "top" }
            },

            style: {
                bg: { type: "none", color: "#1f2937", alpha: 1, gA: "#0ea5e9", gAalpha: 1, gB: "#1d4ed8", gBalpha: 1, angle: 135, url: "", size: "cover", pos: "center", overlayColor: "#0f172a", overlayAlpha: 0.35, gray: 0 },
                radius: { mode: "all", all: 0, tl: 0, tr: 0, br: 0, bl: 0, d1a: 0, d1b: 0, d2a: 0, d2b: 0 },
                border: { width: 0, style: "solid", color: "#334155", alpha: 1, soft: 0 },
                shadow: { x: 0, y: 0, blur: 0, spread: 0, color: "#000000", alpha: 0, inset: { x: 0, y: 0, blur: 0, spread: 0, color: "#000000", alpha: 0 } },
                overlay: { top: { enable: false, color: "#000000", alpha: 0.4, h: 120 }, bottom: { enable: false, color: "#000000", alpha: 0.4, h: 120 } },
                cornersOn: false,
                shadowsOn: false,
                blockShadow: true
            },

            scroll: {
                x: false, y: false, panEnable: false, panDir: "y", bgFixed: false,
                sbHide: false, sbThick: 8, sbTrack: "#020617", sbThumb: "#64748b", sbRadius: 8
            },

            children: []
        };

        // shallow merge
        const out = Object.assign({}, base, partial);
        if (partial.children) out.children = partial.children;
        return out;
    }
    const DESIGN_TEMPLATES = {
        "base-01": {
            header: [
                createDesignBlock({
                    display: "flex",
                    dir: "row",
                    justify: "space-between",
                    align: "center",
                    gap: 16,
                    padding: { t: 18, r: 24, b: 18, l: 24 },
                    style: { ...createDesignBlock().style, bg: { type: "color", color: "#0f172a", alpha: 1 } },
                    children: [
                        createDesignBlock({ kind: "heading", headingLevel: 2, text: "My Site", padding: { t: 0, r: 0, b: 0, l: 0 }, style: { ...createDesignBlock().style, bg: { type: "none" } }, children: [] }),
                        createDesignBlock({
                            display: "flex", dir: "row", gap: 14,
                            padding: { t: 0, r: 0, b: 0, l: 0 },
                            style: { ...createDesignBlock().style, bg: { type: "none" } },
                            children: [
                                createDesignBlock({ kind: "nav", padding: { t: 0, r: 0, b: 0, l: 0 }, style: { ...createDesignBlock().style, bg: { type: "none" } }, children: [] })

                            ]
                        })
                    ]
                })
            ],
            footer: [
                createDesignBlock({
                    padding: { t: 18, r: 24, b: 18, l: 24 },
                    style: { ...createDesignBlock().style, bg: { type: "color", color: "#0b1220", alpha: 1 } },
                    children: [
                        createDesignBlock({ kind: "text", text: "© 2025 My Site. All rights reserved.", padding: { t: 0, r: 0, b: 0, l: 0 }, style: { ...createDesignBlock().style, bg: { type: "none" } }, children: [] })
                    ]
                })
            ],
            home: [
                createDesignBlock({
                    padding: { t: 64, r: 24, b: 64, l: 24 },
                    style: { ...createDesignBlock().style, bg: { type: "gradient", gA: "#0f172a", gAalpha: 1, gB: "#1d4ed8", gBalpha: 0.65, angle: 135 } },
                    children: [
                        createDesignBlock({ kind: "heading", headingLevel: 1, text: "Заголовок Hero", padding: { t: 0, r: 0, b: 10, l: 0 }, style: { ...createDesignBlock().style, bg: { type: "none" } }, children: [] }),
                        createDesignBlock({ kind: "text", text: "Короткий опис і CTA. Тут буде основний контент сторінки.", padding: { t: 0, r: 0, b: 0, l: 0 }, style: { ...createDesignBlock().style, bg: { type: "none" } }, children: [] })
                    ]
                })
            ]
        },

        "shop-01": {
            header: null, // використаємо base-01
            footer: null,
            home: [
                createDesignBlock({
                    padding: { t: 48, r: 24, b: 48, l: 24 },
                    style: { ...createDesignBlock().style, bg: { type: "color", color: "#111827", alpha: 1 } },
                    children: [
                        createDesignBlock({ kind: "heading", headingLevel: 1, text: "Каталог товарів", padding: { t: 0, r: 0, b: 12, l: 0 }, style: { ...createDesignBlock().style, bg: { type: "none" } }, children: [] }),
                        createDesignBlock({ kind: "text", text: "Секція під список товарів / категорій.", padding: { t: 0, r: 0, b: 0, l: 0 }, style: { ...createDesignBlock().style, bg: { type: "none" } }, children: [] })
                    ]
                })
            ]
        }
    };



    // ---------- інтеграція з PluginLoader ----------
    window.__plugins = window.__plugins || {};
    window.__plugins.sites = {
        mount(host) {
            initSitesPlugin(host);
        },
        unmount() {
            sitesRoot = null;
        },
    };
})();
