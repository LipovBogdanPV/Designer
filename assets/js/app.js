/* Глобальна логіка: перемикач сайдбара, стан логотипів, доступність */

(function () {
  const STORAGE_KEY = 'ui:sidebar-collapsed';
  const THEME_KEY = 'ui:theme';

  function applyTheme(theme) {
    const root = document.documentElement;
    if (theme === 'light') {
      root.setAttribute('data-theme', 'light');
    } else {
      root.removeAttribute('data-theme'); // dark за замовчуванням
      theme = 'dark';
    }

    // просто для відладки / майбутніх стилів
    const btn = document.getElementById('themeToggle');
    if (btn) {
      btn.dataset.theme = theme;
    }
  }

  // Застосувати тему якомога раніше (до підвантаження partials)
  try {
    const initialTheme = localStorage.getItem(THEME_KEY) || 'dark';
    applyTheme(initialTheme);
  } catch (e) {
    applyTheme('dark');
  }


  function applySidebarState(collapsed) {
    document.body.classList.toggle('sidebar-collapsed', collapsed);
    // Перемалювати іконки (бо DOM міг змінитися)
    if (window.lucide) lucide.createIcons();
  }

  function readState() {
    try { return localStorage.getItem(STORAGE_KEY) === '1'; } catch { return false; }
  }
  function writeState(val) {
    try { localStorage.setItem(STORAGE_KEY, val ? '1' : '0'); } catch { }
  }

  function toggle() {
    const collapsed = !readState();
    writeState(collapsed);
    applySidebarState(collapsed);
  }

  // Коли partials готові — чіпляємо обробники
  document.addEventListener('partials:ready', () => {
    const btn = document.getElementById('sidebarToggle');
    if (btn) {
      btn.addEventListener('click', toggle);
      // Ctrl+B — гаряча клавіша згорнути/розгорнути
      window.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') { e.preventDefault(); toggle(); }
      });
    }
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
      themeToggle.addEventListener('click', () => {
        const current =
          (typeof localStorage !== 'undefined' &&
            localStorage.getItem(THEME_KEY)) ||
          'dark';

        const next = current === 'dark' ? 'light' : 'dark';

        try {
          localStorage.setItem(THEME_KEY, next);
        } catch (e) {
          // пофіг, просто не збережеться
        }

        applyTheme(next);
      });
    }


    // Встановити початковий стан
    applySidebarState(readState());
  });

})();
