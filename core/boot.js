window.addEventListener('DOMContentLoaded', async () => {
  HedgeOS.loadSettings();

  const fill = document.getElementById('boot-fill');
  const status = document.getElementById('boot-status');
  const bootEl = document.getElementById('boot-screen');

  const steps = [
    [10, 'Loading system...'],
    [25, 'Initialising desktop...'],
    [50, 'Connecting to Puter...'],
    [75, 'Loading applications...'],
    [90, 'Preparing environment...'],
    [100, 'Welcome to HedgeOS!'],
  ];

  for (const [pct, msg] of steps) {
    fill.style.width = pct + '%';
    status.textContent = msg;
    await delay(280 + Math.random() * 180);
  }

  if (typeof puter !== 'undefined') {
    try {
      HedgeOS.puterReady = true;
    } catch {}
  }

  await delay(400);

  bootEl.style.opacity = '0';
  await delay(600);
  bootEl.style.display = 'none';

  showLock();
});

function delay(ms) { return new Promise(r => setTimeout(r, ms)); }

function showLock() {
  const lock = document.getElementById('lock-screen');
  lock.style.display = 'flex';
  updateLockClock();
  const ti = setInterval(updateLockClock, 1000);

  document.getElementById('lock-btn').addEventListener('click', () => {
    clearInterval(ti);
    unlock();
  });
  document.getElementById('lock-pin').addEventListener('keydown', e => {
    if (e.key === 'Enter') { clearInterval(ti); unlock(); }
  });
}

function updateLockClock() {
  const now = new Date();
  document.getElementById('lock-time').textContent =
    now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  document.getElementById('lock-date').textContent =
    now.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' });
}

function unlock() {
  const lock = document.getElementById('lock-screen');
  lock.style.transition = 'opacity 0.4s';
  lock.style.opacity = '0';
  setTimeout(() => {
    lock.style.display = 'none';
    startDesktop();
  }, 400);
}

function startDesktop() {
  const desktop = document.getElementById('desktop');
  desktop.style.display = 'block';
  desktop.style.opacity = '0';
  desktop.style.transition = 'opacity 0.4s';
  requestAnimationFrame(() => {
    requestAnimationFrame(() => { desktop.style.opacity = '1'; });
  });

  Desktop.init();
  Taskbar.init();
  StartMenu.init();
  Notifications.init();

  HedgeOS.applySettings();

  Notifications.show('HedgeOS', 'Welcome! Click the 🌿 Hedge button to get started.', '🌿');
}
