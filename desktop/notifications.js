const Notifications = (() => {
  const history = [];

  function init() {}

  function show(title, message, icon = '🔔', duration = 4000) {
    if (!HedgeOS.settings.notificationsEnabled) return;
    history.unshift({ title, message, icon, time: new Date() });
    history.splice(30);
    renderHistory();

    const area = document.getElementById('notification-area');
    const el = document.createElement('div');
    el.className = 'notification';
    el.innerHTML = `
      <div class="notification-icon">${icon}</div>
      <div class="notification-body">
        <div class="notification-title">${title}</div>
        <div class="notification-msg">${message}</div>
      </div>
      <div class="notification-close">✕</div>`;

    el.querySelector('.notification-close').addEventListener('click', () => dismiss(el));
    area.appendChild(el);

    if (duration > 0) setTimeout(() => dismiss(el), duration);
    return el;
  }

  function renderHistory() {
    const area = document.getElementById('qs-notifications');
    if (!area) return;
    if (!history.length) {
      area.innerHTML = '<div class="qs-empty">You’re all caught up. No notifications.</div>';
      return;
    }
    area.innerHTML = '';
    history.forEach(item => {
      const card = document.createElement('div');
      card.className = 'qs-notification-card';
      const icon = document.createElement('span');
      icon.className = 'qs-history-icon';
      icon.textContent = item.icon;
      const body = document.createElement('div');
      const title = document.createElement('strong');
      title.textContent = item.title;
      const message = document.createElement('p');
      message.textContent = item.message;
      const time = document.createElement('small');
      time.textContent = item.time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      body.append(title, message, time);
      card.append(icon, body);
      area.appendChild(card);
    });
  }

  function clearHistory() {
    history.length = 0;
    renderHistory();
  }

  function dismiss(el) {
    el.style.animation = 'fadeOut 0.3s ease forwards';
    setTimeout(() => el.remove(), 300);
  }

  return { init, show, clearHistory, renderHistory };
})();
