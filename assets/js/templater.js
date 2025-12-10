/* ========= Шаблонізатор з маніфестами ========= */
const NAV_KEY = 'builder:nav-order:v1';

async function includePartials() {
  const parts = Array.from(document.querySelectorAll('[data-include]'));
  await Promise.all(parts.map(async el => {
    const url = el.getAttribute('data-include');
    const res = await fetch(url, { cache: 'no-store' });
    el.innerHTML = await res.text();
  }));
}

/* ---------- PluginLoader (як було, тільки дрібний рефактор) ---------- */
const PluginLoader = (() => {
  let current = null; // { id, hostEl, cssEls[], jsEls[], api }

  function injectCSS(href, id) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    document.head.appendChild(link);
    return link;
  }
  function injectJS(src, id) {
    return new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = src;
      s.defer = true;
      s.dataset.plugin = id;
      s.onload = () => resolve(s);
      s.onerror = reject;
      document.body.appendChild(s);
    });
  }
  function ensurePluginsBag() { window.__plugins = window.__plugins || {}; }

  async function clear() {
    if (!current) return;
    try { current.api?.unmount?.(); } catch (e) { console.warn('plugin unmount error:', e); }
    current.cssEls?.forEach(l => l.remove());
    current.jsEls?.forEach(s => s.remove());
    current.hostEl?.remove?.();
    current = null;
  }

  async function load(manifest) {
    await clear();
    const { id, html, css = [], js = [] } = manifest;

    const main = document.getElementById('main');
    const host = document.createElement('div');
    host.className = `plugin-host plugin-${id}`;
    host.dataset.plugin = id;
    host.innerHTML = '<div class="container">Завантаження…</div>';
    main.innerHTML = '';
    main.appendChild(host);

    const htmlText = await (await fetch(html, { cache: 'no-store' })).text();
    host.innerHTML = htmlText;

    const cssEls = css.map(href => injectCSS(href, id));
    const jsEls = [];
    for (const src of js) jsEls.push(await injectJS(src, id));

    ensurePluginsBag();
    const api = window.__plugins[id];
    api?.mount?.(host);

    current = { id, hostEl: host, cssEls, jsEls, api };
    if (window.lucide) lucide.createIcons();
  }

  return { load, clear };
})();

/* ---------- Реєстр плагінів і побудова меню ---------- */
const PluginRegistry = (() => {
  let manifests = [];
  let routes = {};

  function readUserOrder() {
    try { return JSON.parse(localStorage.getItem(NAV_KEY) || '[]'); } catch { return []; }
  }
  function writeUserOrder(order) {
    try { localStorage.setItem(NAV_KEY, JSON.stringify(order)); } catch { }
  }

  function applyOrder(list) {
    const order = readUserOrder();
    if (!order.length) return list.slice().sort((a, b) => (a.order || 0) - (b.order || 0));

    // ставимо за корист. порядком, решту — вкінці за дефолтним order
    const map = Object.fromEntries(list.map(m => [m.id, m]));
    const sorted = [];
    order.forEach(id => { if (map[id]) { sorted.push(map[id]); delete map[id]; } });
    const rest = Object.values(map).sort((a, b) => (a.order || 0) - (b.order || 0));
    return [...sorted, ...rest];
  }

  async function loadRegistry() {
    const reg = await (await fetch('plugins/registry.json', { cache: 'no-store' })).json();
    const list = await Promise.all(reg.plugins.map(async p => (await (await fetch(p.manifest, { cache: 'no-store' })).json())));
    manifests = applyOrder(list);
    routes = Object.fromEntries(manifests.map(m => [m.route, m]));

    // зробимо маніфести доступними плагінам (напр., ui-settings)
    window.__pluginManifests = manifests;
  }

  function getRoutes() { return routes; }
  function getManifests() { return manifests; }

  function renderSidebarNav() {
    const mount = document.querySelector('#nav-plugins');
    if (!mount) return;
    mount.innerHTML = '';
    manifests.forEach(m => {
      const a = document.createElement('a');
      a.href = `#/${m.route}`;
      a.dataset.route = m.route;
      a.dataset.pluginId = m.id;
      a.innerHTML = `<i data-lucide="${m.icon}"></i><span class="label">${m.name}</span>`;
      mount.appendChild(a);
    });
    if (window.lucide) lucide.createIcons();
  }

  // перезастосувати порядок з localStorage (викликаємо з плагіна налаштувань)
  function reapplyOrderAndRender() {
    manifests = applyOrder(manifests);
    routes = Object.fromEntries(manifests.map(m => [m.route, m]));
    renderSidebarNav();
  }

  // слухач глобальної події від плагіна налаштувань
  document.addEventListener('nav:order-changed', (e) => {
    const order = e.detail?.order || [];
    writeUserOrder(order);
    reapplyOrderAndRender();
  });

  return { loadRegistry, getRoutes, getManifests, renderSidebarNav, reapplyOrderAndRender };
})();

/* ---------- Роутер на базі маніфестів ---------- */
const Router = (() => {
  function setActive(route) {
    document.querySelectorAll('.nav a').forEach(a => {
      a.classList.toggle('active', a.dataset.route === route);
    });
  }

  async function go(hash) {
    const routes = PluginRegistry.getRoutes();
    const defaultRoute = PluginRegistry.getManifests()[0]?.route || 'design';

    // 1) очищаємо "#/" на початку
    const cleaned = (hash || '').replace(/^#\/?/, '');

    // 2) відділяємо шлях від query (?site=...&page=...)
    const [path] = cleaned.split('?');     // <- тільки "design"
    const route = path || defaultRoute;    // якщо порожньо — дефолт

    setActive(route);

    const manifest = routes[route];
    if (manifest) {
      await PluginLoader.load(manifest);
      // hash з query залишився як є, design зможе його прочитати
      window.scrollTo({ top: 0, behavior: 'instant' });
    } else {
      document.getElementById('main').innerHTML =
        `<div class="container"><h2>Сторінка в розробці</h2><p>${cleaned}</p></div>`;
    }
  }

  function init() {
    window.addEventListener('hashchange', () => go(location.hash));
    go(location.hash);
  }

  return { init, go };
})();


/* ---------- Старт ---------- */
(async function boot() {
  await includePartials();

  // 1) підтягуємо реєстр плагінів і будуємо меню
  await PluginRegistry.loadRegistry();
  PluginRegistry.renderSidebarNav();

  // 2) намалювати іконки в шапці/меню
  if (window.lucide) lucide.createIcons();

  // 3) дати сигнал app.js (якщо треба) і стартувати роутер
  document.dispatchEvent(new Event('partials:ready'));
  Router.init();
})();
