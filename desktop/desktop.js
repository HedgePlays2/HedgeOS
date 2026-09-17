const Desktop = (() => {
  function init() {
    renderIcons();
    initContextMenu();
  }

  function renderIcons() {
    const area = document.getElementById('desktop-icons');
    area.innerHTML = '';
    HedgeOS.apps.forEach(app => {
      const el = document.createElement('div');
      el.className = 'desktop-icon';
      el.innerHTML = `<div class="icon-emoji">${app.icon}</div><div class="icon-label">${app.name}</div>`;
      el.addEventListener('dblclick', () => app.launch());
      area.appendChild(el);
    });
  }

  function initContextMenu() {
    const menu = document.getElementById('context-menu');
    const desktop = document.getElementById('desktop');

    desktop.addEventListener('contextmenu', e => {
      if (e.target.closest('.os-window') || e.target.closest('#taskbar') || e.target.closest('#start-menu')) return;
      e.preventDefault();
      const x = Math.min(e.clientX, innerWidth - menu.offsetWidth - 8);
      const y = Math.min(e.clientY, innerHeight - menu.offsetHeight - 8);
      menu.style.left = x + 'px';
      menu.style.top = y + 'px';
      menu.style.display = 'block';
    });

    document.addEventListener('click', e => {
      if (!menu.contains(e.target)) menu.style.display = 'none';
    });

    menu.querySelectorAll('.ctx-item').forEach(item => {
      item.addEventListener('click', () => {
        menu.style.display = 'none';
        const action = item.dataset.action;
        if (action === 'refresh') renderIcons();
        else if (action === 'wallpaper') Settings.open('wallpaper');
        else if (action === 'settings') Settings.open();
        else if (action === 'newfile') newTextFile();
      });
    });
  }

  function newTextFile() {
    const name = prompt('File name:', 'untitled.txt');
    if (!name) return;
    const html = `
      <div style="display:flex;flex-direction:column;height:100%">
        <textarea style="flex:1;background:#1a1a2e;border:none;color:#e2e8f0;
          font-family:'Courier New',monospace;font-size:13px;padding:12px;
          resize:none;outline:none;" placeholder="Start typing..."></textarea>
        <div style="padding:8px;display:flex;gap:8px;background:rgba(0,0,0,0.2);border-top:1px solid var(--border)">
          <button class="btn" onclick="saveText(this)">💾 Save to Puter</button>
          <span style="color:var(--text-dim);font-size:11px;align-self:center">${name}</span>
        </div>
      </div>`;
    const w = WindowManager.create({ title: name, icon: '📄', html, width: 500, height: 380 });
    w.el._filename = name;
    w.content.querySelector('button').onclick = function() { saveText(this, name, w.el); };
  }

  window.saveText = async function(btn, name, winEl) {
    const ta = winEl ? winEl.querySelector('textarea') : btn.closest('.win-content').querySelector('textarea');
    const fname = name || 'untitled.txt';
    try {
      if (HedgeOS.puterReady) {
        await puter.fs.write('/' + fname, new Blob([ta.value], { type: 'text/plain' }));
        Notifications.show('File Saved', fname + ' saved to Puter cloud.', '💾');
      } else {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(new Blob([ta.value], { type: 'text/plain' }));
        a.download = fname;
        a.click();
      }
    } catch (e) {
      Notifications.show('Save Error', e.message, '❌');
    }
  };

  return { init, renderIcons };
})();
