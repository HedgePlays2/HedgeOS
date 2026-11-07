const Settings = (() => {
  const sections = [
    { id: 'appearance', label: 'Appearance', icon: '🎨' },
    { id: 'desktop',    label: 'Desktop',    icon: '🖥' },
    { id: 'system',     label: 'System',     icon: '⚙' },
    { id: 'apps',       label: 'Apps & Storage', icon: '📦' },
    { id: 'advanced',   label: 'Advanced',    icon: '🛠️' },
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
          ${buildApps()}
          ${buildAdvanced()}
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
    initCustomWallpaper(root);
    initAdvancedTools(root);
    initStorageTools(root);
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
        <div style="margin-top:18px;padding:14px;border:1px solid var(--border);border-radius:10px">
          <label style="font-weight:700">Your own background</label>
          <p style="color:var(--text-dim);font-size:12px;line-height:1.5;margin:5px 0 10px">Choose an image from your Chromebook to use as your HedgeOS desktop wallpaper. It is saved on this device.</p>
          <div id="custom-wallpaper-preview" style="height:110px;border-radius:8px;background:#1e293b center/cover no-repeat;margin-bottom:10px"></div>
          <input id="custom-wallpaper-file" type="file" accept="image/png,image/jpeg,image/webp,image/gif" style="max-width:100%;font-size:12px">
          <div style="display:flex;gap:8px;margin-top:10px;flex-wrap:wrap">
            <button class="btn" id="custom-wallpaper-apply" disabled>Use image</button>
            <button class="btn" id="custom-wallpaper-remove">Remove custom background</button>
          </div>
          <small id="custom-wallpaper-status" style="display:block;color:var(--text-dim);margin-top:8px">PNG, JPG, WebP or GIF. Large images are resized to fit.</small>
        </div>
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

  function buildApps() {
    return `
      <div class="settings-section" id="section-apps">
        <h2>Apps & Storage</h2>
        <p style="color:var(--text-dim);font-size:13px;line-height:1.5">
          Manage HedgeOS app storage and experimental Windows compatibility.
        </p>
        <div class="settings-row">
          <div><label>Windows compatibility</label><br><small>Experimental browser-based 64-bit and 32-bit runtimes</small></div>
          <span style="font-size:12px;color:var(--text-dim)">Experimental</span>
        </div>
        <div class="settings-row">
          <div><label>App Installer</label><br><small>Import EXE, APK and ZIP backup files</small></div>
          <button class="btn" id="settings-open-installer">Open</button>
        </div>
        <div class="settings-row">
          <div><label>Local storage</label><br><small id="settings-storage-usage">Checking browser storage…</small></div>
          <button class="btn" id="settings-storage-refresh">Refresh</button>
        </div>
        <div class="settings-row">
          <div><label>Keep local files available</label><br><small id="settings-storage-persist-status">Checking persistent storage permission…</small></div>
          <button class="btn" id="settings-storage-persist">Enable</button>
        </div>
        <div class="settings-row">
          <div><label>Cloud backups</label><br><small>Use App Installer to back up files to your signed-in Puter account</small></div>
          <span style="font-size:12px;color:var(--text-dim)" id="settings-storage-cloud">${typeof Accounts !== 'undefined' && Accounts.getUser() ? '☁ Signed in' : 'Not signed in'}</span>
        </div>
        <p style="color:var(--text-dim);font-size:11px;line-height:1.5;margin-top:12px">
          Persistent storage asks Chrome to protect HedgeOS files from automatic storage cleanup. It does not guarantee unlimited space or replace cloud backups. Windows programs still run in a separate browser runtime; live virtual C: drive syncing is not connected yet.
        </p>
      </div>`;
  }

  function buildAdvanced() {
    return `
      <div class="settings-section" id="section-advanced">
        <h2>Advanced</h2>
        <p style="color:var(--text-dim);font-size:13px;line-height:1.5">Power-user tools for backing up and troubleshooting HedgeOS.</p>
        <div class="settings-row">
          <div><label>Export settings</label><br><small>Download a backup of your HedgeOS preferences</small></div>
          <button class="btn" id="settings-export">Export</button>
        </div>
        <div class="settings-row">
          <div><label>Import settings</label><br><small>Restore preferences from a HedgeOS JSON backup</small></div>
          <button class="btn" id="settings-import">Import</button>
          <input type="file" id="settings-import-file" accept="application/json,.json" hidden>
        </div>
        <div class="settings-row">
          <div><label>Storage diagnostics</label><br><small>Check browser storage support and available quota</small></div>
          <button class="btn" id="settings-advanced-storage">Check</button>
        </div>
        <p id="settings-advanced-status" role="status" style="font-size:11px;color:var(--text-dim);margin-top:12px"></p>
      </div>`;
  }

  function buildAccount() {
    const user = typeof Accounts !== 'undefined' ? Accounts.getUser() : null;
    return `
      <div class="settings-section" id="section-account">
        <h2>HedgeOS Account</h2>
        <p style="color:var(--text-dim);font-size:13px;line-height:1.5">
          Sign in with a Puter account to use HedgeOS on other devices. Your HedgeOS settings will sync through your private cloud storage.
        </p>
        <div class="settings-row">
          <div><label>Account status</label><br><small id="hedge-account-status">${user ? 'Signed in as ' + user.username : 'Not signed in'}</small></div>
          <span id="hedge-account-avatar" style="font-size:26px">${user ? '✅' : '👤'}</span>
        </div>
        <div class="settings-row">
          <div><label>Display Name</label><br><small>Your name in HedgeOS</small></div>
          <input type="text" id="settings-username" value="${HedgeOS.settings.userName}"
            style="background:rgba(255,255,255,0.07);border:1px solid var(--border);border-radius:6px;
              padding:6px 10px;color:var(--text);font-size:13px;outline:none;width:160px">
        </div>
        <div class="settings-row">
          <div><label>Cloud Sync</label><br><small>Syncs your theme, wallpaper, and preferences</small></div>
          <span id="hedge-cloud-status" style="font-size:12px;color:var(--text-dim)">${user ? '☁ Connected' : 'Sign in to enable'}</span>
        </div>
        <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:18px">
          <button class="btn" id="hedge-account-signin">${user ? 'Switch Account' : 'Create Account / Sign In'}</button>
          ${user ? '<button class="btn danger" id="hedge-account-signout">Sign Out</button>' : ''}
        </div>
        <p style="color:var(--text-dim);font-size:11px;margin-top:14px">
          New here? Choose “Create Account / Sign In” and follow the Puter sign-up screen. HedgeOS never stores your password.
        </p>
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

  function initCustomWallpaper(root) {
    const picker = root.querySelector('#custom-wallpaper-file');
    const apply = root.querySelector('#custom-wallpaper-apply');
    const remove = root.querySelector('#custom-wallpaper-remove');
    const preview = root.querySelector('#custom-wallpaper-preview');
    const status = root.querySelector('#custom-wallpaper-status');
    let preparedImage = '';

    function showCurrent() {
      const image = HedgeOS.settings.customWallpaper || '';
      preview.style.backgroundImage = image ? 'url("' + image + '")' : 'none';
      if (!image) preview.style.background = '#1e293b';
    }
    showCurrent();

    picker?.addEventListener('change', () => {
      const file = picker.files && picker.files[0];
      preparedImage = '';
      apply.disabled = true;
      if (!file) return;
      if (!/^image\/(png|jpeg|webp|gif)$/.test(file.type)) {
        status.textContent = 'Please choose a PNG, JPG, WebP or GIF image.';
        return;
      }
      if (file.size > 15 * 1024 * 1024) {
        status.textContent = 'That image is over 15 MB. Choose a smaller image.';
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        const image = new Image();
        image.onload = () => {
          const maxWidth = 1920, maxHeight = 1080;
          const scale = Math.min(1, maxWidth / image.width, maxHeight / image.height);
          const canvas = document.createElement('canvas');
          canvas.width = Math.max(1, Math.round(image.width * scale));
          canvas.height = Math.max(1, Math.round(image.height * scale));
          const ctx = canvas.getContext('2d');
          ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
          preparedImage = canvas.toDataURL('image/jpeg', 0.78);
          if (preparedImage.length > 3 * 1024 * 1024) {
            status.textContent = 'This image is still too large after resizing. Try a smaller image.';
            preparedImage = '';
            return;
          }
          preview.style.background = '#1e293b center/cover no-repeat';
          preview.style.backgroundImage = 'url("' + preparedImage + '")';
          status.textContent = 'Image ready. Select “Use image” to apply it.';
          apply.disabled = false;
        };
        image.onerror = () => { status.textContent = 'Could not read that image.'; };
        image.src = reader.result;
      };
      reader.onerror = () => { status.textContent = 'Could not load that image.'; };
      reader.readAsDataURL(file);
    });

    apply?.addEventListener('click', () => {
      if (!preparedImage) return;
      HedgeOS.settings.customWallpaper = preparedImage;
      HedgeOS.settings.wallpaper = -1;
      HedgeOS.saveSettings();
      showCurrent();
      status.textContent = 'Custom background applied and saved on this device.';
      apply.disabled = true;
    });

    remove?.addEventListener('click', () => {
      delete HedgeOS.settings.customWallpaper;
      HedgeOS.settings.wallpaper = 0;
      HedgeOS.saveSettings();
      picker.value = '';
      preparedImage = '';
      showCurrent();
      status.textContent = 'Custom background removed. Default background restored.';
      apply.disabled = true;
    });
  }

  function initStorageTools(root) {
    const openInstaller = root.querySelector('#settings-open-installer');
    openInstaller?.addEventListener('click', () => {
      if (typeof AppInstaller !== 'undefined') AppInstaller.open();
      else Notifications.show('App Installer', 'The App Installer is not available.', '⚠️');
    });

    const usage = root.querySelector('#settings-storage-usage');
    const persistStatus = root.querySelector('#settings-storage-persist-status');
    const persistButton = root.querySelector('#settings-storage-persist');

    async function refreshStorage() {
      if (usage) usage.textContent = 'Checking browser storage…';
      try {
        if (navigator.storage && navigator.storage.estimate) {
          const estimate = await navigator.storage.estimate();
          const used = estimate.usage || 0;
          const quota = estimate.quota || 0;
          const format = bytes => bytes < 1048576 ? (bytes / 1024).toFixed(1) + ' KB' : (bytes / 1048576).toFixed(1) + ' MB';
          usage.textContent = format(used) + ' used of ' + (quota ? format(quota) : 'unknown quota');
        } else if (usage) {
          usage.textContent = 'Storage estimates are not supported by this browser.';
        }
      } catch (error) {
        if (usage) usage.textContent = 'Could not read storage usage.';
      }
      try {
        if (navigator.storage && navigator.storage.persisted) {
          const persistent = await navigator.storage.persisted();
          if (persistStatus) persistStatus.textContent = persistent ? 'Persistent storage is enabled' : 'Browser may clear site data when space is low';
          if (persistButton) {
            persistButton.textContent = persistent ? 'Enabled' : 'Enable';
            persistButton.disabled = persistent;
          }
        } else if (persistStatus) {
          persistStatus.textContent = 'Persistent storage is not supported here.';
          if (persistButton) persistButton.disabled = true;
        }
      } catch (error) {
        if (persistStatus) persistStatus.textContent = 'Could not check storage permission.';
      }
    }

    root.querySelector('#settings-storage-refresh')?.addEventListener('click', refreshStorage);
    persistButton?.addEventListener('click', async () => {
      if (!navigator.storage || !navigator.storage.persist) {
        if (persistStatus) persistStatus.textContent = 'Persistent storage is not supported here.';
        return;
      }
      persistButton.disabled = true;
      persistButton.textContent = 'Requesting…';
      try {
        const granted = await navigator.storage.persist();
        if (persistStatus) persistStatus.textContent = granted ? 'Persistent storage is enabled' : 'Chrome did not grant persistent storage. Keep cloud backups.';
        persistButton.textContent = granted ? 'Enabled' : 'Try again';
        persistButton.disabled = granted;
      } catch (error) {
        if (persistStatus) persistStatus.textContent = 'Could not request persistent storage.';
        persistButton.textContent = 'Try again';
        persistButton.disabled = false;
      }
    });
    refreshStorage();
  }

  function initAdvancedTools(root) {
    const status = root.querySelector('#settings-advanced-status');
    root.querySelector('#settings-export')?.addEventListener('click', () => {
      const blob = new Blob([JSON.stringify(HedgeOS.settings, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'hedgeos-settings-backup.json';
      link.click();
      URL.revokeObjectURL(url);
      status.textContent = 'Settings backup exported.';
    });

    const importButton = root.querySelector('#settings-import');
    const importPicker = root.querySelector('#settings-import-file');
    importButton?.addEventListener('click', () => importPicker.click());
    importPicker?.addEventListener('change', async () => {
      const file = importPicker.files && importPicker.files[0];
      if (!file) return;
      try {
        if (file.size > 256 * 1024) throw new Error('Settings backup is too large.');
        const data = JSON.parse(await file.text());
        const allowed = ['theme', 'wallpaper', 'userName', 'notificationsEnabled', 'clockSeconds'];
        allowed.forEach(key => {
          if (Object.prototype.hasOwnProperty.call(data, key)) HedgeOS.settings[key] = data[key];
        });
        HedgeOS.saveSettings();
        status.textContent = 'Settings imported. Reload HedgeOS to refresh every part of the desktop.';
      } catch (error) {
        status.textContent = error.message || 'Could not import this settings file.';
      }
      importPicker.value = '';
    });

    root.querySelector('#settings-advanced-storage')?.addEventListener('click', async () => {
      try {
        const estimate = navigator.storage?.estimate ? await navigator.storage.estimate() : null;
        const persisted = navigator.storage?.persisted ? await navigator.storage.persisted() : false;
        status.textContent = estimate
          ? 'Storage: ' + ((estimate.usage || 0) / 1048576).toFixed(1) + ' MB used / ' + ((estimate.quota || 0) / 1048576).toFixed(1) + ' MB quota. Persistent: ' + (persisted ? 'yes' : 'no') + '.'
          : 'Storage diagnostics are not supported in this browser.';
      } catch (error) {
        status.textContent = 'Storage diagnostics failed: ' + (error.message || error);
      }
    });
  }

  function initAccount(root) {
    const signInButton = root.querySelector('#hedge-account-signin');
    const signOutButton = root.querySelector('#hedge-account-signout');
    const status = root.querySelector('#hedge-account-status');
    const cloudStatus = root.querySelector('#hedge-cloud-status');

    signInButton?.addEventListener('click', async () => {
      const switching = !!Accounts.getUser();
      signInButton.disabled = true;
      signInButton.textContent = 'Connecting...';
      try {
        const user = await Accounts.signIn(switching);
        status.textContent = 'Signed in as ' + (user.username || 'Puter user');
        cloudStatus.textContent = '☁ Connected';
        Notifications.show('HedgeOS Account', 'Welcome, ' + (user.username || 'there') + '!', '✅');
        open('account');
      } catch (error) {
        Notifications.show('Sign-in failed', error.message || 'Could not sign in.', '❌');
        signInButton.disabled = false;
        signInButton.textContent = switching ? 'Switch Account' : 'Create Account / Sign In';
      }
    });

    signOutButton?.addEventListener('click', async () => {
      try {
        await Accounts.signOut();
        Notifications.show('HedgeOS Account', 'You have signed out.', '👋');
        open('account');
      } catch (error) {
        Notifications.show('Sign-out failed', error.message || 'Could not sign out.', '❌');
      }
    });

    const nameInput = root.querySelector('#settings-username');
    if (nameInput) {
      let debounce;
      nameInput.addEventListener('input', () => {
        clearTimeout(debounce);
        debounce = setTimeout(() => {
          HedgeOS.settings.userName = nameInput.value.trim() || 'HedgeOS User';
          HedgeOS.saveSettings();
        }, 400);
      });
    }
  }

  return { open };
})();
