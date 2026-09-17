const FileExplorer = (() => {
  function open(startPath = '/') {
    const html = `
      <div class="fm-container" id="fm-root">
        <div class="app-toolbar">
          <button class="btn secondary" id="fm-back">◀</button>
          <button class="btn secondary" id="fm-up">▲ Up</button>
          <input type="text" id="fm-path-input" value="${startPath}">
          <button class="btn" id="fm-go">Go</button>
          <button class="btn" id="fm-refresh">🔄</button>
        </div>
        <div class="fm-path" id="fm-breadcrumb"></div>
        <div class="fm-list" id="fm-list"></div>
        <div class="fm-actions">
          <button class="btn" id="fm-upload">📤 Upload</button>
          <button class="btn secondary" id="fm-newfolder">📁 New Folder</button>
          <button class="btn secondary" id="fm-newfile">📄 New File</button>
        </div>
      </div>`;

    const w = WindowManager.create({ title: 'File Manager', icon: '📁', html, width: 620, height: 460 });
    const root = w.content.querySelector('#fm-root');
    const state = { path: startPath, history: [startPath] };

    const pathInput = root.querySelector('#fm-path-input');
    root.querySelector('#fm-go').onclick = () => navigate(root, state, pathInput.value.trim() || '/');
    root.querySelector('#fm-refresh').onclick = () => loadDir(root, state);
    root.querySelector('#fm-back').onclick = () => {
      if (state.history.length > 1) {
        state.history.pop();
        state.path = state.history[state.history.length - 1];
        pathInput.value = state.path;
        loadDir(root, state);
      }
    };
    root.querySelector('#fm-up').onclick = () => {
      const parts = state.path.replace(/\/+$/, '').split('/').filter(Boolean);
      parts.pop();
      navigate(root, state, '/' + parts.join('/') || '/');
    };
    root.querySelector('#fm-upload').onclick = () => uploadFile(root, state);
    root.querySelector('#fm-newfolder').onclick = () => newFolder(root, state);
    root.querySelector('#fm-newfile').onclick = () => newFile(root, state);
    pathInput.addEventListener('keydown', e => { if (e.key === 'Enter') navigate(root, state, pathInput.value.trim() || '/'); });

    loadDir(root, state);
    return w;
  }

  function navigate(root, state, path) {
    state.path = path;
    state.history.push(path);
    root.querySelector('#fm-path-input').value = path;
    loadDir(root, state);
  }

  async function loadDir(root, state) {
    const list = root.querySelector('#fm-list');
    const crumb = root.querySelector('#fm-breadcrumb');
    list.innerHTML = '<div class="fm-empty">Loading...</div>';

    renderBreadcrumb(crumb, state, root);

    if (!HedgeOS.puterReady) {
      list.innerHTML = '<div class="fm-empty">⚠ Connect to Puter to use the file system.<br><br>Sign in via Settings → Account.</div>';
      return;
    }

    try {
      const entries = await puter.fs.readdir(state.path);
      list.innerHTML = '';
      if (!entries.length) {
        list.innerHTML = '<div class="fm-empty">This folder is empty</div>';
        return;
      }
      const sorted = [...entries].sort((a, b) => {
        if (a.is_dir !== b.is_dir) return a.is_dir ? -1 : 1;
        return a.name.localeCompare(b.name);
      });
      sorted.forEach(entry => {
        const item = document.createElement('div');
        item.className = 'fm-item';
        const icon = entry.is_dir ? '📁' : getFileIcon(entry.name);
        item.innerHTML = `<div class="fm-icon">${icon}</div><div class="fm-name" title="${entry.name}">${entry.name}</div>`;
        item.addEventListener('dblclick', () => {
          if (entry.is_dir) {
            navigate(root, state, (state.path.replace(/\/$/, '') + '/' + entry.name));
          } else {
            openFile(entry, state.path);
          }
        });
        item.addEventListener('contextmenu', e => {
          e.preventDefault();
          showFileMenu(entry, state, root, e.clientX, e.clientY);
        });
        list.appendChild(item);
      });
    } catch (err) {
      list.innerHTML = `<div class="fm-empty">Error: ${err.message}</div>`;
    }
  }

  function renderBreadcrumb(el, state, root) {
    const parts = state.path.split('/').filter(Boolean);
    el.innerHTML = '<span class="fm-path-seg" data-path="/">🌿 Home</span>';
    let built = '';
    parts.forEach((p, i) => {
      built += '/' + p;
      const path = built;
      el.innerHTML += ` / <span class="fm-path-seg" data-path="${path}">${p}</span>`;
    });
    el.querySelectorAll('.fm-path-seg').forEach(s => {
      s.addEventListener('click', () => navigate(root, state, s.dataset.path));
    });
  }

  function showFileMenu(entry, state, root, x, y) {
    const existing = document.getElementById('fm-ctx');
    if (existing) existing.remove();
    const menu = document.createElement('div');
    menu.id = 'fm-ctx';
    menu.style.cssText = `position:fixed;left:${x}px;top:${y}px;background:var(--glass);
      backdrop-filter:blur(20px);border:1px solid var(--border);border-radius:10px;
      padding:6px 0;min-width:160px;z-index:9999;box-shadow:var(--shadow)`;
    const items = entry.is_dir
      ? [['📂 Open', () => navigate(root, state, (state.path.replace(/\/$/, '') + '/' + entry.name))],
         ['🗑 Delete', () => deleteEntry(entry, state, root)]]
      : [['📖 Open', () => openFile(entry, state.path)],
         ['⬇ Download', () => downloadFile(entry, state.path)],
         ['🗑 Delete', () => deleteEntry(entry, state, root)]];
    items.forEach(([label, fn]) => {
      const d = document.createElement('div');
      d.style.cssText = 'padding:8px 16px;font-size:13px;color:var(--text);cursor:pointer';
      d.textContent = label;
      d.onmouseenter = () => d.style.background = 'var(--glass-light)';
      d.onmouseleave = () => d.style.background = '';
      d.onclick = () => { menu.remove(); fn(); };
      menu.appendChild(d);
    });
    document.body.appendChild(menu);
    setTimeout(() => document.addEventListener('click', () => menu.remove(), { once: true }), 10);
  }

  async function openFile(entry, dir) {
    const path = dir.replace(/\/$/, '') + '/' + entry.name;
    const name = entry.name.toLowerCase();
    if (/\.(txt|md|js|css|html|json|csv|log|py|sh)$/.test(name)) {
      try {
        const blob = await puter.fs.read(path);
        const text = await blob.text();
        const html = `
          <div style="display:flex;flex-direction:column;height:100%">
            <textarea style="flex:1;background:#1a1a2e;border:none;color:#e2e8f0;
              font-family:'Courier New',monospace;font-size:13px;padding:12px;resize:none;outline:none;"
              spellcheck="false">${escapeHtml(text)}</textarea>
            <div style="padding:8px;display:flex;gap:8px;background:rgba(0,0,0,0.2);border-top:1px solid var(--border)">
              <button class="btn" id="save-btn-${Date.now()}">💾 Save</button>
            </div>
          </div>`;
        const w = WindowManager.create({ title: entry.name, icon: getFileIcon(entry.name), html, width: 560, height: 420 });
        const ta = w.content.querySelector('textarea');
        w.content.querySelector('button').onclick = async () => {
          try {
            await puter.fs.write(path, new Blob([ta.value]));
            Notifications.show('Saved', entry.name + ' saved.', '💾');
          } catch (e) { Notifications.show('Error', e.message, '❌'); }
        };
      } catch (e) {
        Notifications.show('Error', 'Could not open file: ' + e.message, '❌');
      }
    } else if (/\.(png|jpg|jpeg|gif|webp|svg|bmp)$/.test(name)) {
      try {
        const blob = await puter.fs.read(path);
        const url = URL.createObjectURL(blob);
        const html = `<div style="height:100%;display:flex;align-items:center;justify-content:center;background:#000;padding:8px">
          <img src="${url}" style="max-width:100%;max-height:100%;object-fit:contain">
        </div>`;
        WindowManager.create({ title: entry.name, icon: '🖼', html, width: 600, height: 460 });
      } catch (e) { Notifications.show('Error', e.message, '❌'); }
    } else {
      Notifications.show('File Manager', entry.name + ' — unsupported preview type.', '📄');
    }
  }

  async function downloadFile(entry, dir) {
    try {
      const blob = await puter.fs.read(dir.replace(/\/$/, '') + '/' + entry.name);
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = entry.name;
      a.click();
    } catch (e) { Notifications.show('Error', e.message, '❌'); }
  }

  async function deleteEntry(entry, state, root) {
    if (!confirm(`Delete "${entry.name}"?`)) return;
    try {
      if (entry.is_dir) await puter.fs.delete(state.path.replace(/\/$/, '') + '/' + entry.name, { recursive: true });
      else await puter.fs.delete(state.path.replace(/\/$/, '') + '/' + entry.name);
      Notifications.show('Deleted', entry.name + ' deleted.', '🗑');
      loadDir(root, state);
    } catch (e) { Notifications.show('Error', e.message, '❌'); }
  }

  async function uploadFile(root, state) {
    if (!HedgeOS.puterReady) { Notifications.show('Error', 'Not connected to Puter.', '❌'); return; }
    try {
      const files = await puter.ui.openFilePicker({ multiple: true });
      const list = Array.isArray(files) ? files : [files];
      for (const f of list) {
        await puter.fs.write(state.path.replace(/\/$/, '') + '/' + f.name, f);
      }
      Notifications.show('Uploaded', list.length + ' file(s) uploaded.', '📤');
      loadDir(root, state);
    } catch (e) { if (e.message !== 'User cancelled') Notifications.show('Error', e.message, '❌'); }
  }

  async function newFolder(root, state) {
    const name = prompt('Folder name:');
    if (!name) return;
    try {
      await puter.fs.mkdir(state.path.replace(/\/$/, '') + '/' + name);
      Notifications.show('Created', name + ' folder created.', '📁');
      loadDir(root, state);
    } catch (e) { Notifications.show('Error', e.message, '❌'); }
  }

  async function newFile(root, state) {
    const name = prompt('File name:', 'untitled.txt');
    if (!name) return;
    try {
      await puter.fs.write(state.path.replace(/\/$/, '') + '/' + name, new Blob(['']));
      Notifications.show('Created', name + ' created.', '📄');
      loadDir(root, state);
    } catch (e) { Notifications.show('Error', e.message, '❌'); }
  }

  function getFileIcon(name) {
    const n = name.toLowerCase();
    if (/\.(png|jpg|jpeg|gif|webp|svg|bmp|ico)$/.test(n)) return '🖼';
    if (/\.(mp4|webm|mkv|avi|mov)$/.test(n)) return '🎬';
    if (/\.(mp3|ogg|wav|flac|m4a)$/.test(n)) return '🎵';
    if (/\.(pdf)$/.test(n)) return '📕';
    if (/\.(zip|rar|tar|gz|7z)$/.test(n)) return '🗜';
    if (/\.(js|ts|py|java|c|cpp|rs|go|php|rb)$/.test(n)) return '💻';
    if (/\.(html|htm|css|scss)$/.test(n)) return '🌐';
    if (/\.(json|yaml|yml|xml|toml)$/.test(n)) return '⚙';
    if (/\.(md|txt|log)$/.test(n)) return '📄';
    return '📦';
  }

  function escapeHtml(s) {
    return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }

  return { open };
})();
