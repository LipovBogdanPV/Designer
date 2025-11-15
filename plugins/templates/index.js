(function(){
  function onClick(e){
    const btn = e.target.closest('.add-tpl');
    if (!btn) return;
    const tpl = btn.dataset.tpl;
    alert('Додано шаблон: ' + tpl);
  }

  function mount(host){
    host.addEventListener('click', onClick);
    host._onClick = onClick;
  }

  function unmount(){
    const host = document.querySelector('.plugin-host.plugin-templates');
    if (!host || !host._onClick) return;
    host.removeEventListener('click', host._onClick);
    host._onClick = null;
  }

  window.__plugins = window.__plugins || {};
  window.__plugins.templates = { mount, unmount };
})();
