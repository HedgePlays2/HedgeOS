const StartMenu = (() => {
  let visible = false;
  let pinnedIds = [];
  let recentIds = [];
  let showingAll = false;
  const PIN_KEY = 'hedgeos-pinned-apps';
  const RECENT_KEY = 'hedgeos-recent-apps';

  function readList(key, fallback) {
    try {
      const value = JSON.parse(localStorage.getItem(key) || 'null');
      return Array.isArray(value) ? value : fallback;
    } catch { return fallback; }
  }

  function saveLists() {
    try {
      localStorage.setItem(PIN_KEY, JSON.stringify(pinnedIds));
      localStorage.setItem(RECENT_KEY, JSON.stringify(recentIds));
    } catch {}
  }

  function init() {
    pinnedIds = readList(PIN_KEY, HedgeOS.apps.slice(0, 4).map(app => app.id));
    recentIds = readList(RECENT_KEY, []);
    pinnedIds = pinnedIds.filter(id => HedgeOS.apps.some(app => app.id === id));
    recentIds = recentIds.filter(id => HedgeOS.apps.some(app => app.id === id));
    if (!pinnedIds.length) pinnedIds = HedgeOS.apps.slice(0, 4).map(app => app.id);
    saveLists();
    renderHome();

    document.getElementById('start-search').addEventListener('input', renderSearch);
    document.getElementById('start-all-apps').addEventListener('click', () => {
      showingAll = !showingAll;
      document.getElementById('start-all-section').hidden = !showingAll;
      document.getElementById('start-all-apps').querySelector('span').textContent = showingAll ? '⌄' : '›';
      if (showingAll) renderAllApps(HedgeOS.apps);
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
        const action = item.dataset.action;
        document.getElementById('power-menu').style.display = 'none';
        if (action === 'lock') lockScreen();
        else if (action === 'restart') location.reload();
        else if (action === 'shutdown') shutDown();
      });
    });

    document.addEventListener('keydown', event => {
      if (event.key === 'Escape' && visible) hide();
    });

    document.addEventListener('click', event => {
      if (visible && !event.target.closest('#start-menu') && !event.target.closest('#start-btn')) hide();
      if (!event.target.closest('#power-menu') && !event.target.closest('.start-foot-btn[data-action="power"]')) {
        document.getElementById('power-menu').style.display = 'none';
      }
    });
  }

  function makeAppButton(app, compact = false, showPin = false) {
    const row = document.createElement('div');
    row.className = compact ? 'start-app-wrap' : 'start-app-wrap';

    const launch = document.createElement('button');
    launch.type = 'button';
    launch.className = compact ? 'start-pinned-app' : 'start-app';
    const icon = document.createElement('span');
    icon.className = 'app-icon';
    icon.textContent = app.icon;
    const name = document.createElement('span');
    name.className = 'app-name';
    name.textContent = app.name;
    launch.append(icon, name);
    launch.addEventListener('click', () => openApp(app));
    row.appendChild(launch);

    if (showPin) {
      const pin = document.createElement('button');
      pin.type = 'button';
      pin.className = 'start-pin-toggle';
      pin.textContent = pinnedIds.includes(app.id) ? '📌' : '＋';
      pin.title = pinnedIds.includes(app.id) ? 'Unpin app' : 'Pin app';
      pin.setAttribute('aria-label', pin.title + ': ' + app.name);
      pin.addEventListener('click', event => {
        event.stopPropagation();
        togglePin(app.id);
      });
      row.appendChild(pin);
      row.classList.add('start-app-row');
    }
    return row;
  }

  function openApp(app) {
    recentIds = [app.id, ...recentIds.filter(id => id !== app.id)].slice(0, 5);
    saveLists();
    renderHome();
    hide();
    app.launch();
  }

  function togglePin(id) {
    pinnedIds = pinnedIds.includes(id)
      ? pinnedIds.filter(item => item !== id)
      : [...pinnedIds, id];
    saveLists();
    renderHome();
    if (showingAll) renderAllApps(HedgeOS.apps);
  }

  function renderHome() {
    const pinnedArea = document.getElementById('start-pinned');
    const recentArea = document.getElementById('start-recent');
    pinnedArea.innerHTML = '';
    recentArea.innerHTML = '';
    HedgeOS.apps.filter(app => pinnedIds.includes(app.id)).forEach(app => {
      pinnedArea.appendChild(makeAppButton(app, true));
    });
    const recent = recentIds.map(id => HedgeOS.apps.find(app => app.id === id)).filter(Boolean);
    if (recent.length) recent.forEach(app => recentArea.appendChild(makeAppButton(app)));
    else recentArea.innerHTML = '<div class="start-empty">Your recently opened apps will show up here.</div>';
  }

  function renderAllApps(apps) {
    const area = document.getElementById('start-apps');
    area.innerHTML = '';
    area.className = 'start-app-list';
    if (!apps.length) {
      area.innerHTML = '<div class="start-empty">No apps found.</div>';
      return;
    }
    apps.forEach(app => area.appendChild(makeAppButton(app, false, true)));
  }

  function renderSearch() {
    const query = document.getElementById('start-search').value.toLowerCase().trim();
    const pinnedSection = document.getElementById('start-pinned-section');
    const recentSection = document.getElementById('start-recent-section');
    const allSection = document.getElementById('start-all-section');
    const allButton = document.getElementById('start-all-apps');
    if (query) {
      pinnedSection.hidden = true;
      recentSection.hidden = true;
      allButton.hidden = true;
      allSection.hidden = false;
      document.getElementById('start-list-heading').textContent = 'Search results';
      renderAllApps(HedgeOS.apps.filter(app => app.name.toLowerCase().includes(query)));
    } else {
      pinnedSection.hidden = false;
      recentSection.hidden = false;
      allButton.hidden = false;
      allSection.hidden = !showingAll;
      document.getElementById('start-list-heading').textContent = 'All apps';
      renderHome();
      if (showingAll) renderAllApps(HedgeOS.apps);
    }
  }

  function toggle() { visible ? hide() : show(); }

  function show() {
    visible = true;
    showingAll = false;
    const menu = document.getElementById('start-menu');
    menu.style.display = 'flex';
    document.getElementById('start-search').value = '';
    document.getElementById('start-all-section').hidden = true;
    document.getElementById('start-all-apps').hidden = false;
    document.getElementById('start-all-apps').querySelector('span').textContent = '›';
    document.getElementById('start-pinned-section').hidden = false;
    document.getElementById('start-recent-section').hidden = false;
    renderHome();
    setTimeout(() => document.getElementById('start-search').focus(), 50);
  }

  function hide() {
    visible = false;
    document.getElementById('start-menu').style.display = 'none';
  }

  function togglePower() {
    const menu = document.getElementById('power-menu');
    menu.style.display = menu.style.display === 'block' ? 'none' : 'block';
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
    const updateLockClock = () => {
      const now = new Date();
      document.getElementById('lock-time').textContent = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      document.getElementById('lock-date').textContent = now.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' });
    };
    updateLockClock();
    const timer = setInterval(updateLockClock, 1000);
    const button = document.getElementById('lock-btn');
    const pin = document.getElementById('lock-pin');
    const unlock = () => {
      clearInterval(timer);
      lock.style.opacity = '0';
      setTimeout(() => {
        lock.style.display = 'none';
        document.getElementById('desktop').style.display = 'block';
        button.removeEventListener('click', unlock);
        pin.removeEventListener('keydown', keyHandler);
      }, 400);
    };
    const keyHandler = event => { if (event.key === 'Enter') unlock(); };
    button.addEventListener('click', unlock);
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
