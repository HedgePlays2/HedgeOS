const AppInstaller = (() => {
  const DB_NAME = 'hedgeos-windows-storage';
  const DB_VERSION = 1;
  const STORE_NAME = 'files';
  const HISTORY_KEY = 'hedgeos-imported-packages';
  const CLOUD_DIR = 'HedgeOS/Windows';
  const WINDOWS64_URL = 'https://andrewnakas.github.io/Boxedwine64/';
  const WINDOWS32_URL = 'https://exebrowser.com/load-exe/';

  function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, char => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' })[char]);
  }
  function formatSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(1) + ' MB';
  }
  function openDB() {
    return new Promise((resolve, reject) => {
      if (!('indexedDB' in window)) return reject(new Error('This browser does not support local file storage.'));
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error || new Error('Could not open local storage.'));
    });
  }
  async function storeFile(file, kind) {
    const db = await openDB();
    const record = { id: kind + ':' + file.name + ':' + file.size + ':' + file.lastModified, name: file.name, size: file.size, type: file.type || 'application/octet-stream', kind, modified: file.lastModified || Date.now(), blob: file, savedAt: new Date().toISOString() };
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).put(record);
      tx.oncomplete = () => { db.close(); resolve(record); };
      tx.onerror = () => { db.close(); reject(tx.error || new Error('Could not save this file locally.')); };
      tx.onabort = () => { db.close(); reject(tx.error || new Error('Local save was cancelled.')); };
    });
  }
  async function listFiles() {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const request = tx.objectStore(STORE_NAME).getAll();
      request.onsuccess = () => { db.close(); resolve((request.result || []).sort((a, b) => b.savedAt.localeCompare(a.savedAt))); };
      request.onerror = () => { db.close(); reject(request.error || new Error('Could not read local files.')); };
    });
  }
  async function removeFile(id) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).delete(id);
      tx.oncomplete = () => { db.close(); resolve(); };
      tx.onerror = () => { db.close(); reject(tx.error || new Error('Could not delete file.')); };
    });
  }
  function cloudAvailable() {
    return typeof puter !== 'undefined' && puter.auth && puter.auth.isSignedIn() && puter.fs && typeof puter.fs.write === 'function';
  }
  function safeFilename(name) {
    return String(name).replace(/[^\w.\-() ]/g, '_').slice(0, 120) || 'backup.bin';
  }
  async function cloudBackup(record) {
    if (!cloudAvailable()) throw new Error('Sign in to your HedgeOS account first. Open Settings → Account.');
    await puter.fs.write(CLOUD_DIR + '/' + safeFilename(record.name), record.blob, { createMissingParents: true });
  }
  async function restoreCloudBackups(root) {
    if (!cloudAvailable() || typeof puter.fs.readdir !== 'function' || typeof puter.fs.read !== 'function') {
      setStatus(root, 'Sign in to your HedgeOS account first. Open Settings → Account.', true);
      return;
    }
    const area = root.querySelector('#installer-cloud');
    area.textContent = 'Checking your cloud drive…';
    try {
      const entries = await puter.fs.readdir(CLOUD_DIR);
      const files = (entries || []).filter(item => item && item.name && item.path && !item.is_dir && !item.isDirectory);
      area.innerHTML = '';
      if (!files.length) {
        area.textContent = 'No cloud backups found yet.';
        return;
      }
      files.forEach(item => {
        const row = document.createElement('div');
        row.style.cssText = 'display:flex;align-items:center;justify-content:space-between;gap:8px;background:white;border:1px solid #e1e7ef;border-radius:8px;padding:9px;margin-bottom:6px';
        const label = document.createElement('span');
        label.style.cssText = 'font-size:11px;overflow-wrap:anywhere;min-width:0;flex:1';
        label.textContent = item.name;
        const button = document.createElement('button');
        button.type = 'button'; button.textContent = 'Restore to device';
        button.style.cssText = 'border:0;border-radius:6px;padding:7px 9px;background:#2563eb;color:white;font-size:10px;font-weight:700';
        button.addEventListener('click', async () => {
          button.disabled = true; button.textContent = 'Restoring…';
          try {
            const blob = await puter.fs.read(item.path);
            const name = item.name;
            const ext = name.split('.').pop().toLowerCase();
            const kind = ext === 'zip' ? 'save' : ext === 'apk' ? 'apk' : 'exe';
            const file = new File([blob], name, { type: blob.type || 'application/octet-stream', lastModified: Date.now() });
            await storeFile(file, kind);
            await renderStoredFiles(root);
            button.textContent = 'Restored ✓';
            setStatus(root, name + ' restored to this device.');
          } catch (error) {
            button.disabled = false; button.textContent = 'Restore to device';
            setStatus(root, error.message || 'Could not restore cloud backup.', true);
          }
        });
        row.append(label, button);
        area.appendChild(row);
      });
    } catch (error) {
      area.textContent = 'Could not read cloud backups. Sign in and try again.';
      setStatus(root, error.message || 'Cloud drive unavailable.', true);
    }
  }
  async function downloadRecord(record) {
    const url = URL.createObjectURL(record.blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = record.name;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 30000);
  }
  function setStatus(root, message, isError) {
    const status = root.querySelector('#installer-status');
    if (!status) return;
    status.textContent = message;
    status.style.color = isError ? '#b42318' : '#166534';
  }
  function addHistory(file, type) {
    try {
      const old = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
      const history = Array.isArray(old) ? old : [];
      if (!history.some(item => item.name === file.name && item.size === formatSize(file.size))) {
        history.unshift({ name: file.name, size: formatSize(file.size), type, addedAt: new Date().toISOString() });
        localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(0, 20)));
      }
    } catch (error) { console.warn('HedgeOS import history could not be updated:', error); }
  }
  async function renderStoredFiles(root) {
    const area = root.querySelector('#installer-files');
    if (!area) return;
    try {
      const files = await listFiles();
      area.innerHTML = '';
      if (!files.length) {
        area.innerHTML = '<div style="padding:16px;text-align:center;color:#64748b;background:white;border-radius:9px;font-size:12px">No files saved yet. Imported EXEs and ZIP save backups will appear here.</div>';
        return;
      }
      files.forEach(record => {
        const card = document.createElement('article');
        card.style.cssText = 'display:flex;align-items:center;gap:10px;background:white;border:1px solid #e1e7ef;border-radius:9px;padding:10px;margin-bottom:8px;flex-wrap:wrap';
        const info = document.createElement('div');
        info.style.cssText = 'min-width:130px;flex:1';
        const name = document.createElement('b');
        name.style.cssText = 'display:block;font-size:12px;overflow-wrap:anywhere';
        name.textContent = record.name;
        const meta = document.createElement('div');
        meta.style.cssText = 'font-size:10px;color:#64748b;margin-top:3px';
        meta.textContent = (record.kind === 'save' ? 'Windows save archive' : record.kind === 'apk' ? 'Android package' : 'Windows EXE') + ' · ' + formatSize(record.size);
        info.append(name, meta);
        const actions = document.createElement('div');
        actions.style.cssText = 'display:flex;gap:6px;flex-wrap:wrap';
        function makeButton(label, action, color) {
          const button = document.createElement('button');
          button.type = 'button'; button.textContent = label;
          button.style.cssText = 'border:0;border-radius:6px;padding:7px 9px;background:' + color + ';color:white;font-size:11px;font-weight:700;cursor:pointer';
          button.addEventListener('click', action);
          actions.appendChild(button);
          return button;
        }
        makeButton('Download', () => downloadRecord(record), '#475569');
        if (record.kind === 'exe') makeButton('Run 64-bit ↗', () => window.open(WINDOWS64_URL, '_blank', 'noopener,noreferrer'), '#0f766e');
        makeButton('Cloud backup', async event => {
          const button = event.currentTarget;
          button.disabled = true; button.textContent = 'Backing up…';
          try { await cloudBackup(record); button.textContent = 'Backed up ✓'; setStatus(root, record.name + ' backed up to your Puter cloud drive.'); }
          catch (error) { button.textContent = 'Cloud backup'; setStatus(root, error.message || 'Cloud backup failed.', true); }
          finally { button.disabled = false; }
        }, '#2563eb');
        makeButton('Delete', async () => {
          if (!confirm('Delete ' + record.name + ' from this device? Cloud backups are not deleted.')) return;
          try { await removeFile(record.id); await renderStoredFiles(root); setStatus(root, record.name + ' deleted from this device.'); }
          catch (error) { setStatus(root, error.message || 'Could not delete file.', true); }
        }, '#b42318');
        card.append(info, actions);
        area.appendChild(card);
      });
    } catch (error) {
      area.textContent = 'Local storage is unavailable: ' + (error.message || error);
    }
  }
  async function inspect(file, root) {
    const ext = file.name.split('.').pop().toLowerCase();
    const header = new Uint8Array(await file.slice(0, 4).arrayBuffer());
    const isExe = ext === 'exe';
    const isApk = ext === 'apk';
    const isZip = ext === 'zip';
    const valid = isExe ? header[0] === 0x4d && header[1] === 0x5a : (isApk || isZip) ? header[0] === 0x50 && header[1] === 0x4b : false;
    const kind = isZip ? 'save' : isApk ? 'apk' : 'exe';
    const type = isExe ? 'Windows executable' : isApk ? 'Android package' : isZip ? 'ZIP archive / Windows save backup' : 'Unsupported package';
    const message = isExe
      ? 'HedgeOS will keep a local copy. Try the experimental 64-bit Wine runtime for portable Windows programs; you must choose the EXE again in that runtime.'
      : isApk
        ? 'The APK will be saved, but a compatible Android runtime is not integrated yet.'
        : isZip
          ? 'Use this for the ZIP created by the Windows runtime’s “Download my files” option. HedgeOS can preserve and cloud-back up the archive; restoring it into the emulator is not connected yet.'
          : 'Choose an EXE, APK, or ZIP file.';
    const area = root.querySelector('#installer-result');
    area.innerHTML = '<article style="background:white;border:1px solid #dce4ef;border-radius:12px;padding:15px">' +
      '<div style="font-size:14px;font-weight:800;overflow-wrap:anywhere">' + escapeHTML(file.name) + '</div>' +
      '<div style="font-size:11px;color:#64748b;margin-top:3px">' + type + ' · ' + formatSize(file.size) + '</div>' +
      '<div style="font-size:12px;color:#475569;line-height:1.5;margin-top:10px">' + message + '</div>' +
      '<button id="installer-save" type="button" ' + (valid ? '' : 'disabled') + ' style="margin-top:12px;border:0;border-radius:7px;padding:8px 12px;background:' + (valid ? '#2563eb' : '#94a3b8') + ';color:white;font-weight:700">' + (valid ? 'Save in HedgeOS' : 'Unsupported file') + '</button>' +
      (valid && isExe ? '<button id="installer-run64" type="button" style="margin:12px 0 0 7px;border:0;border-radius:7px;padding:8px 12px;background:#0f766e;color:white;font-weight:700">Try 64-bit Windows ↗</button><button id="installer-run32" type="button" style="margin:12px 0 0 7px;border:0;border-radius:7px;padding:8px 12px;background:#475569;color:white;font-weight:700">Try 32-bit Windows ↗</button>' : '') +
      '</article>';
    const saveButton = area.querySelector('#installer-save');
    const run64 = area.querySelector('#installer-run64');
    const run32 = area.querySelector('#installer-run32');
    if (run64) run64.addEventListener('click', () => window.open(WINDOWS64_URL, '_blank', 'noopener,noreferrer'));
    if (run32) run32.addEventListener('click', () => window.open(WINDOWS32_URL, '_blank', 'noopener,noreferrer'));
    if (valid) saveButton.addEventListener('click', async () => {
      saveButton.disabled = true; saveButton.textContent = 'Saving locally…';
      try {
        const record = await storeFile(file, kind);
        addHistory(file, type);
        saveButton.textContent = 'Saved on this device ✓';
        setStatus(root, file.name + ' is saved locally. Use Cloud backup to copy it to your Puter drive.');
        await renderStoredFiles(root);
        if (cloudAvailable()) setStatus(root, file.name + ' saved locally. Cloud backup is available below.');
      } catch (error) {
        saveButton.disabled = false; saveButton.textContent = 'Save in HedgeOS';
        setStatus(root, error.message || 'Could not save file locally.', true);
      }
    });
  }
  function renderHistory(root) {
    let history = [];
    try { const value = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]'); history = Array.isArray(value) ? value : []; } catch {}
    const area = root.querySelector('#installer-history');
    area.innerHTML = history.length ? history.map(item => '<div style="background:white;border:1px solid #e1e7ef;border-radius:8px;padding:9px 11px;margin-bottom:6px"><b style="font-size:11px;overflow-wrap:anywhere">' + escapeHTML(item.name) + '</b><div style="font-size:10px;color:#64748b;margin-top:3px">' + escapeHTML(item.type) + ' · ' + escapeHTML(item.size) + '</div></div>').join('') : '<div style="padding:12px;text-align:center;color:#64748b;background:white;border-radius:9px;font-size:11px">No import history yet.</div>';
  }
  function open() {
    const html = '<div style="height:100%;min-height:0;overflow:auto;background:#f3f6fb;color:#172033;font-family:Arial,sans-serif;padding:20px;box-sizing:border-box">' +
      '<div style="display:flex;align-items:center;gap:12px;margin-bottom:8px"><div style="font-size:34px">📦</div><div><div style="font-size:21px;font-weight:800">HedgeOS App Installer</div><div style="font-size:12px;color:#64748b;margin-top:3px">Windows apps, local storage and cloud backups</div></div></div>' +
      '<div style="background:#eaf4ff;border:1px solid #b8d8f5;color:#17446b;padding:12px 14px;border-radius:10px;font-size:12px;line-height:1.5;margin:16px 0"><b>Experimental 64-bit Windows runtime</b><br>HedgeOS now links to Boxedwine64, a browser-based x86-64 Wine emulator. It supports a limited range of portable Win32 apps, not every modern Windows program. First startup is a large download (around 196 MB) and can take a few minutes. 3D/GPU-heavy games, .NET apps and programs needing network access are poor fits.</div>' +
      '<div style="background:#fff4db;border:1px solid #f3d18b;color:#754b08;padding:12px 14px;border-radius:10px;font-size:12px;line-height:1.5;margin:12px 0"><b>How saving works right now</b><br>Imported EXE files and ZIP save archives can be stored in this browser with IndexedDB, downloaded, and backed up to your signed-in Puter cloud drive. In the emulator, use “Download my files” to export its saved files, then import that ZIP here. Automatic syncing of the emulator’s live C: drive and one-click restore into the emulator are not integrated yet.</div>' +
      '<label id="installer-drop" for="installer-file" style="display:block;border:2px dashed #9bb4d5;border-radius:14px;background:#fff;padding:24px 16px;text-align:center;cursor:pointer"><div style="font-size:34px">⬆️</div><div style="font-weight:800;margin:8px 0 4px">Choose an EXE, APK or ZIP backup</div><div style="font-size:12px;color:#64748b">or drag a file into this area</div><input id="installer-file" type="file" accept=".exe,.apk,.zip,application/zip,application/vnd.android.package-archive,application/x-msdownload" style="display:none"></label>' +
      '<section id="installer-result" style="margin-top:12px"></section><div id="installer-status" role="status" style="font-size:11px;min-height:18px;margin:8px 0;color:#166534"></div>' +
      '<h3 style="font-size:14px;margin:18px 0 9px">Saved files on this device</h3><div id="installer-files"></div>' +
      '<div style="margin-top:10px"><button id="installer-cloud-refresh" type="button" style="border:0;border-radius:7px;padding:8px 11px;background:#2563eb;color:white;font-size:11px;font-weight:700">Browse cloud backups</button></div><div id="installer-cloud" style="margin-top:8px"></div>' +
      '<h3 style="font-size:13px;margin:20px 0 8px">Recent import history</h3><div id="installer-history"></div>' +
      '<div style="font-size:11px;color:#64748b;margin-top:16px;line-height:1.5">Local files stay in this browser profile. Cloud backups use your own Puter account and its storage quota. Deleting a local copy does not delete its cloud backup.</div></div>';
    const w = WindowManager.create({ title:'App Installer', icon:'📦', html:html, width:700, height:650 });
    const root = w.content;
    const picker = root.querySelector('#installer-file');
    const drop = root.querySelector('#installer-drop');
    picker.addEventListener('change', () => { if (picker.files && picker.files[0]) inspect(picker.files[0], root); });
    drop.addEventListener('dragover', event => { event.preventDefault(); drop.style.background = '#eaf2ff'; });
    drop.addEventListener('dragleave', () => { drop.style.background = '#fff'; });
    drop.addEventListener('drop', event => { event.preventDefault(); drop.style.background = '#fff'; const file = event.dataTransfer.files && event.dataTransfer.files[0]; if (file) inspect(file, root); });
    root.querySelector('#installer-cloud-refresh').addEventListener('click', () => restoreCloudBackups(root));
    renderHistory(root);
    renderStoredFiles(root);
    return w;
  }
  return { open };
})();
