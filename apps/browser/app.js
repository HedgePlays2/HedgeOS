const OSBrowser = (() => {
  const SCRAMJET_HOME = 'https://scramjet.mercurywork.shop/';

  function open() {
    const html = `
      <div class="hedge-scramjet-shell" style="height:100%;min-height:0;display:flex;flex-direction:column;background:#111827;color:#fff;overflow:hidden;">
        <div style="display:flex;align-items:center;gap:10px;padding:9px 12px;background:#1f2937;border-bottom:1px solid #374151;flex:0 0 auto;">
          <span style="font-size:18px;">🌐</span>
          <strong style="font-size:13px;letter-spacing:.3px;">HedgeOS Browser</strong>
          <span style="font-size:11px;color:#9ca3af;">Powered by Scramjet</span>
          <span style="flex:1;"></span>
          <button id="br-reload" title="Reload Scramjet" style="border:0;border-radius:6px;padding:6px 10px;background:#374151;color:white;cursor:pointer;">↻</button>
          <button id="br-open" style="border:0;border-radius:6px;padding:6px 10px;background:#2563eb;color:white;cursor:pointer;">Open separately ↗</button>
        </div>
        <div style="flex:1;min-height:0;position:relative;background:#fff;">
          <iframe id="br-frame" title="Scramjet Browser" src="${SCRAMJET_HOME}" style="display:block;width:100%;height:100%;border:0;background:white;"></iframe>
        </div>
        <div style="padding:5px 10px;background:#1f2937;color:#9ca3af;font-size:10px;flex:0 0 auto;">
          Scramjet is hosted externally. Website availability depends on that service.
        </div>
      </div>`;

    const w = WindowManager.create({
      title: 'HedgeOS Browser — Scramjet',
      icon: '🌐',
      html,
      width: 1000,
      height: 680
    });

    const root = w.content;
    const frame = root.querySelector('#br-frame');

    root.querySelector('#br-reload').onclick = () => {
      frame.src = SCRAMJET_HOME;
    };

    root.querySelector('#br-open').onclick = () => {
      window.open(SCRAMJET_HOME, '_blank', 'noopener,noreferrer');
    };

    return w;
  }

  return { open };
})();
