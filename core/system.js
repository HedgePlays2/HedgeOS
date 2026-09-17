const HedgeOS = {
  version: '3.0',
  puterReady: false,

  settings: {
    theme: 'blue',
    wallpaper: 0,
    userName: 'HedgeOS User',
    notificationsEnabled: true,
    clockSeconds: true,
  },

  apps: [
    { id: 'files',    name: 'File Manager', icon: '📁', launch: () => FileExplorer.open() },
    { id: 'terminal', name: 'Terminal',      icon: '⌨',  launch: () => Terminal.open() },
    { id: 'browser',  name: 'Browser',       icon: '🌐', launch: () => OSBrowser.open() },
    { id: 'settings', name: 'Settings',      icon: '⚙',  launch: () => Settings.open() },
    { id: 'about',    name: 'About HedgeOS', icon: '💻', launch: () => HedgeOS.openAbout() },
  ],

  wallpapers: [
    'linear-gradient(135deg,#111827 0%,#1e3a8a 50%,#0f172a 100%)',
    'linear-gradient(135deg,#0f172a,#4c1d95,#0f172a)',
    'linear-gradient(135deg,#064e3b,#065f46,#1e3a5f)',
    'linear-gradient(135deg,#1c1917,#451a03,#1c1917)',
    'linear-gradient(135deg,#0c4a6e,#075985,#0369a1)',
    'linear-gradient(160deg,#0f172a 0%,#1e1b4b 40%,#312e81 100%)',
  ],

  loadSettings() {
    try {
      const s = localStorage.getItem('hedgeos-settings');
      if (s) Object.assign(this.settings, JSON.parse(s));
    } catch {}
    this.applySettings();
  },

  saveSettings() {
    localStorage.setItem('hedgeos-settings', JSON.stringify(this.settings));
    this.applySettings();
  },

  applySettings() {
    document.documentElement.setAttribute('data-theme', this.settings.theme);
    const wp = document.getElementById('wallpaper');
    if (wp) wp.style.background = this.wallpapers[this.settings.wallpaper] || this.wallpapers[0];
    const sm = document.getElementById('start-user-name');
    if (sm) sm.textContent = this.settings.userName;
  },

  openAbout() {
    const html = `
      <div class="about-container">
        <div class="about-logo">🌿</div>
        <div class="about-name">HedgeOS</div>
        <div class="about-version">Version ${this.version}</div>
        <div class="about-desc">A web-based operating system powered by Puter.js</div>
        <div class="about-info">
          <div class="about-row"><span class="key">Version</span><span class="val">${this.version}</span></div>
          <div class="about-row"><span class="key">Engine</span><span class="val">Puter.js v2</span></div>
          <div class="about-row"><span class="key">Platform</span><span class="val">${navigator.platform}</span></div>
          <div class="about-row"><span class="key">Browser</span><span class="val">${navigator.userAgent.split(') ').pop().split('/')[0]}</span></div>
          <div class="about-row"><span class="key">Screen</span><span class="val">${screen.width}×${screen.height}</span></div>
          <div class="about-row"><span class="key">Window</span><span class="val">${innerWidth}×${innerHeight}</span></div>
        </div>
      </div>`;
    WindowManager.create({ title: 'About HedgeOS', icon: '💻', html, width: 360, height: 460 });
  },
};
