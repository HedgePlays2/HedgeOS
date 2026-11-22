const Desktop = (() => {
  let selectedApp = null;
  const positionsKey = 'hedgeos-desktop-icon-positions';
  function init() {
    renderIcons();
    initContextMenu();
  }

  function renderIcons() {
    const area = document.getElementById('desktop-icons');
    area.innerHTML = '';
    let saved = {};
    try { saved = JSON.parse(localStorage.getItem(positionsKey) || '{}'); } catch {}
    HedgeOS.apps.forEach((app, index) => {
      const el = document.createElement('div');
      el.className = 'desktop-icon';
      el.dataset.appName = app.name;
      el.innerHTML = `<div class="icon-emoji">${app.icon}</div><div class="icon-label">${app.name}</div>`;
      const pos = saved[app.name] || { x: 8, y: 8 + index * 94 };
      el.style.left = Math.max(0, Number(pos.x) || 0) + 'px';
      el.style.top = Math.max(0, Number(pos.y) || 0) + 'px';
      el.addEventListener('dblclick', () => app.launch());
      el.addEventListener('contextmenu', event => {
        event.preventDefault(); event.stopPropagation();
        selectedApp = app; showContextMenu(event.clientX, event.clientY);
      });
      makeIconDraggable(el, app.name);
      area.appendChild(el);
    });
  }

  function initContextMenu() {
    const menu = document.getElementById('context-menu');
    const desktop = document.getElementById('desktop');

    desktop.addEventListener('contextmenu', e => {
      if (e.target.closest('.os-window') || e.target.closest('#taskbar') || e.target.closest('#start-menu')) return;
      e.preventDefault(); selectedApp = null; showContextMenu(e.clientX, e.clientY);
    });

    document.addEventListener('click', e => {
      if (!menu.contains(e.target)) menu.style.display = 'none';
    });

    menu.querySelectorAll('.ctx-item').forEach(item => {
      item.addEventListener('click', () => {
        menu.style.display = 'none';
        const action = item.dataset.action;
        if (action === 'refresh') renderIcons();
        else if (action === 'open' && selectedApp) selectedApp.launch();
        else if (action === 'display') Settings.open('desktop');
        else if (action === 'personalize' || action === 'wallpaper') Settings.open('appearance');
        else if (action === 'settings') Settings.open();
        else if (action === 'newfile') newTextFile();
      });
    });
  }

  function showContextMenu(x, y) {
    const menu = document.getElementById('context-menu');
    menu.querySelector('[data-action="open"]').style.display = selectedApp ? 'flex' : 'none';
    menu.style.left = Math.max(8, Math.min(x, innerWidth - menu.offsetWidth - 8)) + 'px';
    menu.style.top = Math.max(8, Math.min(y, innerHeight - menu.offsetHeight - 8)) + 'px';
    menu.style.display = 'block';
  }

  function makeIconDraggable(el, name) {
    let id = null, sx = 0, sy = 0, ox = 0, oy = 0, moved = false;
    el.addEventListener('pointerdown', e => {
      if (e.button !== 0) return;
      id=e.pointerId; sx=e.clientX; sy=e.clientY; ox=el.offsetLeft; oy=el.offsetTop; moved=false;
      el.setPointerCapture(id);
    });
    el.addEventListener('pointermove', e => {
      if (e.pointerId !== id) return;
      const dx=e.clientX-sx, dy=e.clientY-sy;
      if (Math.abs(dx)+Math.abs(dy)>5) moved=true;
      if (!moved) return;
      el.classList.add('dragging');
      el.style.left=Math.max(0,Math.min(innerWidth-el.offsetWidth,ox+dx))+'px';
      el.style.top=Math.max(0,Math.min(innerHeight-el.offsetHeight-70,oy+dy))+'px';
    });
    const finish=e=>{
      if(e.pointerId!==id)return; id=null; el.classList.remove('dragging');
      if(!moved)return;
      let all={}; try{all=JSON.parse(localStorage.getItem(positionsKey)||'{}')}catch{}
      all[name]={x:el.offsetLeft,y:el.offsetTop};
      localStorage.setItem(positionsKey,JSON.stringify(all));
    };
    el.addEventListener('pointerup',finish); el.addEventListener('pointercancel',finish);
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
