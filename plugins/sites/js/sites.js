// plugins/sites/js/sites.js
(function () {
    const SITES_KEY = "st:sites:v1";

    // глобальний стан плагіна
    let sitesState = [];   // масив сайтів
    let sitesRoot = null;  // кореневий елемент плагіна (host)

    const $ = (sel, root = document) => root.querySelector(sel);
    const uid = () => Math.random().toString(36).slice(2, 9);

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
            tr.innerHTML = `
        <td><input data-page="${p.id}" data-field="title" value="${p.title}" /></td>
        <td><input data-page="${p.id}" data-field="slug" value="${p.slug}" /></td>
        <td>
          <button class="btn small" data-page="${p.id}" data-action="editPage">
            Редагувати
          </button>
          <button class="btn small" data-page="${p.id}" data-action="editPageSeo">SEO</button>
          <button class="btn small danger" data-page="${p.id}" data-action="delPage">
            ✕
          </button>
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
                slug: "page-" + uid(),
            };
            currentSite.pages.push(p);
            saveSites();
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
                const hash = `#/design?site=${currentSite.id}&page=${pid}`;
                location.hash = hash;
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
            p[field] = inp.value;
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
