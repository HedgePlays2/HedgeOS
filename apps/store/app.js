const PlayStore = (() => {
  const STORAGE_KEY = 'hedgeos-installed-apps';

  const catalog = [
    { id: 'hedge-arcade', name: 'Hedge Web Arcade', icon: '🎮', category: 'Games', description: 'A collection of browser games, including Sonic adventures.', url: 'https://hedgeplays2.github.io/' },
    { id: 'scratch', name: 'Scratch', icon: '🐱', category: 'Apps', description: 'Create games, animations and interactive stories.', url: 'https://scratch.mit.edu/' },
    { id: 'itch-io', name: 'itch.io', icon: '🕹️', category: 'Games', description: 'Discover indie games you can play in your browser.', url: 'https://itch.io/games/html5' },
    { id: 'steam', name: 'Steam Store', icon: '🎮', category: 'Games', description: 'Browse PC games on Valve’s official Steam store website.', url: 'https://store.steampowered.com/' },
    { id: 'google-docs', name: 'Google Docs', icon: '📄', category: 'Apps', description: 'Write and edit documents online.', url: 'https://docs.google.com/' },
    { id: 'google-drive', name: 'Google Drive', icon: '📁', category: 'Apps', description: 'Store and organize files in the cloud.', url: 'https://drive.google.com/' },
    { id: 'youtube', name: 'YouTube', icon: '▶️', category: 'Apps', description: 'Watch videos, music and creators.', url: 'https://www.youtube.com/' },
    { id: 'photopea', name: 'Photopea', icon: '🖼️', category: 'Apps', description: 'Edit images with a powerful browser-based editor.', url: 'https://www.photopea.com/' },
    { id: 'tinkercad', name: 'Tinkercad', icon: '🧊', category: 'Apps', description: 'Create 3D designs and simple circuits.', url: 'https://www.tinkercad.com/' }
  ];

  function readInstalled() {
    try {
      const value = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      return Array.isArray(value) ? value.filter(id => catalog.some(app => app.id === id)) : [];
    } catch {
      return [];
    }
  }

  function saveInstalled(ids) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
    } catch {
      alert('HedgeOS could not save your installed apps in this browser.');
    }
  }

  function launchApp(app) {
    OSBrowser.open(app.url, app.name);
  }

  function syncInstalledApps() {
    const installed = readInstalled();
    HedgeOS.apps = HedgeOS.apps.filter(app => !catalog.some(item => item.id === app.id));
    installed.forEach(id => {
      const app = catalog.find(item => item.id === id);
      if (!app) return;
      HedgeOS.apps.push({
        id: app.id,
        name: app.name,
        icon: app.icon,
        launch: () => launchApp(app)
      });
    });
  }

  function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, char => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    })[char]);
  }

  function open() {
    syncInstalledApps();

    const html = `
      <div class="store-shell" style="height:100%;min-height:0;display:flex;flex-direction:column;background:#f4f7fb;color:#172033;font-family:Arial,sans-serif;overflow:hidden;">
        <header style="padding:18px 22px;background:linear-gradient(115deg,#163b70,#2563a8);color:white;flex:0 0 auto;">
          <div style="display:flex;align-items:center;gap:12px;">
            <div style="font-size:32px;">🛍️</div>
            <div><div style="font-size:21px;font-weight:800;">HedgeOS Play Store</div><div style="font-size:12px;opacity:.82;margin-top:3px;">Games, tools and websites for your desktop</div></div>
          </div>
          <input id="store-search" type="search" placeholder="Search games and apps..." style="box-sizing:border-box;width:100%;margin-top:16px;padding:11px 13px;border:0;border-radius:9px;font-size:14px;outline:none;">
        </header>
        <nav id="store-tabs" style="display:flex;gap:7px;padding:12px 18px;background:white;border-bottom:1px solid #dce3ed;flex:0 0 auto;overflow-x:auto;">
          <button data-category="All">Discover</button><button data-category="Games">Games</button><button data-category="Apps">Apps</button><button data-category="Installed">Installed</button>
        </nav>
        <main id="store-list" style="padding:18px;overflow:auto;flex:1;min-height:0;">
          <div style="color:#64748b;">Loading the store...</div>
        </main>
        <footer style="padding:8px 16px;background:white;border-top:1px solid #dce3ed;color:#64748b;font-size:11px;flex:0 0 auto;">
          Installing adds a shortcut to HedgeOS. Apps launch inside HedgeOS Browser through Scramjet. Third-party services are not affiliated with HedgeOS.
        </footer>
      </div>
      <style>
        .store-shell #store-tabs button{border:0;border-radius:20px;padding:8px 14px;background:#edf2f8;color:#334155;font-weight:700;cursor:pointer;white-space:nowrap}
        .store-shell #store-tabs button.active{background:#2563eb;color:white}
        .store-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(225px,1fr));gap:12px}
        .store-card{display:flex;gap:12px;align-items:flex-start;background:white;border:1px solid #e1e7ef;border-radius:12px;padding:14px;min-width:0;box-shadow:0 2px 7px #1720330a}
        .store-icon{width:48px;height:48px;flex:0 0 48px;display:grid;place-items:center;background:#eef4ff;border-radius:12px;font-size:27px}
        .store-info{min-width:0;flex:1}
        .store-info h3{margin:1px 0 5px;font-size:14px}
        .store-info p{margin:0;color:#64748b;font-size:12px;line-height:1.4;min-height:34px}
        .store-category{font-size:10px;color:#2563eb;font-weight:700;text-transform:uppercase;letter-spacing:.5px}
        .store-action{margin-top:10px;border:0;border-radius:7px;padding:7px 12px;background:#2563eb;color:white;font-weight:700;cursor:pointer}
        .store-action.remove{background:#e9eef5;color:#334155}
        .store-empty{text-align:center;padding:42px 12px;color:#64748b}
        @media(max-width:520px){.store-grid{grid-template-columns:1fr}.store-shell header{padding:14px}}
      </style>`;

    const w = WindowManager.create({
      title: 'Play Store',
      icon: '🛍️',
      html,
      width: 900,
      height: 650
    });

    const root = w.content;
    const list = root.querySelector('#store-list');
    const search = root.querySelector('#store-search');
    const tabs = root.querySelector('#store-tabs');
    let category = 'All';

    function render() {
      const installed = readInstalled();
      const term = search.value.trim().toLowerCase();
      const visible = catalog.filter(app => {
        const categoryMatch = category === 'All' ||
          (category === 'Installed' ? installed.includes(app.id) : app.category === category);
        const searchMatch = !term || (app.name + ' ' + app.description + ' ' + app.category).toLowerCase().includes(term);
        return categoryMatch && searchMatch;
      });

      list.innerHTML = visible.length ? '<div class="store-grid">' + visible.map(app => {
        const isInstalled = installed.includes(app.id);
        return `
          <article class="store-card">
            <div class="store-icon">${app.icon}</div>
            <div class="store-info">
              <div class="store-category">${escapeHTML(app.category)}</div>
              <h3>${escapeHTML(app.name)}</h3>
              <p>${escapeHTML(app.description)}</p>
              <button class="store-action ${isInstalled ? 'remove' : ''}" data-app="${escapeHTML(app.id)}" data-action="${isInstalled ? 'remove' : 'install'}">${isInstalled ? 'Uninstall' : 'Install'}</button>
              <button class="store-action remove" data-app="${escapeHTML(app.id)}" data-action="open">Open</button>
            </div>
          </article>`;
      }).join('') + '</div>' : '<div class="store-empty"><div style="font-size:34px;">🔎</div><h3>Nothing found</h3><p>Try another search or category.</p></div>';
      
      tabs.querySelectorAll('button').forEach(button => {
        const active = button.dataset.category === category;
        button.classList.toggle('active', active);
      });
    }

    tabs.querySelectorAll('button').forEach(button => {
      button.onclick = () => {
        category = button.dataset.category;
        render();
      };
    });

    search.oninput = render;

    list.onclick = event => {
      const button = event.target.closest('button[data-app]');
      if (!button) return;
      const app = catalog.find(item => item.id === button.dataset.app);
      if (!app) return;

      if (button.dataset.action === 'open') {
        launchApp(app);
        return;
      }

      const installed = readInstalled();
      if (button.dataset.action === 'install' && !installed.includes(app.id)) installed.push(app.id);
      if (button.dataset.action === 'remove') {
        const index = installed.indexOf(app.id);
        if (index !== -1) installed.splice(index, 1);
      }
      saveInstalled(installed);
      syncInstalledApps();
      if (typeof Desktop !== 'undefined' && Desktop.renderIcons) Desktop.renderIcons();
      render();
    };

    render();
    return w;
  }

  return { open, syncInstalledApps };
})();

// Restore installed app shortcuts whenever HedgeOS starts.
PlayStore.syncInstalledApps();
