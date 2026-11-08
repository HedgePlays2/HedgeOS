const QuickSettings = (() => {
  let panel;
  let battery = null;

  function init() {
    panel = document.getElementById('quick-settings');
    if (!panel) return;

    document.getElementById('tray-notif').addEventListener('click', () => toggle('notifications'));
    document.getElementById('tray-wifi').addEventListener('click', () => toggle('quick'));
    document.getElementById('clock-display').addEventListener('click', () => toggle('quick'));

    panel.querySelector('.qs-close').addEventListener('click', close);
    panel.querySelectorAll('[data-toggle]').forEach(button => {
      button.addEventListener('click', () => toggleSetting(button.dataset.toggle));
    });
    panel.querySelector('#qs-brightness').addEventListener('input', e => setBrightness(e.target.value));
    panel.querySelector('#qs-volume').addEventListener('input', e => setVolume(e.target.value));
    panel.querySelectorAll('#qs-settings').forEach(button => button.addEventListener('click', () => {
      close();
      Settings.open();
    }));
    panel.querySelector('#qs-clear').addEventListener('click', () => {
      Notifications.clearHistory();
    });

    document.addEventListener('click', e => {
      if (panel.classList.contains('open') &&
          !panel.contains(e.target) &&
          !e.target.closest('#taskbar-tray')) close();
    });
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') close();
    });

    window.addEventListener('online', updateNetwork);
    window.addEventListener('offline', updateNetwork);

    const brightness = Number(HedgeOS.settings.brightness ?? 100);
    const volume = Number(HedgeOS.settings.mediaVolume ?? 70);
    panel.querySelector('#qs-brightness').value = brightness;
    panel.querySelector('#qs-volume').value = volume;
    setBrightness(brightness, false);
    setVolume(volume, false);
    applyModes();

    if (navigator.getBattery) {
      navigator.getBattery().then(b => {
        battery = b;
        updateBattery();
        battery.addEventListener('levelchange', updateBattery);
        battery.addEventListener('chargingchange', updateBattery);
      }).catch(updateBattery);
    } else {
      updateBattery();
    }
    updateNetwork();
    updateDate();
  }

  function toggle(tab = 'quick') {
    if (panel.classList.contains('open') && panel.dataset.tab === tab) {
      close();
      return;
    }
    panel.dataset.tab = tab;
    panel.classList.add('open');
    panel.setAttribute('aria-hidden', 'false');
    panel.querySelector('#qs-quick-view').hidden = tab !== 'quick';
    panel.querySelector('#qs-notification-view').hidden = tab !== 'notifications';
    updateDate();
    updateNetwork();
    updateBattery();
  }

  function close() {
    if (!panel) return;
    panel.classList.remove('open');
    panel.setAttribute('aria-hidden', 'true');
  }

  function toggleSetting(name) {
    if (name === 'dark') HedgeOS.settings.colorMode = HedgeOS.settings.colorMode === 'light' ? 'dark' : 'light';
    if (name === 'night') HedgeOS.settings.nightLight = !HedgeOS.settings.nightLight;
    if (name === 'notifications') HedgeOS.settings.notificationsEnabled = !HedgeOS.settings.notificationsEnabled;
    applyModes();
    HedgeOS.saveSettings();
  }

  function applyModes() {
    document.documentElement.dataset.colorMode = HedgeOS.settings.colorMode === 'light' ? 'light' : 'dark';
    document.body.classList.toggle('night-light', !!HedgeOS.settings.nightLight);
    panel.querySelector('[data-toggle="dark"]').classList.toggle('active', HedgeOS.settings.colorMode !== 'light');
    panel.querySelector('[data-toggle="night"]').classList.toggle('active', !!HedgeOS.settings.nightLight);
    panel.querySelector('[data-toggle="notifications"]').classList.toggle('active', !!HedgeOS.settings.notificationsEnabled);
    panel.querySelector('[data-toggle="dark"] .qs-tile-state').textContent =
      HedgeOS.settings.colorMode === 'light' ? 'Light' : 'Dark';
    panel.querySelector('[data-toggle="night"] .qs-tile-state').textContent =
      HedgeOS.settings.nightLight ? 'On' : 'Off';
    panel.querySelector('[data-toggle="notifications"] .qs-tile-state').textContent =
      HedgeOS.settings.notificationsEnabled ? 'On' : 'Off';
  }

  function setBrightness(value, save = true) {
    const amount = Math.max(35, Math.min(100, Number(value)));
    panel.querySelector('#qs-brightness-value').textContent = amount + '%';
    document.getElementById('screen-dimmer').style.opacity = String((100 - amount) / 100 * 0.55);
    if (save) {
      HedgeOS.settings.brightness = amount;
      localStorage.setItem('hedgeos-settings', JSON.stringify(HedgeOS.settings));
    }
  }

  function setVolume(value, save = true) {
    const amount = Math.max(0, Math.min(100, Number(value)));
    panel.querySelector('#qs-volume-value').textContent = amount + '%';
    document.querySelectorAll('audio, video').forEach(media => { media.volume = amount / 100; });
    if (save) {
      HedgeOS.settings.mediaVolume = amount;
      localStorage.setItem('hedgeos-settings', JSON.stringify(HedgeOS.settings));
    }
  }

  function updateNetwork() {
    const online = navigator.onLine;
    panel.querySelector('#qs-network-state').textContent = online ? 'Connected' : 'Offline';
    panel.querySelector('#qs-network-icon').textContent = online ? '📶' : '⚠️';
    panel.querySelector('#tray-wifi').textContent = online ? '📶' : '⚠️';
  }

  function updateBattery() {
    const label = panel.querySelector('#qs-battery-state');
    if (!label) return;
    if (!battery) {
      label.textContent = 'Battery status unavailable';
      return;
    }
    label.textContent = (battery.charging ? 'Charging · ' : '') + Math.round(battery.level * 100) + '%';
  }

  function updateDate() {
    const now = new Date();
    panel.querySelector('#qs-large-time').textContent = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    panel.querySelector('#qs-date').textContent = now.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  }

  return { init, toggle, close };
})();
