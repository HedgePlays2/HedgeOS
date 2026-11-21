const PlayStore = (() => {
  const STORAGE_KEY = 'hedgeos-installed-apps';

  const catalog = [
    { id: 'hedge-arcade', name: 'Hedge Web Arcade', icon: '🎮', category: 'Games', description: 'A collection of browser games, including Sonic adventures.', url: 'https://hedgeplays2.github.io/' },
    { id: 'scratch', name: 'Scratch', icon: '🐱', category: 'Apps', description: 'Create games, animations and interactive stories.', url: 'https://scratch.mit.edu/' },
    { id: 'itch-io', name: 'itch.io', icon: '🕹️', category: 'Games', description: 'Discover indie games you can play in your browser.', url: 'https://itch.io/games/html5' },
    { id: 'sonic-triple-trouble-16bit', name: 'Sonic Triple Trouble 16-bit Web', icon: '🦔', category: 'Games', description: 'Play the fan-made 16-bit Sonic adventure in your browser.', url: 'https://sonic-triple-trouble-16-bit-webport.pages.dev/' },
    { id: 'poppy-playtime-ch4', name: 'Poppy Playtime: Chapter 4', icon: '🧸', category: 'Games', description: 'A browser port of Poppy Playtime: Chapter 4.', url: 'https://ppch4-private.theblehlollipop.workers.dev/' },
    { id: 'poppy-playtime-ch6', name: 'Poppy Playtime: Chapter 6 — A Better Place', icon: '⭐', category: 'Games', description: 'Continue the fan-made Poppy Playtime story in the Data Center.', url: 'https://hedgeplays2.github.io/Poppy-Playtime-Chapter-6-Better-Place/' },
    { id: 'sonic-time-twisted', name: 'Sonic Time Twisted Web', icon: '🌀', category: 'Games', description: 'A Sonic fan game with time-traveling zones.', url: 'https://hedgeplays2.github.io/sonic-time-twisted-web/' },
    { id: 'sonic-time-twisted-port', name: 'Sonic Time Twisted Web Port', icon: '🌀', category: 'Games', description: 'Another web build of Sonic Time Twisted.', url: 'https://hedgeplays2.github.io/stt-web-port/' },
    { id: 'sonic-1-web', name: 'Sonic 1 Web', icon: '💨', category: 'Games', description: 'Play the original Sonic the Hedgehog in your browser.', url: 'https://hedgeplays2.github.io/sonic-1-jsdlivr/' },
    { id: 'sonic-2-web', name: 'Sonic 2 Web Port', icon: '💨', category: 'Games', description: 'Play Sonic the Hedgehog 2 in your browser.', url: 'https://hedgeplays2.github.io/Sonic2-Web-Port/' },
    { id: 'srb2-web', name: 'Sonic Robo Blast 2 Web', icon: '🤖', category: 'Games', description: 'A browser-playable build of Sonic Robo Blast 2.', url: 'https://srb2web.gvbvdxx.me/' },
    { id: 'sonic-3-air', name: 'Sonic 3 A.I.R. Web', icon: '🦔', category: 'Games', description: 'Play Sonic 3 A.I.R. in your browser. Requires an original Sonic 3 & Knuckles ROM.', url: 'https://projects.sappharad.com/s3air_ios/20260328_beta/sonic3air_web.html' },
    { id: 'deltarune-fight-sim', name: 'DELTARUNE Fight Simulator', icon: '⚔️', category: 'Games', description: 'A browser-based DELTARUNE battle simulator.', url: 'https://deltarunesim.com/' },
    { id: 'deltarune-ch1-4', name: 'DELTARUNE Chapters 1–4 Web', icon: '🌟', category: 'Games', description: 'A browser build covering DELTARUNE Chapters 1–4.', url: 'https://mollomm1.github.io/test/' },
    { id: 'deltarune-web', name: 'DELTARUNE Web', icon: '🌟', category: 'Games', description: 'A web version of DELTARUNE.', url: 'https://hedgeplays2.github.io/Deltarune-Web/' },
    { id: 'bendy-web', name: 'Bendy and the Ink Machine Web', icon: '🖋️', category: 'Games', description: 'Explore the ink-soaked world of Bendy in this browser port.', url: 'https://hedgeplays2.github.io/BATIM-Web/' },
    { id: 'sonic-mania-plus', name: 'Sonic Mania Plus Web', icon: '💎', category: 'Games', description: 'A browser port of Sonic Mania Plus.', url: 'https://hedgeplays2.github.io/Sonic-Mania-Plus-WEB/' },
    { id: 'sonic-cd-web', name: 'Sonic CD Web', icon: '⏱️', category: 'Games', description: 'Race through time in Sonic CD.', url: 'https://hedgeplays2.github.io/Sonic-CD-Web/' },
    { id: 'cuphead-web', name: 'Cuphead Web', icon: '☕', category: 'Games', description: 'A browser version of Cuphead.', url: 'https://hedgeplays2.github.io/Cuphead-Web/' },
    { id: 'baldis-basics-plus', name: 'Baldi\'s Basics Plus Web', icon: '📏', category: 'Games', description: 'A browser version of Baldi\'s Basics Plus.', url: 'https://hedgeplays2.github.io/Baldi-s-Basics-Plus-Web/' },
    { id: 'sonic-fallen-star', name: 'Sonic and the Fallen Star', icon: '⭐', category: 'Games', description: 'A fan-made Sonic platforming adventure.', url: 'https://hedgeplays2.github.io/Sonic-and-the-Fallen-Star-Web/' },
    { id: 'super-mario-64', name: 'Super Mario 64 Web', icon: '🍄', category: 'Games', description: 'Play Super Mario 64 in your browser.', url: 'https://hedgeplays2.github.io/sm64ex-wasm/' },
    { id: 'super-mario-galaxy', name: 'Super Mario Galaxy Web', icon: '🌌', category: 'Games', description: 'A browser port of Super Mario Galaxy.', url: 'https://hedgeplays2.github.io/SMGwebport/' },
    { id: 'capuchin-web', name: 'Capuchin Web', icon: '🐒', category: 'Games', description: 'A browser version of Capuchin.', url: 'https://hedgeplays2.github.io/Capuchin/' },
    { id: 'happyhills-homicide', name: 'Happyhills Homicide 1', icon: '🔪', category: 'Games', description: 'A horror game with graphic violence.', url: 'https://hedgeplays2.github.io/happyhills_homicide_1_webport/' },
    { id: 'sonic-classic-heroes', name: 'Sonic Classic Heroes', icon: '🦔', category: 'Games', description: 'A classic-style Sonic fan game featuring team play.', url: 'https://hedgeplays2.github.io/Sonic-Classic-Heroes-Web/' },
    { id: 'garten-banban-1', name: 'Garten of Banban 1', icon: '🎈', category: 'Games', description: 'Explore the mysterious kindergarten in this browser port.', url: 'https://hedgeplays2.github.io/garten-of-banban/Garten%20of%20Banban%201.html' },
    { id: 'ddlc-web', name: 'Doki Doki Literature Club! Web', icon: '📚', category: 'Games', description: 'A browser port of the psychological horror visual novel.', url: 'https://hedgeplays2.github.io/DDLC-Web-Port/' },
    { id: 'minecraft-story-mode', name: 'Minecraft: Story Mode Web', icon: '⛏️', category: 'Games', description: 'Play the Minecraft story adventure in your browser.', url: 'https://hedgeplays2.github.io/mcsm-web-port/' },
    { id: 'minecraft-story-mode-alt', name: 'Minecraft: Story Mode Web — Alternate Port', icon: '⛏️', category: 'Games', description: 'An alternate browser port of Minecraft: Story Mode.', url: 'https://hedgeplays2.github.io/mcsmw/' },
    { id: 'sonic-megamix', name: 'Sonic Megamix V5.0 Web', icon: '🌀', category: 'Games', description: 'A browser version of the Sonic Megamix fan game.', url: 'https://hedgeplays2.github.io/Sonic-Megamix-V5.0-Web/' },
    { id: 'sonic-exe-web', name: 'Sonic.EXE Web', icon: '👁️', category: 'Games', description: 'A horror-themed Sonic fan game. Contains disturbing imagery.', url: 'https://hedgeplays2.github.io/Sonic.EXE/' },
    { id: 'sonic-webhog', name: 'Sonic The Webhog', icon: '🦔', category: 'Games', description: 'A Sonic browser game.', url: 'https://hedgeplays2.github.io/SonicWebHog/' },
    { id: 'websonic', name: 'WebSonic', icon: '💨', category: 'Games', description: 'A Sonic game playable on the web.', url: 'https://hedgeplays2.github.io/WebSonic/' },
    { id: 'sonic-forever-absolute', name: 'Sonic 1 Forever + Sonic 2 Absolute Web', icon: '💨', category: 'Games', description: 'Play Sonic 1 Forever and Sonic 2 Absolute in your browser.', url: 'https://www.ayuwoki.online/forever/' },
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
