const OSBrowser = (() => {
  const SCRAMJET_HOME = new URL('scramjet-static/index.html', document.baseURI).href;

  function open(url = '', pageTitle = 'Scramjet Browser') {
    const target = String(url || '');
    const safeTitle = String(pageTitle || 'HedgeOS Browser').replace(/[<>]/g, '');
    const launchUrl = new URL(SCRAMJET_HOME);
    if (target) launchUrl.searchParams.set('url', target);
    const browserUrl = launchUrl.href;
    const html = `
      <div class="hedge-scramjet-shell" style="height:100%;min-height:0;display:flex;flex-direction:column;background:#111827;color:#fff;overflow:hidden;">
        <div style="display:flex;align-items:center;gap:10px;padding:9px 12px;background:#1f2937;border-bottom:1px solid #374151;flex:0 0 auto;">
          <span style="font-size:18px;">🌐</span>
          <strong id="br-title" style="font-size:13px;letter-spacing:.3px;">${safeTitle}</strong>
          <span style="font-size:11px;color:#9ca3af;">HedgeOS Browser</span>
          <span style="flex:1;"></span>
          <button id="br-reload" title="Reload page" style="border:0;border-radius:6px;padding:6px 10px;background:#374151;color:white;cursor:pointer;">↻</button>
          <button id="br-home" title="Open Scramjet home" style="border:0;border-radius:6px;padding:6px 10px;background:#374151;color:white;cursor:pointer;">Home</button>
          <button id="br-open" style="border:0;border-radius:6px;padding:6px 10px;background:#2563eb;color:white;cursor:pointer;">Open separately ↗</button>
        </div>
        <div style="flex:1;min-height:0;position:relative;background:#fff;">
          <iframe id="br-frame" title="HedgeOS Browser content" src="${browserUrl}" style="display:block;width:100%;height:100%;border:0;background:white;"></iframe>
        </div>
        <div style="padding:5px 10px;background:#1f2937;color:#9ca3af;font-size:10px;flex:0 0 auto;">
          Powered by Scramjet STATIC. Proxy availability depends on its WISP server.
        </div>
      </div>`;

    const w = WindowManager.create({
      title: safeTitle + ' — HedgeOS',
      icon: '🌐',
      html,
      width: 1000,
      height: 680
    });

    const root = w.content;
    const frame = root.querySelector('#br-frame');

    root.querySelector('#br-reload').onclick = () => {
      frame.src = frame.src;
    };

    root.querySelector('#br-home').onclick = () => {
      frame.src = SCRAMJET_HOME;
      root.querySelector('#br-title').textContent = 'Scramjet Browser';
      w.title = 'Scramjet Browser — HedgeOS';
    };

    root.querySelector('#br-open').onclick = () => {
      window.open(browserUrl, '_blank', 'noopener,noreferrer');
    };

    return w;
  }

  return { open };
})();
