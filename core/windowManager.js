const WindowManager = (() => {
  let zCounter = 100;
  const wins = new Map();
  let focusedId = null;

  const TASKBAR_HEIGHT = 48;
  const MIN_WIDTH = 320;
  const MIN_HEIGHT = 240;

  function nextZ() {
    return ++zCounter;
  }

  function getTaskbarButton(id) {
    return [...document.querySelectorAll('.taskbar-btn')].find(button => button.dataset.id === id);
  }

  function focus(id) {
    const win = wins.get(id);
    if (!win || win.minimized) return;

    if (focusedId && focusedId !== id) {
      const previous = wins.get(focusedId);
      if (previous) previous.el.classList.remove('focused');
    }

    focusedId = id;
    win.el.classList.add('focused');
    win.el.style.zIndex = nextZ();

    document.querySelectorAll('.taskbar-btn').forEach(button => {
      button.classList.toggle('active', button.dataset.id === id);
    });
  }

  function create({
    title = 'Window',
    icon = '',
    html = '',
    width = 600,
    height = 420,
    x,
    y
  } = {}) {
    const desktop = document.getElementById('desktop');
    if (!desktop) throw new Error('HedgeOS desktop is not ready.');

    const id = 'win-' + Date.now() + '-' + Math.random().toString(36).slice(2);
    const maxWidth = Math.max(MIN_WIDTH, window.innerWidth - 24);
    const maxHeight = Math.max(MIN_HEIGHT, window.innerHeight - TASKBAR_HEIGHT - 16);
    width = Math.min(Math.max(MIN_WIDTH, width), maxWidth);
    height = Math.min(Math.max(MIN_HEIGHT, height), maxHeight);

    const el = document.createElement('section');
    el.className = 'os-window';
    el.dataset.id = id;
    el.setAttribute('role', 'dialog');
    el.setAttribute('aria-label', title);
    el.style.width = width + 'px';
    el.style.height = height + 'px';

    const startX = x !== undefined ? x : Math.max(12, (window.innerWidth - width) / 2 + (wins.size % 6) * 24);
    const startY = y !== undefined ? y : Math.max(12, (window.innerHeight - TASKBAR_HEIGHT - height) / 2 + (wins.size % 6) * 20);
    el.style.left = Math.min(Math.max(0, startX), Math.max(0, window.innerWidth - width)) + 'px';
    el.style.top = Math.min(Math.max(0, startY), Math.max(0, window.innerHeight - TASKBAR_HEIGHT - height)) + 'px';
    el.style.zIndex = nextZ();

    // App markup is supplied by HedgeOS's own app modules.
    el.innerHTML = `
      <div class="win-titlebar">
        <span class="win-icon">${icon}</span>
        <span class="win-title"></span>
        <div class="win-controls">
          <button class="win-btn win-min" type="button" title="Minimize" aria-label="Minimize">−</button>
          <button class="win-btn win-max" type="button" title="Maximize" aria-label="Maximize">□</button>
          <button class="win-btn win-close" type="button" title="Close" aria-label="Close">×</button>
        </div>
      </div>
      <div class="win-content"></div>
      <div class="win-resize" title="Resize window"></div>`;

    el.querySelector('.win-title').textContent = title;
    el.querySelector('.win-content').innerHTML = html;
    desktop.appendChild(el);

    const state = {
      id,
      el,
      title,
      icon,
      minimized: false,
      maximized: false,
      prevRect: null
    };
    wins.set(id, state);

    el.addEventListener('pointerdown', () => focus(id));
    el.querySelector('.win-close').addEventListener('click', () => close(id));
    el.querySelector('.win-min').addEventListener('click', () => minimize(id));
    el.querySelector('.win-max').addEventListener('click', () => maximize(id));

    makeDraggable(el, el.querySelector('.win-titlebar'), state);
    makeResizable(el, el.querySelector('.win-resize'), state);
    addTaskbarButton(state);
    focus(id);

    return { id, el, content: el.querySelector('.win-content') };
  }

  function close(id) {
    const win = wins.get(id);
    if (!win) return;

    win.el.remove();
    wins.delete(id);
    getTaskbarButton(id)?.remove();

    if (focusedId === id) {
      focusedId = null;
      const next = [...wins.values()].filter(item => !item.minimized).pop();
      if (next) focus(next.id);
    }
  }

  function minimize(id) {
    const win = wins.get(id);
    if (!win) return;

    win.minimized = !win.minimized;
    win.el.classList.toggle('minimized', win.minimized);
    const button = getTaskbarButton(id);
    if (button) button.classList.toggle('minimized', win.minimized);

    if (win.minimized && focusedId === id) {
      win.el.classList.remove('focused');
      focusedId = null;
      const next = [...wins.values()].filter(item => !item.minimized).pop();
      if (next) focus(next.id);
    } else if (!win.minimized) {
      focus(id);
    }
  }

  function maximize(id) {
    const win = wins.get(id);
    if (!win) return;

    if (!win.maximized) {
      win.prevRect = {
        left: win.el.style.left,
        top: win.el.style.top,
        width: win.el.style.width,
        height: win.el.style.height
      };
      win.maximized = true;
      win.el.classList.add('maximized');
      win.el.querySelector('.win-max').textContent = '❐';
      win.el.querySelector('.win-max').title = 'Restore';
    } else {
      win.maximized = false;
      win.el.classList.remove('maximized');
      if (win.prevRect) Object.assign(win.el.style, win.prevRect);
      win.el.querySelector('.win-max').textContent = '□';
      win.el.querySelector('.win-max').title = 'Maximize';
      keepOnScreen(win);
    }
    focus(id);
  }

  function addTaskbarButton(state) {
    const bar = document.getElementById('taskbar-windows');
    if (!bar) return;

    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'taskbar-btn';
    button.dataset.id = state.id;
    button.textContent = (state.icon ? state.icon + ' ' : '') + state.title;
    button.title = state.title;
    button.setAttribute('aria-label', 'Switch to ' + state.title);

    button.addEventListener('click', () => {
      const win = wins.get(state.id);
      if (!win) return;

      if (win.minimized) {
        win.minimized = false;
        win.el.classList.remove('minimized');
        button.classList.remove('minimized');
        focus(state.id);
      } else if (focusedId === state.id) {
        minimize(state.id);
      } else {
        focus(state.id);
      }
    });

    bar.appendChild(button);
  }

  function keepOnScreen(win) {
    const maxLeft = Math.max(0, window.innerWidth - win.el.offsetWidth);
    const maxTop = Math.max(0, window.innerHeight - TASKBAR_HEIGHT - win.el.offsetHeight);
    win.el.style.left = Math.min(Math.max(0, win.el.offsetLeft), maxLeft) + 'px';
    win.el.style.top = Math.min(Math.max(0, win.el.offsetTop), maxTop) + 'px';
  }

  function makeDraggable(el, handle, state) {
    let pointerId = null;
    let offsetX = 0;
    let offsetY = 0;

    handle.addEventListener('pointerdown', event => {
      if (event.target.closest('.win-btn') || state.maximized) return;
      if (event.pointerType === 'mouse' && event.button !== 0) return;

      pointerId = event.pointerId;
      offsetX = event.clientX - el.offsetLeft;
      offsetY = event.clientY - el.offsetTop;
      handle.setPointerCapture(pointerId);
      focus(state.id);
      event.preventDefault();
    });

    handle.addEventListener('pointermove', event => {
      if (pointerId !== event.pointerId || state.maximized) return;
      const maxLeft = Math.max(0, window.innerWidth - el.offsetWidth);
      const maxTop = Math.max(0, window.innerHeight - TASKBAR_HEIGHT - el.offsetHeight);
      el.style.left = Math.min(Math.max(0, event.clientX - offsetX), maxLeft) + 'px';
      el.style.top = Math.min(Math.max(0, event.clientY - offsetY), maxTop) + 'px';
    });

    const stopDragging = event => {
      if (pointerId !== event.pointerId) return;
      pointerId = null;
    };
    handle.addEventListener('pointerup', stopDragging);
    handle.addEventListener('pointercancel', stopDragging);
    handle.addEventListener('dblclick', event => {
      if (!event.target.closest('.win-btn')) maximize(state.id);
    });
  }

  function makeResizable(el, handle, state) {
    let pointerId = null;
    let startX = 0;
    let startY = 0;
    let startWidth = 0;
    let startHeight = 0;

    handle.addEventListener('pointerdown', event => {
      if (state.maximized || (event.pointerType === 'mouse' && event.button !== 0)) return;
      pointerId = event.pointerId;
      startX = event.clientX;
      startY = event.clientY;
      startWidth = el.offsetWidth;
      startHeight = el.offsetHeight;
      handle.setPointerCapture(pointerId);
      focus(state.id);
      event.preventDefault();
      event.stopPropagation();
    });

    handle.addEventListener('pointermove', event => {
      if (pointerId !== event.pointerId || state.maximized) return;
      const maxWidth = Math.max(MIN_WIDTH, window.innerWidth - el.offsetLeft);
      const maxHeight = Math.max(MIN_HEIGHT, window.innerHeight - TASKBAR_HEIGHT - el.offsetTop);
      el.style.width = Math.min(Math.max(MIN_WIDTH, startWidth + event.clientX - startX), maxWidth) + 'px';
      el.style.height = Math.min(Math.max(MIN_HEIGHT, startHeight + event.clientY - startY), maxHeight) + 'px';
    });

    const stopResizing = event => {
      if (pointerId !== event.pointerId) return;
      pointerId = null;
    };
    handle.addEventListener('pointerup', stopResizing);
    handle.addEventListener('pointercancel', stopResizing);
  }

  window.addEventListener('resize', () => {
    wins.forEach(win => {
      if (win.maximized) return;
      keepOnScreen(win);
    });
  });

  return { create, close, minimize, maximize, focus, wins };
})();
