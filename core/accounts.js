// HedgeOS cloud accounts powered by Puter.js.
// Puter handles identity; HedgeOS stores each user's preferences in their private app KV store.
const Accounts = (() => {
  let user = null;

  function available() {
    return typeof puter !== 'undefined' && puter.auth && puter.kv;
  }

  async function refresh() {
    if (!available() || !puter.auth.isSignedIn()) {
      user = null;
      HedgeOS.puterReady = false;
      return null;
    }

    user = await puter.auth.getUser();
    HedgeOS.puterReady = true;

    // Cloud preferences are authoritative when signing in on a new device.
    try {
      const cloudSettings = await puter.kv.get('hedgeos:settings');
      if (cloudSettings && typeof cloudSettings === 'object') {
        Object.assign(HedgeOS.settings, cloudSettings);
        HedgeOS.applySettings();
      } else {
        await saveSettings();
      }
    } catch (error) {
      console.warn('HedgeOS cloud settings could not be loaded:', error);
    }

    const lockUser = document.getElementById('lock-user');
    if (lockUser) lockUser.textContent = user.username || 'HedgeOS User';
    const startUser = document.getElementById('start-user-name');
    if (startUser) startUser.textContent = HedgeOS.settings.userName || user.username;

    return user;
  }

  async function signIn(switchAccount = false) {
    if (!available()) throw new Error('Puter.js could not be loaded. Check your internet connection and reload HedgeOS.');
    await puter.auth.signIn(switchAccount ? { request_auth: true } : {});
    return refresh();
  }

  async function signOut() {
    if (!available()) return;
    await puter.auth.signOut();
    user = null;
    HedgeOS.puterReady = false;
    const lockUser = document.getElementById('lock-user');
    if (lockUser) lockUser.textContent = 'HedgeOS';
  }

  async function saveSettings() {
    if (!available() || !puter.auth.isSignedIn()) return false;
    try {
      await puter.kv.set('hedgeos:settings', {
        theme: HedgeOS.settings.theme,
        wallpaper: HedgeOS.settings.wallpaper,
        userName: HedgeOS.settings.userName,
        notificationsEnabled: HedgeOS.settings.notificationsEnabled,
        clockSeconds: HedgeOS.settings.clockSeconds,
      });
      return true;
    } catch (error) {
      console.warn('HedgeOS cloud settings could not be saved:', error);
      return false;
    }
  }

  function getUser() {
    return user;
  }

  return { available, refresh, signIn, signOut, saveSettings, getUser };
})();
