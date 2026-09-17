const Settings = (() => {
  const sections = [
    { id: 'appearance', label: 'Appearance', icon: '🎨' },
    { id: 'desktop',    label: 'Desktop',    icon: '🖥' },
    { id: 'system',     label: 'System',     icon: '⚙' },
    { id: 'account',    label: 'Account',    icon: '👤' },
    { id: 'about',      label: 'About',      icon: '💻' },
  ];

  function open(startSection = 'appearance') {
    const navHtml = sections.map(s =>
      `<div class="settings-nav-item${s.id === startSection ? ' active' : ''}" data-section="${s.id}">
        <span>${s.icon}</span><span>${s.label}</span>
      </div>`
    ).join('');

    const html = `
      <div class="settings-container">
        <div class="settings-nav">${navHtml}</div>
        <div class="settings-content">
          ${buildAppearance()}
          ${buildDesktop()}
          ${buildSystem()}
          ${buildAccount()}
          ${buildAbout()}
        </div>
      </div>`;

    const w = WindowManager.create({ title: 'Settings', icon: '⚙', html, width: 600, height: 460 });
    const root = w.content;

    root.querySelectorAll('.settings-nav-item').forEach(item => {
      item.addEventListener('click', () => {
        root.querySelectorAll('.settings-nav-item').forEach(i => i.classList.remove('active'));
        root.querySelectorAll('.settings-section').forEach(s => s.classList.remove('active'));
        item.classList.add('active');
        root.querySelector('#section-' + item.dataset.section)?.classList.add('active');
      });
    });

    root.querySelector('#section-' + startSection)?.classList.add('active');

    initToggles(root);
    initThemePicker(root);
    initWallpaperPicker(root);
    initNameInput(root);
    initAccount(root);

    return w;
  }

  function buildAppearance() {
    const themes = [
      { id: 'blue', label: 'Blue', color: '#2563eb' },
      { id: 'purple', label: 'Purple', color: '#7c3aed' },
      { id: 'green', label: 'Green', color: '#059669' },
      { id: 'rose', label: 'Rose', color: '#e11d48' },
      { id: 'orange', label: 'Orange', color: '#ea580c' },
    ];
    const themeHtml = themes.map(t =>
      `<div class="theme-swatch${HedgeOS.settings.theme === t.id ? ' selected' : ''}"
        data-theme="${t.id}"
        style="width:40px;height:40px;border-radius:8px;background:${t.color};cursor:pointer;
          border:3px solid ${HedgeOS.settings.theme === t.id ? '#fff' : 'transparent'};
          transition:border-color 0.2s;display:inline-block;margin:4px;"
        title="${t.label}"></div>`
    ).join('');

    const wallpapers = HedgeOS.wallpapers.map((w, i) =>
      `<div class="wallpaper-opt${HedgeOS.settings.wallpaper === i ? ' selected' : ''}"
        data-wp="${i}" style="background:${w}"></div>`
    ).join('');

    return `
      <div class="settings-section" id="section-appearance">
        <h2>Appearance</h2>
        <div class="settings-row">
          <div><label>Accent Colour</label><br><small>Changes the OS accent colour</small></div>
        </div>
        <div style="padding:8px 0 16px">${themeHtml}</div>
        <div class="settings-row">
          <div><label>Wallpaper</label><br><small>Choose a desktop background</small></div>
        </div>
        <div class="wallpaper-grid" style="margin-top:8px">${wallpapers}</div>
      </div>`;
  }

  function buildDesktop() {
    return `
      <div class="settings-section" id="section-desktop">
        <h2>Desktop</h2>
        <div class="settings-row">
          <div><label>Show Seconds in Clock</label><br><small>Display seconds in the taskbar clock</small></div>
          <div class="toggle${HedgeOS.settings.clockSeconds ? ' on' : ''}" data-setting="clockSeconds"></div>
        </div>
        <div class="settings-row">
          <div><label>Enable Notifications</label><br><small>Show desktop notifications</small></div>
          <div class="toggle${HedgeOS.settings.notificationsEnabled ? ' on' : ''}" data-setting="notificationsEnabled"></div>
        </div>
      </div>`;
  }

  function buildSystem() {
    return `
      <div class="settings-section" id="section-system">
        <h2>System</h2>
        <div class="settings-row">
          <div><label>Version</label></div>
          <span style="color:var(--text-dim);font-size:13px">HedgeOS ${HedgeOS.version}</span>
        </div>
        <div class="settings-row">
          <div><label>Platform</label></div>
          <span style="color:var(--text-dim);font-size:13px">${navigator.platform}</span>
        </div>
        <div class="settings-row">
          <div><label>Screen</label></div>
          <span style="color:var(--text-dim);font-size:13px">${screen.width}×${screen.height}</span>
        </div>
        <div class="settings-row" style="margin-top:8px">
          <div><label>Reset Settings</label><br><small>Restore all settings to defaults</small></div>
          <button class="btn danger" id="settings-reset">Reset</button>
        </div>
      </div>`;
  }

  function buildAccount() {
    return `
      <div class="settings-section" id="section-account">
        <h2>Account</h2>
        <div class="settings-row">
          <div><label>Display Name</label><br><small>Your name on the lock screen and start menu</small></div>
          <input type="text" id="settings-username" value="${HedgeOS.settings.userName}"
            style="background:rgba(255,255,255,0.07);border:1px solid var(--border);border-radius:6px;
              padding:6px 10px;color:var(--text);font-size:13px;outline:none;width:160px">
        </div>
        <div class="settings-row">
          <div><label>Puter Account</label><br><small>Cloud file storage and sync</small></div>
          <div id="puter-status-row"></div>
        </div>
      </div>`;
  }

  function buildAbout() {
    return `
      <div class="settings-section" id="section-about">
        <h2>About HedgeOS</h2>
        <div class="about-container" style="text-align:left;align-items:flex-start;padding:0">
          <div style="font-size:48px">🌿</div>
          <div style="font-size:20px;font-weight:700;color:var(--text)">HedgeOS ${HedgeOS.version}</div>
          <div style="font-size:13px;color:var(--text-dim)">A web-based operating system powered by Puter.js</div>
          <div style="font-size:12px;color:var(--text-dim);margin-top:8px">
            Built with vanilla JavaScript, no frameworks.<br>
            Open source and extensible.
          </div>
        </div>
      </div>`;
  }

  function initToggles(root) {
    root.querySelectorAll('.toggle[data-setting]').forEach(toggle => {
      toggle.addEventListener('click', () => {
        toggle.classList.toggle('on');
        const key = toggle.dataset.setting;
        HedgeOS.settings[key] = toggle.classList.contains('on');
        HedgeOS.saveSettings();
      });
    });

    const resetBtn = root.querySelector('#settings-reset');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        if (confirm('Reset all settings to defaults?')) {
          localStorage.removeItem('hedgeos-settings');
          location.reload();
        }
      });
    }
  }

  function initThemePicker(root) {
    root.querySelectorAll('.theme-swatch').forEach(sw => {
      sw.addEventListener('click', () => {
        root.querySelectorAll('.theme-swatch').forEach(s => {
          s.classList.remove('selected');
          s.style.borderColor = 'transparent';
        });
        sw.classList.add('selected');
        sw.style.borderColor = '#fff';
        HedgeOS.settings.theme = sw.dataset.theme;
        HedgeOS.saveSettings();
      });
    });
  }

  function initWallpaperPicker(root) {
    root.querySelectorAll('.wallpaper-opt').forEach(opt => {
      opt.addEventListener('click', () => {
        root.querySelectorAll('.wallpaper-opt').forEach(o => o.classList.remove('selected'));
        opt.classList.add('selected');
        HedgeOS.settings.wallpaper = parseInt(opt.dataset.wp);
        HedgeOS.saveSettings();
      });
    });
  }

  function initNameInput(root) {
    const nameInput = root.querySelector('#settings-username');
    if (!nameInput) return;
    let debounce;
    nameInput.addEventListener('input', () => {
      clearTimeout(debounce);
      debounce = setTimeout(() => {
        HedgeOS.settings.userName = nameInput.value || 'HedgeOS User';
        HedgeOS.saveSettings();
      }, 500);
    });
  }

  function initAccount(root) {
    const row = root.querySelector('#puter-status-row');
    if (!row) return;
    if (HedgeOS.puterReady) {
      puter.auth.getUser().then(user => {
        row.innerHTML = `<span style="color:var(--text);font-size:13px">✅ ${user.username || 'Signed in'}</span>
          <button class="btn danger" style="margin-left:8px;padding:4px 10px;font-size:12px" id="puter-signout">Sign Out</button>`;
        root.querySelector('#puter-signout')?.addEventListener('click', async () => {
          await puter.auth.signOut();
          HedgeOS.puterReady = false;
          Notifications.show('Account', 'Signed out of Puter.', '👤');
        });
      }).catch(() => {
        row.innerHTML = `<button class="btn" id="puter-signin">Sign in to Puter</button>`;
        root.querySelector('#puter-signin')?.addEventListener('click', async () => {
          await puter.auth.signIn();
          HedgeOS.puterReady = true;
          Notifications.show('Account', 'Signed in to Puter!', '✅');
        });
      });
    } else {
      row.innerHTML = `<button class="btn" id="puter-signin">Sign in to Puter</button>`;
      root.querySelector('#puter-signin')?.addEventListener('click', async () => {
        try {
          await puter.auth.signIn();
          HedgeOS.puterReady = true;
          Notifications.show('Account', 'Signed in to Puter!', '✅');
          row.innerHTML = `<span style="color:var(--text);font-size:13px">✅ Signed in</span>`;
        } catch (e) { Notifications.show('Error', e.message, '❌'); }
      });
    }
  }

  return { open };
})();
