/* Глобальна логіка: перемикач сайдбара, стан логотипів, доступність */

(function(){
  const STORAGE_KEY = 'ui:sidebar-collapsed';

  function applySidebarState(collapsed){
    document.body.classList.toggle('sidebar-collapsed', collapsed);
    // Перемалювати іконки (бо DOM міг змінитися)
    if (window.lucide) lucide.createIcons();
  }

  function readState(){
    try{ return localStorage.getItem(STORAGE_KEY) === '1'; }catch{ return false; }
  }
  function writeState(val){
    try{ localStorage.setItem(STORAGE_KEY, val ? '1' : '0'); }catch{}
  }

  function toggle(){
    const collapsed = !readState();
    writeState(collapsed);
    applySidebarState(collapsed);
  }

  // Коли partials готові — чіпляємо обробники
  document.addEventListener('partials:ready', () => {
    const btn = document.getElementById('sidebarToggle');
    if (btn){
      btn.addEventListener('click', toggle);
      // Ctrl+B — гаряча клавіша згорнути/розгорнути
      window.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b'){ e.preventDefault(); toggle(); }
      });
    }

    // Встановити початковий стан
    applySidebarState(readState());
  });

})();
