const Notifications = (() => {
  function init() {}

  function show(title, message, icon = '🔔', duration = 4000) {
    if (!HedgeOS.settings.notificationsEnabled) return;
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

  function dismiss(el) {
    el.style.animation = 'fadeOut 0.3s ease forwards';
    setTimeout(() => el.remove(), 300);
  }

  return { init, show };
})();
