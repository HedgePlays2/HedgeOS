// HedgeOS Cloud Drive — personal cloud files powered by Puter.js.
const CloudDrive = (() => {
  const ROOT = 'HedgeOS Drive';
  let currentPath = ROOT;
  let windowRoot = null;

  const esc = value => String(value ?? '').replace(/[&<>"']/g, ch => ({
    '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'
  })[ch]);

  function signedIn() {
    return typeof puter !== 'undefined' &&
      puter.auth && puter.auth.isSignedIn();
  }

  function pathJoin(base, name) {
    return base.replace(/\/$/, '') + '/' + name;
  }

  function formatSize(bytes) {
    const n = Number(bytes) || 0;
    if (n < 1024) return n + ' B';
    if (n < 1048576) return (n / 1024).toFixed(1) + ' KB';
    if (n < 1073741824) return (n / 1048576).toFixed(1) + ' MB';
    return (n / 1073741824).toFixed(2) + ' GB';
  }

  function open() {
    if (!signedIn()) {
      const w = WindowManager.create({
        title: 'Cloud Drive', icon: '☁️', width: 540, height: 360,
        html: '<div style="padding:28px;text-align:center"><div style="font-size:48px">☁️</div><h2>Sign in to use Cloud Drive</h2><p style="color:var(--text-dim)">Cloud Drive uses your existing Puter account. Sign in through Settings → Account, then open Cloud Drive again.</p><button class="btn" id="cloud-drive-settings">Open Settings</button></div>'
      });
      w.content.querySelector('#cloud-drive-settings')?.addEventListener('click', () => Settings.open('account'));
      return w;
    }

    currentPath = ROOT;
    const html = `
      <div style="height:100%;display:flex;flex-direction:column;gap:10px;padding:12px;box-sizing:border-box">
        <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
          <div style="font-size:21px;font-weight:700">☁️ Cloud Drive</div>
          <span style="color:var(--text-dim);font-size:11px;margin-left:auto">Your personal Puter storage</span>
        </div>
        <div style="display:flex;gap:7px;flex-wrap:wrap">
          <button class="btn" id="cloud-drive-home">Home</button>
          <button class="btn" id="cloud-drive-up">Up</button>
          <button class="btn" id="cloud-drive-new-folder">New folder</button>
          <button class="btn" id="cloud-drive-upload">Upload</button>
          <button class="btn" id="cloud-drive-refresh">Refresh</button>
          <input id="cloud-drive-file-input" type="file" multiple hidden>
        </div>
        <div id="cloud-drive-breadcrumb" style="font-size:12px;color:var(--text-dim);overflow-wrap:anywhere"></div>
        <div id="cloud-drive-status" role="status" style="font-size:12px;color:var(--text-dim)">Connecting to your cloud drive…</div>
        <div id="cloud-drive-list" style="flex:1;min-height:100px;overflow:auto;border:1px solid var(--border);border-radius:9px;padding:6px"></div>
        <div style="font-size:10px;color:var(--text-dim)">Files are stored in your Puter account under HedgeOS Drive. Storage limits and usage follow your Puter account.</div>
      </div>`;

    const w = WindowManager.create({ title: 'Cloud Drive', icon: '☁️', html, width: 660, height: 500 });
    windowRoot = w.content;

    windowRoot.querySelector('#cloud-drive-home').addEventListener('click', () => {
      currentPath = ROOT; load();
    });
    windowRoot.querySelector('#cloud-drive-up').addEventListener('click', () => {
      if (currentPath !== ROOT) {
        currentPath = currentPath.slice(0, currentPath.lastIndexOf('/'));
        if (currentPath.length < ROOT.length) currentPath = ROOT;
        load();
      }
    });
    windowRoot.querySelector('#cloud-drive-refresh').addEventListener('click', load);
    windowRoot.querySelector('#cloud-drive-new-folder').addEventListener('click', createFolder);
    windowRoot.querySelector('#cloud-drive-upload').addEventListener('click', () => {
      windowRoot.querySelector('#cloud-drive-file-input').click();
    });
    windowRoot.querySelector('#cloud-drive-file-input').addEventListener('change', uploadFiles);

    load();
    return w;
  }

  function status(message, error = false) {
    const el = windowRoot?.querySelector('#cloud-drive-status');
    if (el) {
      el.textContent = message;
      el.style.color = error ? '#ef7777' : 'var(--text-dim)';
    }
  }

  async function load() {
    if (!windowRoot) return;
    const list = windowRoot.querySelector('#cloud-drive-list');
    const crumb = windowRoot.querySelector('#cloud-drive-breadcrumb');
    crumb.textContent = currentPath.slice(ROOT.length).split('/').filter(Boolean).join('  /  ') || 'My Drive';
    list.innerHTML = '<div style="padding:20px;text-align:center;color:var(--text-dim)">Loading files…</div>';
    status('Loading your cloud files…');
    try {
      await puter.fs.mkdir(ROOT, { createMissingParents: true, dedupeName: false });
      const items = await puter.fs.readdir(currentPath, { sortBy: 'name', sortOrder: 'asc' });
      list.innerHTML = '';
      if (!items.length) {
        list.innerHTML = '<div style="padding:28px;text-align:center;color:var(--text-dim)">This folder is empty. Upload a file or create a folder to get started.</div>';
      }
      items.forEach(item => {
        const isDir = !!(item.is_dir ?? item.isDir);
        const row = document.createElement('div');
        row.style.cssText = 'display:flex;align-items:center;gap:10px;padding:9px 7px;border-bottom:1px solid var(--border);min-height:34px';
        const name = document.createElement('div');
        name.style.cssText = 'flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:13px';
        name.textContent = (isDir ? '📁 ' : '📄 ') + item.name;
        if (isDir) {
          name.style.cursor = 'pointer';
          name.title = 'Open folder';
          name.addEventListener('click', () => { currentPath = item.path || pathJoin(currentPath, item.name); load(); });
        }
        const size = document.createElement('span');
        size.style.cssText = 'font-size:11px;color:var(--text-dim);white-space:nowrap';
        size.textContent = isDir ? 'Folder' : formatSize(item.size);
        row.append(name, size);
        if (!isDir) {
          const download = document.createElement('button');
          download.className = 'btn';
          download.textContent = 'Download';
          download.addEventListener('click', () => downloadFile(item));
          row.append(download);
        }
        const remove = document.createElement('button');
        remove.className = 'btn danger';
        remove.textContent = 'Delete';
        remove.addEventListener('click', () => deleteItem(item));
        row.append(remove);
        list.append(row);
      });
      status(items.length + (items.length === 1 ? ' item' : ' items'));
    } catch (error) {
      list.innerHTML = '<div style="padding:22px;color:#ef7777">Could not load this folder. Check your connection and Puter account permissions, then refresh.</div>';
      status(error.message || 'Cloud Drive could not load.', true);
    }
  }

  async function createFolder() {
    const name = prompt('Name your new folder:');
    if (!name) return;
    if (/[\\/]/.test(name) || name === '.' || name === '..') {
      status('Folder names cannot contain slashes.', true); return;
    }
    try {
      await puter.fs.mkdir(pathJoin(currentPath, name), { createMissingParents: true, dedupeName: true });
      await load();
    } catch (error) { status(error.message || 'Could not create folder.', true); }
  }

  async function uploadFiles(event) {
    const files = event.target.files;
    if (!files || !files.length) return;
    status('Uploading ' + files.length + (files.length === 1 ? ' file…' : ' files…'));
    try {
      await puter.fs.upload(files, currentPath, { createMissingParents: true, dedupeName: true });
      status('Upload complete.');
      event.target.value = '';
      await load();
    } catch (error) {
      status(error.message || 'Upload failed. Check your cloud storage quota.', true);
    }
  }

  async function downloadFile(item) {
    try {
      status('Preparing ' + item.name + '…');
      const blob = await puter.fs.read(item.path);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = item.name;
      document.body.append(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1500);
      status('Download started.');
    } catch (error) { status(error.message || 'Could not download file.', true); }
  }

  async function deleteItem(item) {
    if (!confirm('Delete "' + item.name + '" from your cloud drive? This cannot be undone.')) return;
    try {
      await puter.fs.delete(item.path);
      await load();
    } catch (error) { status(error.message || 'Could not delete item.', true); }
  }

  return { open };
})();
