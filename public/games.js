/* قعدة زمان — الألعاب التسعة
   كل لعبة: mount(el, X) → { destroy(), onState?(s), forceEnd?() }
   X: { seed, rng, now(), startAt, endAt, finish({rk,label,done}), prog(p), me, g(m,f), ... } */
(function () {
  'use strict';
  const TAU = Math.PI * 2;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const wrap = a => { while (a > Math.PI) a -= TAU; while (a < -Math.PI) a += TAU; return a; };
  function css(n) { return getComputedStyle(document.documentElement).getPropertyValue(n).trim(); }
  function pal() {
    return { ink: css('--ink'), line: css('--line'), text: css('--text'), paper: css('--paper'), card: css('--card'), muted: css('--muted'),
      orange: css('--c0'), denim: css('--c1'), rose: css('--c2'), aqua: css('--c3'), butter: css('--c4'), plum: css('--c5'), avocado: css('--c6'), brick: css('--c7'),
      screen: css('--screen'), dark: document.documentElement.dataset.theme === 'dark' };
  }
  const FONT = '"IBM Plex Sans Arabic", system-ui, sans-serif';
  const TFONT = '"Marhey", "IBM Plex Sans Arabic", sans-serif';
  function buzz(ms) { try { navigator.vibrate && navigator.vibrate(ms); } catch (e) {} }

  // صوت بسيط بلا ملفات
  let AC = null;
  function beep(f = 660, d = 0.06, type = 'square', vol = 0.04) {
    try {
      AC = AC || new (window.AudioContext || window.webkitAudioContext)();
      const o = AC.createOscillator(), g = AC.createGain();
      o.type = type; o.frequency.value = f; g.gain.value = vol;
      o.connect(g); g.connect(AC.destination);
      const t = AC.currentTime; g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
      o.start(t); o.stop(t + d + 0.02);
    } catch (e) {}
  }

  function Stage(el, world) { // world: {w,h} إحداثيات ثابتة لعدالة كل الأجهزة
    const cv = document.createElement('canvas');
    cv.className = 'gcv'; el.appendChild(cv);
    const ctx = cv.getContext('2d');
    const S = { cv, ctx, W: 0, H: 0, k: 1, ox: 0, oy: 0 };
    function fit() {
      const r = el.getBoundingClientRect(); const dpr = Math.min(2, window.devicePixelRatio || 1);
      S.W = Math.max(10, r.width); S.H = Math.max(10, r.height);
      cv.width = S.W * dpr; cv.height = S.H * dpr; cv.style.width = S.W + 'px'; cv.style.height = S.H + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0); S.dpr = dpr;
      if (world) { S.k = Math.min(S.W / world.w, S.H / world.h); S.ox = (S.W - world.w * S.k) / 2; S.oy = (S.H - world.h * S.k) / 2; }
    }
    fit();
    const ro = new ResizeObserver(fit); ro.observe(el);
    S.toWorld = (e) => { const r = cv.getBoundingClientRect(); const x = e.clientX - r.left, y = e.clientY - r.top; return world ? { x: (x - S.ox) / S.k, y: (y - S.oy) / S.k } : { x, y }; };
    S.local = (e) => { const r = cv.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; };
    S.worldT = () => { ctx.setTransform(S.dpr * S.k, 0, 0, S.dpr * S.k, S.dpr * S.ox, S.dpr * S.oy); };
    S.screenT = () => { ctx.setTransform(S.dpr, 0, 0, S.dpr, 0, 0); };
    S.destroy = () => ro.disconnect();
    return S;
  }
  function loop(fn) { let id, last = performance.now(), on = true; const f = t => { if (!on) return; const dt = Math.min(0.05, (t - last) / 1000); last = t; fn(dt, t); id = requestAnimationFrame(f); }; id = requestAnimationFrame(f); return () => { on = false; cancelAnimationFrame(id); }; }
  function rr(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }
  function txt(ctx, s, x, y, size, color, weight = 700, font = FONT, align = 'center') { ctx.font = `${weight} ${size}px ${font}`; ctx.fillStyle = color; ctx.textAlign = align; ctx.textBaseline = 'middle'; ctx.direction = 'rtl'; ctx.fillText(s, x, y); }
  function secs(ms) { return (ms / 1000).toFixed(1) + ' ث'; }
  function tRk(ms) { return 1e6 - Math.round(ms / 100); }

  // مساعد مشترك: البداية والنهاية والتقدم
  function Runner(X, opts = {}) {
    const R = { done: false, lastProg: -1, lastSent: 0 };
    R.started = () => X.now() >= X.startAt;
    R.elapsed = () => Math.max(0, X.now() - X.startAt);
    R.left = () => X.endAt - X.now();
    R.prog = (p) => { const t = performance.now(); if (Math.abs(p - R.lastProg) > 0.02 && t - R.lastSent > 350) { R.lastProg = p; R.lastSent = t; X.prog(p); } };
    R.finish = (rk, label, done) => { if (R.done) return; R.done = true; X.finish({ rk, label, done }); };
    return R;
  }

  // ═══════════════ 1) لفّ الكاسيت بالقلم ═══════════════
  const cassette = {
    mount(el, X) {
      const S = Stage(el), ctx = S.ctx, R = Runner(X);
      const dir = X.rng() < 0.5 ? -1 : 1;
      const turns = 6 + Math.floor(X.rng() * 5);
      const need = turns * TAU;
      let acc = 0, rot = 0, lastA = null, wrongT = 0, doneAt = 0, P = pal();
      const label = ['مزيكا السهرة', 'شريط الحارة', 'أغاني الرحلة', 'كاسيت العيد'][Math.floor(X.rng() * 4)];
      function geo() {
        const w = Math.min(S.W * 0.9, 440), h = w * 0.64, cx = S.W / 2, cy = S.H * 0.52;
        return { w, h, cx, cy, lx: cx - w * 0.24, rx: cx + w * 0.24, ry: cy - h * 0.06, r: h * 0.16 };
      }
      function down(e) { if (!R.started() || R.done) return; S.cv.setPointerCapture(e.pointerId); const G = geo(), p = S.local(e); lastA = Math.atan2(p.y - G.ry, p.x - G.lx); }
      function move(e) {
        if (lastA == null || R.done || !R.started()) return;
        const G = geo(), p = S.local(e);
        if (Math.hypot(p.x - G.lx, p.y - G.ry) < G.r * 0.35) return;
        const a = Math.atan2(p.y - G.ry, p.x - G.lx);
        let d = clamp(wrap(a - lastA), -1.1, 1.1); lastA = a;
        const s = d * dir;
        if (s < 0) wrongT = performance.now();
        acc = clamp(acc + s, 0, need); rot += d;
        const pr = acc / need; R.prog(pr);
        if (pr >= 1 && !R.done) { doneAt = R.elapsed(); beep(880, 0.12, 'triangle', 0.06); buzz(40); R.finish(tRk(doneAt), secs(doneAt), true); }
      }
      function up() { lastA = null; }
      S.cv.addEventListener('pointerdown', down); S.cv.addEventListener('pointermove', move);
      S.cv.addEventListener('pointerup', up); S.cv.addEventListener('pointercancel', up);
      const stop = loop(() => {
        P = pal(); const G = geo(); ctx.clearRect(0, 0, S.W, S.H);
        const pr = acc / need;
        // التعليمة
        const wrong = performance.now() - wrongT < 400;
        txt(ctx, R.done ? '♪ وصلت للأغنية!' : (dir < 0 ? 'لفّ القلم عكس عقارب الساعة' : 'لفّ القلم مع عقارب الساعة'), S.W / 2, G.cy - G.h * 0.5 - 30, 16, wrong ? P.rose : '#F3EAD8');
        // جسم الكاسيت
        ctx.save(); ctx.translate(G.cx - G.w / 2, G.cy - G.h / 2);
        ctx.lineWidth = 3; ctx.strokeStyle = '#0A0E19';
        rr(ctx, 0, 0, G.w, G.h, 14); ctx.fillStyle = '#2A2F45'; ctx.fill(); ctx.stroke();
        rr(ctx, G.w * 0.06, G.h * 0.08, G.w * 0.88, G.h * 0.62, 10); ctx.fillStyle = P.butter; ctx.fill(); ctx.stroke();
        ctx.fillStyle = P.orange; ctx.fillRect(G.w * 0.06 + 1.5, G.h * 0.1, G.w * 0.88 - 3, G.h * 0.09);
        txt(ctx, label, G.w / 2, G.h * 0.27, Math.max(13, G.w * 0.045), '#1B2238', 600, TFONT);
        // نافذة الشريط
        rr(ctx, G.w * 0.2, G.h * 0.34, G.w * 0.6, G.h * 0.3, G.h * 0.15); ctx.fillStyle = '#1B2238'; ctx.fill(); ctx.stroke();
        // شبه منحرف أسفل
        ctx.beginPath(); ctx.moveTo(G.w * 0.18, G.h); ctx.lineTo(G.w * 0.26, G.h * 0.78); ctx.lineTo(G.w * 0.74, G.h * 0.78); ctx.lineTo(G.w * 0.82, G.h); ctx.fillStyle = '#3A4060'; ctx.fill(); ctx.stroke();
        ctx.restore();
        // البكرات والشريط
        const rMin = G.r * 0.62, rMax = G.r * 1.25;
        const tl = dir < 0 ? rMin + (rMax - rMin) * pr : rMax - (rMax - rMin) * pr;
        const tr = rMin + rMax - tl;
        for (const [x, tape] of [[G.lx, tl], [G.rx, tr]]) {
          ctx.save(); ctx.beginPath(); ctx.rect(G.cx - G.w * 0.3, G.cy - G.h * 0.5 + G.h * 0.34 + 2, G.w * 0.6, G.h * 0.3 - 4); ctx.clip();
          ctx.beginPath(); ctx.arc(x, G.ry, tape, 0, TAU); ctx.fillStyle = '#5A3A2A'; ctx.fill(); ctx.restore();
          ctx.beginPath(); ctx.arc(x, G.ry, G.r * 0.55, 0, TAU); ctx.fillStyle = '#F3EAD8'; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = '#0A0E19'; ctx.stroke();
          ctx.save(); ctx.translate(x, G.ry); ctx.rotate(rot * (x === G.lx ? 1 : 1.25));
          for (let i = 0; i < 6; i++) { ctx.rotate(TAU / 6); ctx.fillStyle = '#0A0E19'; ctx.fillRect(G.r * 0.22, -3, G.r * 0.2, 6); }
          ctx.restore();
        }
        // العدّاد
        rr(ctx, G.cx - 34, G.cy + G.h * 0.08, 68, 26, 6); ctx.fillStyle = '#0A0E19'; ctx.fill();
        txt(ctx, String(Math.floor(pr * 999)).padStart(3, '0'), G.cx, G.cy + G.h * 0.08 + 14, 17, P.butter, 700, 'ui-monospace, monospace');
        // القلم كذراع
        ctx.save(); ctx.translate(G.lx, G.ry); ctx.rotate(rot - Math.PI * 0.75);
        const L = G.r * 2.6;
        ctx.lineWidth = 3; ctx.strokeStyle = '#0A0E19';
        rr(ctx, -5, -7, L, 14, 4); ctx.fillStyle = P.butter; ctx.fill(); ctx.stroke();
        ctx.fillStyle = P.rose; rr(ctx, L - 14, -7, 14, 14, 4); ctx.fill(); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(-5, -7); ctx.lineTo(-16, 0); ctx.lineTo(-5, 7); ctx.fillStyle = '#E9C9A0'; ctx.fill(); ctx.stroke();
        ctx.restore();
        ctx.beginPath(); ctx.arc(G.lx, G.ry, 6, 0, TAU); ctx.fillStyle = '#0A0E19'; ctx.fill();
        // سهم الاتجاه
        if (!R.done) {
          ctx.save(); ctx.translate(G.lx, G.ry); ctx.strokeStyle = wrong ? P.rose : P.aqua; ctx.lineWidth = 4; ctx.setLineDash([2, 8]); ctx.lineCap = 'round';
          const a0 = -Math.PI * 0.9, a1 = a0 + 1.6 * dir;
          ctx.beginPath(); ctx.arc(0, 0, G.r * 3.0, Math.min(a0, a1), Math.max(a0, a1)); ctx.stroke(); ctx.setLineDash([]);
          const ex = Math.cos(a1) * G.r * 3, ey = Math.sin(a1) * G.r * 3; ctx.fillStyle = wrong ? P.rose : P.aqua;
          ctx.translate(ex, ey); ctx.rotate(a1 + (dir > 0 ? Math.PI / 2 : -Math.PI / 2)); ctx.beginPath(); ctx.moveTo(0, -8); ctx.lineTo(9, 6); ctx.lineTo(-9, 6); ctx.fill();
          ctx.restore();
        }
        // شريط التقدم
        const bw = Math.min(S.W * 0.8, 360), bx = (S.W - bw) / 2, by = G.cy + G.h * 0.5 + 26;
        rr(ctx, bx, by, bw, 14, 7); ctx.fillStyle = 'rgba(255,255,255,.12)'; ctx.fill();
        rr(ctx, bx + bw * (1 - pr), by, bw * pr, 14, 7); ctx.fillStyle = P.aqua; ctx.fill();
        txt(ctx, '♪', bx - 14, by + 7, 16, P.butter);
        if (!R.done && R.started() && R.left() <= 0) R.finish(Math.round(pr * 100), Math.round(pr * 100) + '%', false);
      });
      return { destroy() { stop(); S.destroy(); }, forceEnd() { const pr = acc / need; R.finish(Math.round(pr * 100), Math.round(pr * 100) + '%', false); } };
    }
  };

  // ═══════════════ 2) ظبّط الأنتين ═══════════════
  const antenna = {
    mount(el, X) {
      const S = Stage(el), ctx = S.ctx, R = Runner(X);
      const targets = []; let prev = 0;
      while (targets.length < 3) { const t = Math.round(X.rng() * 120 - 60); if (Math.abs(t - prev) >= 28 && Math.abs(t) <= 60) { targets.push(t); prev = t; } }
      const scenes = [0, 1, 2].sort(() => X.rng() - 0.5);
      let ang = 0, input = 0, drag = null, dragAng = 0, sensorAng = null, sensorAt = 0, hold = 0, ch = 0, flash = 0, P = pal();
      const noise = document.createElement('canvas'); noise.width = 96; noise.height = 72; const nctx = noise.getContext('2d'); const nimg = nctx.createImageData(96, 72);
      function onOri(e) { if (e.gamma == null) return; sensorAng = clamp(e.gamma * 1.6, -75, 75); sensorAt = performance.now(); }
      window.addEventListener('deviceorientation', onOri);
      function down(e) { S.cv.setPointerCapture(e.pointerId); drag = S.local(e).x; dragAng = input; }
      function move(e) { if (drag == null) return; const x = S.local(e).x; dragAng = clamp(dragAng + (x - drag) * 0.35, -75, 75); drag = x; }
      function up() { drag = null; }
      S.cv.addEventListener('pointerdown', down); S.cv.addEventListener('pointermove', move); S.cv.addEventListener('pointerup', up); S.cv.addEventListener('pointercancel', up);
      function scene(k, w, h) {
        if (k === 0) { const cols = [P.paper, P.butter, P.aqua, P.avocado, P.plum, P.rose, P.denim]; cols.forEach((c, i) => { ctx.fillStyle = c; ctx.fillRect(i * w / 7, 0, w / 7 + 1, h * 0.72); }); ctx.fillStyle = '#1B2238'; ctx.fillRect(0, h * 0.72, w, h); txt(ctx, 'قناة ' + (ch + 1), w / 2, h * 0.86, 18, '#F3EAD8'); }
        else if (k === 1) { ctx.fillStyle = P.orange; ctx.fillRect(0, 0, w, h); ctx.fillStyle = P.butter; ctx.beginPath(); ctx.arc(w * 0.62, h * 0.45, h * 0.2, 0, TAU); ctx.fill(); ctx.fillStyle = P.avocado; ctx.beginPath(); ctx.ellipse(w * 0.3, h * 0.95, w * 0.55, h * 0.38, 0, 0, TAU); ctx.fill(); ctx.fillStyle = P.denim; ctx.beginPath(); ctx.ellipse(w * 0.85, h, w * 0.5, h * 0.3, 0, 0, TAU); ctx.fill(); txt(ctx, 'قناة ' + (ch + 1), w / 2, h * 0.14, 16, '#1B2238'); }
        else { ctx.fillStyle = P.denim; ctx.fillRect(0, 0, w, h); ctx.fillStyle = P.paper; ctx.beginPath(); ctx.arc(w / 2, h * 0.48, h * 0.27, 0, TAU); ctx.fill(); ctx.strokeStyle = '#1B2238'; ctx.lineWidth = 4; ctx.stroke(); txt(ctx, 'قعدة', w / 2, h * 0.45, h * 0.11, '#1B2238', 600, TFONT); txt(ctx, 'زمان', w / 2, h * 0.58, h * 0.07, P.orange, 600, TFONT); txt(ctx, 'قناة ' + (ch + 1), w / 2, h * 0.88, 16, '#F3EAD8'); }
      }
      const stop = loop((dt) => {
        P = pal();
        const sensorLive = performance.now() - sensorAt < 600;
        if (drag != null || !sensorLive) input = dragAng; else { input = sensorAng; dragAng = sensorAng; }
        ang += (input - ang) * Math.min(1, dt * 12);
        const t = targets[Math.min(ch, 2)];
        const d = Math.abs(ang - t), c = R.done ? 1 : clamp(1 - d / 32, 0, 1);
        if (R.started() && !R.done) {
          if (c > 0.86) hold += dt * 1000; else hold = Math.max(0, hold - dt * 2000);
          if (hold >= 1100) { ch++; hold = 0; flash = 1; beep(990, 0.1, 'triangle', 0.05); buzz(30); R.prog(ch / 3); if (ch >= 3) { const ms = R.elapsed(); R.finish(tRk(ms), secs(ms), true); } }
          if (R.left() <= 0 && !R.done) R.finish(ch, ch + '/3 قنوات', false);
        }
        const W = S.W, H = S.H; ctx.clearRect(0, 0, W, H);
        const sh = R.done ? 0 : (1 - c) * 18 * Math.sin(performance.now() / 70);
        ctx.save(); ctx.translate(0, sh); scene(scenes[Math.min(ch, 2)], W, H); ctx.restore();
        if (!R.done) {
          const d32 = nimg.data; for (let i = 0; i < d32.length; i += 4) { const v = Math.random() * 255; d32[i] = d32[i + 1] = d32[i + 2] = v; d32[i + 3] = 255; }
          nctx.putImageData(nimg, 0, 0); ctx.globalAlpha = clamp((1 - c) * 1.05, 0, 0.97); ctx.imageSmoothingEnabled = false; ctx.drawImage(noise, 0, 0, W, H); ctx.globalAlpha = 1; ctx.imageSmoothingEnabled = true;
        }
        if (flash > 0) { ctx.fillStyle = `rgba(255,255,255,${flash * 0.7})`; ctx.fillRect(0, 0, W, H); flash = Math.max(0, flash - dt * 2.5); }
        // الأنتين
        const ax = W / 2, ay = 64;
        ctx.save(); ctx.translate(ax, ay); ctx.rotate(ang * Math.PI / 180);
        ctx.lineWidth = 4; ctx.lineCap = 'round'; ctx.strokeStyle = '#0A0E19';
        for (const s of [-1, 1]) { ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.sin(s * 0.42) * 52, -Math.cos(0.42) * 52); ctx.stroke(); ctx.beginPath(); ctx.arc(Math.sin(s * 0.42) * 52, -Math.cos(0.42) * 52, 4, 0, TAU); ctx.fillStyle = P.butter; ctx.fill(); ctx.stroke(); }
        ctx.restore();
        ctx.beginPath(); ctx.ellipse(ax, ay + 6, 26, 12, 0, 0, TAU); ctx.fillStyle = '#2A2F45'; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = '#0A0E19'; ctx.stroke();
        // الإشارة
        const bars = Math.round(c * 5);
        for (let i = 0; i < 5; i++) { const bh = 6 + i * 5; rr(ctx, 14 + i * 9, 40 - bh, 6, bh, 2); ctx.fillStyle = i < bars ? P.aqua : 'rgba(255,255,255,.25)'; ctx.fill(); }
        // القنوات
        for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.arc(W - 22 - i * 18, 26, 6, 0, TAU); ctx.fillStyle = i < ch ? P.butter : 'rgba(255,255,255,.3)'; ctx.fill(); }
        if (!R.done && hold > 0) { rr(ctx, W / 2 - 60, H - 30, 120 * (hold / 1100), 8, 4); ctx.fillStyle = P.butter; ctx.fill(); }
        if (!R.done) { rr(ctx, W / 2 - 130, H - 62, 260, 26, 13); ctx.fillStyle = 'rgba(10,14,25,.6)'; ctx.fill(); txt(ctx, sensorLive ? 'ميّل الموبايل يمين ويسار' : 'اسحب يمين ويسار لتدوّر الأنتين', W / 2, H - 49, 13, '#F3EAD8', 600); }
        else txt(ctx, '📺 صفيت القنوات كلها!', W / 2, H - 46, 17, '#F3EAD8');
      });
      return { destroy() { stop(); S.destroy(); window.removeEventListener('deviceorientation', onOri); }, forceEnd() { R.finish(ch, ch + '/3 قنوات', false); } };
    }
  };

  // ═══════════════ 3) التلفون أبو دولاب ═══════════════
  const rotary = {
    mount(el, X) {
      const S = Stage(el), ctx = S.ctx, R = Runner(X);
      const num = []; for (let i = 0; i < 6; i++) num.push(i === 0 ? 1 + Math.floor(X.rng() * 9) : Math.floor(X.rng() * 10));
      const STOP = 58; // درجة
      const req = i => 46 + i * 30;
      const theta = i => STOP - req(i);
      const digitOf = i => (i === 9 ? 0 : i + 1);
      let pos = 0, rot = 0, mode = 'idle', hole = -1, lastA = 0, reg = false, wrongT = 0, okT = 0, P = pal();
      function geo() { const R0 = Math.min(S.W * 0.46, S.H * 0.36); return { cx: S.W / 2, cy: S.H * 0.58, R: R0, hr: R0 * 0.135, hd: R0 * 0.7 }; }
      const deg = a => a * Math.PI / 180;
      function down(e) {
        if (!R.started() || R.done || mode !== 'idle') return;
        const G = geo(), p = S.local(e);
        for (let i = 0; i < 10; i++) {
          const a = deg(theta(i)); const hx = G.cx + Math.cos(a) * G.hd, hy = G.cy + Math.sin(a) * G.hd;
          if (Math.hypot(p.x - hx, p.y - hy) < G.hr * 1.35) { mode = 'drag'; hole = i; reg = false; lastA = Math.atan2(p.y - G.cy, p.x - G.cx); S.cv.setPointerCapture(e.pointerId); beep(300, 0.03); return; }
        }
      }
      function move(e) {
        if (mode !== 'drag') return;
        const G = geo(), p = S.local(e); const a = Math.atan2(p.y - G.cy, p.x - G.cx);
        const d = clamp(wrap(a - lastA), -0.6, 0.6) * 180 / Math.PI; lastA = a;
        rot = clamp(rot + d, 0, req(hole));
        if (!reg && rot >= req(hole) - 5) {
          reg = true; const dg = digitOf(hole);
          if (dg === num[pos]) { pos++; okT = performance.now(); beep(520, 0.05); buzz(15); R.prog(pos / 6); if (pos >= 6) { const ms = R.elapsed(); R.finish(tRk(ms), secs(ms), true); } }
          else { wrongT = performance.now(); beep(160, 0.2, 'sawtooth', 0.05); buzz([40, 40, 40]); }
        }
      }
      function up() { if (mode === 'drag') mode = 'return'; }
      S.cv.addEventListener('pointerdown', down); S.cv.addEventListener('pointermove', move); S.cv.addEventListener('pointerup', up); S.cv.addEventListener('pointercancel', up);
      let tick = 0;
      const stop = loop((dt) => {
        P = pal(); const G = geo(); ctx.clearRect(0, 0, S.W, S.H);
        if (mode === 'return') { const before = rot; rot = Math.max(0, rot - dt * 420); tick += before - rot; if (tick > 30) { tick = 0; beep(1200, 0.012, 'square', 0.02); } if (rot === 0) mode = 'idle'; }
        // الرقم المطلوب
        const bw = Math.min(46, (S.W - 40) / 6.6), bx0 = S.W / 2 + bw * 3.3 - bw;
        txt(ctx, 'دوّر الرقم:', S.W / 2, 26, 14, 'rgba(243,234,216,.8)', 600);
        const wrong = performance.now() - wrongT < 450;
        for (let i = 0; i < 6; i++) {
          // الأرقام من اليسار لليمين متل رقم التلفون
          const x = S.W / 2 - bw * 3.3 + i * bw * 1.1;
          rr(ctx, x, 42, bw, bw * 1.15, 8); ctx.fillStyle = i < pos ? P.butter : (i === pos ? (wrong ? P.rose : 'rgba(255,255,255,.95)') : 'rgba(255,255,255,.7)'); ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = '#0A0E19'; ctx.stroke();
          txt(ctx, String(num[i]), x + bw / 2, 42 + bw * 0.6, bw * 0.6, '#1B2238', 700, 'ui-monospace, monospace');
        }
        void bx0;
        // القاعدة والأرقام
        ctx.beginPath(); ctx.arc(G.cx, G.cy, G.R * 1.04, 0, TAU); ctx.fillStyle = '#F3EAD8'; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = '#0A0E19'; ctx.stroke();
        for (let i = 0; i < 10; i++) { const a = deg(theta(i)); txt(ctx, String(digitOf(i)), G.cx + Math.cos(a) * G.hd, G.cy + Math.sin(a) * G.hd, G.hr * 1.1, '#1B2238', 700); }
        // القرص الدوّار بالفتحات
        ctx.save(); ctx.beginPath(); ctx.arc(G.cx, G.cy, G.R * 0.97, 0, TAU);
        for (let i = 0; i < 10; i++) { const a = deg(theta(i) + rot); const hx = G.cx + Math.cos(a) * G.hd, hy = G.cy + Math.sin(a) * G.hd; ctx.moveTo(hx + G.hr, hy); ctx.arc(hx, hy, G.hr, 0, TAU, true); }
        ctx.fillStyle = performance.now() - okT < 200 ? P.avocado : P.denim; ctx.fill('evenodd'); ctx.lineWidth = 3; ctx.strokeStyle = '#0A0E19'; ctx.stroke(); ctx.restore();
        for (let i = 0; i < 10; i++) { const a = deg(theta(i) + rot); ctx.beginPath(); ctx.arc(G.cx + Math.cos(a) * G.hd, G.cy + Math.sin(a) * G.hd, G.hr, 0, TAU); ctx.lineWidth = 2.5; ctx.strokeStyle = '#0A0E19'; ctx.stroke(); }
        // الوسط
        ctx.beginPath(); ctx.arc(G.cx, G.cy, G.R * 0.36, 0, TAU); ctx.fillStyle = '#F3EAD8'; ctx.fill(); ctx.lineWidth = 3; ctx.stroke();
        txt(ctx, 'قعدة زمان', G.cx, G.cy - 6, G.R * 0.11, '#1B2238', 600, TFONT); txt(ctx, '☎', G.cx, G.cy + G.R * 0.14, G.R * 0.13, P.orange);
        // المسكة
        const sa = deg(STOP + 8);
        ctx.save(); ctx.translate(G.cx + Math.cos(sa) * G.R * 0.92, G.cy + Math.sin(sa) * G.R * 0.92); ctx.rotate(sa);
        rr(ctx, -4, -7, G.R * 0.26, 14, 6); ctx.fillStyle = '#C9CED8'; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = '#0A0E19'; ctx.stroke(); ctx.restore();
        if (!R.done) txt(ctx, mode === 'return' ? 'استنى الدولاب يرجع…' : 'حط إصبعك بالرقم ولفّه لعند المسكة', S.W / 2, S.H - 18, 13, 'rgba(243,234,216,.85)', 600);
        else txt(ctx, '☎ ترررن… وصل الخط!', S.W / 2, S.H - 20, 16, P.butter);
        if (!R.done && R.started() && R.left() <= 0) R.finish(pos * 100, pos + '/6 أرقام', false);
      });
      return { destroy() { stop(); S.destroy(); }, forceEnd() { R.finish(pos * 100, pos + '/6 أرقام', false); } };
    }
  };

  // ═══════════════ 4) رسالة T9 ═══════════════
  const T9 = { '1': 'اأإآءىئؤ', '2': 'بتثة', '3': 'جحخ', '4': 'دذرز', '5': 'سشصض', '6': 'طظعغ', '7': 'فقك', '8': 'لمن', '9': 'هوي', '0': ' ' };
  const PHRASES = ['رن علي', 'خلص الرصيد', 'وينك يا غالي', 'تعا عالحارة', 'ابعتلي رنة', 'صباح الخير', 'مسا الورد', 'السهرة عندنا', 'جيب الكلل معك', 'نزل المسلسل', 'رجعت عالبيت', 'بدي كاسيت جديد', 'شحنت الرصيد', 'نطرتك عالباب', 'شو عم تعمل'];
  const t9 = {
    mount(el, X) {
      const R = Runner(X);
      const target = PHRASES[Math.floor(X.rng() * PHRASES.length)];
      let text = '', pend = null, pendKey = null, pendIdx = 0, pendT = null;
      el.innerHTML = `<div class="t9"><div class="t9-phone"><div class="t9-lcd"><div class="t9-top"><span>✉ رسالة جديدة</span><span class="t9-bat">▮▮▮</span></div><div class="t9-target"></div><div class="t9-typed"></div></div><div class="t9-keys"></div></div></div>`;
      const keys = el.querySelector('.t9-keys'), tgt = el.querySelector('.t9-target'), typed = el.querySelector('.t9-typed');
      const order = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', '>'];
      for (const k of order) {
        const b = document.createElement('button'); b.className = 'k';
        if (k === 'C') { b.innerHTML = '<b>مسح</b>'; b.classList.add('kc'); }
        else if (k === '>') { b.innerHTML = '<b>⟵</b><small>تثبيت</small>'; b.classList.add('kc'); }
        else b.innerHTML = `<b>${k}</b><small>${k === '0' ? 'مسافة' : (k === '1' ? 'ا أ إ ء' : T9[k].split('').join(' '))}</small>`;
        b.addEventListener('pointerdown', (e) => { e.preventDefault(); press(k); b.classList.add('on'); setTimeout(() => b.classList.remove('on'), 120); });
        keys.appendChild(b);
      }
      function commit() { if (pend != null) { text += pend; pend = null; pendKey = null; } clearTimeout(pendT); }
      function press(k) {
        if (!R.started() || R.done) return;
        buzz(8); beep(k === 'C' ? 300 : 700 + (+k || 0) * 30, 0.03, 'square', 0.025);
        if (k === 'C') { if (pend != null) { pend = null; pendKey = null; } else text = text.slice(0, -1); clearTimeout(pendT); }
        else if (k === '>') commit();
        else if (k === '0') { commit(); text += ' '; }
        else {
          if (pendKey === k) { pendIdx = (pendIdx + 1) % T9[k].length; pend = T9[k][pendIdx]; }
          else { commit(); pendKey = k; pendIdx = 0; pend = T9[k][0]; }
          clearTimeout(pendT); pendT = setTimeout(() => { commit(); draw(); check(); }, 950);
        }
        draw(); check();
      }
      function full() { return text + (pend || ''); }
      function check() {
        const f = full();
        let ok = 0; while (ok < f.length && ok < target.length && f[ok] === target[ok]) ok++;
        R.prog(ok / target.length);
        if (f === target) { commit(); const ms = R.elapsed(); beep(990, 0.15, 'triangle', 0.05); R.finish(tRk(ms), secs(ms), true); draw(); }
      }
      function draw() {
        const f = full();
        tgt.innerHTML = 'اكتب: <b>' + target.split('').map((ch, i) => `<i class="${i < f.length ? (f[i] === ch ? 'ok' : 'no') : ''}">${ch === ' ' ? '&nbsp;' : ch}</i>`).join('') + '</b>';
        typed.innerHTML = (text.replace(/ /g, '&nbsp;')) + (pend ? `<u>${pend}</u>` : '') + (R.done ? ' ✓' : '<span class="cur"></span>');
      }
      draw();
      const iv = setInterval(() => { if (!R.done && R.started() && R.left() <= 0) { const f = full(); let ok = 0; while (ok < f.length && f[ok] === target[ok]) ok++; R.finish(Math.round(ok / target.length * 1000), ok + '/' + target.length + ' حرف', false); } }, 250);
      return { destroy() { clearInterval(iv); clearTimeout(pendT); }, forceEnd() { const f = full(); let ok = 0; while (ok < f.length && f[ok] === target[ok]) ok++; R.finish(Math.round(ok / target.length * 1000), ok + '/' + target.length + ' حرف', false); } };
    }
  };

  // ═══════════════ 5) البلبل ═══════════════
  const top = {
    mount(el, X) {
      const S = Stage(el), ctx = S.ctx, R = Runner(X);
      const meterHz = 0.9 + X.rng() * 0.8;
      const pulses = []; let tt = 1.2 + X.rng(); while (tt < 60) { pulses.push(tt); tt += 1.3 + X.rng() * 1.3; }
      let phase = 'throw', power = 0, rpm = 0, spinT = 0, phaseA = 0, wob = 0, fallT = 0, msg = '', msgT = 0, used = {}, throwAt = 0, P = pal(), throwTime = 0;
      const MAX = 100;
      function meter() { const t = R.elapsed() / 1000; return 0.5 - 0.5 * Math.cos(t * meterHz * TAU); }
      function inPulse() { for (let i = 0; i < pulses.length; i++) { const d = spinT - pulses[i]; if (d >= 0 && d < 0.6) return i; } return -1; }
      function tap() {
        if (!R.started() || R.done) return;
        if (phase === 'throw') { power = meter(); phase = 'spin'; rpm = 32 + power * 68; throwAt = performance.now(); throwTime = R.elapsed(); beep(220 + power * 400, 0.15, 'triangle', 0.05); buzz(30); return; }
        if (phase === 'spin') {
          const k = inPulse();
          if (k >= 0 && !used[k]) { used[k] = 1; rpm = Math.min(MAX, rpm + 9); msg = '+ ضربة حلوة'; msgT = performance.now(); beep(880, 0.06, 'triangle', 0.05); buzz(15); }
          else if (k < 0) { rpm = Math.max(0, rpm - 6); msg = '− بكّير'; msgT = performance.now(); beep(200, 0.08, 'sawtooth', 0.03); }
        }
      }
      S.cv.addEventListener('pointerdown', tap);
      function endSpin() { if (R.done) return; const s = spinT; R.finish(Math.round(s * 10), s.toFixed(1) + ' ث لفّ', true); }
      const stop = loop((dt) => {
        P = pal(); const W = S.W, H = S.H; ctx.clearRect(0, 0, W, H);
        if (R.started() && phase === 'throw' && R.elapsed() > 6000) tap();
        if (phase === 'spin') {
          spinT += dt; const decay = 3 + spinT * 0.28; rpm -= decay * dt; phaseA += rpm * dt * 0.9; wob = clamp(1 - rpm / 45, 0, 1);
          R.prog(clamp(spinT / 30, 0, 1));
          if (rpm <= 5 || spinT >= 50) { phase = 'fall'; fallT = 0; endSpin(); }
        }
        if (phase === 'fall') fallT = Math.min(1, fallT + dt * 2);
        if (!R.done && R.started() && R.left() <= 0) { if (phase === 'throw') R.finish(0, 'ما انرمى', false); else endSpin(); }
        // الأرض
        const cx = W / 2, gy = H * 0.66;
        ctx.beginPath(); ctx.ellipse(cx, gy, Math.min(W * 0.42, 190), 46, 0, 0, TAU); ctx.fillStyle = 'rgba(243,234,216,.08)'; ctx.fill(); ctx.setLineDash([6, 8]); ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(243,234,216,.6)'; ctx.stroke(); ctx.setLineDash([]);
        // البلبل
        const sz = Math.min(W, H) * 0.2;
        const drift = phase === 'spin' ? Math.sin(spinT * 1.3) * wob * 30 : 0;
        ctx.save(); ctx.translate(cx + drift, gy);
        let tilt = 0;
        if (phase === 'throw') tilt = 1.25; else if (phase === 'spin') tilt = Math.sin(spinT * (5 + wob * 4)) * wob * 0.35; else tilt = 0.35 + fallT * 0.9;
        ctx.rotate(tilt);
        // ظل
        ctx.save(); ctx.rotate(-tilt); ctx.beginPath(); ctx.ellipse(0, 4, sz * 0.5, 8, 0, 0, TAU); ctx.fillStyle = 'rgba(0,0,0,.3)'; ctx.fill(); ctx.restore();
        // الجسم
        ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(-sz * 0.62, -sz * 0.55, -sz * 0.5, -sz * 0.95); ctx.lineTo(sz * 0.5, -sz * 0.95); ctx.quadraticCurveTo(sz * 0.62, -sz * 0.55, 0, 0); ctx.closePath();
        ctx.fillStyle = P.orange; ctx.fill();
        ctx.save(); ctx.clip();
        const cols = [P.butter, P.denim, P.rose, P.aqua];
        for (let i = -6; i < 8; i++) { const x = ((i * sz * 0.26 + phaseA * sz * 0.08) % (sz * 2.1)) - sz; ctx.fillStyle = cols[(i + 60) % 4]; ctx.fillRect(x, -sz, sz * 0.11, sz * 1.1); }
        ctx.restore();
        ctx.lineWidth = 3; ctx.strokeStyle = '#0A0E19'; ctx.stroke();
        ctx.beginPath(); ctx.ellipse(0, -sz * 0.95, sz * 0.5, sz * 0.12, 0, 0, TAU); ctx.fillStyle = P.butter; ctx.fill(); ctx.stroke();
        rr(ctx, -5, -sz * 1.2, 10, sz * 0.25, 4); ctx.fillStyle = '#5A3A2A'; ctx.fill(); ctx.stroke();
        ctx.restore();
        // نبضة الضربة
        if (phase === 'spin') {
          const k = inPulse();
          if (k >= 0 && !used[k]) { const d = spinT - pulses[k]; ctx.beginPath(); ctx.arc(cx + drift, gy - sz * 0.5, sz * (1.25 - d * 0.6), 0, TAU); ctx.lineWidth = 6; ctx.strokeStyle = P.aqua; ctx.stroke(); txt(ctx, 'هلأ!', cx + drift, gy - sz * 1.6, 22, P.aqua, 700, TFONT); }
          // عدّاد السرعة
          const bw = Math.min(W * 0.7, 300); rr(ctx, (W - bw) / 2, 30, bw, 12, 6); ctx.fillStyle = 'rgba(255,255,255,.15)'; ctx.fill();
          rr(ctx, (W - bw) / 2, 30, bw * clamp(rpm / MAX, 0, 1), 12, 6); ctx.fillStyle = rpm < 18 ? P.rose : P.butter; ctx.fill();
          txt(ctx, spinT.toFixed(1) + ' ث', W / 2, 62, 22, '#F3EAD8', 700, 'ui-monospace, monospace');
        }
        if (phase === 'throw') {
          const m = R.started() ? meter() : 0; const mh = H * 0.5, mx = W - 40, my = H * 0.18;
          rr(ctx, mx, my, 18, mh, 9); ctx.fillStyle = 'rgba(255,255,255,.15)'; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = '#0A0E19'; ctx.stroke();
          rr(ctx, mx, my + mh * (1 - m), 18, mh * m, 9); ctx.fillStyle = m > 0.8 ? P.aqua : P.butter; ctx.fill();
          txt(ctx, 'اكبس لما يعلى العدّاد لترمي البلبل', W / 2, H - 26, 14, '#F3EAD8', 600);
          // الخيط
          ctx.strokeStyle = '#F3EAD8'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(cx, gy - sz * 0.6); ctx.bezierCurveTo(cx + 60, gy - sz * 1.5, cx - 40, gy - sz * 2, cx + 30, gy - sz * 2.4); ctx.stroke();
        } else if (phase === 'spin') txt(ctx, 'اكبس بس لما تضوي الدائرة', W / 2, H - 26, 14, '#F3EAD8', 600);
        else txt(ctx, 'وقع البلبل بعد ' + spinT.toFixed(1) + ' ث', W / 2, H - 26, 16, P.butter);
        if (performance.now() - msgT < 600) txt(ctx, msg, W / 2, H * 0.2, 18, msg[0] === '+' ? P.aqua : P.rose);
        void throwAt; void throwTime;
      });
      return { destroy() { stop(); S.destroy(); }, forceEnd() { if (phase === 'throw') R.finish(0, 'ما انرمى', false); else endSpin(); } };
    }
  };

  // ═══════════════ 6) الكلل ═══════════════
  // 5 كلل مبعثرة بالأرض، وكلّتك بتضربهن ليفوتوا بالجورة. كل شي بيضل مكان ما وقف.
  const marbles = {
    mount(el, X) {
      const WW = 100, HH = 160;
      const S = Stage(el, { w: WW, h: HH }), ctx = S.ctx, R = Runner(X);
      const hole = { x: 32 + X.rng() * 36, y: 40 + X.rng() * 20, r: 6.2 };
      const start = { x: 50, y: 142 };
      const MR = 3.3, TR = 3.0, N = 5;
      const tgts = []; let guard = 0;
      while (tgts.length < N && guard++ < 2000) {
        const a = X.rng() * TAU, d = 14 + X.rng() * 34;
        const o = { x: hole.x + Math.cos(a) * d, y: hole.y + Math.sin(a) * d * 1.25, vx: 0, vy: 0, r: TR, in: false };
        if (o.x < 8 || o.x > WW - 8 || o.y < 10 || o.y > 118) continue;
        if (tgts.every(q => Math.hypot(q.x - o.x, q.y - o.y) > 11)) tgts.push(o);
      }
      const COLS = ['--c1', '--c6', '--c5', '--c7', '--c3'];
      let m = { x: start.x, y: start.y, vx: 0, vy: 0 }, sunk = 0, shots = 0, state = 'aim', drag = null, aimV = null, msg = '', msgT = 0, scratch = false, P = pal(), sinkFx = [];
      function down(e) { if (!R.started() || R.done || state !== 'aim') return; S.cv.setPointerCapture(e.pointerId); drag = S.toWorld(e); aimV = { x: 0, y: 0 }; }
      function move(e) { if (!drag) return; const p = S.toWorld(e); let dx = p.x - drag.x, dy = p.y - drag.y; const L = Math.hypot(dx, dy), max = 42; if (L > max) { dx *= max / L; dy *= max / L; } aimV = { x: dx, y: dy }; }
      function up() {
        if (!drag) return; drag = null;
        if (!aimV || Math.hypot(aimV.x, aimV.y) < 3) { aimV = null; return; }
        m.vx = -aimV.x * 3.4; m.vy = -aimV.y * 3.4; aimV = null; state = 'roll'; shots++; scratch = false; beep(400, 0.05, 'triangle', 0.05); buzz(15);
      }
      S.cv.addEventListener('pointerdown', down); S.cv.addEventListener('pointermove', move); S.cv.addEventListener('pointerup', up); S.cv.addEventListener('pointercancel', up);
      function collide(a, b, ra, rb) {
        const dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy), min = ra + rb;
        if (d > 0 && d < min) {
          const nx = dx / d, ny = dy / d, ov = (min - d) / 2; a.x -= nx * ov; a.y -= ny * ov; b.x += nx * ov; b.y += ny * ov;
          const rv = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny;
          if (rv < 0) { const j = -rv * 0.95; a.vx -= j * nx; a.vy -= j * ny; b.vx += j * nx; b.vy += j * ny; if (Math.abs(rv) > 6) beep(1500, 0.02, 'square', 0.03); }
        }
      }
      function inHole(b, r) {
        const dh = Math.hypot(b.x - hole.x, b.y - hole.y), sp = Math.hypot(b.vx, b.vy);
        if (dh < hole.r - r * 0.25 && sp < 75) return true;
        if (dh < hole.r + 1) { b.vx += (hole.x - b.x) * 0.9; b.vy += (hole.y - b.y) * 0.9; } // حافة الجورة بتسحب شوي
        return false;
      }
      function step(dt) {
        const live = tgts.filter(t => !t.in);
        for (const b of [m, ...live]) {
          b.x += b.vx * dt; b.y += b.vy * dt; const f = Math.pow(0.3, dt); b.vx *= f; b.vy *= f;
          const r = b === m ? MR : TR;
          if (b.x < r) { b.x = r; b.vx = Math.abs(b.vx) * 0.55; } if (b.x > WW - r) { b.x = WW - r; b.vx = -Math.abs(b.vx) * 0.55; }
          if (b.y < r) { b.y = r; b.vy = Math.abs(b.vy) * 0.55; } if (b.y > HH - r) { b.y = HH - r; b.vy = -Math.abs(b.vy) * 0.55; }
        }
        for (const t of live) collide(m, t, MR, TR);
        for (let i = 0; i < live.length; i++) for (let j = i + 1; j < live.length; j++) collide(live[i], live[j], TR, TR);
        for (const t of live) if (inHole(t, TR)) { t.in = true; t.vx = t.vy = 0; sunk++; sinkFx.push({ x: hole.x, y: hole.y, t: 0 }); beep(1046, 0.15, 'triangle', 0.06); buzz([20, 30, 40]); msg = 'فاتت! ' + sunk + '/' + N; msgT = performance.now(); R.prog(sunk / N); }
        if (!scratch && inHole(m, MR)) { scratch = true; m.vx = m.vy = 0; msg = 'كلّتك وقعت! رجعت لخط البداية'; msgT = performance.now(); beep(220, 0.15, 'sawtooth', 0.04); }
      }
      function result() { const ms = R.elapsed(); return sunk >= N ? { rk: N * 100000 + (100000 - Math.round(ms / 100)), label: 'الخمسة! ' + secs(ms) } : { rk: sunk * 100000, label: sunk + '/' + N + ' بالجورة' }; }
      const stop = loop((dt) => {
        P = pal();
        if (state === 'roll') {
          for (let i = 0; i < 3; i++) step(dt / 3);
          const moving = [m, ...tgts.filter(t => !t.in)].some(b => Math.hypot(b.vx, b.vy) > 1.2);
          if (!moving) {
            if (scratch) { m.x = start.x; m.y = start.y; scratch = false; }
            // ما في كلّة بتطلع برّا خط البداية: إذا كلّتك وقفت لتحت، بترجع للخط
            if (m.y > start.y) m.y = start.y;
            if (sunk >= N) { state = 'over'; const r0 = result(); R.finish(r0.rk, r0.label, true); }
            else state = 'aim';
          }
        }
        if (!R.done && R.started() && R.left() <= 0) { const r0 = result(); R.finish(r0.rk, r0.label, sunk > 0); }
        for (const f of sinkFx) f.t += dt; sinkFx = sinkFx.filter(f => f.t < 0.7);
        S.screenT(); ctx.clearRect(0, 0, S.W, S.H); S.worldT();
        ctx.fillStyle = '#C9A774'; rr(ctx, 0, 0, WW, HH, 6); ctx.fill();
        ctx.fillStyle = 'rgba(90,58,42,.12)'; for (let i = 0; i < 40; i++) { const x = (i * 37.3) % WW, y = (i * 61.7) % HH; ctx.beginPath(); ctx.arc(x, y, 0.7 + (i % 3) * 0.4, 0, TAU); ctx.fill(); }
        ctx.setLineDash([2, 2]); ctx.strokeStyle = 'rgba(243,234,216,.8)'; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.moveTo(6, start.y + 7); ctx.lineTo(WW - 6, start.y + 7); ctx.stroke(); ctx.setLineDash([]);
        ctx.beginPath(); ctx.arc(hole.x, hole.y, hole.r + 1.6, 0, TAU); ctx.strokeStyle = 'rgba(90,58,42,.35)'; ctx.lineWidth = 1.4; ctx.stroke();
        ctx.beginPath(); ctx.arc(hole.x, hole.y, hole.r, 0, TAU); ctx.fillStyle = '#4A2E1E'; ctx.fill(); ctx.lineWidth = 0.9; ctx.strokeStyle = '#2B1A10'; ctx.stroke();
        for (const f of sinkFx) { ctx.beginPath(); ctx.arc(f.x, f.y, hole.r + f.t * 14, 0, TAU); ctx.strokeStyle = `rgba(242,193,78,${1 - f.t / 0.7})`; ctx.lineWidth = 1.2; ctx.stroke(); }
        tgts.forEach((t, i) => { if (!t.in) marble(t.x, t.y, TR, css(COLS[i])); });
        marble(m.x, m.y, MR, P.orange, true);
        if (aimV && state === 'aim') {
          const L = Math.hypot(aimV.x, aimV.y);
          ctx.setLineDash([1.5, 2.5]); ctx.strokeStyle = '#F3EAD8'; ctx.lineWidth = 1.1; ctx.beginPath(); ctx.moveTo(m.x, m.y); ctx.lineTo(m.x - aimV.x * 1.7, m.y - aimV.y * 1.7); ctx.stroke(); ctx.setLineDash([]);
          ctx.beginPath(); ctx.arc(m.x, m.y, MR + 1 + L / 42 * 5, 0, TAU); ctx.strokeStyle = L > 35 ? P.rose : P.butter; ctx.lineWidth = 1; ctx.stroke();
        }
        S.screenT();
        // عدّاد الكلل اللي فاتت
        for (let i = 0; i < N; i++) { ctx.beginPath(); ctx.arc(S.W - 18 - i * 17, 20, 6, 0, TAU); ctx.fillStyle = i < sunk ? css(COLS[N - 1 - i]) : 'rgba(27,34,56,.18)'; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = '#1B2238'; ctx.stroke(); }
        txt(ctx, 'ضربات: ' + shots, 14, 20, 13, '#1B2238', 700, FONT, 'left');
        if (performance.now() - msgT < 1300 && msg) { const w0 = Math.min(S.W - 30, 250); rr(ctx, S.W / 2 - w0 / 2, S.H * 0.47 - 20, w0, 40, 20); ctx.fillStyle = 'rgba(27,34,56,.88)'; ctx.fill(); txt(ctx, msg, S.W / 2, S.H * 0.47, 16, '#F3EAD8'); }
        if (state === 'aim' && !R.done && R.started()) txt(ctx, 'اسحب لورا وفلّت، ودخّل الكلل بالجورة', S.W / 2, S.H - 14, 13, '#1B2238', 700);
        if (R.done) txt(ctx, sunk >= N ? 'دخّلت الخمسة! 🎯' : sunk + '/' + N + ' بالجورة', S.W / 2, S.H * 0.3, 20, '#1B2238', 700, TFONT);
      });
      function marble(x, y, r, col, mine) {
        ctx.beginPath(); ctx.arc(x + 0.6, y + 0.8, r, 0, TAU); ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.fill();
        ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fillStyle = col; ctx.fill(); ctx.lineWidth = mine ? 1 : 0.6; ctx.strokeStyle = '#0A0E19'; ctx.stroke();
        ctx.beginPath(); ctx.ellipse(x, y, r * 0.5, r * 0.18, 0.8, 0, TAU); ctx.fillStyle = 'rgba(255,255,255,.55)'; ctx.fill();
        ctx.beginPath(); ctx.arc(x - r * 0.35, y - r * 0.35, r * 0.22, 0, TAU); ctx.fillStyle = 'rgba(255,255,255,.85)'; ctx.fill();
        if (mine) { ctx.beginPath(); ctx.arc(x, y, r + 1.4, 0, TAU); ctx.strokeStyle = 'rgba(255,255,255,.7)'; ctx.lineWidth = 0.6; ctx.stroke(); }
      }
      return { destroy() { stop(); S.destroy(); }, forceEnd() { const r0 = result(); R.finish(r0.rk, r0.label, sunk > 0); } };
    }
  };

  // ═══════════════ 7) طاق طاق طاقية ═══════════════
  const hat = {
    server: true,
    mount(el, X) {
      el.innerHTML = `<div class="hat"><div class="hat-ring"></div><div class="hat-center"><div class="hat-big"></div><div class="hat-say"></div></div><div class="hat-msg"></div></div>`;
      const ring = el.querySelector('.hat-ring'), big = el.querySelector('.hat-big'), say = el.querySelector('.hat-say'), msg = el.querySelector('.hat-msg');
      let taps = 0, lastHolder = null, s = null;
      const WORDS = ['طاق', 'طاق', 'طاقية!'];
      big.innerHTML = X.icon('hatCap');
      big.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        if (!s || !s.cur.hat || s.cur.hat.holder !== X.me || s.cur.hat.burned || X.now() < s.cur.startAt) return;
        if (taps < 3) { taps++; beep(500 + taps * 120, 0.06, 'square', 0.04); buzz(12); big.classList.remove('bop'); void big.offsetWidth; big.classList.add('bop'); render(); }
      });
      function eligible() {
        const c = s.cur, me = X.me; const meTeam = X.teamOf(me);
        let ids = c.active.filter(id => id !== me && X.player(id) && !X.player(id).kicked);
        const teamsIn = new Set(c.active.map(id => X.teamOf(id)));
        if (X.isTeam && teamsIn.size > 1) ids = ids.filter(id => X.teamOf(id) !== meTeam);
        if (ids.length > 1 && c.hat.from) ids = ids.filter(id => id !== c.hat.from);
        return ids;
      }
      function render() {
        if (!s || !s.cur || !s.cur.hat) return;
        const c = s.cur, h = c.hat, mine = h.holder === X.me && !h.burned;
        if (h.holder !== lastHolder) { taps = 0; lastHolder = h.holder; if (h.holder === X.me) { buzz([60, 40, 60]); beep(330, 0.1, 'triangle', 0.05); } }
        const el2 = mine && taps >= 3 ? eligible() : [];
        const ids = c.active;
        ring.innerHTML = ids.map((id, i) => {
          const a = (i / ids.length) * TAU - Math.PI / 2; const x = 50 + Math.cos(a) * 40, y = 50 + Math.sin(a) * 40;
          const can = el2.includes(id);
          return `<button class="hat-p ${id === h.holder ? 'has' : ''} ${can ? 'can' : ''} ${h.burned === id ? 'burn' : ''}" data-id="${id}" style="left:${x}%;top:${y}%;--pc:var(--c${X.player(id).color})" ${can ? '' : 'disabled'}>${X.avatar(id, 44)}<span>${X.esc(X.nameOf(id))}</span>${id === h.holder ? '<i class="hat-mini">' + X.icon('hatCap') + '</i>' : ''}</button>`;
        }).join('');
        ring.querySelectorAll('.hat-p.can').forEach(b => b.addEventListener('pointerdown', (e) => { e.preventDefault(); X.hatPass(b.dataset.id); taps = 0; beep(700, 0.05, 'triangle', 0.05); }));
        big.style.display = mine ? '' : 'none';
        el.querySelector('.hat').classList.toggle('mine', mine);
        if (h.burned) { say.textContent = ''; msg.innerHTML = `🔥 احترقت الطاقية عند <b>${X.esc(X.nameOf(h.burned))}</b>`; big.style.display = 'none'; }
        else if (X.now() < c.startAt) { say.textContent = ''; msg.textContent = 'جهّزوا حالكن…'; }
        else if (mine) { say.textContent = taps < 3 ? WORDS[taps] : 'ارميها لحدا!'; msg.textContent = taps < 3 ? 'اكبس عالطاقية 3 مرات' : 'اختار مين بدك ترميها عليه'; }
        else { say.textContent = ''; msg.innerHTML = `الطاقية عند <b>${X.esc(X.nameOf(h.holder))}</b>`; }
      }
      // نبض بيسرع مع الوقت بلا ما يكشف قديش باقي
      const iv = setInterval(() => {
        if (!s || !s.cur || !s.cur.hat || s.cur.hat.burned) return;
        const el0 = Math.max(0, X.now() - s.cur.startAt) / 1000;
        el.querySelector('.hat').style.setProperty('--beat', Math.max(0.28, 1.1 - el0 * 0.03) + 's');
      }, 500);
      const st = setTimeout(render, Math.max(0, X.startAt - X.now()) + 50);
      return { onState(ns) { s = ns; render(); }, destroy() { clearInterval(iv); clearTimeout(st); } };
    }
  };

  // ═══════════════ 8) شدّ الحبل ═══════════════
  // رسمة حيّة: فريقين = حبل واحد بين طرفين. كل واحد لحالو (أو أكتر من فريقين) = حبال من كل الجهات لحلقة بالنص.
  const tug = {
    server: true,
    mount(el, X) {
      el.innerHTML = `<div class="tug"><svg class="tug-svg" viewBox="0 0 360 300" preserveAspectRatio="xMidYMid meet"></svg><div class="tug-low"><div class="tug-count"></div><button class="tug-btn">شدّ!</button></div></div>`;
      const svg = el.querySelector('.tug-svg'), btn = el.querySelector('.tug-btn'), cnt = el.querySelector('.tug-count');
      const NS = 'http://www.w3.org/2000/svg';
      let pending = 0, mine = 0, s = null, recent = [], built = '', sides = [], raf = 0, myJerk = 0;
      const cur = { x: 0, y: 0 }, target = { x: 0, y: 0 };
      btn.addEventListener('pointerdown', (e) => {
        e.preventDefault(); if (!s || X.now() < s.cur.startAt || X.now() > s.cur.endAt) return;
        const t = performance.now(); recent = recent.filter(x => t - x < 1000); if (recent.length >= 14) return; recent.push(t);
        pending++; mine++; myJerk = 1; buzz(6); btn.classList.remove('pull'); void btn.offsetWidth; btn.classList.add('pull'); cnt.textContent = mine + ' شدّة';
      });
      const iv = setInterval(() => { if (pending > 0) { const n = Math.min(8, pending); pending -= n; X.tap(n); } }, 180);
      function sideList(c) {
        if (X.isTeam) {
          const ts = [...new Set(c.active.map(id => X.teamOf(id)))].sort((a, b) => a - b);
          return ts.map(t => { const ids = c.active.filter(id => X.teamOf(id) === t); return { key: 't' + t, ids, name: X.teamName(t), col: `var(--tc${t})`, me: X.teamOf(X.me) === t, figs: ids.slice(0, 4) }; });
        }
        return c.active.map(id => ({ key: id, ids: [id], name: X.nameOf(id), col: `var(--c${X.player(id).color})`, me: id === X.me, figs: [id] }));
      }
      function initial(id) { const n = (X.nameOf(id) || '؟').trim(); return /^[اأإآ]/.test(n) ? n.slice(0, 2) : n.slice(0, 1); }
      function fig(id, col, me, mir) { // شخص من جنب، وجهه لـ +x، إيديه عند (0,0)
        return `<g class="lean"><path d="M-3 34 L-12 10 M-6 34 L-12 10" stroke="#0A0E19" stroke-width="4" stroke-linecap="round"/>
          <path d="M-12 10 L-19 -9" stroke="${col}" stroke-width="9" stroke-linecap="round"/><path d="M-12 10 L-19 -9" stroke="#0A0E19" stroke-width="1.6" stroke-linecap="round" opacity=".35"/>
          <path d="M-18 -7 L0 0" stroke="#0A0E19" stroke-width="3.5" stroke-linecap="round"/>
          <circle cx="-23" cy="-21" r="11" fill="${col}" stroke="${me ? '#F2C14E' : '#0A0E19'}" stroke-width="${me ? 4 : 2.5}"/>
          <text transform="translate(-23 -20) scale(${mir} 1)" text-anchor="middle" dominant-baseline="central" class="fig-t">${X.esc(initial(id))}</text></g>`;
      }
      function build(c) {
        sides = sideList(c); const n = sides.length; built = sides.map(x => x.key).join('|');
        const two = n === 2;
        sides.forEach((sd, i) => {
          // الجهة: فريقين = يمين ويسار. أكتر = دايرة
          const a = two ? (i === 0 ? 0 : Math.PI) : (-Math.PI / 2 + i * TAU / n);
          sd.ux = Math.cos(a); sd.uy = Math.sin(a);
          const rx = two ? 58 : (n > 5 ? 108 : 96), ry = two ? 0 : (n > 5 ? 88 : 78);
          sd.ax = 180 + sd.ux * rx; sd.ay = (two ? 160 : 150) + sd.uy * ry;
          sd.sc = two ? (sd.figs.length > 2 ? 1.15 : 1.4) : (n > 6 ? 0.78 : n > 4 ? 0.92 : 1.12);
          sd.lean = 0; sd.prev = 0; sd.v = 0;
        });
        const two0 = two;
        let h = `<defs><pattern id="rp" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="8" height="8" fill="#C9A774"/><rect width="4" height="8" fill="#A9844F"/></pattern></defs>`;
        h += two0 ? `<rect x="0" y="${160 + 34 * sides[0].sc}" width="360" height="200" fill="rgba(201,167,116,.18)"/><line x1="0" y1="${160 + 34 * sides[0].sc}" x2="360" y2="${160 + 34 * sides[0].sc}" stroke="rgba(243,234,216,.35)" stroke-width="2"/>`
                  : `<ellipse cx="180" cy="152" rx="160" ry="134" fill="rgba(201,167,116,.14)"/>`;
        // خط الطبشورة بالنص + خطوط الفوز
        h += two0 ? `<line x1="180" y1="118" x2="180" y2="250" stroke="#F3EAD8" stroke-width="3" stroke-dasharray="7 6"/>`
                  : `<circle cx="180" cy="150" r="24" fill="none" stroke="#F3EAD8" stroke-width="3" stroke-dasharray="6 6"/>`;
        h += `<g class="world">`;
        sides.forEach((sd, i) => {
          const far = sd.figs.length;
          const ex = sd.ax + sd.ux * (far - 1) * 26 * sd.sc + sd.ux * 30 * sd.sc, ey = sd.ay + sd.uy * (far - 1) * 26 * sd.sc + sd.uy * 30 * sd.sc;
          h += `<path class="rope r${i}" d="" fill="none" stroke="#5A3A2A" stroke-width="7" stroke-linecap="round"/><path class="rope2 r${i}b" d="" fill="none" stroke="url(#rp)" stroke-width="4.5" stroke-linecap="round"/>`;
          sd.ex = ex; sd.ey = ey;
        });
        sides.forEach((sd, i) => {
          sd.figs.forEach((id, k) => {
            const fx = sd.ax + sd.ux * k * 26 * sd.sc, fy = sd.ay + sd.uy * k * 26 * sd.sc;
            const mir = sd.ux < -0.01 ? 1 : (sd.ux > 0.01 ? -1 : (i % 2 ? 1 : -1)); // وجهه للنص
            h += `<g class="fig f${i}" data-x="${fx}" data-y="${fy}" transform="translate(${fx} ${fy}) scale(${mir * sd.sc} ${sd.sc})">${fig(id, sd.col, sd.me && (!X.isTeam ? true : id === X.me), mir)}</g>`;
          });
        });
        h += `<g class="knot"><circle r="12" fill="#D9637A" stroke="#0A0E19" stroke-width="3"/><path d="M-4 9 L-9 22 M4 9 L9 22" stroke="#D9637A" stroke-width="5" stroke-linecap="round"/><circle r="4" fill="#F3EAD8"/></g>`;
        h += `</g>`;
        // اللافتات
        sides.forEach((sd, i) => {
          let lx, ly;
          if (two0) { lx = i === 0 ? 290 : 70; ly = 40; }
          else {
            const reach = Math.hypot(sd.ex - 180, sd.ey - 150) + 30;
            lx = Math.max(54, Math.min(306, 180 + sd.ux * reach)); ly = Math.max(16, Math.min(286, 150 + sd.uy * reach + (sd.uy > 0.3 ? 30 : sd.uy < -0.3 ? -32 : 30)));
          }
          h += `<g class="lab" transform="translate(${lx} ${ly})"><rect x="-52" y="-14" width="104" height="${two0 ? 46 : 28}" rx="10" fill="${sd.me ? '#F2C14E' : 'rgba(15,20,36,.75)'}" stroke="${sd.col}" stroke-width="2.5"/>
            <text class="lab-n" x="0" y="${two0 ? -1 : 0}" text-anchor="middle" dominant-baseline="central" fill="${sd.me ? '#1B2238' : '#F3EAD8'}">${X.esc(sd.name.length > 13 ? sd.name.slice(0, 12) + '…' : sd.name)}</text>
            ${two0 ? `<text class="lab-v v${i}" x="0" y="20" text-anchor="middle" dominant-baseline="central" fill="${sd.me ? '#1B2238' : '#F3EAD8'}">0</text>` : ''}</g>`;
        });
        svg.innerHTML = h;
      }
      function strengths(c) { const taps = c.tug.taps; return sides.map(sd => sd.ids.reduce((a, id) => a + (taps[id] || 0), 0) / Math.max(1, sd.ids.length)); }
      function render() {
        if (!s || !s.cur || !s.cur.tug) return;
        const c = s.cur;
        const key = sideList(c).map(x => x.key).join('|'); if (key !== built) build(c);
        const started = X.now() >= c.startAt, over = X.now() > c.endAt;
        btn.disabled = !started || over; btn.textContent = over ? 'خلص!' : 'شدّ!';
        const st = strengths(c); const sum = st.reduce((a, b) => a + b, 0);
        let vx = 0, vy = 0; sides.forEach((sd, i) => { vx += sd.ux * st[i]; vy += sd.uy * st[i]; });
        const den = Math.max(sum, 10 * sides.length * 0.6);
        const R0 = sides.length === 2 ? 56 : 58;
        target.x = vx / den * R0 * 1.6; target.y = vy / den * R0 * 1.6;
        const L = Math.hypot(target.x, target.y); if (L > R0) { target.x *= R0 / L; target.y *= R0 / L; }
        sides.forEach((sd, i) => { sd.v = st[i]; const t = svg.querySelector('.v' + i); if (t) t.textContent = Math.round(st[i]); });
      }
      function frame() {
        raf = requestAnimationFrame(frame);
        if (!sides.length) return;
        cur.x += (target.x - cur.x) * 0.12; cur.y += (target.y - cur.y) * 0.12;
        const two = sides.length === 2;
        const kx = 180 + cur.x, ky = (two ? 160 : 150) + cur.y;
        const world = svg.querySelector('.world'); if (!world) return;
        const knot = world.querySelector('.knot'); knot.setAttribute('transform', `translate(${kx} ${ky})`);
        const tnow = performance.now() / 1000;
        sides.forEach((sd, i) => {
          // كل ما زاد الشد زاد الميلان، ومع رجفة خفيفة
          const rate = Math.max(0, sd.v - sd.prev); sd.prev += (sd.v - sd.prev) * 0.2;
          let lean = Math.min(28, 8 + rate * 6) + Math.sin(tnow * 9 + i) * 1.5;
          if (sd.me && myJerk > 0) { lean += myJerk * 10; }
          sd.lean += (lean - sd.lean) * 0.25;
          const shift = two ? { x: cur.x, y: 0 } : { x: cur.x * 0.45, y: cur.y * 0.45 };
          world.querySelectorAll('.f' + i).forEach(f => {
            const fx = +f.dataset.x + shift.x, fy = +f.dataset.y + shift.y;
            const t = f.getAttribute('transform').replace(/translate\([^)]*\)/, `translate(${fx.toFixed(1)} ${fy.toFixed(1)})`);
            f.setAttribute('transform', t);
            f.querySelector('.lean').setAttribute('transform', `rotate(${(-sd.lean).toFixed(1)} -4 34)`);
          });
          const hx = sd.ax + shift.x, hy = sd.ay + shift.y, ex = sd.ex + shift.x, ey = sd.ey + shift.y;
          // الحبل مشدود: انحناء خفيف بس
          const mx = (kx + ex) / 2, my = (ky + ey) / 2 + (two ? 5 : 3) - Math.min(4, sd.lean / 7);
          const d = `M${kx.toFixed(1)} ${ky.toFixed(1)} Q${mx.toFixed(1)} ${my.toFixed(1)} ${ex.toFixed(1)} ${ey.toFixed(1)}`;
          world.querySelector('.r' + i).setAttribute('d', d); world.querySelector('.r' + i + 'b').setAttribute('d', d);
          void hx; void hy;
        });
        myJerk = Math.max(0, myJerk - 0.12);
      }
      raf = requestAnimationFrame(frame);
      const rv = setInterval(render, 200);
      return { onState(ns) { s = ns; render(); }, destroy() { clearInterval(iv); clearInterval(rv); cancelAnimationFrame(raf); if (pending) X.tap(Math.min(8, pending)); } };
    }
  };

  // ═══════════════ 9) السبع حجار ═══════════════
  const stones = {
    mount(el, X) {
      const WW = 100, HH = 150;
      const S = Stage(el, { w: WW, h: HH }), ctx = S.ctx, R = Runner(X);
      const SH = 11, GROUND = 140, BASE_W = 58;
      let speed = 34 + X.rng() * 10, dirv = X.rng() < 0.5 ? 1 : -1;
      const tones = ['#A39A88', '#8E8676', '#B9AF9B', '#9A8F7C', '#B0A48E', '#8A8070', '#C2B8A3'];
      const radii = Array.from({ length: 7 }, () => 3 + X.rng() * 3);
      let stack = [{ x: (WW - BASE_W) / 2, w: BASE_W, base: true }];
      let cur = null, falling = [], placed = 0, perfectT = 0, over = false, P = pal();
      function spawn() { const prev = stack[stack.length - 1]; cur = { x: dirv > 0 ? -prev.w * 0.3 : WW - prev.w * 0.7, w: prev.w, y: GROUND - SH * (stack.length) }; }
      spawn();
      function tap() {
        if (!R.started() || R.done || !cur) return;
        const prev = stack[stack.length - 1];
        let a = Math.max(cur.x, prev.x), b = Math.min(cur.x + cur.w, prev.x + prev.w);
        if (Math.abs(cur.x - prev.x) < 1.3) { cur.x = prev.x; a = prev.x; b = prev.x + prev.w; perfectT = performance.now(); beep(1175, 0.1, 'triangle', 0.05); }
        else beep(500 + placed * 60, 0.06, 'square', 0.03);
        buzz(15);
        if (b - a <= 0.5) { falling.push({ x: cur.x, w: cur.w, y: cur.y, vy: 0, i: placed }); cur = null; over = true; done(); return; }
        if (cur.x < a) falling.push({ x: cur.x, w: a - cur.x, y: cur.y, vy: 0, i: placed });
        if (cur.x + cur.w > b) falling.push({ x: b, w: cur.x + cur.w - b, y: cur.y, vy: 0, i: placed });
        stack.push({ x: a, w: b - a, i: placed }); placed++; R.prog(placed / 7);
        if (placed >= 7) { cur = null; done(); return; }
        speed *= 1.12; dirv = X.rng() < 0.5 ? 1 : -1; spawn();
      }
      function score() { const top = stack[stack.length - 1]; const pct = placed ? Math.round(top.w / BASE_W * 100) : 0; return { rk: placed * 1000 + pct * 5 + (placed >= 7 ? 500 : 0), label: placed + '/7' + (placed ? ' · ' + pct + '%' : '') }; }
      function done() { const s = score(); R.finish(s.rk, s.label, true); }
      S.cv.addEventListener('pointerdown', tap);
      const stop = loop((dt) => {
        P = pal();
        if (cur && R.started() && !R.done) { cur.x += dirv * speed * dt; if (cur.x + cur.w > WW + 6) { cur.x = WW + 6 - cur.w; dirv = -1; } if (cur.x < -6) { cur.x = -6; dirv = 1; } }
        if (!R.done && R.started() && R.left() <= 0) { const s = score(); R.finish(s.rk, s.label, false); cur = null; }
        for (const f of falling) { f.vy += 260 * dt; f.y += f.vy * dt; }
        falling = falling.filter(f => f.y < HH + 30);
        S.screenT(); ctx.clearRect(0, 0, S.W, S.H); S.worldT();
        // السما والأرض
        ctx.fillStyle = 'rgba(243,234,216,.06)'; ctx.fillRect(0, 0, WW, GROUND);
        ctx.fillStyle = '#C9A774'; ctx.fillRect(-20, GROUND, WW + 40, 30); ctx.strokeStyle = '#0A0E19'; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.moveTo(-20, GROUND); ctx.lineTo(WW + 20, GROUND); ctx.stroke();
        // خطوط الحجار السبعة
        for (let i = 1; i <= 7; i++) { ctx.fillStyle = 'rgba(243,234,216,.25)'; ctx.font = `600 4px ${FONT}`; ctx.textAlign = 'left'; ctx.fillText(String(i), 2, GROUND - SH * (i - 1) - SH / 2 + 1.5); }
        stack.forEach((s, k) => { if (s.base) { ctx.fillStyle = 'rgba(0,0,0,.15)'; ctx.fillRect(s.x, GROUND - 1.2, s.w, 1.2); return; } stone(s.x, GROUND - SH * k, s.w, s.i); });
        for (const f of falling) stone(f.x, f.y, f.w, f.i, 0.8);
        if (cur) stone(cur.x, cur.y, cur.w, placed, 1, true);
        S.screenT();
        txt(ctx, '\u2066' + placed + ' / 7\u2069', S.W / 2, 26, 22, '#F3EAD8', 700, 'ui-monospace, monospace');
        if (performance.now() - perfectT < 700) txt(ctx, 'نظيفة! ✨', S.W / 2, 56, 18, P.butter, 700, TFONT);
        if (!R.done && R.started()) txt(ctx, 'اكبس لتنزّل الحجرة فوق اللي قبلها', S.W / 2, S.H - 14, 13, '#1B2238', 700);
        if (R.done) txt(ctx, over ? 'وقعت الحجار! ' + placed + '/7' : (placed >= 7 ? 'عمّرت السبع حجار! 🎉' : placed + '/7'), S.W / 2, S.H * 0.18, 18, P.butter, 700, TFONT);
      });
      function stone(x, y, w, i, a = 1, moving) {
        ctx.globalAlpha = a; const h = SH - 0.6; const r = Math.min(radii[i % 7], h / 2, w / 2);
        rr(ctx, x, y - h, w, h, r); ctx.fillStyle = tones[i % 7]; ctx.fill(); ctx.lineWidth = 0.9; ctx.strokeStyle = '#0A0E19'; ctx.stroke();
        ctx.fillStyle = 'rgba(255,255,255,.18)'; rr(ctx, x + 2, y - h + 1.6, Math.max(0, w - 4), 2, 1); ctx.fill();
        if (moving) { ctx.fillStyle = P.butter; ctx.beginPath(); ctx.arc(x + w / 2, y - h - 3, 1.2, 0, TAU); ctx.fill(); }
        ctx.globalAlpha = 1;
      }
      return { destroy() { stop(); S.destroy(); }, forceEnd() { const s = score(); R.finish(s.rk, s.label, false); } };
    }
  };

  // ═══════════════ البيانات الوصفية ═══════════════
  const META = {
    cassette: { name: 'لفّ الكاسيت', year: 1985, how: 'الشريط علق؟ لفّ القلم حول البكرة بالاتجاه المطلوب لحد ما ترجع للأغنية. الأسرع بيربح.', mode: 'الأسرع',
      facts: ['زمان كنا نرجّع الشريط بقلم الرصاص، كرمال ما تخلص بطاريات المسجّلة.', 'إذا علق الشريط بالمسجّلة، كنا نطلعه بالراحة ونلفّه بإيدينا شبر شبر.', 'الكاسيت كان إله وجهين، وكنا نقلبه بنص السهرة.'] },
    antenna: { name: 'ظبّط الأنتين', year: 1980, how: 'الشاشة كلها تشويش! ميّل الموبايل (أو اسحب) لحد ما تصفى الصورة وتثبت. 3 قنوات، والأسرع بيربح.', mode: 'الأسرع', sensor: true,
      facts: ['كان في واحد يطلع عالسطح يدوّر الأنتين، وواحد تحت يصرّخ: «هيك! لا لا، رجعها شوي!»', 'التشويش كان جزء من السهرة، وبعض الناس كانت تضرب التلفزيون عجنبه ليصفى.', 'كانت المحطات قليلة، وكل البيت يتفرج عنفس الشي.'] },
    rotary: { name: 'التلفون أبو دولاب', year: 1975, how: 'دوّر الرقم المطلوب: حط إصبعك بفتحة الرقم ولفّه لعند المسكة، واستنى الدولاب يرجع. الأسرع بيربح.', mode: 'الأسرع',
      facts: ['بالتلفون أبو دولاب، الرقم 0 كان الأطول، وإذا غلطت برقم بترجع من الأول.', 'التلفون كان واحد بالبيت، ومربوط بشريط، وكل العيلة بتعرف مين عم يحكي.', 'كنا نحفظ أرقام كل الأقارب غيب، بلا ما نسجّلها بمكان.'] },
    t9: { name: 'رسالة T9', year: 2003, how: 'اكتب الجملة متل ما هي على كيبورد الأزرار: كل حرف بكبسة أو أكتر على نفس الزر. الأسرع بلا غلط بيربح.', mode: 'الأسرع',
      facts: ['الرسالة الوحدة كانت 70 حرف عربي بس، فكنا نختصر الكلام لنوفّر الرصيد.', 'كان في ناس بتكتب الرسالة والموبايل بجيبتها، بلا ما تطلّع عالشاشة.', 'الرنّة كانت رسالة لحالها: رنّة يعني «وصلت»، رنّتين يعني «انزل».'] },
    top: { name: 'البلبل', year: 1970, how: 'اكبس لما يعلى العدّاد لترمي البلبل بقوة، وبعدين اكبس بس لما تضوي الدائرة لتعطيه دفشة. أطول لفّة بتربح.', mode: 'الأطول',
      facts: ['البلبل كان يلفّ بخيط، وكان في بلابل إلها مسمار حديد بتحفر بالأرض.', 'كانت المسابقة: مين بلبله بيضل يلفّ أطول، أو مين بيضرب بلبل التاني.', 'الشطارة كانت بلفّة الخيط: إذا لفّيته غلط، البلبل بيطير لبعيد.'] },
    marbles: { name: 'الكلل', year: 1978, how: 'في 5 كلل مبعثرة حول الجورة. اسحب كلّتك لورا وفلّت لتضربهن وتدخّلهن، وكل كلّة بتضل مكان ما وقفت. اللي بيدخّل أكتر كلل بدقيقة بيربح، وإذا دخّلوا الخمسة الأسرع.', mode: 'الأكتر',
      facts: ['كل ولد كان عنده كيس كلل، والكلّة اللي فيها لون من جوّا كانت أغلى شي.', 'كنا نحفر الجورة بكعب الصباط، ونرسم خط البداية بعود.', 'الكلل كانت عملة الحارة: بتربح كلل، بتخسر كلل.'] },
    hat: { name: 'طاق طاق طاقية', year: 1965, how: 'الطاقية بتلفّ عليكن! إذا إجت لعندك: اكبس عليها 3 مرات وارميها لحدا. ما حدا بيعرف إيمتى بتحترق. الأقل حملاً للطاقية بيربح.', mode: 'الأقل',
      facts: ['كنا نقعد بدائرة، وواحد يلفّ ورانا بالطاقية ويغنّي، ولما يحطها ورا حدا لازم يلحقه.', 'اللي ما بينتبه إنو الطاقية وراه، كان بيقعد بنص الدائرة.', 'كانت تنلعب بساحة المدرسة، والطاقية ممكن تكون منديل أو كنزة.'] },
    tug: { name: 'شدّ الحبل', year: 1972, how: 'اكبس «شدّ!» بأسرع ما فيك لحد ما يخلص الوقت. بالفرق: معدّل الفريق هو اللي بيشدّ.', mode: 'الأقوى',
      facts: ['شدّ الحبل كانت لعبة الرحلات والأعراس، ودايماً في واحد قوي بيحطّوه بالآخر.', 'كنا نرسم خط بالطبشورة بالنص، واللي بيتعدّى الخط بيخسر.', 'السر مو بالقوة بس، بالشدّة سوا بنفس اللحظة.'] },
    stones: { name: 'السبع حجار', year: 1968, how: 'معك 30 ثانية بس! الحجرة بتتحرك فوق البرج: اكبس لتنزلها فوق اللي قبلها، واللي بيطلع برّا بينقص. اللي بيعمّر أكتر حجار بيربح، وإذا تساووا الأعرض.', mode: 'الأعلى',
      facts: ['السبع حجار: كنا نعمّرها فوق بعض ونضربها بالطابة، وبعدين نرجع نعمّرها قبل ما ينضربنا.', 'كانت الحجار تنلمّ من الطريق، وكل حجرة إلها شكلها.', 'الفريق اللي بيعمّر البرج لازم يركض أسرع من الطابة.'] },
  };
  const IMPL = { cassette, antenna, rotary, t9, top, marbles, hat, tug, stones };
  function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  window.ZG = { META, IMPL, mulberry32, beep, buzz };
})();
