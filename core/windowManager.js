const WindowManager = (() => {
  let zCounter = 100;
  const wins = new Map();
  let focusedId = null;

  function nextZ() { return ++zCounter; }

  function focus(id) {
    if (focusedId === id) return;
    if (focusedId) {
      const prev = wins.get(focusedId);
      if (prev) prev.el.classList.remove('focused');
    }
    focusedId = id;
    const w = wins.get(id);
    if (!w) return;
    w.el.classList.add('focused');
    w.el.style.zIndex = nextZ();
    document.querySelectorAll('.taskbar-btn').forEach(b => b.classList.remove('active'));
    const tb = document.querySelector(`.taskbar-btn[data-id="${id}"]`);
    if (tb) tb.classList.add('active');
  }

  function create({ title = 'Window', icon = '', html = '', width = 600, height = 420, x, y } = {}) {
    const id = 'win-' + Date.now() + '-' + Math.random().toString(36).slice(2);
    const desktop = document.getElementById('desktop');

    const el = document.createElement('div');
    el.className = 'os-window';
    el.dataset.id = id;
    el.style.width = width + 'px';
    el.style.height = height + 'px';

    const startX = x !== undefined ? x : Math.max(40, Math.random() * (innerWidth - width - 80) + 40);
    const startY = y !== undefined ? y : Math.max(40, Math.random() * (innerHeight - height - 100) + 40);
    el.style.left = startX + 'px';
    el.style.top = startY + 'px';
    el.style.zIndex = nextZ();

    el.innerHTML = `
      <div class="win-titlebar">
        <span class="win-icon">${icon}</span>
        <span class="win-title">${title}</span>
        <div class="win-controls">
          <button class="win-btn win-close" title="Close">✕</button>
          <button class="win-btn win-min" title="Minimize">−</button>
          <button class="win-btn win-max" title="Maximize">⊞</button>
        </div>
      </div>
      <div class="win-content">${html}</div>
      <div class="win-resize"></div>`;

    desktop.appendChild(el);

    const state = { id, el, title, icon, minimized: false, maximized: false, prevRect: null };
    wins.set(id, state);

    el.addEventListener('mousedown', () => focus(id));

    el.querySelector('.win-close').addEventListener('click', () => close(id));
    el.querySelector('.win-min').addEventListener('click', () => minimize(id));
    el.querySelector('.win-max').addEventListener('click', () => maximize(id));

    makeDraggable(el, el.querySelector('.win-titlebar'), state);
    makeResizable(el, el.querySelector('.win-resize'), state);

    addTaskbarBtn(state);
    focus(id);

    return { id, el, content: el.querySelector('.win-content') };
  }

  function close(id) {
    const w = wins.get(id);
    if (!w) return;
    w.el.remove();
    wins.delete(id);
    const tb = document.querySelector(`.taskbar-btn[data-id="${id}"]`);
    if (tb) tb.remove();
    if (focusedId === id) {
      focusedId = null;
      const remaining = [...wins.keys()];
      if (remaining.length) focus(remaining[remaining.length - 1]);
    }
  }

  function minimize(id) {
    const w = wins.get(id);
    if (!w) return;
    w.minimized = !w.minimized;
    w.el.classList.toggle('minimized', w.minimized);
    const tb = document.querySelector(`.taskbar-btn[data-id="${id}"]`);
    if (tb) tb.classList.toggle('active', !w.minimized);
    if (w.minimized && focusedId === id) {
      focusedId = null;
      const vis = [...wins.values()].filter(v => !v.minimized);
      if (vis.length) focus(vis[vis.length - 1].id);
    }
  }

  function maximize(id) {
    const w = wins.get(id);
    if (!w) return;
    if (!w.maximized) {
      w.prevRect = { left: w.el.style.left, top: w.el.style.top, width: w.el.style.width, height: w.el.style.height };
      w.maximized = true;
      w.el.classList.add('maximized');
    } else {
      w.maximized = false;
      w.el.classList.remove('maximized');
      if (w.prevRect) {
        w.el.style.left = w.prevRect.left;
        w.el.style.top = w.prevRect.top;
        w.el.style.width = w.prevRect.width;
        w.el.style.height = w.prevRect.height;
      }
    }
  }

  function addTaskbarBtn(state) {
    const bar = document.getElementById('taskbar-windows');
    const btn = document.createElement('div');
    btn.className = 'taskbar-btn';
    btn.dataset.id = state.id;
    btn.textContent = (state.icon ? state.icon + ' ' : '') + state.title;
    btn.title = state.title;
    btn.addEventListener('click', () => {
      const w = wins.get(state.id);
      if (!w) return;
      if (w.minimized) {
        minimize(state.id);
        focus(state.id);
      } else if (focusedId === state.id) {
        minimize(state.id);
      } else {
        focus(state.id);
      }
    });
    bar.appendChild(btn);
  }

  function makeDraggable(el, handle, state) {
    let ox = 0, oy = 0, dragging = false;
    handle.addEventListener('mousedown', e => {
      if (e.target.classList.contains('win-btn')) return;
      if (state.maximized) return;
      dragging = true;
      ox = e.clientX - el.offsetLeft;
      oy = e.clientY - el.offsetTop;
      e.preventDefault();
    });
    document.addEventListener('mousemove', e => {
      if (!dragging) return;
      let nx = e.clientX - ox;
      let ny = e.clientY - oy;
      nx = Math.max(0, Math.min(innerWidth - el.offsetWidth, nx));
      ny = Math.max(0, Math.min(innerHeight - 48 - el.offsetHeight, ny));
      el.style.left = nx + 'px';
      el.style.top = ny + 'px';
    });
    document.addEventListener('mouseup', () => { dragging = false; });
    handle.addEventListener('dblclick', () => maximize(state.id));
  }

  function makeResizable(el, handle, state) {
    let resizing = false, sx = 0, sy = 0, sw = 0, sh = 0;
    handle.addEventListener('mousedown', e => {
      if (state.maximized) return;
      resizing = true;
      sx = e.clientX;
      sy = e.clientY;
      sw = el.offsetWidth;
      sh = el.offsetHeight;
      e.preventDefault();
      e.stopPropagation();
    });
    document.addEventListener('mousemove', e => {
      if (!resizing) return;
      const nw = Math.max(320, sw + e.clientX - sx);
      const nh = Math.max(240, sh + e.clientY - sy);
      el.style.width = nw + 'px';
      el.style.height = nh + 'px';
    });
    document.addEventListener('mouseup', () => { resizing = false; });
  }

  return { create, close, minimize, maximize, focus, wins };
})();
