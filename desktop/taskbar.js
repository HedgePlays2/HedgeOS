const Taskbar = (() => {
  let clockTick;

  function init() {
    updateClock();
    clockTick = setInterval(updateClock, 1000);

    document.getElementById('start-btn').addEventListener('click', e => {
      e.stopPropagation();
      StartMenu.toggle();
    });

    document.getElementById('tray-notif').addEventListener('click', () => {
      Notifications.show('HedgeOS', 'No new notifications.', '🔔');
    });
  }

  function updateClock() {
    const now = new Date();
    const time = now.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      second: HedgeOS.settings.clockSeconds ? '2-digit' : undefined
    });
    const date = now.toLocaleDateString([], { month: 'short', day: 'numeric' });
    document.getElementById('clock-display').innerHTML = `${time}<br><span style="font-size:10px;color:var(--text-dim)">${date}</span>`;
  }

  return { init };
})();
