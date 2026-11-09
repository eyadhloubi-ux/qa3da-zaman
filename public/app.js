/* قعدة زمان — واجهة اللعبة
   إعداد م. إياد حلوبي · @eyad.hloubi · صار بدها قعدة. */
(function () {
  'use strict';
  const IG = 'https://instagram.com/eyad.hloubi';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const LS = { get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }, set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }, del(k) { try { localStorage.removeItem(k); } catch (e) {} } };
  const { META, IMPL, mulberry32, beep, buzz, noise } = window.ZG;

  // ───────── الأيقونات ─────────
  const I = {
    cassette: '<svg viewBox="0 0 48 48"><rect x="4" y="11" width="40" height="27" rx="4" fill="var(--c4)" stroke="currentColor" stroke-width="3"/><rect x="12" y="18" width="24" height="10" rx="5" fill="currentColor"/><circle cx="18" cy="23" r="3" fill="var(--paper)"/><circle cx="30" cy="23" r="3" fill="var(--paper)"/><path d="M13 38l3-5h16l3 5" fill="none" stroke="currentColor" stroke-width="3"/></svg>',
    antenna: '<svg viewBox="0 0 48 48"><path d="M24 22L13 6M24 22L35 6" stroke="currentColor" stroke-width="3" stroke-linecap="round"/><rect x="6" y="20" width="36" height="22" rx="5" fill="var(--c3)" stroke="currentColor" stroke-width="3"/><rect x="11" y="25" width="20" height="12" rx="2" fill="var(--paper)" stroke="currentColor" stroke-width="2"/><circle cx="36" cy="29" r="2" fill="currentColor"/><circle cx="36" cy="35" r="2" fill="currentColor"/></svg>',
    rotary: '<svg viewBox="0 0 48 48"><circle cx="24" cy="24" r="19" fill="var(--c1)" stroke="currentColor" stroke-width="3"/><circle cx="24" cy="24" r="6" fill="var(--paper)" stroke="currentColor" stroke-width="2.5"/><g fill="var(--paper)" stroke="currentColor" stroke-width="2"><circle cx="24" cy="10.5" r="3"/><circle cx="34" cy="14.5" r="3"/><circle cx="37.5" cy="24" r="3"/><circle cx="14" cy="14.5" r="3"/><circle cx="10.5" cy="24" r="3"/><circle cx="14" cy="33.5" r="3"/></g></svg>',
    t9: '<svg viewBox="0 0 48 48"><rect x="12" y="3" width="24" height="42" rx="7" fill="var(--c6)" stroke="currentColor" stroke-width="3"/><rect x="16" y="8" width="16" height="12" rx="2" fill="#B9C9A0" stroke="currentColor" stroke-width="2"/><g fill="currentColor"><circle cx="18" cy="26" r="1.8"/><circle cx="24" cy="26" r="1.8"/><circle cx="30" cy="26" r="1.8"/><circle cx="18" cy="32" r="1.8"/><circle cx="24" cy="32" r="1.8"/><circle cx="30" cy="32" r="1.8"/><circle cx="18" cy="38" r="1.8"/><circle cx="24" cy="38" r="1.8"/><circle cx="30" cy="38" r="1.8"/></g></svg>',
    top: '<svg viewBox="0 0 48 48"><path d="M24 44C14 30 9 22 10 14h28c1 8-4 16-14 30z" fill="var(--c0)" stroke="currentColor" stroke-width="3" stroke-linejoin="round"/><ellipse cx="24" cy="14" rx="14" ry="4" fill="var(--c4)" stroke="currentColor" stroke-width="3"/><path d="M24 10V4" stroke="currentColor" stroke-width="3.5" stroke-linecap="round"/><path d="M17 20l3 12M28 20l-2 12" stroke="currentColor" stroke-width="2" opacity=".5"/></svg>',
    marbles: '<svg viewBox="0 0 48 48"><ellipse cx="24" cy="38" rx="17" ry="5" fill="currentColor" opacity=".2"/><circle cx="17" cy="24" r="10" fill="var(--c1)" stroke="currentColor" stroke-width="3"/><circle cx="34" cy="28" r="7" fill="var(--c2)" stroke="currentColor" stroke-width="3"/><circle cx="14" cy="20" r="2.5" fill="#fff"/><circle cx="32" cy="25" r="1.8" fill="#fff"/></svg>',
    hat: '<svg viewBox="0 0 48 48"><path d="M8 33c0-11 7-20 16-20s16 9 16 20z" fill="var(--c2)" stroke="currentColor" stroke-width="3" stroke-linejoin="round"/><path d="M4 33h40v5H4z" fill="var(--c4)" stroke="currentColor" stroke-width="3" stroke-linejoin="round"/><circle cx="24" cy="11" r="3.5" fill="var(--c4)" stroke="currentColor" stroke-width="2.5"/></svg>',
    hatCap: '<svg viewBox="0 0 48 48"><path d="M8 33c0-11 7-20 16-20s16 9 16 20z" fill="var(--c2)" stroke="#0A0E19" stroke-width="3" stroke-linejoin="round"/><path d="M4 33h40v5H4z" fill="var(--c4)" stroke="#0A0E19" stroke-width="3" stroke-linejoin="round"/><circle cx="24" cy="11" r="3.5" fill="var(--c4)" stroke="#0A0E19" stroke-width="2.5"/></svg>',
    tug: '<svg viewBox="0 0 48 48"><path d="M3 26c7-3 13 3 21 0s14-3 21 0" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round"/><path d="M3 26c7-3 13 3 21 0s14-3 21 0" fill="none" stroke="var(--c4)" stroke-width="1.5" stroke-dasharray="3 3"/><rect x="21" y="18" width="6" height="14" rx="2" fill="var(--c0)" stroke="currentColor" stroke-width="2.5"/><path d="M24 8v6M24 36v6" stroke="currentColor" stroke-width="2.5" stroke-dasharray="2 3"/></svg>',
    stones: '<svg viewBox="0 0 48 48"><rect x="8" y="37" width="32" height="7" rx="3.5" fill="#A39A88" stroke="currentColor" stroke-width="2.5"/><rect x="11" y="29" width="27" height="7" rx="3.5" fill="#B9AF9B" stroke="currentColor" stroke-width="2.5"/><rect x="13" y="21" width="22" height="7" rx="3.5" fill="#8E8676" stroke="currentColor" stroke-width="2.5"/><rect x="16" y="13" width="17" height="7" rx="3.5" fill="#B0A48E" stroke="currentColor" stroke-width="2.5"/><rect x="19" y="5" width="11" height="7" rx="3.5" fill="#9A8F7C" stroke="currentColor" stroke-width="2.5"/></svg>',
    hoop: '<svg viewBox="0 0 48 48"><circle cx="20" cy="27" r="15" fill="none" stroke="currentColor" stroke-width="5"/><circle cx="20" cy="27" r="15" fill="none" stroke="var(--c0)" stroke-width="2.4"/><path d="M44 6L30 24" stroke="currentColor" stroke-width="4" stroke-linecap="round"/><path d="M44 6L30 24" stroke="var(--c4)" stroke-width="1.6" stroke-linecap="round"/><path d="M4 44h40" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" opacity=".4"/></svg>',
    qabban: '<svg viewBox="0 0 48 48"><path d="M24 4v6" stroke="currentColor" stroke-width="3" stroke-linecap="round"/><circle cx="24" cy="4" r="2.5" fill="currentColor"/><path d="M6 14h38" stroke="currentColor" stroke-width="4" stroke-linecap="round"/><path d="M6 14h38" stroke="var(--c4)" stroke-width="1.6" stroke-dasharray="2 4"/><path d="M10 14l-4 14M10 14l4 14" stroke="currentColor" stroke-width="2"/><path d="M2 28h16a8 6 0 0 1-16 0z" fill="var(--c6)" stroke="currentColor" stroke-width="2.5"/><path d="M36 14v8" stroke="currentColor" stroke-width="2.5"/><rect x="31" y="22" width="10" height="12" rx="3" fill="var(--c1)" stroke="currentColor" stroke-width="2.5"/></svg>',
    jumprope: '<svg viewBox="0 0 48 48"><path d="M6 14C6 46 42 46 42 14" fill="none" stroke="var(--c2)" stroke-width="3.5" stroke-linecap="round"/><rect x="3" y="7" width="6" height="10" rx="2" fill="var(--c4)" stroke="currentColor" stroke-width="2.4"/><rect x="39" y="7" width="6" height="10" rx="2" fill="var(--c4)" stroke="currentColor" stroke-width="2.4"/><circle cx="24" cy="10" r="4.5" fill="currentColor"/><path d="M24 15v11M24 19l-6 4M24 19l6 4M24 26l-5 7M24 26l5 7" stroke="currentColor" stroke-width="3" stroke-linecap="round"/></svg>',
    chairs: '<svg viewBox="0 0 48 48"><path d="M14 6h20v18H14z" fill="var(--c2)" stroke="currentColor" stroke-width="3" stroke-linejoin="round"/><path d="M10 24h28v6H10z" fill="var(--c4)" stroke="currentColor" stroke-width="3" stroke-linejoin="round"/><path d="M13 30v14M35 30v14M17 24v-4M31 24v-4" stroke="currentColor" stroke-width="3" stroke-linecap="round"/><path d="M40 6l4-2v9" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" fill="none"/><circle cx="41" cy="13" r="2.6" fill="currentColor"/></svg>',
    chair: '<svg viewBox="0 0 48 48"><path d="M14 4h20v20H14z" fill="#C9A774" stroke="#0A0E19" stroke-width="3" stroke-linejoin="round"/><path d="M14 10h20M14 16h20" stroke="#8A6A3E" stroke-width="2"/><path d="M9 24h30v7H9z" fill="#D9B27C" stroke="#0A0E19" stroke-width="3" stroke-linejoin="round"/><path d="M12 31v14M36 31v14" stroke="#0A0E19" stroke-width="3.5" stroke-linecap="round"/></svg>',
    help: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-width="2.4"/><path d="M9.2 9.3a2.9 2.9 0 1 1 4.3 2.6c-1 .6-1.5 1.1-1.5 2.3" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/><circle cx="12" cy="17.6" r="1.4" fill="currentColor"/></svg>',
    moon: '<svg viewBox="0 0 24 24"><path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5z" fill="currentColor"/></svg>',
    sun: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="4.5" fill="currentColor"/><g stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M4.9 19.1l1.8-1.8M17.3 6.7l1.8-1.8"/></g></svg>',
    crown: '<svg viewBox="0 0 24 24"><path d="M3 8l4.5 4L12 5l4.5 7L21 8l-2 11H5z" fill="var(--c4)" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>',
    cam: '<svg viewBox="0 0 24 24"><path d="M4 8h3l1.6-2.5h6.8L17 8h3v11H4z" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round"/><circle cx="12" cy="13.3" r="3.4" fill="none" stroke="currentColor" stroke-width="2.2"/></svg>',
    img: '<svg viewBox="0 0 24 24"><rect x="3.5" y="4.5" width="17" height="15" rx="2.5" fill="none" stroke="currentColor" stroke-width="2.2"/><circle cx="9" cy="10" r="1.8" fill="currentColor"/><path d="M4 18l5-5 4 4 3-3 4 4" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round"/></svg>',
    people: '<svg viewBox="0 0 24 24"><circle cx="9" cy="8" r="3.4" fill="none" stroke="currentColor" stroke-width="2.2"/><path d="M3 19.5c0-3.3 2.7-5.5 6-5.5s6 2.2 6 5.5" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/><circle cx="17" cy="9" r="2.6" fill="none" stroke="currentColor" stroke-width="2"/><path d="M16.5 14.2c2.6.2 4.5 2 4.5 4.6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
    stop: '<svg viewBox="0 0 24 24"><rect x="5.5" y="5.5" width="13" height="13" rx="2.5" fill="none" stroke="currentColor" stroke-width="2.4"/><rect x="9.5" y="9.5" width="5" height="5" rx="1" fill="currentColor"/></svg>',
    tv: '<svg viewBox="0 0 24 24"><path d="M8 3l4 4 4-4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><rect x="3" y="7" width="18" height="13" rx="3" fill="none" stroke="currentColor" stroke-width="2.2"/></svg>',
    share: '<svg viewBox="0 0 24 24"><path d="M12 15V4M7.5 8.5L12 4l4.5 4.5M5 13v6h14v-6" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    dl: '<svg viewBox="0 0 24 24"><path d="M12 4v11M7.5 10.5L12 15l4.5-4.5M5 19h14" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  };
  const GAME_ORDER = ['cassette', 'antenna', 'rotary', 't9', 'chairs', 'marbles', 'hat', 'tug', 'stones', 'hoop', 'qabban', 'jumprope'];
  const NG = GAME_ORDER.length, STEP = 360 / NG;

  // ───────── الحالة ─────────
  let pid = LS.get('zaman_pid'); if (!pid) { pid = 'p' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4); LS.set('zaman_pid', pid); }
  let wantSetup = false;
  let code = null, S = null, ws = null, offset = 0, photos = {}, groupPhoto = null, connected = false, wantProfile = false, editingProfile = false;
  const params = new URLSearchParams(location.search);
  if (params.get('r')) code = params.get('r').toUpperCase(); else code = LS.get('zaman_room');
  const now = () => Date.now() + offset;
  const me = () => S && S.players[pid];
  const isHost = () => S && S.hostId === pid;
  const gend = (id, m, f) => (S && S.players[id] && S.players[id].gender === 'f') ? f : m;
  const myG = (m, f) => gend(pid, m, f);
  const nameOf = id => (S && S.players[id] && S.players[id].name) || 'لاعب بلا اسم';
  const teamName = i => (S && S.teams[i] && S.teams[i].name) || '';
  const isTeam = () => S && S.settings.mode !== 'solo';

  // ───────── الثيم ─────────
  function setTheme(t) { document.documentElement.dataset.theme = t; LS.set('zaman_theme', t); const b = $('#themeBtn'); if (b) b.innerHTML = t === 'dark' ? I.sun : I.moon; const m = $('meta[name=theme-color]'); if (m) m.content = t === 'dark' ? '#141A2B' : '#F1E6D0'; }
  setTheme(LS.get('zaman_theme') || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'));

  // ───────── الاتصال ─────────
  let retry = 0, pingT;
  function connect() {
    ws = new WebSocket((location.protocol === 'https:' ? 'wss://' : 'ws://') + location.host);
    ws.onopen = () => {
      connected = true; retry = 0; netBadge();
      for (let i = 0; i < 3; i++) setTimeout(() => sendRaw({ t: 'ping', c: Date.now() }), i * 300);
      clearInterval(pingT); pingT = setInterval(() => sendRaw({ t: 'ping', c: Date.now() }), 20000);
      if (code) sendRaw({ t: 'join', code, pid, hostKey: LS.get('zaman_hk_' + code) });
      else render();
    };
    ws.onmessage = e => { let m; try { m = JSON.parse(e.data); } catch (x) { return; } onMsg(m); };
    ws.onclose = () => { connected = false; netBadge(); setTimeout(connect, Math.min(5000, 600 * (++retry))); };
  }
  let bestRtt = 1e9;
  function sendRaw(m) { if (ws && ws.readyState === 1) ws.send(JSON.stringify(m)); }
  function send(m) { sendRaw(m); }
  function host(a, extra) { send(Object.assign({ t: 'host', a }, extra || {})); }
  function onMsg(m) {
    if (m.t === 'pong') { const rtt = Date.now() - m.c; if (rtt <= bestRtt + 30) { bestRtt = Math.min(bestRtt, rtt); offset = m.s - (m.c + rtt / 2); } return; }
    if (m.t === 'created') { code = m.code; LS.set('zaman_hk_' + code, m.hostKey); LS.set('zaman_room', code); history.replaceState(null, '', '/?r=' + code); sendRaw({ t: 'join', code, pid, hostKey: m.hostKey }); return; }
    if (m.t === 'joined') { LS.set('zaman_room', code); if (location.search.indexOf('r=') < 0) history.replaceState(null, '', '/?r=' + code); return; }
    if (m.t === 'state') { const prev = S; S = m.s; if (!prev || Math.abs(S.now - Date.now() - offset) > 1500 && bestRtt > 1e8) offset = S.now - Date.now(); render(prev); return; }
    if (m.t === 'photos') { photos = m.map || {}; groupPhoto = m.group; refreshPhotos(); return; }
    if (m.t === 'kicked') { leaveRoom(); showScreen(kickedScreen()); return; }
    if (m.t === 'error') {
      if (m.e === 'noroom' || m.e === 'closed') { toast(m.e === 'closed' ? 'انسكّرت القعدة' : 'الكود غلط أو القعدة خلصت'); leaveRoom(); render(); }
      return;
    }
  }
  function leaveRoom() { code = null; S = null; LS.del('zaman_room'); history.replaceState(null, '', '/'); }
  function netBadge() { const b = $('#net'); if (!b) return; b.hidden = connected; }

  // ───────── أدوات الواجهة ─────────
  function toast(t) { const el = document.createElement('div'); el.className = 'toast'; el.textContent = t; document.body.appendChild(el); setTimeout(() => el.classList.add('on'), 10); setTimeout(() => { el.classList.remove('on'); setTimeout(() => el.remove(), 300); }, 2300); }
  function avatar(id, size = 40) {
    const p = S && S.players[id]; const col = p ? `var(--c${p.color})` : 'var(--c0)';
    const src = photos[id];
    const inner = src ? `<img src="${src}" alt="">` : `<b>${esc(initials(p && p.name))}</b>`;
    return `<span class="av" data-av="${esc(id)}" style="--pc:${col};width:${size}px;height:${size}px;font-size:${Math.round(size * 0.42)}px">${inner}</span>`;
  }
  function initials(n) { n = (n || '').trim(); if (!n) return '؟'; return /^[اأإآ]/.test(n) ? n.slice(0, 2) : n.slice(0, 1); }
  function refreshPhotos() { $$('[data-av]').forEach(el => { const id = el.dataset.av; if (photos[id]) el.innerHTML = `<img src="${photos[id]}" alt="">`; }); $$('[data-group]').forEach(el => { el.innerHTML = groupPhoto ? `<img src="${groupPhoto}" alt="">` : el.dataset.empty || ''; }); }
  function sheet(html, onMount) {
    const w = document.createElement('div'); w.className = 'sheet-wrap';
    w.innerHTML = `<div class="sheet" role="dialog"><button class="x" aria-label="سكّر">✕</button>${html}</div>`;
    document.body.appendChild(w); requestAnimationFrame(() => w.classList.add('on'));
    const close = () => { w.classList.remove('on'); setTimeout(() => w.remove(), 250); };
    w.addEventListener('pointerdown', e => { if (e.target === w) close(); });
    $('.x', w).onclick = close;
    if (onMount) onMount($('.sheet', w), close);
    return close;
  }
  function confirmBox(text, yes, cb) { sheet(`<h3>${text}</h3><div class="row2"><button class="btn ghost" data-n>لا</button><button class="btn red" data-y>${yes}</button></div>`, (el, close) => { $('[data-n]', el).onclick = close; $('[data-y]', el).onclick = () => { close(); cb(); }; }); }
  function fireworks() {
    const c = document.createElement('canvas'); c.className = 'fw'; document.body.appendChild(c);
    const x = c.getContext('2d'); const W = c.width = innerWidth, H = c.height = innerHeight;
    const cols = ['--c0', '--c2', '--c3', '--c4', '--c5', '--c1'].map(v => getComputedStyle(document.documentElement).getPropertyValue(v).trim());
    const P = [];
    const burst = (bx, by, big) => { noise(big ? 1.1 : 0.7, big ? 0.6 : 0.35, 700); const n = big ? 120 : 70, col = cols[Math.floor(Math.random() * cols.length)];
      for (let i = 0; i < n; i++) { const a = Math.random() * 6.283, s = (big ? 7 : 5) * (0.4 + Math.random()); P.push({ x: bx, y: by, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: 1, c: Math.random() < 0.3 ? '#FFF6D8' : col }); } };
    const plan = [[0, W * 0.5, H * 0.3, 1], [350, W * 0.25, H * 0.22, 0], [600, W * 0.78, H * 0.26, 0], [950, W * 0.4, H * 0.18, 1], [1250, W * 0.65, H * 0.35, 0], [1600, W * 0.5, H * 0.25, 1]];
    plan.forEach(([t, bx, by, big]) => setTimeout(() => burst(bx, by, big), t));
    let t0 = performance.now();
    (function f() { const el = performance.now() - t0; x.globalCompositeOperation = 'source-over'; x.clearRect(0, 0, W, H);
      x.globalCompositeOperation = 'lighter';
      for (const p of P) { p.vy += 0.07; p.vx *= 0.985; p.vy *= 0.985; p.x += p.vx; p.y += p.vy; p.life -= 0.011; if (p.life <= 0) continue; x.globalAlpha = Math.max(0, p.life); x.fillStyle = p.c; x.beginPath(); x.arc(p.x, p.y, 2.6, 0, 6.283); x.fill(); }
      x.globalAlpha = 1; if (el < 4200) requestAnimationFrame(f); else c.remove(); })();
    setTimeout(() => confetti(120), 400);
  }
  function confetti(n = 120) {
    const c = document.createElement('canvas'); c.className = 'confetti'; document.body.appendChild(c);
    const x = c.getContext('2d'); const W = c.width = innerWidth, H = c.height = innerHeight;
    const cols = ['--c0', '--c1', '--c2', '--c3', '--c4', '--c5'].map(v => getComputedStyle(document.documentElement).getPropertyValue(v));
    const P = Array.from({ length: n }, () => ({ x: W / 2 + (Math.random() - 0.5) * W * 0.3, y: H * 0.35, vx: (Math.random() - 0.5) * 14, vy: -Math.random() * 16 - 4, r: Math.random() * 6.28, s: 6 + Math.random() * 8, c: cols[Math.floor(Math.random() * cols.length)] }));
    let t = 0; (function f() { t++; x.clearRect(0, 0, W, H); for (const p of P) { p.vy += 0.42; p.x += p.vx; p.y += p.vy; p.vx *= 0.99; p.r += 0.15; x.save(); x.translate(p.x, p.y); x.rotate(p.r); x.fillStyle = p.c; x.fillRect(-p.s / 2, -p.s / 4, p.s, p.s / 2); x.restore(); } if (t < 200) requestAnimationFrame(f); else c.remove(); })();
  }

  // ───────── إدارة الشاشات ─────────
  let screen = null;
  function showScreen(sc) {
    if (screen && screen.destroy) screen.destroy();
    screen = sc; updateTopbar(); const root = $('#app'); root.innerHTML = ''; root.appendChild(sc.el);
    root.scrollTop = 0; window.scrollTo(0, 0);
    if (sc.mounted) sc.mounted();
  }
  function el(html) { const d = document.createElement('div'); d.className = 'screen'; d.innerHTML = html; return d; }

  let wheelAnimKey = null, finalAnimDone = false;
  function render(prev) {
    netBadge(); updateTopbar();
    if (!code) { if (!screen || screen.key !== 'home') showScreen(homeScreen()); return; }
    if (!S) { if (!screen || screen.key !== 'loading') showScreen({ key: 'loading', el: el('<div class="center-msg"><div class="tv-mini">' + I.tv + '</div><p>عم نوصل للقعدة…</p></div>') }); return; }
    const needGen = me() && S.settings.family && !me().gen && S.phase === 'lobby';
    if (!me() || wantProfile || needGen) { if (!screen || screen.key !== 'profile') showScreen(profileScreen()); return; }
    const needSetup = isHost() && S.phase === 'lobby' && (!S.settings.sessionName.trim() || wantSetup);
    if (needSetup) { if (!screen || screen.key !== 'setup') showScreen(setupScreen()); else if (screen.update) screen.update(); return; }
    let key = S.phase;
    const c = S.cur;
    if (S.phase === 'intro' && c && c.wheelAt && wheelAnimKey !== c.n + ':' + c.seed) {
      wheelAnimKey = c.n + ':' + c.seed;
      if (now() - c.wheelAt < 6000) {
        showScreen(wheelScreen('wheel:' + c.n + ':' + c.seed));
        screen.spinTo(c.game, () => { screen = null; render(); });
        hostAwayBanner(); return;
      }
    }
    if (screen && screen.spinning) { hostAwayBanner(); return; }
    if (screen && screen.drum) return;
    if (S.phase === 'intro') key = 'intro:' + c.n + ':' + c.seed;
    else if (S.phase === 'play') key = 'play:' + c.n + ':' + c.seed;
    else if (S.phase === 'result') key = 'result:' + c.n + ':' + c.seed;
    if (S.phase !== 'final' && S.phase !== 'reveal') finalAnimDone = false;
    if (!screen || screen.key !== key) {
      const mk = { lobby: lobbyScreen, intro: introScreen, play: playScreen, result: resultScreen, reveal: revealScreen, final: finalScreen }[S.phase];
      if (mk) showScreen(mk(key));
    } else if (screen.update) screen.update(prev);
    hostAwayBanner();
  }

  // ───────── الشريط العلوي ─────────
  function updateTopbar() {
    const pb = $('#plBtn'); if (pb) pb.hidden = !(code && S && me() && isHost());
    const mb = $('#endBtn'); const showEnd = !!(code && S && me() && isHost() && S.phase !== 'lobby'); if (mb) mb.hidden = !showEnd; document.body.classList.toggle('has-end', showEnd);
    const t = $('#topTitle'); if (!t) return;
    const inRoom = !!(code && S && me());
    t.innerHTML = inRoom ? `<span class="tt-word">قعدة زمان</span> <span class="code-chip">${esc(S.code)}</span>${isHost() ? ' <span class="host-chip">' + I.crown + ' ' + myG('الريس', 'الريسة') + '</span>' : ''}` : 'قعدة زمان';
  }
  function hostAwayBanner() {
    let b = $('#hostAway');
    const show = S && S.hostAway && S.hostId !== pid && me();
    if (!show) { if (b) b.remove(); return; }
    if (!b) { b = document.createElement('div'); b.id = 'hostAway'; b.className = 'banner'; document.body.appendChild(b); }
    const left = Math.ceil((45000 - (now() - S.hostLeftAt)) / 1000);
    if (left > 0) { b.innerHTML = `${esc(gend(S.hostId, 'الريس طلع', 'الريسة طلعت'))}… ناطرين يرجع (${left} ث)`; clearTimeout(b._t); b._t = setTimeout(hostAwayBanner, 1000); }
    else { b.innerHTML = `${esc(gend(S.hostId, 'الريس ما رجع', 'الريسة ما رجعت'))} <button class="btn sm">${myG('خليني أنا الريس', 'خليني أنا الريسة')}</button>`; $('button', b).onclick = () => send({ t: 'claimHost' }); }
  }

  // ═════════════ الغلاف ═════════════
  function homeScreen() {
    const e = el(`
      <section class="cover">
        <div class="cover-tv">
          <div class="ant"><i></i><i></i></div>
          <div class="tv-body"><div class="tv-screen"><canvas class="static"></canvas><div class="tv-ch"></div></div><div class="tv-knobs"><i></i><i></i></div></div>
        </div>
        <h1 class="title">قعدة زمان</h1>
        <p class="sub">ألعاب من أيام الكاسيت والحارة</p>
        <div class="ticker"><div>${('<span>رجّع الشريط بالقلم · ظبّط الأنتين · دوّر الرقم عالدولاب · اكتب رسالة بالأزرار · ارمي الكلّة · طاق طاق طاقية · شدّ الحبل · اقعد عالكرسي · عمّر السبع حجار · سوق الدولاب بالعصاية · وزّن عالقبّان · نطّ الحبل ·</span>').repeat(2)}</div></div>
        <div class="cover-actions">
          <button class="btn big" id="newBtn">افتح قعدة جديدة</button>
          <div class="join-row"><input id="codeIn" maxlength="5" placeholder="الكود" autocomplete="off" dir="ltr" inputmode="text"><button class="btn ghost" id="joinBtn">فوت</button></div>
        </div>
        <p class="sig">إعداد م. إياد حلوبي</p>
      </section>`);
    const sc = { key: 'home', el: e };
    sc.mounted = () => {
      $('#newBtn', e).onclick = () => { if (!connected) return toast('عم نتصل… جرّب كمان شوي'); sendRaw({ t: 'create', pid }); };
      const go = () => { const v = $('#codeIn', e).value.trim().toUpperCase(); if (v.length !== 5) return toast('الكود 5 أحرف'); code = v; S = null; sendRaw({ t: 'join', code, pid }); render(); };
      $('#joinBtn', e).onclick = go; $('#codeIn', e).addEventListener('keydown', ev => { if (ev.key === 'Enter') go(); });
      // التلفزيون: تشويش وقنوات
      const cv = $('.static', e), cx = cv.getContext('2d'); cv.width = 80; cv.height = 60; const img = cx.createImageData(80, 60);
      const chEl = $('.tv-ch', e); let k = 0, staticOn = true;
      const show = () => { staticOn = false; chEl.innerHTML = I[GAME_ORDER[k % NG]]; chEl.classList.add('on'); k++; setTimeout(() => { chEl.classList.remove('on'); staticOn = true; }, 1700); };
      let raf; const f = () => { if (staticOn) { for (let i = 0; i < img.data.length; i += 4) { const v = Math.random() * 200; img.data[i] = img.data[i + 1] = img.data[i + 2] = v; img.data[i + 3] = 255; } cx.putImageData(img, 0, 0); } raf = requestAnimationFrame(f); }; f();
      const iv = setInterval(show, 2300); setTimeout(show, 500);
      sc.destroy = () => { cancelAnimationFrame(raf); clearInterval(iv); };
    };
    return sc;
  }
  function kickedScreen() { const e = el(`<div class="center-msg"><div class="big-ic">${I.hat}</div><h2>طلعت من القعدة</h2><p>الريس طلّعك من هالقعدة.</p><button class="btn" id="h">رجوع للبداية</button></div>`); $('#h', e).onclick = () => { screen = null; render(); }; return { key: 'kicked', el: e }; }

  // ═════════════ الدخول (الاسم والصورة) ═════════════
  function profileScreen() {
    const p = me(); const editing = !!p;
    let photo = editing ? (photos[pid] || null) : null, gender = editing ? p.gender : null, gen = editing ? p.gen : null;
    let name = editing ? p.name : '';
    const fam = S.settings.family;
    const e = el(`
      <section class="card prof">
        <h2>${editing ? 'عدّل معلوماتك' : 'فوت عالقعدة'}</h2>
        <p class="hint">${isHost() && !editing ? 'إنت فاتح القعدة، يعني إنت الريس.' : 'الاسم والصورة اختياريين.'}</p>
        <div class="ph-pick"><div class="ph-prev">${photo ? `<img src="${photo}">` : I.cam}</div>
          <div class="ph-btns"><button class="btn ghost sm" id="gal">${I.img} من الصور</button><button class="btn ghost sm" id="sel">${I.cam} التقط سيلفي</button>${photo ? '<button class="link" id="rm">شيل الصورة</button>' : ''}</div></div>
        <label class="fld"><span>الاسم</span><input id="nm" maxlength="20" placeholder="شو بينادوك بالقعدة؟" value="${esc(name)}"></label>
        <div class="fld"><span>إنت؟ <em>(إجباري)</em></span><div class="seg" id="gd"><button data-v="m">شب</button><button data-v="f">صبية</button></div></div>
        ${fam ? `<div class="fld"><span>من أي جيل؟ <em>(إجباري)</em></span><div class="seg" id="gn"><button data-v="old">جيل الكاسيت</button><button data-v="new">جيل الموبايل</button></div></div>` : ''}
        <button class="btn big" id="ok">${editing ? 'حفظ' : 'يلا فوت'}</button>
        ${editing ? '<button class="link" id="cancel">رجوع</button>' : ''}
        <input type="file" accept="image/*" id="file" hidden>
      </section>`);
    const sc = { key: 'profile', el: e };
    const paint = () => {
      $$('#gd button', e).forEach(b => b.classList.toggle('on', b.dataset.v === gender));
      $$('#gn button', e).forEach(b => b.classList.toggle('on', b.dataset.v === gen));
      $('.ph-prev', e).innerHTML = photo ? `<img src="${photo}">` : I.cam;
    };
    sc.mounted = () => {
      paint();
      $$('#gd button', e).forEach(b => b.onclick = () => { gender = b.dataset.v; paint(); });
      $$('#gn button', e).forEach(b => b.onclick = () => { gen = b.dataset.v; paint(); });
      $('#gal', e).onclick = () => $('#file', e).click();
      $('#file', e).onchange = ev => { const f = ev.target.files[0]; if (!f) return; const r = new FileReader(); r.onload = () => cropper(r.result, 1, 320, out => { photo = out; paint(); }); r.readAsDataURL(f); ev.target.value = ''; };
      $('#sel', e).onclick = () => selfie(false, src => cropper(src, 1, 320, out => { photo = out; paint(); }));
      const rm = $('#rm', e); if (rm) rm.onclick = () => { photo = null; paint(); rm.remove(); };
      const cancel = $('#cancel', e); if (cancel) cancel.onclick = () => { wantProfile = false; screen = null; render(); };
      $('#ok', e).onclick = () => {
        if (!gender) return toast('اختار شب أو صبية');
        if (fam && !gen) return toast('اختار جيلك');
        const m = { t: 'profile', name: $('#nm', e).value.trim(), gender, gen: fam ? gen : null };
        if (!editing || photo !== (photos[pid] || null)) m.photo = photo;
        send(m); wantProfile = false; screen = null;
        setTimeout(render, 50);
      };
    };
    return sc;
  }

  // ═════════════ بطاقة القعدة (للريس من الأول) ═════════════
  function setupScreen() {
    const s = S.settings; const types = ['شلة', 'رفقة', 'عيلة', 'شغل'];
    let type = types.includes(s.sessionType) ? s.sessionType : (s.sessionType || 'شلة');
    const e = el(`<section class="card setup"><h2>بطاقة القعدة</h2><p class="hint">قبل ما يفوت الناس: سمّوا القعدة وصوّروا صورتكن، بتطلع بالنتيجة وبصور الستوري</p>
      <div class="gp big" data-group data-empty="${esc(I.cam)}">${groupPhoto ? `<img src="${groupPhoto}">` : I.cam}</div>
      <div class="row2"><button class="btn ghost sm" id="gpSel">${I.cam} سيلفي بمؤقت</button><button class="btn ghost sm" id="gpGal">${I.img} من الصور</button></div><input type="file" accept="image/*" id="gpFile" hidden>
      <p class="hint sm">الصورة اختيارية، وبتقدر تزيدها أو تغيّرها بعدين</p>
      <label class="fld"><span>اسم القعدة <em>(إجباري)</em></span><input id="sn" maxlength="30" placeholder="مثلاً: سهرة الخميس" value="${esc(s.sessionName)}"></label>
      <div class="fld"><span>نوع القعدة</span><div class="chips">${types.map(t => `<button data-t="${t}">${t}</button>`).join('')}<button data-t="__">غير شي</button></div><input id="st" maxlength="20" placeholder="اكتبوه إنتو" hidden></div>
      <button class="btn big" id="go">يلا، خلّي الناس تفوت</button></section>`);
    const sc = { key: 'setup', el: e };
    const paint = () => { const custom = !types.includes(type); $$('.chips button', e).forEach(b => b.classList.toggle('on', b.dataset.t === type || (custom && b.dataset.t === '__'))); $('#st', e).hidden = !custom; if (custom && type !== 'غير شي') $('#st', e).value = type; };
    sc.mounted = () => {
      paint(); bindGroupPhoto(e);
      $$('.chips button', e).forEach(b => b.onclick = () => { type = b.dataset.t === '__' ? 'غير شي' : b.dataset.t; paint(); });
      $('#go', e).onclick = () => {
        const n = $('#sn', e).value.trim(); if (!n) { toast('اكتب اسم القعدة'); $('#sn', e).focus(); return; }
        const t = type === 'غير شي' ? ($('#st', e).value.trim() || 'غير شي') : type;
        host('settings', { v: { sessionName: n, sessionType: t } }); wantSetup = false; screen = null; setTimeout(render, 120);
      };
    };
    sc.update = () => { const g = $('.gp.big', e); if (g) g.innerHTML = groupPhoto ? `<img src="${groupPhoto}">` : I.cam; };
    return sc;
  }

  // ═════════════ غرفة الانتظار ═════════════
  function lobbyScreen(key) {
    const e = el(`<section class="lobby"><div class="ticket"><div class="t-qr"><img alt="QR" src="/qr/${esc(S.code)}.svg"></div><div class="t-info"><small>كود القعدة</small><div class="t-code" dir="ltr">${esc(S.code)}</div><button class="btn ghost sm" id="shareLink">${I.share} ابعت الرابط</button></div></div>
      <div id="sess"></div><div id="hostSet"></div><div id="players"></div><div id="startBox"></div></section>`);
    const sc = { key, el: e };
    function renderSess() {
      const box = $('#sess', e); const s = S.settings;
      if (isHost()) {
        if (box.querySelector('input:focus')) return;
        const types = ['شلة', 'رفقة', 'عيلة', 'شغل'];
        const custom = !types.includes(s.sessionType);
        box.innerHTML = `<div class="card"><label class="fld"><span>اسم القعدة <em>(إجباري)</em></span><input id="sn" maxlength="30" placeholder="مثلاً: سهرة الخميس" value="${esc(s.sessionName)}"></label>
          <div class="fld"><span>نوع القعدة</span><div class="chips">${types.map(t => `<button data-t="${t}" class="${s.sessionType === t ? 'on' : ''}">${t}</button>`).join('')}<button data-t="__" class="${custom ? 'on' : ''}">غير شي</button></div>${custom ? `<input id="st" maxlength="20" placeholder="اكتبوه إنتو" value="${esc(s.sessionType)}">` : ''}</div>
          <div class="gp-row"><div class="gp" data-group data-empty="${esc(I.cam)}">${groupPhoto ? `<img src="${groupPhoto}">` : I.cam}</div><div><b>الصورة الجماعية</b><small>اختيارية، بتطلع بالنتيجة</small><div class="row2 sm"><button class="btn ghost sm" id="gpSel">${I.cam} سيلفي بمؤقت</button><button class="btn ghost sm" id="gpGal">${I.img} من الصور</button></div></div></div><input type="file" accept="image/*" id="gpFile" hidden></div>`;
        $('#sn', box).addEventListener('change', ev => host('settings', { v: { sessionName: ev.target.value.trim() } }));
        $('#sn', box).addEventListener('input', ev => { clearTimeout(sc._sn); sc._sn = setTimeout(() => host('settings', { v: { sessionName: ev.target.value.trim() } }), 500); });
        $$('.chips button', box).forEach(b => b.onclick = () => { host('settings', { v: { sessionType: b.dataset.t === '__' ? 'غير شي' : b.dataset.t } }); });
        const st = $('#st', box); if (st) st.addEventListener('change', ev => host('settings', { v: { sessionType: ev.target.value.trim() || 'غير شي' } }));
        bindGroupPhoto(box);
      } else {
        box.innerHTML = s.sessionName ? `<div class="sess-name"><small>${esc(s.sessionType)}</small><b>${esc(s.sessionName)}</b></div>` : '';
      }
    }
    function renderHostSet() {
      const box = $('#hostSet', e); const s = S.settings;
      if (!isHost()) { box.innerHTML = `<div class="card mode-info"><b>${(s.mode === 'solo' ? 'فردي: كل واحد لحالو' : 'فرق: نتيجة الفريق = متوسط نتايج أعضاءه')}</b><small>${s.gameCount} ألعاب${s.family ? ' · وضع العيلة' : ''}</small></div>`; return; }
      box.innerHTML = `<div class="card"><div class="fld"><span>طريقة اللعب</span><div class="seg" id="md"><button data-v="solo">فردي</button><button data-v="team">فرق</button></div></div>
        ${s.mode !== 'solo' ? `<div class="fld"><span>عدد الفرق</span><div class="seg" id="tc">${[2, 3, 4].map(n => `<button data-v="${n}">${n}</button>`).join('')}</div></div>` : ''}
        <div class="fld"><span>كم لعبة؟</span><div class="seg" id="gc">${[3, 6, 9, 12].map(n => `<button data-v="${n}">${n}</button>`).join('')}</div></div>
        <div class="fld"><span>كشف النتيجة</span><div class="seg" id="rv"><button data-v="now">بعد كل لعبة</button><button data-v="end">بالآخر</button></div></div>
        <label class="tgl"><input type="checkbox" id="fm" ${s.family ? 'checked' : ''}><span></span><div><b>وضع العيلة</b><small>كل واحد بيختار جيله (كاسيت أو موبايل)، وبالآخر منعرف مين أشطر</small></div></label></div>`;
      const mark = (id, v) => $$(`#${id} button`, box).forEach(b => b.classList.toggle('on', b.dataset.v === String(v)));
      mark('md', s.mode); mark('tc', s.teamCount); mark('gc', s.gameCount); mark('rv', s.reveal);
      $$('#md button', box).forEach(b => b.onclick = () => host('settings', { v: { mode: b.dataset.v } }));
      $$('#tc button', box).forEach(b => b.onclick = () => host('settings', { v: { teamCount: +b.dataset.v } }));
      $$('#gc button', box).forEach(b => b.onclick = () => host('settings', { v: { gameCount: +b.dataset.v } }));
      $$('#rv button', box).forEach(b => b.onclick = () => host('settings', { v: { reveal: b.dataset.v } }));
      $('#fm', box).onchange = ev => host('settings', { v: { family: ev.target.checked } });
    }
    function chip(id) {
      const p = S.players[id]; const lead = isTeam() && S.teams.some(t => t.leader === id);
      return `<button class="pchip ${p.connected ? '' : 'off'} ${id === pid ? 'me' : ''}" data-id="${esc(id)}" style="--pc:var(--c${p.color})">${avatar(id, 34)}<span>${esc(nameOf(id))}${id === pid ? ' <em>(إنت)</em>' : ''}</span>${S.hostId === id ? `<i class="ic">${I.crown}</i>` : ''}${lead ? '<i class="lead">قائد</i>' : ''}${S.settings.family && p.gen ? `<i class="gen">${p.gen === 'old' ? '📼' : '📱'}</i>` : ''}</button>`;
    }
    function renderPlayers() {
      const box = $('#players', e); const ids = S.order.filter(id => S.players[id] && !S.players[id].kicked);
      if (!isTeam()) box.innerHTML = `<div class="card"><div class="ph"><b>اللي بالقعدة (${ids.length})</b><button class="link" id="editMe">عدّل معلوماتي</button></div><div class="pgrid">${ids.map(chip).join('')}</div></div>`;
      else {
        box.innerHTML = `<div class="ph out"><b>الفرق (${ids.length} لاعب)</b><span>${isHost() ? '<button class="link" id="shuf">فرز عشوائي</button> · ' : ''}<button class="link" id="editMe">عدّل معلوماتي</button></span></div><div class="teams">${S.teams.map(t => `
          <div class="team" style="--pc:var(--tc${t.i})"><div class="team-h"><b class="tn" data-i="${t.i}">${esc(t.name)}</b>${(isHost() || t.leader === pid) ? '<button class="link sm tn-ed" data-i="' + t.i + '">✎ الاسم</button>' : ''}</div>
          <div class="pgrid">${t.members.map(chip).join('') || '<small class="empty">لسّا ما في حدا</small>'}</div>
          ${me().team !== t.i ? `<button class="btn ghost sm jn" data-i="${t.i}">انضم لهون</button>` : '<small class="here">إنت بهالفريق</small>'}</div>`).join('')}</div>`;
        $$('.jn', box).forEach(b => b.onclick = () => send({ t: 'profile', team: +b.dataset.i }));
        $$('.tn-ed', box).forEach(b => b.onclick = () => { const i = +b.dataset.i; sheet(`<h3>اسم الفريق</h3><input id="tnIn" maxlength="24" value="${esc(teamName(i))}"><button class="btn" id="tnOk">حفظ</button>`, (s, close) => { $('#tnOk', s).onclick = () => { send({ t: 'teamName', i, name: $('#tnIn', s).value.trim() }); close(); }; }); });
        const sh = $('#shuf', box); if (sh) sh.onclick = () => host('shuffleTeams');
      }
      $('#editMe', box).onclick = () => { wantProfile = true; screen = null; render(); };
      $$('.pchip', box).forEach(b => b.onclick = () => playerMenu(b.dataset.id));
    }
    function renderStart() {
      const box = $('#startBox', e); const ids = S.order.filter(id => S.players[id] && !S.players[id].kicked);
      if (!isHost()) { box.innerHTML = `<div class="wait"><span class="dots"><i></i><i></i><i></i></span> ناطرين ${esc(gend(S.hostId, 'الريس', 'الريسة'))} ${esc(nameOf(S.hostId))} يبلّش</div>`; return; }
      let why = '';
      if (ids.length < 2) why = 'لازم يكون في لاعبين اتنين عالأقل';
      else if (!S.settings.sessionName.trim()) why = 'اكتب اسم القعدة فوق';
      else if (isTeam() && S.teams.filter(t => t.members.length).length < 2) why = 'لازم فريقين فيهن ناس عالأقل';
      box.innerHTML = `<button class="btn big" id="start" ${why ? 'disabled' : ''}>يلا نبلّش</button>${why ? `<p class="why">${why}</p>` : ''}`;
      const b = $('#start', box); if (b) b.onclick = () => host('start');
    }
    sc.update = () => { renderSess(); renderHostSet(); renderPlayers(); renderStart(); };
    sc.mounted = () => {
      sc.update();
      $('#shareLink', e).onclick = async () => { const url = location.origin + '/?r=' + S.code; try { if (navigator.share) await navigator.share({ title: 'قعدة زمان', text: 'فوت عالقعدة: ' + S.code, url }); else { await navigator.clipboard.writeText(url); toast('انسخ الرابط'); } } catch (x) {} };
    };
    return sc;
  }
  function bindGroupPhoto(box) {
    const set = src => cropper(src, 4 / 3, 720, out => host('groupPhoto', { photo: out }));
    const a = $('#gpSel', box), b = $('#gpGal', box), f = $('#gpFile', box);
    if (a) a.onclick = () => selfie(true, set);
    if (b) b.onclick = () => f.click();
    if (f) f.onchange = ev => { const x = ev.target.files[0]; if (!x) return; const r = new FileReader(); r.onload = () => set(r.result); r.readAsDataURL(x); ev.target.value = ''; };
  }
  function playerMenu(id) {
    if (!isHost()) { if (id === pid) { wantProfile = true; screen = null; render(); } return; }
    const p = S.players[id]; if (!p) return;
    sheet(`<div class="pm-head">${avatar(id, 54)}<div><b>${esc(nameOf(id))}</b><small>${p.connected ? 'متصل' : 'مو متصل'}</small></div></div>
      <label class="fld"><span>عدّل الاسم</span><div class="row2"><input id="rn" maxlength="20" value="${esc(p.name)}"><button class="btn sm" id="rnOk">حفظ</button></div></label>
      ${isTeam() ? `<button class="btn ghost" id="ld">${I.crown} ${gend(id, 'خليه قائد الفريق', 'خليها قائدة الفريق')}</button>` : ''}
      ${isTeam() ? `<div class="fld"><span>انقله لفريق${S.phase === 'lobby' ? '' : ' <em>(بيمشي من هلأ)</em>'}</span><div class="chips">${S.teams.map(t => `<button data-t="${t.i}" class="${p.team === t.i ? 'on' : ''}">${esc(t.name)}</button>`).join('')}</div></div>` : ''}
      ${id !== pid ? `<button class="btn ghost" id="mh">سلّم ${gend(id, 'الريسة لإله', 'الريسة لإلها')}</button><button class="btn red" id="kk">${gend(id, 'طلّعه من القعدة', 'طلّعها من القعدة')}</button>` : ''}`, (s, close) => {
      $('#rnOk', s).onclick = () => { host('rename', { id, name: $('#rn', s).value.trim() }); close(); };
      const ld = $('#ld', s); if (ld) ld.onclick = () => { host('leader', { id }); close(); };
      $$('.chips button', s).forEach(b => b.onclick = () => { host('moveTeam', { id, team: +b.dataset.t }); close(); toast(gend(id, 'انتقل', 'انتقلت') + ' لـ' + b.textContent); });
      const mh = $('#mh', s); if (mh) mh.onclick = () => { if (!p.connected) return toast('لازم يكون متصل'); host('makeHost', { id }); close(); };
      const kk = $('#kk', s); if (kk) kk.onclick = () => { close(); confirmBox(`أكيد بدك تطلّع ${esc(nameOf(id))}؟ ما رح يقدر يرجع.`, 'طلّع', () => host('kick', { id })); };
    });
  }

  // ═════════════ دولاب القنوات ═════════════
  function wheelScreen(key) {
    const c = S.cur; const played = S.rounds.length; const total = played + S.pool.length;
    const e = el(`<section class="wheel-sc"><p class="step">اللعبة ${played + 1} من ${total}</p><p class="spin-say">الدولاب عم يدور… 📺</p>
      <div class="dial-wrap"><div class="dial"><div class="dial-ring">${GAME_ORDER.map((g, i) => { const a = i * STEP; const live = S.pool.includes(g); return `<span class="dch ${live ? '' : 'dim'}" data-g="${g}" style="transform:rotate(${a}deg) translateY(-38cqw) rotate(${-a}deg)">${I[g]}</span>`; }).join('')}</div>
      <div class="knob"><i class="pointer"></i><b>قناة</b></div></div><div class="dial-tv"><div class="tv-screen small"><canvas class="static"></canvas><div class="tv-ch"></div></div></div></div>
      </section>`);
    const sc = { key, el: e };
    let rot = 0;
    const cv = $('.static', e), cx = cv.getContext('2d'); cv.width = 64; cv.height = 48; const img = cx.createImageData(64, 48);
    let raf, staticOn = true;
    const f = () => { if (staticOn) { for (let i = 0; i < img.data.length; i += 4) { const v = Math.random() * 190; img.data[i] = img.data[i + 1] = img.data[i + 2] = v; img.data[i + 3] = 255; } cx.putImageData(img, 0, 0); } raf = requestAnimationFrame(f); }; f();
    sc.spinTo = (g, done) => {
      sc.spinning = true;
      const idx = GAME_ORDER.indexOf(g); const target = 360 * 4 + idx * STEP;
      const knob = $('.knob', e); const t0 = performance.now(), dur = 3000;
      let lastTick = 0;
      const anim = t => {
        const k = Math.min(1, (t - t0) / dur); const ease = 1 - Math.pow(1 - k, 3); rot = target * ease;
        knob.style.transform = `rotate(${rot}deg)`;
        const cur = Math.round(rot / STEP); if (cur !== lastTick) { lastTick = cur; beep(900, 0.015, 'square', 0.02); }
        const under = ((Math.round(rot / STEP) % NG) + NG) % NG;
        $$('.dch', e).forEach((d, i) => d.classList.toggle('pass', i === under));
        if (k < 1) requestAnimationFrame(anim);
        else {
          $$('.dch', e).forEach(d => { d.classList.remove('pass'); d.classList.toggle('hit', d.dataset.g === g); });
          $('.spin-say', e).textContent = META[g].name + '!';
          staticOn = false; const ch = $('.tv-ch', e); ch.innerHTML = I[g]; ch.classList.add('on'); beep(660, 0.12, 'triangle', 0.05); buzz(30);
          setTimeout(() => { sc.spinning = false; done(); }, 1200);
        }
      };
      requestAnimationFrame(anim);
    };
    sc.destroy = () => cancelAnimationFrame(raf);
    return sc;
  }

  // ═════════════ تقديم اللعبة ═════════════
  function relayActive() { return null; }
  function factOf(g, seed) { const f = META[g].facts; return f[seed % f.length]; }
  function introScreen(key) {
    const c = S.cur, M = META[c.game];
    const e = el(`<section class="intro"><div class="tvcard"><div class="tv-head"><span>قناة ${c.n}</span><span dir="ltr">${M.year}</span></div><div class="g-ic">${I[c.game]}</div><h2>${M.name}</h2><p class="how">${M.how}</p><span class="tag">${M.mode} بيربح</span></div>
      <div id="who"></div><div id="bet"></div><div id="ictl"></div></section>`);
    const sc = { key, el: e };
    function upd() {
      const c = S.cur; if (!c) return;
      const rel = relayActive();
      const who = $('#who', e);
      if (rel) who.innerHTML = `<div class="card who"><b>مين بيلعب هالجولة؟</b><div class="pgrid">${rel.map(id => `<span class="pchip" style="--pc:var(--c${S.players[id].color})">${avatar(id, 30)}<span>${esc(nameOf(id))}</span><i class="tchip" style="background:var(--tc${S.players[id].team})"></i></span>`).join('')}</div></div>`;
      else who.innerHTML = '';
      // الرهان
      const bet = $('#bet', e); const b = c.bet;
      const myTeam = me().team; const leaderOf = isTeam() ? S.teams.find(t => t.leader === pid) : null;
      if (!isTeam()) bet.innerHTML = '';
      else if (b && b.status === 'wait') {
        const need = leaderOf && b.need.includes(leaderOf.i) && !b.ok[leaderOf.i];
        bet.innerHTML = `<div class="card bet"><b>🔥 ${esc(teamName(b.by))} ${'بدّن رهان: هالجولة دبل'}</b>${need ? `<div class="row2"><button class="btn ghost" id="bNo">لأ</button><button class="btn" id="bOk">قبلنا!</button></div>` : '<small>ناطرين باقي القادة يوافقوا…</small>'}</div>`;
        const ok = $('#bOk', bet), no = $('#bNo', bet); if (ok) ok.onclick = () => send({ t: 'betReply', ok: true }); if (no) no.onclick = () => send({ t: 'betReply', ok: false });
      } else if (b && b.status === 'ok') bet.innerHTML = `<div class="card bet on"><b>🔥 الرهان مقبول — هالجولة دبل!</b></div>`;
      else if (leaderOf) bet.innerHTML = `<div class="card bet"><div><b>إنت قائد ${esc(leaderOf.name)}</b><small>${b && b.status === 'no' ? 'انرفض الرهان. بدك تطلب مرة تانية؟' : 'بدك تطلب رهان؟ إذا وافقوا، هالجولة بتنحسب دبل.'}</small></div><button class="btn sm" id="bReq">رهان!</button></div>`;
      else if (b && b.status === 'no') bet.innerHTML = `<div class="card bet"><small>انرفض الرهان، الجولة عادية.</small></div>`;
      else bet.innerHTML = '';
      void myTeam;
      const rq = $('#bReq', bet); if (rq) rq.onclick = () => send({ t: 'bet' });
      // التحكم
      const ctl = $('#ictl', e); const live = S.order.filter(id => S.players[id] && !S.players[id].kicked && S.players[id].connected);
      const rdy = live.filter(id => S.players[id].ready).length, tot = live.length;
      const allReady = tot >= 2 && rdy === tot;
      const myReady = me().ready;
      ctl.innerHTML = `<button class="btn ${myReady ? 'ghost' : ''} wide" id="rdy">${myReady ? '✓ ' + myG('جاهز', 'جاهزة') : myG('أنا جاهز', 'أنا جاهزة')}</button><p class="rd">${allReady ? 'الكل جاهز… يلا! 🎬' : rdy + ' من ' + tot + ' جاهزين'}</p><div class="rdy-list">${live.map(id => { const q = S.players[id]; return `<span class="rdy-p ${q.ready ? 'on' : ''}">${avatar(id, 30)}<bdi>${esc(q.name)}</bdi><i>${q.ready ? '✓' : '⏳'}</i></span>`; }).join('')}</div><p class="ready-note">لما الكل يكبس «جاهز»، اللعبة بتبلّش لحالها</p>` +
        (isHost() && !allReady ? `<div class="row2"><button class="btn ghost" id="pass">تمرير</button><button class="btn" id="go">بلّش هلأ</button></div>` : '');
      $('#rdy', ctl).onclick = async () => { if (M.sensor) await askSensor(); send({ t: 'ready', v: !me().ready }); };
      const go = $('#go', ctl); if (go) go.onclick = () => { go.disabled = true; host('go'); };
      const ps = $('#pass', ctl); if (ps) ps.onclick = () => host('pass');
    }
    sc.mounted = upd; sc.update = upd;
    return sc;
  }
  async function askSensor() { try { if (window.DeviceOrientationEvent && typeof DeviceOrientationEvent.requestPermission === 'function') await DeviceOrientationEvent.requestPermission(); } catch (e) {} }

  // ═════════════ اللعب ═════════════
  function playScreen(key) {
    const c = S.cur, M = META[c.game], active = c.active.includes(pid);
    const isServerGame = !!IMPL[c.game].server;
    const e = el(`<section class="play"><div class="play-top"><span class="pg-name">${I[c.game]} ${M.name}</span>${c.bet && c.bet.status === 'ok' ? '<span class="dbl">دبل 🔥</span>' : ''}<span class="timer" id="tm"></span></div>
      <div class="tv-frame"><div class="stage" id="stage"></div><div class="count" id="count"></div><div class="doneov" id="doneov" hidden></div></div>
      <div id="spect"></div><div id="hctl"></div><p class="sig small">إعداد م. إياد حلوبي</p></section>`);
    const sc = { key, el: e }; let mod = null, finished = false, forced = false, tmIv;
    const X = {
      seed: c.seed, rng: mulberry32(c.seed), now, startAt: c.startAt, endAt: c.endAt, me: pid,
      finish(r) { if (finished) return; finished = true; send({ t: 'result', rk: r.rk, label: r.label, done: r.done, v: r.v, unit: r.unit }); showDone(r); },
      prog(p) { send({ t: 'prog', p }); },
      tap(n) { send({ t: 'tap', n }); }, hatPass(to) { send({ t: 'hatPass', to }); }, sit(i) { send({ t: 'sit', i }); }, mulberry: mulberry32,
      icon: n => I[n], avatar, esc, nameOf, player: id => S.players[id], teamOf: id => S.players[id] && S.players[id].team, teamName, isTeam: isTeam(), g: myG, active,
    };
    function showDone(r) {
      if (isServerGame) return;
      const ov = $('#doneov', e); ov.hidden = false;
      ov.innerHTML = `<div class="done-card"><b>${r.done ? myG('خلصت!', 'خلصتي!') : 'خلص الوقت'}</b><span>${esc(r.label)}</span><small>ناطرين الباقي…</small><div id="live"></div></div>`;
      liveBars();
    }
    function liveBars() {
      const box = $('#live', e) || $('#spect', e); if (!box) return;
      const ids = S.cur.active;
      box.innerHTML = `<div class="live">${ids.map(id => { const r = S.cur.results[id]; const p = r ? 1 : (S.cur.prog[id] || 0); return `<div class="lv"><span>${avatar(id, 24)} ${esc(nameOf(id))}</span><div><i style="width:${p * 100}%;background:var(--c${S.players[id].color})"></i></div><b>${r ? '✓' : ''}</b></div>`; }).join('')}</div>`;
    }
    function spect() {
      const box = $('#spect', e);
      if (active || isServerGame) { if (!finished) box.innerHTML = ''; return; }
      box.innerHTML = `<div class="card"><b>إنت عم تتفرّج هالجولة</b></div>`;
      const d = document.createElement('div'); d.id = 'live'; box.firstChild.appendChild(d); liveBars();
    }
    function hctl() {
      const box = $('#hctl', e);
      box.innerHTML = isHost() ? `<div class="hbar"><button class="link" id="rp">إعادة اللعبة</button><button class="btn sm red" id="st">سكّر اللعبة</button></div>` : '';
      const rp = $('#rp', box); if (rp) rp.onclick = () => confirmBox('نعيد اللعبة؟ النتيجة بتنلغى.', 'نعيد', () => host('replay'));
      const st = $('#st', box); if (st) st.onclick = () => confirmBox('نسكّر اللعبة هلأ؟ كل واحد بتنحسبله النتيجة اللي وصلها.', 'سكّر', () => host('stopRound'));
    }
    function tick() {
      const tm = $('#tm', e); const left = c.endAt - now();
      if (!c.endAt) { tm.textContent = now() < c.startAt ? '' : '∞'; tm.title = 'بلا وقت: لحد ما يبقى واحد'; }
      else tm.textContent = now() < c.startAt ? '' : Math.max(0, Math.ceil(left / 1000)) + ' ث';
      const cd = $('#count', e); const toStart = c.startAt - now();
      if (toStart > 0) { const n = Math.ceil(toStart / 1000); if (cd.dataset.n !== String(n)) { cd.dataset.n = n; cd.innerHTML = `<b>${n}</b>`; cd.hidden = false; beep(440, 0.08, 'square', 0.04); } }
      else if (!cd.hidden) { if (cd.dataset.n !== 'go') { cd.dataset.n = 'go'; cd.innerHTML = '<b class="go">يلا!</b>'; beep(880, 0.15, 'square', 0.05); buzz(40); setTimeout(() => { cd.hidden = true; }, 600); } }
      if (active && !isServerGame && !finished && !forced && now() > ((S.cur && S.cur.endAt) || c.endAt) + 300) { forced = true; if (mod && mod.forceEnd) mod.forceEnd(); else X.finish({ rk: -1e9, label: 'ما لحّق', done: false }); }
    }
    sc.mounted = () => {
      const stage = $('#stage', e);
      stage.classList.add('g-' + c.game);
      if (active || isServerGame) { mod = IMPL[c.game].mount(stage, X); if (mod.onState) mod.onState(S); }
      else stage.innerHTML = `<div class="spect-stage">${I[c.game]}<p>${esc(M.name)}</p></div>`;
      const mine = c.results[pid]; if (mine && !isServerGame) { finished = true; showDone(mine); }
      spect(); hctl(); tick(); tmIv = setInterval(tick, 200);
    };
    sc.update = () => { if (mod && mod.onState) mod.onState(S); if (finished || !active) liveBars(); spect(); hctl(); };
    sc.destroy = () => { clearInterval(tmIv); if (mod) mod.destroy(); };
    return sc;
  }

  // ═════════════ نتيجة اللعبة ═════════════
  const MEDAL = ['🥇', '🥈', '🥉'];
  function placeBadge(p) { return p < 3 ? `<i class="medal">${MEDAL[p]}</i>` : `<i class="pl">${p + 1}</i>`; }
  function resultLabel(id, o) { const r = S.cur.results[id]; if (r && r.burned) return gend(id, 'احترق بالطاقية 🔥', 'احترقت بالطاقية 🔥'); return o.label; }
  function resultScreen(key) {
    const c = S.cur, M = META[c.game], o = c.outcome;
    const hidden = S.settings.reveal === 'end';
    const last = S.pool.length === 0;
    let body = '';
    if (hidden) {
      const mine = o.players.find(p => p.id === pid);
      body = `<div class="card hidden-res"><div class="big-ic">🤫</div><b>انحفظت النتيجة للآخر</b>${mine ? `<small>نتيجتك: ${esc(resultLabel(pid, mine))}</small>` : ''}</div>`;
    } else if (!isTeam()) {
      body = `<div class="card rank">${o.players.map(p => `<div class="rk ${p.id === pid ? 'me' : ''}">${placeBadge(p.place)}${avatar(p.id, 36)}<span class="nm">${esc(nameOf(p.id))}<small>${esc(resultLabel(p.id, p))}</small></span><b class="pts">+${p.pts}</b></div>`).join('')}</div>`;
    } else {
      body = `<div class="card rank">${o.teams.map(t => `<div class="rk team-rk" style="--pc:var(--tc${t.team})">${placeBadge(t.place)}<span class="tdot"></span><span class="nm">${esc(teamName(t.team))}${t.avg != null ? `<em class="avg">المتوسط: <bdi>${t.avg}</bdi> ${esc(t.unit || '')}</em>` : ''}<small>${o.players.filter(p => S.players[p.id] && S.players[p.id].team === t.team).map(p => esc(nameOf(p.id)) + ': ' + esc(resultLabel(p.id, p))).join(' · ')}</small></span><b class="pts">+${t.pts}</b></div>`).join('')}</div>`;
    }
    const e = el(`<section class="result"><p class="step">${I[c.game]} نتيجة «${M.name}»${o.mult > 1 ? ' · دبل 🔥' : ''}</p>${body}
      <div class="fact"><div class="fact-h">كانت زمان…</div><p>${esc(factOf(c.game, c.seed))}</p></div>
      <div id="rctl"></div></section>`);
    const sc = { key, el: e };
    function ctl() {
      const box = $('#rctl', e);
      if (isHost()) box.innerHTML = `<button class="btn big" id="nx">${last ? 'النتيجة النهائية' : 'اللعبة الجاية'}</button><div class="row2"><button class="link" id="rp">إعادة هاللعبة</button>${last ? '' : '<button class="link" id="fn">خلصنا هون</button>'}</div><p class="rem">${last ? 'هي كانت آخر لعبة' : 'باقي ' + S.pool.length + ' ألعاب'}</p>`;
      else box.innerHTML = `<div class="wait"><span class="dots"><i></i><i></i><i></i></span> ناطرين ${esc(gend(S.hostId, 'الريس', 'الريسة'))}</div>`;
      const nx = $('#nx', box); if (nx) nx.onclick = () => host(last ? 'finish' : 'next');
      const rp = $('#rp', box); if (rp) rp.onclick = () => confirmBox('نعيد اللعبة؟ النتيجة بتنلغى.', 'نعيد', () => host('replay'));
      const fn = $('#fn', box); if (fn) fn.onclick = () => confirmBox('بدك تخلّصوا هون وتشوفوا النتيجة؟', 'إي خلصنا', () => host('finish'));
    }
    sc.mounted = () => { ctl(); if (!hidden) { const mine = o.players.find(p => p.id === pid); const myTeamWin = isTeam() && o.teams[0] && me().team === o.teams[0].team; if ((mine && mine.place === 0 && !isTeam()) || myTeamWin) confetti(70); } };
    sc.update = ctl;
    return sc;
  }

  // ═════════════ الألقاب ═════════════
  const ENC_M = ['حظ أوفر بالسهرة الجاية', 'الكاسيت لسّا ما خلص', 'شدّ حيلك، الحارة ناطرتك', 'بتردّها الجاية أكيد', 'ما حدا بيربح كل مرة'];
  const ENC_F = ['حظ أوفر بالسهرة الجاية', 'الكاسيت لسّا ما خلص', 'شدّي حيلك، الحارة ناطرتك', 'بتردّيها الجاية أكيد', 'ما حدا بيربح كل مرة'];
  function titleOf(place, id, k = 0) {
    if (isTeam()) return ['زعماء الحارة', 'ولاد الحارة', 'جيران الرضا'][place] || 'الحارة ناطرتكن';
    const f = gend(id, 0, 1);
    if (place === 0) return f ? 'زعيمة الحارة' : 'زعيم الحارة';
    if (place === 1) return f ? 'بنت الحارة' : 'ابن الحارة';
    if (place === 2) return f ? 'جارة الرضا' : 'جار الرضا';
    return (f ? ENC_F : ENC_M)[k % 5];
  }
  function finalRows() { // صفوف مرتّبة
    const F = S.final; if (!F) return [];
    return F.ranking.map((r, k) => ({ ...r, title: r.team != null ? titleOf(r.place) : titleOf(r.place, r.id, k), k }));
  }

  // ═════════════ الكشف ═════════════
  function revealScreen(key) {
    const e = el(`<section class="reveal"><div id="rv"></div></section>`);
    const sc = { key, el: e, anim: -1 };
    let timers = [];
    const later = (fn, ms) => timers.push(setTimeout(fn, ms));
    sc.destroy = () => { timers.forEach(clearTimeout); if (sc.stopRaf) sc.stopRaf(); };
    function who(r) { return r.team != null ? { name: teamName(r.team), av: `<div class="rv-team" style="--pc:var(--tc${r.team})">${esc(teamName(r.team))}</div>` } : { name: nameOf(r.id), av: avatar(r.id, 150) }; }
    function upd() {
      const box = $('#rv', e); const rows = finalRows();
      if (!S.revealMode) {
        sc.anim = -1;
        box.innerHTML = `<div class="tvcard"><div class="g-ic">${I.tv}</div><h2>خلصت الألعاب!</h2><p class="how">مين رح ${isTeam() ? 'يكونوا زعماء' : 'يكون زعيم'} الحارة؟</p></div>` +
          (isHost() ? `<button class="btn big" id="party">حفلة كشف 🎉</button><button class="btn ghost wide" id="all">كشف دفعة وحدة</button>` : `<div class="wait"><span class="dots"><i></i><i></i><i></i></span> ${esc(gend(S.hostId, 'الريس', 'الريسة'))} عم يجهّز الكشف</div>`);
        const p = $('#party', box), a = $('#all', box); if (p) p.onclick = () => host('revealMode', { v: 'party' }); if (a) a.onclick = () => host('revealMode', { v: 'all' });
        return;
      }
      // الكشف حسب المراكز: من الأخير للأول، كل مركز لحاله على شاشة التلفزيون
      const places = [...new Set(rows.map(r => r.place))].sort((x, y) => y - x);
      const step = Math.min(S.revealStep, places.length);
      if (sc.anim === step && box.firstChild) { ctl(places, step); return; }
      sc.anim = step;
      timers.forEach(clearTimeout); timers = []; if (sc.stopRaf) sc.stopRaf();
      const place = step > 0 ? places[step - 1] : null;
      const group = place == null ? [] : rows.filter(r => r.place === place);
      const done = rows.filter(r => step > 0 && places.slice(0, step - 1).includes(r.place)).sort((x, y) => x.place - y.place);
      const top = place === 0, podium = place != null && place <= 2;
      box.innerHTML = `<p class="step">حفلة الكشف · ${step ? (top ? 'المركز الأول' : 'المركز ' + (place + 1)) : 'جاهزين؟'}</p>
        <div class="rv-tv ${top ? 'gold' : podium ? 'silver' : ''}"><div class="rv-screen"><canvas class="static"></canvas><div class="rv-in"></div></div><div class="rv-knobs"><i></i><i></i></div></div>
        <div id="rvctl"></div>
        ${done.length ? `<div class="card rank rv-done">${done.map(rowHtml).join('')}</div>` : ''}`;
      const cv = $('.static', box), cx = cv.getContext('2d'); cv.width = 90; cv.height = 68; const img = cx.createImageData(90, 68);
      let stOn = true, raf;
      const f = () => { if (stOn) { for (let i = 0; i < img.data.length; i += 4) { const v = Math.random() * 200; img.data[i] = img.data[i + 1] = img.data[i + 2] = v; img.data[i + 3] = 255; } cx.putImageData(img, 0, 0); } raf = requestAnimationFrame(f); }; f();
      sc.stopRaf = () => cancelAnimationFrame(raf); const stopStatic = () => { stOn = false; cancelAnimationFrame(raf); cv.style.opacity = 0; };
      const inn = $('.rv-in', box);
      if (!step) { inn.innerHTML = `<div class="rv-q">؟</div>`; ctl(places, step); return; }
      // تشويش التلفزيون، وبعدين بتصفى الصورة. الأول بيطوّل شوي وبيختم بفتيش
      const wait = top ? 2600 : podium ? 1900 : 1300;
      inn.innerHTML = `<span class="rv-chan">CH ${place + 1}</span><div class="rv-lbl">${top ? 'المركز الأول…' : 'المركز ' + (place + 1)}</div>`;
      noise(wait / 1000, 0.035);
      sc.busy = true; ctl(places, step);
      later(() => {
        stopStatic(); sc.busy = false;
        const g0 = group[0];
        inn.innerHTML = `<div class="rv-card">
            <div class="rv-pl">${place < 3 ? ['🥇', '🥈', '🥉'][place] : '#' + (place + 1)}</div>
            <div class="rv-avs">${group.map(r => who(r).av).join('')}</div>
            <h2>${group.map(r => esc(who(r).name)).join(' و ')}</h2>
            <small>${esc(g0.title)}${group.length > 1 ? ' · تعادل!' : ''}</small>
            <div class="rv-pts"><b data-to="${g0.pts}">0</b> نقطة</div></div>`;
        const pb = $('.rv-pts b', inn); const to = g0.pts, t1 = performance.now();
        const cnt = () => { const p = Math.min(1, (performance.now() - t1) / 900); pb.textContent = Math.round(to * p); if (p < 1) requestAnimationFrame(cnt); }; cnt();
        if (top) { fireworks(); buzz([120, 60, 120, 60, 200]); } else beep(620, 0.15, 'triangle', 0.05);
        ctl(places, step);
      }, wait);
    }
    function ctl(places, step) {
      const box = $('#rvctl', e); if (!box) return;
      const nextPlace = places[step];
      if (!isHost()) { box.innerHTML = sc.busy ? '' : `<div class="wait">${step >= places.length ? 'ناطرين النتيجة الكاملة…' : 'ناطرين الكشف الجاي…'}</div>`; return; }
      if (sc.busy) { box.innerHTML = ''; return; }
      const txtB = step >= places.length ? 'النتيجة الكاملة' : nextPlace === 0 ? 'كشف المركز الأول' : (step === 0 ? 'ابدأ: المركز ' + (nextPlace + 1) : 'الجاي: المركز ' + (nextPlace + 1));
      box.innerHTML = `<button class="btn big" id="nx">${txtB}</button>`;
      $('#nx', box).onclick = (ev) => { ev.target.disabled = true; host('revealNext'); };
    }
    sc.mounted = upd; sc.update = upd;
    return sc;
  }
  function rowHtml(r) {
    if (r.team != null) { const t = S.teams[r.team]; return `<div class="rk team-rk" style="--pc:var(--tc${r.team})">${placeBadge(r.place)}<span class="tdot"></span><span class="nm">${esc(t ? t.name : '')}<small>${esc(r.title)}</small></span><b class="pts">${r.pts}</b></div>`; }
    return `<div class="rk ${r.id === pid ? 'me' : ''}">${placeBadge(r.place)}${avatar(r.id, 38)}<span class="nm">${esc(nameOf(r.id))}<small>${esc(r.title)}</small></span><b class="pts">${r.pts}</b></div>`;
  }
  function drumrollScreen(done) {
    const e = el(`<div class="drum"><b>3</b></div>`); const sc = { key: 'drum', el: e, drum: true };
    sc.mounted = () => { let n = 3; const b = $('b', e); beep(440, 0.1); const iv = setInterval(() => { n--; if (n > 0) { b.textContent = n; b.style.animation = 'none'; void b.offsetWidth; b.style.animation = ''; beep(440, 0.1); } else { clearInterval(iv); beep(880, 0.3, 'triangle', 0.06); sc.drum = false; done(); } }, 900); };
    return sc;
  }

  // ═════════════ النتيجة النهائية ═════════════
  function myRank() {
    const rows = finalRows();
    if (!isTeam()) return rows.find(r => r.id === pid);
    return rows.find(r => r.team === me().team);
  }
  function bestGame(id) {
    let best = null;
    for (const rd of S.rounds) { const p = rd.outcome.players.find(x => x.id === id); if (!p) continue; const rank = p.place / Math.max(1, rd.outcome.players.length); if (!best || rank < best.rank) best = { rank, game: rd.game }; }
    return best ? META[best.game].name : '';
  }
  function finalScreen(key) {
    const rows = finalRows(); const F = S.final; const top = rows[0];
    const fam = F.family;
    const e = el(`<section class="final">
      ${winnerHtml(rows)}
      <div class="card rank">${rows.map(rowHtml).join('')}</div>
      ${fam ? `<div class="card fam"><b>جيل الكاسيت ضد جيل الموبايل</b><div class="fam-bar"><i style="width:${fam.pctOld}%"></i></div><div class="fam-l"><span>📼 الكاسيت <bdi dir="ltr">${fam.pctOld}%</bdi></span><span>الموبايل <bdi dir="ltr">${100 - fam.pctOld}%</bdi> 📱</span></div><small>${fam.pctOld === 50 ? 'تعادل! الجيلين قدّ بعض' : (fam.pctOld > 50 ? 'جيل الكاسيت لسّا ماسك الحارة' : 'جيل الموبايل سحب البساط')}</small></div>` : ''}
      <details class="card rounds"><summary>كل الألعاب بالتفصيل</summary>${S.rounds.map(rd => `<div class="rd"><b>${I[rd.game]} ${META[rd.game].name}${rd.mult > 1 ? ' · دبل' : ''}</b><small>${isTeam() ? rd.outcome.teams.map(t => (t.place + 1) + '. ' + esc(teamName(t.team))).join(' · ') : rd.outcome.players.slice(0, 5).map(p => (p.place + 1) + '. ' + esc(nameOf(p.id)) + ' (' + esc(resultLabel2(rd, p)) + ')').join(' · ')}</small></div>`).join('') || '<small>ما انلعبت ألعاب</small>'}</details>
      <div class="card sessc"><div class="gp" data-group data-empty="">${groupPhoto ? `<img src="${groupPhoto}">` : ''}</div><div><small>${esc(S.settings.sessionType)}</small><b>${esc(S.settings.sessionName)}</b></div><button class="link" id="edS" ${isHost() ? '' : 'hidden'}>تعديل</button></div>
      <div class="card story"><b>صورتك للستوري</b><div class="seg three" id="fmt"><button data-v="tv">تلفزيون</button><button data-v="tv2">تلفزيونين</button><button data-v="pip">صورة بصورة</button></div><div class="seg" id="thm"><button data-v="light">فاتح</button><button data-v="dark">داكن</button></div>
        <div class="story-prev"><canvas id="storyCv" width="1080" height="1920"></canvas></div>
        <div class="row2"><button class="btn" id="dl">${I.dl} حمّل الصورة</button><button class="btn ghost" id="sh">${I.share} شارك</button></div></div>
      <a class="btn ghost wide" href="${IG}" target="_blank" rel="noopener" id="ig">شارك مع صحابك</a>
      <div class="card install" id="inst"><b>خلّي اللعبة عموبايلك</b><small id="instTxt">بتفتح متل التطبيق، بلا ما تدوّر عالرابط.</small><button class="btn sm" id="instBtn">نزّلها</button></div>
      <div id="hostEnd"></div>
      <p class="sig"><bdi dir="ltr">@eyad.hloubi</bdi> · صار بدها قعدة.</p></section>`);
    const sc = { key, el: e };
    let fmt = 'tv', thm = document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light';
    function paintStory() {
      $$('#fmt button', e).forEach(b => b.classList.toggle('on', b.dataset.v === fmt));
      $$('#thm button', e).forEach(b => b.classList.toggle('on', b.dataset.v === thm));
      drawStory($('#storyCv', e), fmt, thm);
    }
    sc.mounted = () => {
      if (!sc._conf) { sc._conf = true; const r = myRank(); if (r && r.place === 0) confetti(160); }
      paintStory();
      $$('#fmt button', e).forEach(b => b.onclick = () => { fmt = b.dataset.v; paintStory(); });
      $$('#thm button', e).forEach(b => b.onclick = () => { thm = b.dataset.v; paintStory(); });
      $('#dl', e).onclick = () => { const a = document.createElement('a'); a.download = 'قعدة-زمان-' + (nameOf(pid) || 'أنا') + '.png'; a.href = $('#storyCv', e).toDataURL('image/png'); a.click(); };
      $('#sh', e).onclick = () => $('#storyCv', e).toBlob(async b => { try { const f = new File([b], 'qa3da-zaman.png', { type: 'image/png' }); if (navigator.canShare && navigator.canShare({ files: [f] })) await navigator.share({ files: [f], title: 'قعدة زمان' }); else $('#dl', e).click(); } catch (x) {} });
      $('#edS', e).onclick = editSession;
      hostEnd();
      setupInstall(e);
    };
    function hostEnd() {
      const box = $('#hostEnd', e); $('#edS', e).hidden = !isHost();
      if (!isHost()) { box.innerHTML = ''; return; }
      if (!$('#again', box)) { box.innerHTML = '<button class="btn big" id="again">قعدة جديدة بنفس الناس</button>'; $('#again', box).onclick = () => confirmBox('نبلّش قعدة جديدة بنفس الناس؟', 'يلا', () => host('again')); }
    }
    sc.update = () => { const s = $('.sessc', e); if (s) { $('b', s).textContent = S.settings.sessionName; $('small', s).textContent = S.settings.sessionType; } hostEnd(); paintStory(); };
    sc.refresh = paintStory;
    return sc;
  }
  function winnerHtml(rows) {
    const tops = rows.filter(r => r.place === 0); if (!tops.length) return '';
    if (tops.length > 1) return `<div class="winner"><div class="w-tie">${tops.map(t => t.team != null ? `<span class="w-team sm" style="--pc:var(--tc${t.team})">${esc(teamName(t.team))}</span>` : avatar(t.id, 76)).join('')}</div><small>تعادل! ${tops[0].team != null ? 'زعماء الحارة سوا' : 'الزعامة مقسومة'}</small><h2>${tops.map(t => esc(t.team != null ? '' : nameOf(t.id))).filter(Boolean).join(' و ')}</h2></div>`;
    const t = tops[0];
    return `<div class="winner">${t.team != null ? `<div class="w-team" style="--pc:var(--tc${t.team})">${esc(teamName(t.team))}</div>` : avatar(t.id, 120)}<small>${esc(t.title)}</small>${t.team != null ? '' : `<h2>${esc(nameOf(t.id))}</h2>`}</div>`;
  }
  function resultLabel2(rd, p) { const r = rd.results && rd.results[p.id]; if (r && r.burned) return gend(p.id, 'احترق', 'احترقت'); return p.label; }
  function editSession() {
    const s = S.settings;
    sheet(`<h3>تعديل القعدة</h3><label class="fld"><span>اسم القعدة</span><input id="esN" maxlength="30" value="${esc(s.sessionName)}"></label><label class="fld"><span>نوع القعدة</span><input id="esT" maxlength="20" value="${esc(s.sessionType)}"></label>
      <div class="gp-row"><div class="gp" data-group data-empty="${esc(I.cam)}">${groupPhoto ? `<img src="${groupPhoto}">` : I.cam}</div><div><b>الصورة الجماعية</b><div class="row2 sm"><button class="btn ghost sm" id="gpSel">${I.cam} سيلفي</button><button class="btn ghost sm" id="gpGal">${I.img} من الصور</button></div></div></div><input type="file" accept="image/*" id="gpFile" hidden>
      <button class="btn" id="esOk">حفظ</button>`, (el2, close) => { bindGroupPhoto(el2); $('#esOk', el2).onclick = () => { const n = $('#esN', el2).value.trim(); if (!n) return toast('اسم القعدة إجباري'); host('settings', { v: { sessionName: n, sessionType: $('#esT', el2).value.trim() || 'شلة' } }); close(); }; });
  }

  // ───────── التثبيت كتطبيق ─────────
  let deferredInstall = null;
  window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); deferredInstall = e; });
  function setupInstall(root) {
    const box = $('#inst', root); if (!box) return;
    const standalone = matchMedia('(display-mode: standalone)').matches || navigator.standalone;
    if (standalone) { box.remove(); return; }
    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
    $('#instBtn', box).onclick = async () => {
      if (deferredInstall) { deferredInstall.prompt(); try { await deferredInstall.userChoice; } catch (x) {} deferredInstall = null; return; }
      sheet(ios ? `<h3>نزّلها عالآيفون</h3><ol class="steps"><li>افتح الرابط من <b>Safari</b></li><li>اكبس زر المشاركة <b>⬆︎</b> تحت</li><li>اختار <b>«إضافة إلى الشاشة الرئيسية»</b></li><li>اكبس <b>إضافة</b></li></ol>` : `<h3>نزّلها عالموبايل</h3><ol class="steps"><li>افتح قائمة المتصفح <b>⋮</b></li><li>اختار <b>«تثبيت التطبيق»</b> أو «إضافة للشاشة الرئيسية»</li></ol>`);
    };
  }

  // ═════════════ صورة الستوري ═════════════
  const imgCache = {};
  function loadImg(src) { if (!src) return Promise.resolve(null); if (imgCache[src]) return imgCache[src]; return (imgCache[src] = new Promise(res => { const i = new Image(); i.onload = () => res(i); i.onerror = () => res(null); i.src = src; })); }
  // أيقونات الألعاب كصور للستوري
  const iconCache = {};
  function iconImg(g) {
    if (iconCache[g]) return iconCache[g];
    const css = n => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
    let svg = I[g] || I.tv;
    svg = svg.replace(/var\(--(c\d|paper)\)/g, (m, v) => css('--' + v) || '#F2C14E').replace(/currentColor/g, '#0A0E19').replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" ');
    return (iconCache[g] = loadImg('data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg)));
  }
  function myWins() {
    let w = 0;
    for (const rd of S.rounds) {
      if (isTeam()) { const t = rd.outcome.teams.find(x => x.place === 0); if (t && t.team === me().team) w++; }
      else { const p = rd.outcome.players.find(x => x.id === pid); if (p && p.place === 0) w++; }
    }
    return w;
  }
  function bestGameId(id) {
    let best = null;
    for (const rd of S.rounds) { const p = rd.outcome.players.find(x => x.id === id); if (!p) continue; const rank = p.place / Math.max(1, rd.outcome.players.length); if (!best || rank < best.rank) best = { rank, game: rd.game }; }
    return best ? best.game : null;
  }
  let storyJob = 0;
  async function drawStory(cv, fmt, thm) {
    const job = ++storyJob; const TAU = Math.PI * 2;
    try { await Promise.all([document.fonts.load('600 60px Marhey'), document.fonts.load('700 40px "IBM Plex Sans Arabic"'), document.fonts.load('400 40px "IBM Plex Sans Arabic"')]); } catch (e) {}
    const bg = bestGameId(pid);
    const played = [...new Set(S.rounds.map(r => r.game))];
    const [ph, gp, bgi, ...icons] = await Promise.all([loadImg(photos[pid]), loadImg(groupPhoto), bg ? iconImg(bg) : null, ...played.slice(0, 6).map(iconImg)]);
    if (job !== storyJob) return;
    const x = cv.getContext('2d'); const W = 1080, H = 1920;
    const css = n => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
    const dark = thm === 'dark';
    const C = { bg: dark ? '#141A2B' : '#F1E6D0', card: dark ? '#222A44' : '#FFF8EA', ink: '#0A0E19', text: dark ? '#F3EAD8' : '#1B2238', sub: dark ? 'rgba(243,234,216,.68)' : 'rgba(27,34,56,.62)', line: dark ? 'rgba(243,234,216,.18)' : 'rgba(27,34,56,.14)', o: css('--c0'), b: css('--c4'), a: css('--c3'), r: css('--c2'), d: css('--c1'), p: css('--c5') };
    const myCol = css('--c' + me().color) || C.o;
    const r = myRank() || { place: 0, pts: 0, title: '' };
    const n = S.final ? S.final.ranking.length : 1;
    const nP = S.final ? S.final.ranking.length : 1;
    const name = nameOf(pid), title = r.title || '';
    const teamTxt = isTeam() ? teamName(me().team) : '';
    const wins = myWins();
    const bestName = bg ? META[bg].name : '—';
    const sess = `${S.settings.sessionType} · ${S.settings.sessionName}`;
    const gen = S.settings.family && me().gen ? (me().gen === 'old' ? 'جيل الكاسيت' : 'جيل الموبايل') : '';
    const d = new Date(); const stamp = `⁦'${String(d.getFullYear()).slice(2)} ${String(d.getMonth() + 1).padStart(2, '0')} ${String(d.getDate()).padStart(2, '0')}⁩`;
    x.setTransform(1, 0, 0, 1, 0, 0); x.clearRect(0, 0, W, H); x.direction = 'rtl'; x.textBaseline = 'middle';
    const T = (s, px, py, size, col, w = 700, font = '"IBM Plex Sans Arabic"', al = 'center', maxW = 900) => { x.font = `${w} ${size}px ${font}`; x.fillStyle = col; x.textAlign = al; let sz = size; while (x.measureText(s).width > maxW && sz > 18) { sz -= 2; x.font = `${w} ${sz}px ${font}`; } x.fillText(s, px, py); };
    const box = (bx, by, bw, bh, rad, fill, lw = 6, sh = 14) => { if (sh) { x.fillStyle = C.ink; rrp(x, bx + sh, by + sh, bw, bh, rad); x.fill(); } x.fillStyle = fill; rrp(x, bx, by, bw, bh, rad); x.fill(); if (lw) { x.lineWidth = lw; x.strokeStyle = C.ink; x.stroke(); } };
    const photoIn = (bx, by, bw, bh, rad, path) => { x.save(); if (path) path(); else rrp(x, bx, by, bw, bh, rad); x.clip(); if (ph) { const s = Math.max(bw / ph.width, bh / ph.height); x.drawImage(ph, bx + (bw - ph.width * s) / 2, by + (bh - ph.height * s) / 2, ph.width * s, ph.height * s); } else { x.fillStyle = myCol; x.fillRect(bx, by, bw, bh); x.globalAlpha = 0.18; for (let i = -bh; i < bw; i += 60) { x.fillStyle = '#fff'; x.beginPath(); x.moveTo(bx + i, by + bh); x.lineTo(bx + i + 30, by + bh); x.lineTo(bx + i + 30 + bh, by); x.lineTo(bx + i + bh, by); x.fill(); } x.globalAlpha = 1; T(initials(name), bx + bw / 2, by + bh / 2 + 14, Math.min(bw, bh) * 0.46, '#fff', 600, 'Marhey'); } x.restore(); };
    const sticker = (img, cx, cy, size, rot, ring) => { if (!img) return; x.save(); x.translate(cx, cy); x.rotate(rot); x.fillStyle = C.ink; x.beginPath(); x.arc(8, 10, size / 2 + 14, 0, TAU); x.fill(); x.fillStyle = ring || '#FFFDF6'; x.beginPath(); x.arc(0, 0, size / 2 + 14, 0, TAU); x.fill(); x.lineWidth = 5; x.strokeStyle = C.ink; x.stroke(); x.drawImage(img, -size / 2, -size / 2, size, size); x.restore(); };
    const handle = (y, col) => T('⁦@eyad.hloubi⁩ · صار بدها قعدة.', W / 2, y, 34, col || C.sub, 600);
    const placeTxt = r.place < 3 ? ['الأول', 'التاني', 'التالت'][r.place] : (r.place + 1);

    // ═══ عناصر مشتركة: التلفزيون، الصورة الجماعية، لوحة الاسم ═══
    const gpIn = (bx, by, bw, bh, rad) => { x.save(); rrp(x, bx, by, bw, bh, rad); x.clip(); if (gp) { const s = Math.max(bw / gp.width, bh / gp.height); x.drawImage(gp, bx + (bw - gp.width * s) / 2, by + (bh - gp.height * s) / 2, gp.width * s, gp.height * s); } else { x.fillStyle = '#232B45'; x.fillRect(bx, by, bw, bh); T(S.settings.sessionName || 'الشلة', bx + bw / 2, by + bh / 2, 54, '#F3EAD8', 600, 'Marhey', 'center', bw - 60); } x.restore(); };
    const scan = (bx, by, bw, bh, rad) => { x.save(); rrp(x, bx, by, bw, bh, rad); x.clip(); x.fillStyle = 'rgba(0,0,0,.07)'; for (let yy = by; yy < by + bh; yy += 7) x.fillRect(bx, yy, bw, 3); const gl = x.createRadialGradient(bx + bw * 0.3, by + bh * 0.2, 10, bx + bw * 0.3, by + bh * 0.2, bw * 0.9); gl.addColorStop(0, 'rgba(255,255,255,.14)'); gl.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = gl; x.fillRect(bx, by, bw, bh); x.restore(); };
    const tv = (tx, ty, tw, th, body, screen, ch, ant = true) => {
      const kn = Math.min(120, tw * 0.13), pad = Math.max(30, tw * 0.045);
      if (ant) { const cx = tx + (tw - kn) / 2, top = ty - Math.min(100, th * 0.14); x.lineCap = 'round'; x.lineWidth = 12; x.strokeStyle = C.ink; x.beginPath(); x.moveTo(cx, ty + 4); x.lineTo(cx - tw * 0.14, top); x.moveTo(cx, ty + 4); x.lineTo(cx + tw * 0.14, top); x.stroke(); for (const s of [-1, 1]) { x.beginPath(); x.arc(cx + s * tw * 0.14, top, 17, 0, TAU); x.fillStyle = C.b; x.fill(); x.lineWidth = 8; x.stroke(); } }
      box(tx, ty, tw, th, Math.min(80, th * 0.11), body, 11, 22);
      const sx = tx + pad, sy = ty + pad, sw = tw - pad * 2 - kn, sh = th - pad * 2;
      screen(sx, sy, sw, sh, Math.min(54, sh * 0.08));
      scan(sx, sy, sw, sh, Math.min(54, sh * 0.08));
      x.lineWidth = 9; x.strokeStyle = C.ink; rrp(x, sx, sy, sw, sh, Math.min(54, sh * 0.08)); x.stroke();
      for (let i = 0; i < 2; i++) { const kx = tx + tw - pad - kn / 2 + 6, ky = ty + th * (0.36 + i * 0.26); x.beginPath(); x.arc(kx, ky, kn * 0.3, 0, TAU); x.fillStyle = C.b; x.fill(); x.lineWidth = 7; x.strokeStyle = C.ink; x.stroke(); x.beginPath(); x.moveTo(kx, ky); x.lineTo(kx + kn * 0.18, ky - kn * 0.18); x.lineWidth = 6; x.stroke(); }
      if (ch) { x.font = '700 40px ui-monospace, monospace'; const cw = x.measureText(ch).width + 34; x.fillStyle = 'rgba(10,14,25,.72)'; rrp(x, sx + sw - cw - 26, sy + 24, cw, 58, 14); x.fill(); T(ch, sx + sw - cw / 2 - 26, sy + 54, 40, C.b, 700, 'ui-monospace, monospace', 'center'); }
      return { sx, sy, sw, sh };
    };
    const chTxt = '⁦CH ' + (r.place + 1) + '⁩';
    const statLine = (r.place + 1) + ' من ' + n + ' · ' + r.pts + ' نقطة' + (wins ? ' · ربح ' + wins : '');
    const extra = [teamTxt, gen, bestName !== '—' ? 'أحلى لعبة: ' + bestName : ''].filter(Boolean).join(' · ');
    const plate = (px, py, pw, ph) => {
      box(px, py, pw, ph, 38, C.card, 8, 14);
      T(name || 'لاعب بلا اسم', px + pw / 2, py + ph * 0.27, 100, C.text, 600, 'Marhey', 'center', pw - 80);
      x.font = '700 46px "IBM Plex Sans Arabic"'; const tw = Math.min(pw - 100, x.measureText(title).width + 70);
      box(px + pw / 2 - tw / 2, py + ph * 0.5, tw, 72, 36, C.b, 5, 0); T(title, px + pw / 2, py + ph * 0.5 + 37, 44, '#1B2238', 700, undefined, 'center', tw - 30);
      T(statLine, px + pw / 2, py + ph * 0.84, 36, C.sub, 700, undefined, 'center', pw - 60);
    };
    const photoFrame = (fx, fy, fw, fh, rot, label) => {
      x.save(); x.translate(fx + fw / 2, fy + fh / 2); x.rotate(rot);
      x.fillStyle = C.ink; x.fillRect(-fw / 2 + 14, -fh / 2 + 16, fw, fh);
      x.fillStyle = '#FFFDF6'; x.fillRect(-fw / 2, -fh / 2, fw, fh); x.lineWidth = 6; x.strokeStyle = C.ink; x.strokeRect(-fw / 2, -fh / 2, fw, fh);
      gpIn(-fw / 2 + 26, -fh / 2 + 26, fw - 52, fh - 110, 6);
      T(label, 0, fh / 2 - 44, 46, '#1B2238', 600, 'Marhey', 'center', fw - 60);
      x.fillStyle = 'rgba(242,193,78,.85)'; x.save(); x.translate(0, -fh / 2 - 4); x.rotate(-0.04); x.fillRect(-90, -24, 180, 48); x.restore();
      x.restore();
    };
    // الخلفية
    x.fillStyle = C.bg; x.fillRect(0, 0, W, H);
    x.fillStyle = dark ? 'rgba(243,234,216,.06)' : 'rgba(27,34,56,.07)'; for (let yy = 30; yy < H; yy += 46) for (let xx = (yy / 46) % 2 ? 23 : 0; xx < W; xx += 46) { x.beginPath(); x.arc(xx, yy, 3.5, 0, TAU); x.fill(); }
    const gLabel = 'الشلة · ' + (S.settings.sessionName || '');
    if (fmt === 'tv') {
      T('قعدة زمان', W / 2, 105, 96, C.text, 600, 'Marhey');
      T(sess, W / 2, 182, 32, C.sub, 700, undefined, 'center', 900);
      tv(70, 360, 940, 650, C.o, (sx, sy, sw, sh, rd) => photoIn(sx, sy, sw, sh, rd), chTxt);
      plate(110, 1050, 860, 320);
      if (gp) photoFrame(260, 1420, 560, 390, -0.03, gLabel.length > 22 ? 'الشلة' : gLabel);
      else if (extra) T(extra, W / 2, 1480, 38, C.text, 700, undefined, 'center', 900);
      handle(1878);
    } else if (fmt === 'tv2') {
      T('قعدة زمان', W / 2, 100, 90, C.text, 600, 'Marhey');
      tv(110, 290, 860, 640, C.o, (sx, sy, sw, sh, rd) => photoIn(sx, sy, sw, sh, rd), chTxt);
      // شريط الاسم بين التلفزيونين
      box(60, 975, 960, 190, 30, C.r, 8, 12);
      T(name || 'لاعب بلا اسم', W / 2, 1040, 92, '#FFFDF6', 600, 'Marhey', 'center', 880);
      T(title + ' · ' + statLine, W / 2, 1122, 34, '#FFFDF6', 700, undefined, 'center', 900);
      tv(170, 1280, 740, 540, C.a, (sx, sy, sw, sh, rd) => gpIn(sx, sy, sw, sh, rd), '\u2066CH 2\u2069', false);
      T(gp ? 'الشلة · ' + sess : sess, W / 2, 1238, 30, C.sub, 700, undefined, 'center', 900);
      handle(1878);
    } else {
      // صورة بصورة: صورتك على كامل الشاشة، والشلة بزاوية الشاشة
      T('قعدة زمان', W / 2, 105, 96, C.text, 600, 'Marhey');
      T(sess, W / 2, 182, 32, C.sub, 700, undefined, 'center', 900);
      const sc2 = tv(50, 350, 980, 880, C.o, (sx, sy, sw, sh, rd) => photoIn(sx, sy, sw, sh, rd), chTxt);
      if (gp) {
        const pw2 = sc2.sw * 0.5, ph2 = pw2 * 0.75, px2 = sc2.sx + 26, py2 = sc2.sy + sc2.sh - ph2 - 26;
        x.fillStyle = C.ink; rrp(x, px2 + 10, py2 + 12, pw2, ph2, 18); x.fill();
        x.fillStyle = '#FFFDF6'; rrp(x, px2 - 8, py2 - 8, pw2 + 16, ph2 + 16, 22); x.fill();
        gpIn(px2, py2, pw2, ph2, 16); x.lineWidth = 5; x.strokeStyle = C.ink; rrp(x, px2 - 8, py2 - 8, pw2 + 16, ph2 + 16, 22); x.stroke();
        x.font = '700 32px "IBM Plex Sans Arabic"'; const lw = x.measureText('الشلة').width + 36; x.fillStyle = C.b; rrp(x, px2 + pw2 - lw - 12, py2 + 12, lw, 50, 25); x.fill(); x.lineWidth = 4; x.stroke(); T('الشلة', px2 + pw2 - lw / 2 - 12, py2 + 38, 32, '#1B2238', 700);
      }
      plate(90, 1290, 900, 340);
      if (extra) T(extra, W / 2, 1740, 36, C.text, 700, undefined, 'center', 920);
      handle(1878);
    }
  }
  function rrp(x, X0, Y0, w, h, r) { x.beginPath(); x.moveTo(X0 + r, Y0); x.arcTo(X0 + w, Y0, X0 + w, Y0 + h, r); x.arcTo(X0 + w, Y0 + h, X0, Y0 + h, r); x.arcTo(X0, Y0 + h, X0, Y0, r); x.arcTo(X0, Y0, X0 + w, Y0, r); x.closePath(); }

  // ═════════════ السيلفي والقص ═════════════
  function selfie(group, cb) {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) return toast('الكاميرا مو متاحة هون');
    let stream = null, facing = group ? 'environment' : 'user';
    const close = sheet(`<h3>${group ? 'صورة جماعية' : 'سيلفي'}</h3><div class="cam"><video playsinline autoplay muted></video><div class="cam-count" hidden></div></div><div class="row2"><button class="btn ghost" id="flip">قلب الكاميرا</button><button class="btn" id="snap">${group ? 'صوّر بعد 5 ث' : 'صوّر'}</button></div>`, (s) => {
      const v = $('video', s);
      const start = async () => { try { if (stream) stream.getTracks().forEach(t => t.stop()); stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: facing, width: { ideal: 1280 } }, audio: false }); v.srcObject = stream; v.style.transform = facing === 'user' ? 'scaleX(-1)' : ''; } catch (e) { toast('ما قدرنا نفتح الكاميرا'); } };
      start();
      $('#flip', s).onclick = () => { facing = facing === 'user' ? 'environment' : 'user'; start(); };
      $('#snap', s).onclick = () => {
        const shoot = () => { const c = document.createElement('canvas'); c.width = v.videoWidth; c.height = v.videoHeight; const x = c.getContext('2d'); if (facing === 'user') { x.translate(c.width, 0); x.scale(-1, 1); } x.drawImage(v, 0, 0); const src = c.toDataURL('image/jpeg', 0.9); stop(); closeIt(); cb(src); };
        if (!group) return shoot();
        const cc = $('.cam-count', s); cc.hidden = false; let n = 5; cc.textContent = n; const iv = setInterval(() => { n--; if (n > 0) { cc.textContent = n; beep(500, 0.06); } else { clearInterval(iv); beep(900, 0.12); shoot(); } }, 1000);
      };
      const obs = new MutationObserver(() => { if (!document.body.contains(s)) { stop(); obs.disconnect(); } }); obs.observe(document.body, { childList: true });
    });
    function stop() { if (stream) stream.getTracks().forEach(t => t.stop()); stream = null; }
    function closeIt() { close(); }
  }
  function cropper(src, ratio, outW, cb) {
    const img = new Image(); img.onload = () => {
      const close = sheet(`<h3>قصّ الصورة</h3><div class="crop" style="aspect-ratio:${ratio}"><canvas></canvas></div><input type="range" id="zm" min="1" max="4" step="0.01" value="1"><p class="hint">اسحب لتحرّك الصورة، وكبّر من الشريط أو بإصبعين</p><button class="btn" id="cOk">تمام</button>`, (s) => {
        const box = $('.crop', s), cv = $('canvas', s), x = cv.getContext('2d');
        let W, H, base, z = 1, ox = 0, oy = 0;
        const fit = () => { const r = box.getBoundingClientRect(); W = cv.width = r.width * 2; H = cv.height = r.height * 2; base = Math.max(W / img.width, H / img.height); clampO(); draw(); };
        const clampO = () => { const s2 = base * z, iw = img.width * s2, ih = img.height * s2; ox = Math.min(0, Math.max(W - iw, ox)); oy = Math.min(0, Math.max(H - ih, oy)); };
        const draw = () => { const s2 = base * z; x.fillStyle = '#ddd'; x.fillRect(0, 0, W, H); x.drawImage(img, ox, oy, img.width * s2, img.height * s2); };
        setTimeout(() => { fit(); const s2 = base; ox = (W - img.width * s2) / 2; oy = (H - img.height * s2) / 2; clampO(); draw(); }, 30);
        const pts = new Map(); let lastD = 0;
        cv.addEventListener('pointerdown', e => { cv.setPointerCapture(e.pointerId); pts.set(e.pointerId, { x: e.clientX, y: e.clientY }); });
        cv.addEventListener('pointermove', e => {
          if (!pts.has(e.pointerId)) return; const p = pts.get(e.pointerId); const dx = (e.clientX - p.x) * 2, dy = (e.clientY - p.y) * 2; pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
          if (pts.size === 1) { ox += dx; oy += dy; }
          else { const a = [...pts.values()]; const dd = Math.hypot(a[0].x - a[1].x, a[0].y - a[1].y); if (lastD) zoomTo(z * dd / lastD); lastD = dd; }
          clampO(); draw();
        });
        const end = e => { pts.delete(e.pointerId); lastD = 0; }; cv.addEventListener('pointerup', end); cv.addEventListener('pointercancel', end);
        function zoomTo(nz) { nz = Math.max(1, Math.min(4, nz)); const cxp = W / 2, cyp = H / 2; ox = cxp - (cxp - ox) * nz / z; oy = cyp - (cyp - oy) * nz / z; z = nz; $('#zm', s).value = z; clampO(); draw(); }
        $('#zm', s).oninput = ev => zoomTo(+ev.target.value);
        $('#cOk', s).onclick = () => { const out = document.createElement('canvas'); out.width = outW; out.height = Math.round(outW / ratio); const o = out.getContext('2d'); o.drawImage(cv, 0, 0, W, H, 0, 0, out.width, out.height); close(); cb(out.toDataURL('image/jpeg', 0.82)); };
      });
    }; img.src = src;
  }

  // ═════════════ قائمة اللاعبين (للريس، بأي وقت) ═════════════
  function playersMenu() {
    if (!isHost()) return;
    const ids = S.order.filter(id => S.players[id] && !S.players[id].kicked);
    const row = id => { const p = S.players[id]; return `<button class="pl-row" data-id="${esc(id)}" style="--pc:var(--c${p.color})">${avatar(id, 38)}<span><b>${esc(nameOf(id))}${id === pid ? ' <em>(إنت)</em>' : ''}</b><small>${p.connected ? 'متصل' : 'مفصول'}${isTeam() && p.team != null ? ' · ' + esc(teamName(p.team)) : ''}</small></span><i>›</i></button>`; };
    const body = isTeam() ? S.teams.map(t => `<h4 class="pl-team" style="--pc:var(--tc${t.i})">${esc(t.name)} (${t.members.length})</h4>${t.members.map(row).join('') || '<p class="hint">ما في حدا</p>'}`).join('') : ids.map(row).join('');
    sheet(`<h3>اللاعبين (${ids.length})</h3><p class="hint">اكبس على أي حدا لتطلّعه${isTeam() ? '، أو تغيّرله فريقه' : ''}، أو تعدّل اسمه. بأي وقت، حتى بنص اللعبة.</p><div class="pl-list">${body}</div>`, (s, close) => {
      $$('.pl-row', s).forEach(b => b.onclick = () => { close(); playerMenu(b.dataset.id); });
    });
  }

  // ═════════════ قائمة الإنهاء (للريس) ═════════════
  function endMenu() {
    if (!isHost()) return;
    const canFinish = ['intro', 'play', 'result'].includes(S.phase);
    const ids = S.order.filter(id => S.players[id] && !S.players[id].kicked);
    sheet(`<h3>أدوات ${myG('الريس', 'الريسة')}</h3>
      ${S.phase === 'play' ? `<button class="btn big red" id="emClose">سكّر اللعبة هلأ</button><p class="hint">كل واحد بتنحسبله النتيجة اللي وصلها</p>` : ''}
      ${canFinish ? `<button class="btn big" id="emFin">خلّصنا، ورجينا النتيجة</button><p class="hint">${S.rounds.length ? 'بتنحسب الألعاب اللي خلصت (' + S.rounds.length + ')' : 'لسّا ما خلصت ولا لعبة'}</p>` : ''}
      <button class="btn ghost big" id="emNew">قعدة جديدة بنفس الناس</button><p class="hint">بيتصفّر كل شي وبترجعوا للانتظار</p>
      <h4>اللاعبين (${ids.length})</h4><p class="hint">اكبس على حدا لتعدّل اسمه أو تطلّعه، بأي وقت</p>
      <div class="pgrid">${ids.map(id => `<button class="pchip ${S.players[id].connected ? '' : 'off'}" data-id="${esc(id)}" style="--pc:var(--c${S.players[id].color})">${avatar(id, 30)}<span>${esc(nameOf(id))}${S.players[id].connected ? '' : ' <em>(مفصول)</em>'}</span></button>`).join('')}</div>`, (s, close) => {
      const cl = $('#emClose', s); if (cl) cl.onclick = () => { close(); host('stopRound'); };
      const f = $('#emFin', s); if (f) f.onclick = () => { close(); host('finish'); };
      $('#emNew', s).onclick = () => { close(); confirmBox('أكيد؟ رح تنمسح نتيجة هالقعدة.', 'قعدة جديدة', () => host('again')); };
      $$('.pchip', s).forEach(b => b.onclick = () => { close(); playerMenu(b.dataset.id); });
    });
  }

  // ═════════════ كيف منلعب؟ ═════════════
  function help() {
    sheet(`<h3>كيف منلعب؟</h3>
      <ol class="hsteps">
        <li><i>${I.tv}</i><div><b>الريس بيفتح القعدة</b><small>بتطلع QR وكود من 5 أحرف، والكل بيفوت من موبايله.</small></div></li>
        <li><i>${I.crown}</i><div><b>بيختار طريقة اللعب</b><small>فردي أو فرق، وكم لعبة بدكن.</small></div></li>
        <li><i>${I.rotary}</i><div><b>دولاب القنوات بيدور لحاله</b><small>وبيختار اللعبة، والكل بيبلّش سوا بنفس اللحظة بعد العدّ.</small></div></li>
        <li><i>${I.cassette}</i><div><b>بعد كل لعبة</b><small>ترتيب ونقاط، وبطاقة «كانت زمان».</small></div></li>
        <li><i>${I.hat}</i><div><b>بالآخر</b><small>زعيم الحارة، ونتيجة كاملة، وصورة للستوري.</small></div></li>
      </ol>
      <h4>الألعاب</h4>
      <ul class="hgames">${GAME_ORDER.map(g => `<li><i>${I[g]}</i><div><b>${META[g].name}<em>${META[g].mode} بيربح</em></b><small>${META[g].how}</small></div></li>`).join('')}</ul>
      <h4>النقاط</h4>
      <ul class="hl"><li>بالفردي: الأول 5 نقاط، التاني 3، التالت 2، وبعدهن كل واحد بالنص الأول من اللاعبين بياخد نقطة، والنص التاني ما بياخد شي.</li><li>اللي بيطلعوا نفس النتيجة بالضبط، بياخدوا نفس المركز ونفس النقاط.</li><li>بالفرق: نتيجة الفريق هي المتوسط الحسابي لنتايج أعضاءه، والفريق الأول بياخد 3، التاني 2، التالت 1.</li></ul>
      <h4>وضع العيلة</h4>
      <div class="fam-help">لما تكون القعدة فيها كبار وصغار، الريس بيشغّل «وضع العيلة». كل لاعب بيختار جيله: <b>📼 جيل الكاسيت</b> (الكبار) أو <b>📱 جيل الموبايل</b> (الصغار). اللعب نفسه ما بيتغيّر، بس بالنتيجة النهائية بتطلع مقارنة: أي جيل كان أشطر بألعاب زمان؟</div>
      <h4>أدوات الريس</h4>
      <ul class="hl"><li>لما الكل يكبس «جاهز» اللعبة بتبلّش لحالها، أو الريس بيكبس «بلّش هلأ».</li><li>زر «إنهاء» فوق: «سكّر اللعبة هلأ»، «خلّصنا» بيطلّع النتيجة، «قعدة جديدة» بيصفّر كل شي، وقائمة اللاعبين لتطلّع أو تعدّل أي حدا بأي وقت.</li><li>يمرّر لعبة ما حبّوها، ويعيد لعبة ما فهموها (النتيجة بتنلغى).</li><li>يوقّف اللعبة، أو يخلّص القعدة بأي وقت.</li><li>يعدّل الأسماء، يطلّع حدا، أو يسلّم الريسة.</li><li>يختار حفلة كشف أو كشف دفعة وحدة.</li></ul>
      <h4>الفرق والرهان</h4>
      <ul class="hl"><li>لكل فريق قائد، وبيقدر يطلب رهان: إذا وافقت الفرق التانية، الجولة بتنحسب دبل.</li><li>قائد الفريق بيقدر يغيّر اسم فريقه من شاشة الانتظار.</li></ul>
      <h4>شغلات مهمة</h4>
      <ul class="hl"><li>«ظبّط الأنتين» بيشتغل بميلان الموبايل، وعالآيفون اكبس «جاهز» واسمح بالحساس. وإذا ما في حساس، بتسحب بإصبعك.</li><li>إذا الريس طلع، اللعبة ما بتوقف، وبعد 45 ثانية حدا تاني بيقدر يصير الريس.</li><li>ما حدا بيشوف أرقام غيره خلال اللعب، بس الترتيب بالآخر.</li></ul>
      <p class="ref">مرجع اللعبة: ألعاب الحارة الشعبية وأجهزة زمان (الكاسيت، الأنتين، التلفون أبو دولاب، موبايلات الأزرار).<br>إعداد م. إياد حلوبي</p>`);
  }

  // أداة فحص داخلية (للقراءة فقط) بتشتغل بس مع ?debug=1
  if (params.get('debug') === '1') window.__zaman = () => S;

  // ───────── البداية ─────────
  document.addEventListener('DOMContentLoaded', () => {
    $('#helpBtn').innerHTML = I.help; $('#helpBtn').onclick = help;
    $('#endBtn').innerHTML = I.stop + '<span>إنهاء</span>'; $('#endBtn').onclick = endMenu;
    $('#plBtn').innerHTML = I.people; $('#plBtn').onclick = playersMenu;
    $('#themeBtn').onclick = () => { setTheme(document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark'); if (screen && screen.refresh) screen.refresh(); };
    setTheme(document.documentElement.dataset.theme);
    $('#homeLink').onclick = () => { if (code && S && S.phase !== 'final') return confirmBox('بدك تطلع من القعدة؟', 'اطلع', () => { leaveRoom(); screen = null; render(); }); leaveRoom(); screen = null; render(); };
    connect(); render();
    if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js').catch(() => {});
    // نحافظ عالشاشة صاحية خلال اللعب
    let lock = null; const wake = async () => { try { if ('wakeLock' in navigator && !lock) { lock = await navigator.wakeLock.request('screen'); lock.addEventListener('release', () => { lock = null; }); } } catch (e) {} };
    document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') { wake(); if (ws && ws.readyState > 1) connect(); } }); wake();
  });
})();
