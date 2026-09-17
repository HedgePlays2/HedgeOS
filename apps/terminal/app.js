const Terminal = (() => {
  function open() {
    const html = `
      <div class="term-container">
        <div class="term-output" id="term-out"></div>
        <div class="term-input-row">
          <span class="term-ps1" id="term-ps1">hedge@os:~$</span>
          <input class="term-input" id="term-in" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false">
        </div>
      </div>`;

    const w = WindowManager.create({ title: 'Terminal', icon: '⌨', html, width: 640, height: 460 });
    const out = w.content.querySelector('#term-out');
    const input = w.content.querySelector('#term-in');
    const ps1 = w.content.querySelector('#term-ps1');

    const state = { cwd: '/', history: [], histIdx: -1, env: { USER: 'hedge', HOME: '/', PATH: '/bin', SHELL: '/bin/hedge' } };

    function print(text, cls = '') {
      const d = document.createElement('div');
      d.className = 'term-line' + (cls ? ' ' + cls : '');
      d.innerHTML = text;
      out.appendChild(d);
      out.scrollTop = out.scrollHeight;
    }

    function updatePs1() { ps1.textContent = `hedge@os:${state.cwd}$`; }

    print(`<span style="color:#4ade80">HedgeOS Terminal v${HedgeOS.version}</span>`);
    print(`Type <span style="color:#60a5fa">help</span> for available commands.`);
    print('');

    const commands = {
      help() {
        const cmds = [
          ['help', 'Show this help'],
          ['ls [path]', 'List files'],
          ['cd [path]', 'Change directory'],
          ['pwd', 'Print working directory'],
          ['mkdir name', 'Create directory'],
          ['rm [-r] path', 'Delete file or folder'],
          ['cat file', 'Read file contents'],
          ['echo text', 'Print text'],
          ['clear', 'Clear terminal'],
          ['whoami', 'Show current user'],
          ['date', 'Show current date'],
          ['uname', 'System info'],
          ['history', 'Command history'],
          ['env', 'Show environment'],
          ['uptime', 'System uptime'],
          ['neofetch', 'System info display'],
          ['open app', 'Open an app (files, terminal, settings, browser, about)'],
          ['calc expr', 'Calculate expression'],
          ['weather', 'Fake weather report'],
          ['theme name', 'Set theme (blue/purple/green/rose/orange)'],
        ];
        cmds.forEach(([c, d]) => print(`  <span style="color:#60a5fa;min-width:180px;display:inline-block">${c}</span><span style="color:#9ca3af">${d}</span>`));
      },

      async ls(args) {
        const path = resolvePath(state, args[0] || state.cwd);
        if (!HedgeOS.puterReady) { print('Not connected to Puter (ls uses cloud filesystem).', 'warn'); return; }
        try {
          const entries = await puter.fs.readdir(path);
          if (!entries.length) { print('(empty)', 'info'); return; }
          const sorted = [...entries].sort((a, b) => (a.is_dir !== b.is_dir) ? (a.is_dir ? -1 : 1) : a.name.localeCompare(b.name));
          sorted.forEach(e => {
            const icon = e.is_dir ? '📁' : '📄';
            const col = e.is_dir ? '#60a5fa' : '#e2e8f0';
            print(`${icon} <span style="color:${col}">${e.name}${e.is_dir ? '/' : ''}</span>`);
          });
        } catch (e) { print('ls: ' + e.message, 'error'); }
      },

      async cd(args) {
        const target = args[0] || '/';
        const path = resolvePath(state, target);
        if (!HedgeOS.puterReady) { state.cwd = path; updatePs1(); return; }
        try {
          await puter.fs.readdir(path);
          state.cwd = path;
          updatePs1();
        } catch { print(`cd: ${target}: No such directory`, 'error'); }
      },

      pwd() { print(state.cwd); },

      async mkdir(args) {
        if (!args[0]) { print('mkdir: missing operand', 'error'); return; }
        if (!HedgeOS.puterReady) { print('Not connected to Puter.', 'warn'); return; }
        const path = resolvePath(state, args[0]);
        try { await puter.fs.mkdir(path); print(`Created: ${path}`, 'success'); }
        catch (e) { print('mkdir: ' + e.message, 'error'); }
      },

      async rm(args) {
        if (!args[0]) { print('rm: missing operand', 'error'); return; }
        if (!HedgeOS.puterReady) { print('Not connected to Puter.', 'warn'); return; }
        const recursive = args[0] === '-r' || args[0] === '-rf';
        const target = recursive ? args[1] : args[0];
        if (!target) { print('rm: missing operand', 'error'); return; }
        const path = resolvePath(state, target);
        try {
          await puter.fs.delete(path, { recursive });
          print(`Deleted: ${path}`, 'success');
        } catch (e) { print('rm: ' + e.message, 'error'); }
      },

      async cat(args) {
        if (!args[0]) { print('cat: missing file', 'error'); return; }
        if (!HedgeOS.puterReady) { print('Not connected to Puter.', 'warn'); return; }
        try {
          const blob = await puter.fs.read(resolvePath(state, args[0]));
          const text = await blob.text();
          text.split('\n').forEach(line => print(escapeHtml(line)));
        } catch (e) { print('cat: ' + e.message, 'error'); }
      },

      echo(args) { print(args.join(' ')); },

      clear() { out.innerHTML = ''; },

      whoami() { print(state.env.USER); },

      date() { print(new Date().toString()); },

      uname() { print(`HedgeOS ${HedgeOS.version} ${navigator.platform} Web/JS`); },

      history() {
        state.history.forEach((h, i) => print(`  ${String(i + 1).padStart(3)}  ${h}`));
      },

      env() {
        Object.entries(state.env).forEach(([k, v]) => print(`${k}=${v}`));
      },

      uptime() {
        const s = Math.floor(performance.now() / 1000);
        const m = Math.floor(s / 60);
        const h = Math.floor(m / 60);
        print(`up ${h}h ${m % 60}m ${s % 60}s`);
      },

      neofetch() {
        print(`<span style="color:#4ade80">        🌿🌿🌿        </span>`);
        print(`<span style="color:#4ade80">      🌿🌿🌿🌿🌿      </span>  <span style="color:#60a5fa">hedge</span><span style="color:#9ca3af">@</span><span style="color:#60a5fa">os</span>`);
        print(`<span style="color:#4ade80">    🌿🌿  🌿  🌿🌿    </span>  <span style="color:#9ca3af">OS:</span> HedgeOS ${HedgeOS.version}`);
        print(`<span style="color:#4ade80">   🌿🌿   🌿   🌿🌿   </span>  <span style="color:#9ca3af">Host:</span> ${location.hostname}`);
        print(`<span style="color:#4ade80">    🌿🌿  🌿  🌿🌿    </span>  <span style="color:#9ca3af">Shell:</span> HedgeSH`);
        print(`<span style="color:#4ade80">      🌿🌿🌿🌿🌿      </span>  <span style="color:#9ca3af">Resolution:</span> ${screen.width}x${screen.height}`);
        print(`<span style="color:#4ade80">        🌿🌿🌿        </span>  <span style="color:#9ca3af">Platform:</span> ${navigator.platform}`);
        print(``);
      },

      open(args) {
        const app = (args[0] || '').toLowerCase();
        const match = HedgeOS.apps.find(a => a.id === app || a.name.toLowerCase().includes(app));
        if (match) { match.launch(); print(`Launched: ${match.name}`, 'success'); }
        else print(`open: unknown app "${args[0]}". Try: ${HedgeOS.apps.map(a => a.id).join(', ')}`, 'error');
      },

      calc(args) {
        const expr = args.join(' ');
        try {
          const result = Function('"use strict"; return (' + expr + ')')();
          print(`${expr} = <span style="color:#4ade80">${result}</span>`);
        } catch { print('calc: invalid expression', 'error'); }
      },

      weather() {
        const conds = ['☀ Sunny', '⛅ Partly Cloudy', '🌧 Rainy', '🌩 Stormy', '❄ Snowy', '🌫 Foggy'];
        const temp = Math.floor(Math.random() * 30 + 5);
        const cond = conds[Math.floor(Math.random() * conds.length)];
        print(`Weather for HedgeOS City:`);
        print(`  Condition: ${cond}`);
        print(`  Temperature: ${temp}°C / ${Math.floor(temp * 9 / 5 + 32)}°F`);
        print(`  Humidity: ${Math.floor(Math.random() * 50 + 30)}%`);
        print(`  Wind: ${Math.floor(Math.random() * 30 + 5)} km/h`);
      },

      theme(args) {
        const t = args[0];
        if (!['blue','purple','green','rose','orange'].includes(t)) {
          print('theme: options are blue, purple, green, rose, orange', 'warn');
          return;
        }
        HedgeOS.settings.theme = t;
        HedgeOS.saveSettings();
        print(`Theme set to ${t}`, 'success');
      },
    };

    async function runCommand(line) {
      const trimmed = line.trim();
      if (!trimmed) return;
      state.history.push(trimmed);
      state.histIdx = state.history.length;

      print(`<span style="color:#4ade80">hedge@os:${state.cwd}$</span> ${escapeHtml(trimmed)}`);

      const parts = trimmed.split(/\s+/);
      const cmd = parts[0];
      const args = parts.slice(1);

      if (commands[cmd]) {
        try { await commands[cmd](args); } catch (e) { print(cmd + ': ' + e.message, 'error'); }
      } else {
        print(`${cmd}: command not found. Type <span style="color:#60a5fa">help</span> for help.`, 'error');
      }
    }

    input.addEventListener('keydown', e => {
      if (e.key === 'Enter') {
        runCommand(input.value);
        input.value = '';
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (state.histIdx > 0) { state.histIdx--; input.value = state.history[state.histIdx] || ''; }
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (state.histIdx < state.history.length - 1) { state.histIdx++; input.value = state.history[state.histIdx] || ''; }
        else { state.histIdx = state.history.length; input.value = ''; }
      } else if (e.key === 'l' && e.ctrlKey) {
        e.preventDefault();
        out.innerHTML = '';
      }
    });

    setTimeout(() => input.focus(), 50);
    return w;
  }

  function resolvePath(state, path) {
    if (!path || path === '~') return '/';
    if (path.startsWith('/')) return path.replace(/\/+/g, '/').replace(/\/$/, '') || '/';
    const base = state.cwd.replace(/\/$/, '');
    const parts = (base + '/' + path).split('/').filter(Boolean);
    const resolved = [];
    for (const p of parts) {
      if (p === '..') resolved.pop();
      else if (p !== '.') resolved.push(p);
    }
    return '/' + resolved.join('/');
  }

  function escapeHtml(s) {
    return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }

  return { open };
})();
