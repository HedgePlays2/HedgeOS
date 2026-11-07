const AppInstaller = (() => {
  const STORAGE_KEY = 'hedgeos-imported-packages';
  function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, char => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' })[char]);
  }
  function readHistory() {
    try { const value = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); return Array.isArray(value) ? value : []; } catch { return []; }
  }
  function formatSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(1) + ' MB';
  }
  async function inspect(file, root) {
    const ext = file.name.split('.').pop().toLowerCase();
    const header = new Uint8Array(await file.slice(0, 4).arrayBuffer());
    const isExe = ext === 'exe';
    const isApk = ext === 'apk';
    const valid = isExe ? header[0] === 0x4d && header[1] === 0x5a : isApk ? header[0] === 0x50 && header[1] === 0x4b : false;
    const type = isExe ? 'Windows executable' : isApk ? 'Android package' : 'Unsupported package';
    const icon = isExe ? '🪟' : isApk ? '🤖' : '📦';
    const message = isExe ? 'An experimental browser runtime can try older 32-bit Windows programs. It will open in a separate tab, where you must choose this file again.' : isApk ? 'Android apps need an Android runtime or emulator. Full APK support is not ready yet.' : 'Choose a file ending in .exe or .apk.';
    const status = !valid ? 'File signature could not be verified' : isExe ? 'Experimental 32-bit runtime available' : 'Waiting for Android runtime';
    const area = root.querySelector('#installer-result');
    area.innerHTML = '<article style="background:white;border:1px solid #dce4ef;border-radius:12px;padding:15px">' +
      '<div style="display:flex;align-items:center;gap:10px"><div style="font-size:30px">' + icon + '</div><div style="min-width:0;flex:1"><b style="overflow-wrap:anywhere">' + escapeHTML(file.name) + '</b><div style="font-size:11px;color:#64748b;margin-top:3px">' + type + ' · ' + formatSize(file.size) + '</div></div></div>' +
      '<div style="font-size:12px;color:#475569;line-height:1.5;margin-top:12px">' + message + '</div><div style="font-size:11px;color:#64748b;margin-top:8px">Status: ' + status + '</div>' +
      '<button id="installer-record" type="button" ' + (valid ? '' : 'disabled') + ' style="margin-top:12px;border:0;border-radius:7px;padding:8px 12px;background:' + (valid ? '#2563eb' : '#94a3b8') + ';color:white;font-weight:700">' + (valid ? 'Add to import history' : 'Cannot import this file') + '</button>' + (valid && isExe ? '<button id="installer-run-exe" type="button" style="margin:12px 0 0 7px;border:0;border-radius:7px;padding:8px 12px;background:#0f766e;color:white;font-weight:700">Try in Windows runtime ↗</button><div style="font-size:11px;color:#64748b;margin-top:7px">The runtime opens separately. Re-select your EXE there; the file stays on your device.</div>' : '') + '</article>';
    const button = area.querySelector('#installer-record');
    const runButton = area.querySelector('#installer-run-exe');
    if (runButton) runButton.addEventListener('click', () => {
      window.open('https://exebrowser.com/load-exe/', '_blank', 'noopener,noreferrer');
    });
    if (valid) button.addEventListener('click', () => {
      const history = readHistory();
      if (!history.some(item => item.name === file.name && item.size === file.size)) {
        history.unshift({ name:file.name, size:formatSize(file.size), type:type, addedAt:new Date().toISOString() });
        localStorage.setItem(STORAGE_KEY, JSON.stringify(history.slice(0, 20)));
      }
      renderHistory(root); button.textContent = 'Added to import history'; button.disabled = true;
    });
  }
  function renderHistory(root) {
    const history = readHistory();
    const area = root.querySelector('#installer-history');
    area.innerHTML = history.length ? history.map(item => '<div style="display:flex;justify-content:space-between;gap:10px;background:white;border:1px solid #e1e7ef;border-radius:8px;padding:10px 12px;margin-bottom:7px"><div style="min-width:0"><b style="font-size:12px;overflow-wrap:anywhere">' + escapeHTML(item.name) + '</b><div style="font-size:10px;color:#64748b;margin-top:3px">' + escapeHTML(item.type) + ' · ' + escapeHTML(item.size) + '</div></div><span style="font-size:10px;color:#9a5b08;white-space:nowrap">Not runnable yet</span></div>').join('') : '<div style="padding:18px;text-align:center;color:#64748b;background:white;border-radius:9px;font-size:12px">No imported packages yet.</div>';
  }
  function open() {
    const html = '<div style="height:100%;min-height:0;overflow:auto;background:#f3f6fb;color:#172033;font-family:Arial,sans-serif;padding:20px;box-sizing:border-box">' +
      '<div style="display:flex;align-items:center;gap:12px;margin-bottom:8px"><div style="font-size:34px">📦</div><div><div style="font-size:21px;font-weight:800">HedgeOS App Installer</div><div style="font-size:12px;color:#64748b;margin-top:3px">Import and check desktop app packages</div></div></div>' +
      '<div style="background:#fff4db;border:1px solid #f3d18b;color:#754b08;padding:12px 14px;border-radius:10px;font-size:12px;line-height:1.5;margin:16px 0"><b>Compatibility preview</b><br>EXE support is experimental and currently opens a separate WebAssembly + Wine runtime for older 32-bit Windows apps. APK support is not ready. Package checks happen locally; HedgeOS does not upload your files.</div>' +
      '<label id="installer-drop" for="installer-file" style="display:block;border:2px dashed #9bb4d5;border-radius:14px;background:#fff;padding:28px 16px;text-align:center;cursor:pointer"><div style="font-size:38px">⬆️</div><div style="font-weight:800;margin:8px 0 4px">Choose an EXE or APK</div><div style="font-size:12px;color:#64748b">or drag a package into this area</div><input id="installer-file" type="file" accept=".exe,.apk,application/vnd.android.package-archive,application/x-msdownload" style="display:none"></label>' +
      '<section id="installer-result" style="margin-top:16px"></section><h3 style="font-size:14px;margin:22px 0 10px">Import history</h3><div id="installer-history"></div>' +
      '<div style="font-size:11px;color:#64748b;margin-top:18px;line-height:1.5">Next stages: browser-compatible runtime experiments, then an optional HedgeOS desktop helper for apps that need native execution.</div></div>';
    const w = WindowManager.create({ title:'App Installer', icon:'📦', html:html, width:650, height:570 });
    const root = w.content; const picker = root.querySelector('#installer-file'); const drop = root.querySelector('#installer-drop');
    picker.addEventListener('change', () => { if (picker.files && picker.files[0]) inspect(picker.files[0], root); });
    drop.addEventListener('dragover', event => { event.preventDefault(); drop.style.background = '#eaf2ff'; });
    drop.addEventListener('dragleave', () => { drop.style.background = '#fff'; });
    drop.addEventListener('drop', event => { event.preventDefault(); drop.style.background = '#fff'; const file = event.dataTransfer.files && event.dataTransfer.files[0]; if (file) inspect(file, root); });
    renderHistory(root); return w;
  }
  return { open };
})();

