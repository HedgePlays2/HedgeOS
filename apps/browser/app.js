const OSBrowser = (() => {
  const PROXY_BASE = 'https://hedgeos.detlaffcameron.workers.dev/?url=';

  const BOOKMARKS = [
    { label: '🎮 Games', url: 'https://platypuscodes.github.io/games/' },
    { label: '🔍 Google', url: 'https://www.google.com/webhp?igu=1' },
    { label: '📺 YouTube', url: 'https://www.youtube.com' },
    { label: '📰 Reddit', url: 'https://old.reddit.com' },
  ];

  const HOME = BOOKMARKS[0].url;

  function proxyUrl(url) {
    if (!url || url === 'about:blank') return url;
    return PROXY_BASE + encodeURIComponent(url);
  }

  function open(url = HOME) {
    const bookmarkHtml = BOOKMARKS.map(b =>
      `<button class="browser-bm" data-url="${b.url}">${b.label}</button>`
    ).join('');

    const html = `
      <div class="browser-container">
        <div class="browser-bar">
          <button class="browser-nav-btn" id="br-back" title="Back">◀</button>
          <button class="browser-nav-btn" id="br-fwd" title="Forward">▶</button>
          <button class="browser-nav-btn" id="br-reload" title="Reload">🔄</button>
          <button class="browser-nav-btn" id="br-home" title="Home">🏠</button>
          <input class="browser-url" id="br-url" value="${url}" placeholder="Search or enter URL...">
          <button class="browser-nav-btn" id="br-go" title="Go">→</button>
        </div>
        <div class="browser-bookmarks">${bookmarkHtml}</div>
        <iframe class="browser-frame" id="br-frame"
          src="${proxyUrl(url)}"
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox">
        </iframe>
      </div>`;

    const w = WindowManager.create({ title: 'Browser', icon: '🌐', html, width: 900, height: 600 });
    const root = w.content;
    const frame = root.querySelector('#br-frame');
    const urlInput = root.querySelector('#br-url');

    function navigate(to) {
      let u = to.trim();
      if (!u) return;
      if (!/^https?:\/\//i.test(u) && !u.startsWith('//')) {
        if (u.includes('.') && !u.includes(' ')) u = 'https://' + u;
        else u = 'https://www.google.com/search?q=' + encodeURIComponent(u);
      }
      urlInput.value = u;
      frame.src = proxyUrl(u);
    }

    root.querySelector('#br-go').onclick = () => navigate(urlInput.value);
    urlInput.addEventListener('keydown', e => { if (e.key === 'Enter') navigate(urlInput.value); });
    root.querySelector('#br-back').onclick = () => { try { frame.contentWindow.history.back(); } catch {} };
    root.querySelector('#br-fwd').onclick = () => { try { frame.contentWindow.history.forward(); } catch {} };
    root.querySelector('#br-reload').onclick = () => { frame.src = proxyUrl(urlInput.value); };
    root.querySelector('#br-home').onclick = () => navigate(HOME);

    root.querySelectorAll('.browser-bm').forEach(btn => {
      btn.addEventListener('click', () => navigate(btn.dataset.url));
    });

    return w;
  }

  return { open };
})();
