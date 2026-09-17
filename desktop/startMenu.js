const StartMenu = (() => {
  let visible = false;

  function init() {
    renderApps(HedgeOS.apps);

    document.getElementById('start-search').addEventListener('input', function() {
      const q = this.value.toLowerCase().trim();
      const filtered = q ? HedgeOS.apps.filter(a => a.name.toLowerCase().includes(q)) : HedgeOS.apps;
      renderApps(filtered);
    });

    document.querySelectorAll('.start-foot-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const action = btn.dataset.action;
        if (action === 'settings') { hide(); Settings.open(); }
        else if (action === 'power') { hide(); togglePower(); }
      });
    });

    document.querySelectorAll('.power-item').forEach(item => {
      item.addEventListener('click', () => {
        const a = item.dataset.action;
        document.getElementById('power-menu').style.display = 'none';
        if (a === 'lock') lockScreen();
        else if (a === 'restart') location.reload();
        else if (a === 'shutdown') shutDown();
      });
    });

    document.addEventListener('click', e => {
      if (visible && !e.target.closest('#start-menu') && !e.target.closest('#start-btn')) hide();
      if (!e.target.closest('#power-menu') && !e.target.closest('.start-foot-btn[data-action="power"]')) {
        document.getElementById('power-menu').style.display = 'none';
      }
    });
  }

  function renderApps(apps) {
    const area = document.getElementById('start-apps');
    area.innerHTML = '';
    if (!apps.length) {
      area.innerHTML = '<div style="padding:20px;text-align:center;color:var(--text-dim);font-size:13px">No apps found</div>';
      return;
    }
    apps.forEach(app => {
      const el = document.createElement('div');
      el.className = 'start-app';
      el.innerHTML = `<div class="app-icon">${app.icon}</div><div class="app-name">${app.name}</div>`;
      el.addEventListener('click', () => { hide(); app.launch(); });
      area.appendChild(el);
    });
  }

  function toggle() {
    visible ? hide() : show();
  }

  function show() {
    visible = true;
    const m = document.getElementById('start-menu');
    m.style.display = 'block';
    document.getElementById('start-search').value = '';
    renderApps(HedgeOS.apps);
    setTimeout(() => document.getElementById('start-search').focus(), 50);
  }

  function hide() {
    visible = false;
    document.getElementById('start-menu').style.display = 'none';
  }

  function togglePower() {
    const pm = document.getElementById('power-menu');
    pm.style.display = pm.style.display === 'block' ? 'none' : 'block';
  }

  function lockScreen() {
    document.getElementById('desktop').style.display = 'none';
    const lock = document.getElementById('lock-screen');
    lock.style.opacity = '0';
    lock.style.display = 'flex';
    requestAnimationFrame(() => {
      lock.style.transition = 'opacity 0.4s';
      requestAnimationFrame(() => { lock.style.opacity = '1'; });
    });
    let ti = setInterval(() => {
      const now = new Date();
      document.getElementById('lock-time').textContent =
        now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      document.getElementById('lock-date').textContent =
        now.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' });
    }, 1000);

    const btn = document.getElementById('lock-btn');
    const pin = document.getElementById('lock-pin');
    const handler = () => {
      clearInterval(ti);
      lock.style.opacity = '0';
      setTimeout(() => {
        lock.style.display = 'none';
        document.getElementById('desktop').style.display = 'block';
        btn.removeEventListener('click', handler);
        pin.removeEventListener('keydown', keyHandler);
      }, 400);
    };
    const keyHandler = e => { if (e.key === 'Enter') handler(); };
    btn.addEventListener('click', handler);
    pin.addEventListener('keydown', keyHandler);
  }

  function shutDown() {
    document.body.innerHTML = `
      <div style="position:fixed;inset:0;background:#0a0f1a;display:flex;flex-direction:column;
        align-items:center;justify-content:center;gap:16px;color:#fff;font-family:Arial">
        <div style="font-size:48px">🌿</div>
        <div style="font-size:20px;font-weight:700">Shutting down HedgeOS...</div>
        <div style="font-size:13px;color:rgba(255,255,255,0.4)">It is now safe to close this tab.</div>
      </div>`;
  }

  return { init, toggle, show, hide };
})();
