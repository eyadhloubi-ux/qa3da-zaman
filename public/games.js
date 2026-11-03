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
  // الصوت ما بيشتغل عالموبايل قبل أول لمسة، فمنفتحه مع أول كبسة ومنرجّعه إذا وقف
  function unlockAudio() { try { AC = AC || new (window.AudioContext || window.webkitAudioContext)(); if (AC.state === 'suspended') AC.resume(); } catch (e) {} }
  ['pointerdown', 'touchstart', 'keydown'].forEach(ev => document.addEventListener(ev, unlockAudio, { passive: true }));
  function noise(dur = 1, vol = 0.05, low = 0) { // تشويش التلفزيون وصوت الفتيش
    try {
      unlockAudio(); const n = Math.floor(AC.sampleRate * dur), b = AC.createBuffer(1, n, AC.sampleRate), d = b.getChannelData(0);
      for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (low ? Math.pow(1 - i / n, 2) : 1);
      const src = AC.createBufferSource(); src.buffer = b; const g = AC.createGain(); g.gain.value = vol;
      let node = src; if (low) { const f = AC.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = low; src.connect(f); node = f; }
      node.connect(g); g.connect(AC.destination); src.start();
    } catch (e) {}
  }
  function beep(f = 660, d = 0.06, type = 'square', vol = 0.04) {
    try {
      AC = AC || new (window.AudioContext || window.webkitAudioContext)(); if (AC.state === 'suspended') AC.resume();
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
    R.finish = (rk, label, done, v, unit) => { if (R.done) return; R.done = true; X.finish({ rk, label, done, v, unit }); };
    R.dur = () => Math.max(1000, X.endAt - X.startAt);
    // خلص: الوقت. ما خلص: وقت عقوبة (المدة × (2 − التقدّم))، فبيضل أبطأ من أي حدا خلّص وبيتحسب صح بمتوسط الفريق
    R.timeDone = (ms) => R.finish(tRk(ms), secs(ms), true, Math.round(ms / 100) / 10, 'ث');
    R.timePartial = (pr, label) => { const ms = R.dur() * (2 - Math.max(0, Math.min(1, pr))); R.finish(tRk(ms), label, false, Math.round(ms / 100) / 10, 'ث'); };
    return R;
  }

  // ═══════════════ 1) لفّ الكاسيت بالقلم ═══════════════
  // الشريط طالع ومدلّى برّا الكاسيت. كل لفّة بالقلم بتفوّت شوي منه لجوّا، لحد ما يرجع كله.
  const cassette = {
    mount(el, X) {
      const S = Stage(el), ctx = S.ctx, R = Runner(X);
      const dir0 = X.rng() < 0.5 ? -1 : 1;
      const segs = []; const nSeg = 3 + Math.floor(X.rng() * 2); // 3 أو 4 مقاطع، كل مقطع باتجاه
      for (let i = 0; i < nSeg; i++) segs.push({ dir: i % 2 ? -dir0 : dir0, need: (2.5 + X.rng() * 1.5) * TAU });
      const need = segs.reduce((a, s) => a + s.need, 0);
      let seg = 0, segAcc = 0, flipT = -9;
      let dir = segs[0].dir;
      const wob = [X.rng() * 6, X.rng() * 6, X.rng() * 6];
      let acc = 0, rot = 0, lastA = null, wrongT = 0, P = pal();
      const label = ['مزيكا السهرة', 'شريط الحارة', 'أغاني الرحلة', 'كاسيت العيد'][Math.floor(X.rng() * 4)];
      function geo() {
        const w = Math.min(S.W * 0.86, 400), h = w * 0.64, cx = S.W / 2, cy = Math.max(h * 0.5 + 40, S.H * 0.3);
        return { w, h, cx, cy, lx: cx - w * 0.24, rx: cx + w * 0.24, ry: cy - h * 0.06, r: h * 0.16 };
      }
      function down(e) { if (!R.started() || R.done) return; S.cv.setPointerCapture(e.pointerId); const G = geo(), p = S.local(e); lastA = Math.atan2(p.y - G.ry, p.x - G.lx); }
      function move(e) {
        if (lastA == null || R.done || !R.started()) return;
        const G = geo(), p = S.local(e);
        if (Math.hypot(p.x - G.lx, p.y - G.ry) < G.r * 0.35) return;
        const a = Math.atan2(p.y - G.ry, p.x - G.lx);
        const d = Math.max(-0.9, Math.min(0.9, wrap(a - lastA))); lastA = a;
        const s = d * dir;
        if (s < 0) wrongT = performance.now();
        segAcc = Math.max(0, segAcc + s); rot += d;
        if (segAcc >= segs[seg].need) {
          if (seg < segs.length - 1) { seg++; segAcc = 0; dir = segs[seg].dir; flipT = performance.now(); beep(330, 0.18, 'square', 0.06); buzz([60, 40, 60]); }
          else segAcc = segs[seg].need;
        }
        acc = segs.slice(0, seg).reduce((a, x) => a + x.need, 0) + Math.min(segAcc, segs[seg].need);
        const pr = acc / need; R.prog(pr);
        if (pr >= 0.9999 && !R.done) { beep(880, 0.12, 'triangle', 0.06); buzz(40); R.timeDone(R.elapsed()); }
      }
      function up() { lastA = null; }
      S.cv.addEventListener('pointerdown', down); S.cv.addEventListener('pointermove', move);
      S.cv.addEventListener('pointerup', up); S.cv.addEventListener('pointercancel', up);
      function pct() { return Math.round(acc / need * 100); }
      const stop = loop(() => {
        P = pal(); const G = geo(); ctx.clearRect(0, 0, S.W, S.H);
        const pr = acc / need, rem = 1 - pr;
        const wrong = performance.now() - wrongT < 400;
        // الشريط المدلّى: بيطلع من تحت الكاسيت وبيعمل حلقة طويلة معجوقة
        const exY = G.cy + G.h * 0.5 - 4, spread = G.w * 0.16;
        const maxD = S.H - exY - 26, D = 8 + rem * maxD;
        const tt = performance.now() / 1000;
        if (rem > 0.002) {
          ctx.lineJoin = 'round'; ctx.lineCap = 'round';
          const pts = [];
          for (let i = 0; i <= 90; i++) {
            const u = i / 90, th = Math.PI * u;
            const curl = Math.sin(u * TAU * 2.5 + wob[0]) * spread * 1.4 * rem + Math.sin(u * TAU * 5 + wob[1] + tt * 0.6) * 6 * rem;
            const x = G.cx - spread * Math.cos(th) + curl;
            const y = exY + D * Math.sin(th) * (0.82 + 0.18 * Math.sin(u * TAU * 3 + wob[2]));
            pts.push([x, y]);
          }
          for (const [wd, col] of [[9, '#2B1A10'], [6, '#5A3A2A'], [2, 'rgba(255,255,255,.22)']]) {
            ctx.beginPath(); pts.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.lineWidth = wd; ctx.strokeStyle = col; ctx.stroke();
          }
        }
        // جسم الكاسيت
        ctx.save(); ctx.translate(G.cx - G.w / 2, G.cy - G.h / 2);
        ctx.lineWidth = 3; ctx.strokeStyle = '#0A0E19';
        rr(ctx, 0, 0, G.w, G.h, 14); ctx.fillStyle = '#2A2F45'; ctx.fill(); ctx.stroke();
        rr(ctx, G.w * 0.06, G.h * 0.08, G.w * 0.88, G.h * 0.62, 10); ctx.fillStyle = P.butter; ctx.fill(); ctx.stroke();
        ctx.fillStyle = P.orange; ctx.fillRect(G.w * 0.06 + 1.5, G.h * 0.1, G.w * 0.88 - 3, G.h * 0.09);
        txt(ctx, label, G.w / 2, G.h * 0.27, Math.max(13, G.w * 0.045), '#1B2238', 600, TFONT);
        rr(ctx, G.w * 0.2, G.h * 0.34, G.w * 0.6, G.h * 0.3, G.h * 0.15); ctx.fillStyle = '#1B2238'; ctx.fill(); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(G.w * 0.18, G.h); ctx.lineTo(G.w * 0.26, G.h * 0.78); ctx.lineTo(G.w * 0.74, G.h * 0.78); ctx.lineTo(G.w * 0.82, G.h); ctx.fillStyle = '#3A4060'; ctx.fill(); ctx.stroke();
        ctx.restore();
        // البكرات: الشريط بيكبر عالبكرة كل ما رجع
        const rMin = G.r * 0.6, rMax = G.r * 1.28;
        const tl = rMin + (rMax - rMin) * pr, tr = rMin + (rMax - rMin) * 0.55;
        for (const [x, tape, k] of [[G.lx, tl, 1], [G.rx, tr, 1.25]]) {
          ctx.save(); ctx.beginPath(); ctx.rect(G.cx - G.w * 0.3, G.cy - G.h * 0.5 + G.h * 0.34 + 2, G.w * 0.6, G.h * 0.3 - 4); ctx.clip();
          ctx.beginPath(); ctx.arc(x, G.ry, tape, 0, TAU); ctx.fillStyle = '#5A3A2A'; ctx.fill(); ctx.restore();
          ctx.beginPath(); ctx.arc(x, G.ry, G.r * 0.55, 0, TAU); ctx.fillStyle = '#F3EAD8'; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = '#0A0E19'; ctx.stroke();
          ctx.save(); ctx.translate(x, G.ry); ctx.rotate(rot * k);
          for (let i = 0; i < 6; i++) { ctx.rotate(TAU / 6); ctx.fillStyle = '#0A0E19'; ctx.fillRect(G.r * 0.22, -3, G.r * 0.2, 6); }
          ctx.restore();
        }
        // القلم
        ctx.save(); ctx.translate(G.lx, G.ry); ctx.rotate(rot - Math.PI * 0.75);
        const L = G.r * 2.6;
        ctx.lineWidth = 3; ctx.strokeStyle = '#0A0E19';
        rr(ctx, -5, -7, L, 14, 4); ctx.fillStyle = P.butter; ctx.fill(); ctx.stroke();
        ctx.fillStyle = P.rose; rr(ctx, L - 14, -7, 14, 14, 4); ctx.fill(); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(-5, -7); ctx.lineTo(-16, 0); ctx.lineTo(-5, 7); ctx.fillStyle = '#E9C9A0'; ctx.fill(); ctx.stroke();
        ctx.restore();
        ctx.beginPath(); ctx.arc(G.lx, G.ry, 6, 0, TAU); ctx.fillStyle = '#0A0E19'; ctx.fill();
        if (!R.done) {
          ctx.save(); ctx.translate(G.lx, G.ry); ctx.strokeStyle = wrong ? P.rose : P.aqua; ctx.lineWidth = 4; ctx.setLineDash([2, 8]); ctx.lineCap = 'round';
          const a0 = -Math.PI * 0.9, a1 = a0 + 1.6 * dir;
          ctx.beginPath(); ctx.arc(0, 0, G.r * 3.0, Math.min(a0, a1), Math.max(a0, a1)); ctx.stroke(); ctx.setLineDash([]);
          const ex = Math.cos(a1) * G.r * 3, ey = Math.sin(a1) * G.r * 3; ctx.fillStyle = wrong ? P.rose : P.aqua;
          ctx.translate(ex, ey); ctx.rotate(a1 + (dir > 0 ? Math.PI / 2 : -Math.PI / 2)); ctx.beginPath(); ctx.moveTo(0, -8); ctx.lineTo(9, 6); ctx.lineTo(-9, 6); ctx.fill();
          ctx.restore();
        }
        // التعليمة والتقدّم
        const flipping = performance.now() - flipT < 1100;
        txt(ctx, R.done ? (pr >= 0.9999 ? '♪ رجع الشريط كله!' : 'خلص الوقت') : (dir < 0 ? 'لفّ عكس عقارب الساعة ↺' : 'لفّ مع عقارب الساعة ↻'), S.W / 2, Math.max(18, G.cy - G.h * 0.5 - 18), 15, wrong ? P.rose : '#F3EAD8');
        if (flipping && !R.done) { const k = 1 + Math.sin((performance.now() - flipT) / 60) * 0.06; ctx.save(); ctx.translate(S.W / 2, S.H * 0.62); ctx.scale(k, k); rr(ctx, -120, -36, 240, 72, 36); ctx.fillStyle = P.rose; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = '#0A0E19'; ctx.stroke(); txt(ctx, 'اعكس! ' + (dir < 0 ? '↺' : '↻'), 0, 0, 30, '#fff', 600, TFONT); ctx.restore(); }
        for (let i = 0; i < segs.length; i++) { const bx = 16 + i * 26; rr(ctx, bx, S.H - 34, 20, 20, 6); ctx.fillStyle = i < seg ? P.aqua : i === seg ? P.butter : 'rgba(255,255,255,.18)'; ctx.fill(); txt(ctx, segs[i].dir < 0 ? '↺' : '↻', bx + 10, S.H - 24, 13, '#1B2238', 700); }
        rr(ctx, S.W - 92, S.H - 40, 80, 28, 14); ctx.fillStyle = 'rgba(15,20,36,.8)'; ctx.fill();
        txt(ctx, '⁦' + pct() + '%⁩', S.W - 52, S.H - 26, 16, P.butter, 700, 'ui-monospace, monospace');
        if (!R.done && R.started() && R.left() <= 0) R.timePartial(pr, pct() + '%');
      });
      return { destroy() { stop(); S.destroy(); }, forceEnd() { R.timePartial(acc / need, pct() + '%'); } };
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
      function onOri(e) {
        if (e.gamma == null && e.beta == null) return;
        const ang0 = (screen.orientation && typeof screen.orientation.angle === 'number') ? screen.orientation.angle : (window.orientation || 0);
        let v = e.gamma;
        if (ang0 === 90) v = -e.beta; else if (ang0 === 270 || ang0 === -90) v = e.beta;
        if (v == null || isNaN(v)) return;
        sensorAng = clamp(v * 1.6, -75, 75); sensorAt = performance.now();
      }
      function onMot(e) { // بديل: الجاذبية من حساس الحركة، إذا حساس الاتجاه ما بعت شي
        if (performance.now() - sensorAt < 400) return;
        const gr = e.accelerationIncludingGravity; if (!gr || gr.x == null) return;
        const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
        const deg = Math.asin(clamp((ios ? gr.x : -gr.x) / 9.81, -1, 1)) * 180 / Math.PI;
        sensorAng = clamp(deg * 1.6, -75, 75); sensorAt = performance.now() - 200;
      }
      let permAsked = false;
      async function askPerm() {
        if (permAsked) return; permAsked = true;
        try { if (window.DeviceOrientationEvent && typeof DeviceOrientationEvent.requestPermission === 'function') await DeviceOrientationEvent.requestPermission(); } catch (e) {}
        try { if (window.DeviceMotionEvent && typeof DeviceMotionEvent.requestPermission === 'function') await DeviceMotionEvent.requestPermission(); } catch (e) {}
      }
      window.addEventListener('deviceorientation', onOri);
      window.addEventListener('devicemotion', onMot);
      function down(e) { askPerm(); S.cv.setPointerCapture(e.pointerId); drag = S.local(e).x; dragAng = input; }
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
          if (hold >= 1100) { ch++; hold = 0; flash = 1; beep(990, 0.1, 'triangle', 0.05); buzz(30); R.prog(ch / 3); if (ch >= 3) { const ms = R.elapsed(); R.timeDone(ms); } }
          if (R.left() <= 0 && !R.done) R.timePartial(ch / 3, ch + '/3 قنوات');
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
        if (!R.done) { rr(ctx, W / 2 - 130, H - 62, 260, 26, 13); ctx.fillStyle = 'rgba(10,14,25,.6)'; ctx.fill(); txt(ctx, sensorLive ? 'ميّل الموبايل يمين ويسار' : 'ميّل الموبايل، أو اسحب بإصبعك يمين ويسار', W / 2, H - 49, 13, '#F3EAD8', 600); }
        else txt(ctx, '📺 صفيت القنوات كلها!', W / 2, H - 46, 17, '#F3EAD8');
      });
      return { destroy() { stop(); S.destroy(); window.removeEventListener('deviceorientation', onOri); window.removeEventListener('devicemotion', onMot); }, forceEnd() { R.timePartial(ch / 3, ch + '/3 قنوات'); } };
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
          if (dg === num[pos]) { pos++; okT = performance.now(); beep(520, 0.05); buzz(15); R.prog(pos / 6); if (pos >= 6) { const ms = R.elapsed(); R.timeDone(ms); } }
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
        if (!R.done && R.started() && R.left() <= 0) R.timePartial(pos / 6, pos + '/6 أرقام');
      });
      return { destroy() { stop(); S.destroy(); }, forceEnd() { R.timePartial(pos / 6, pos + '/6 أرقام'); } };
    }
  };

  // ═══════════════ 4) رسالة T9 ═══════════════
  const T9 = { '1': '.،؟!', '2': 'بتثة', '3': 'اأإآءىئؤ', '4': 'سشصض', '5': 'دذرز', '6': 'جحخ', '7': 'نهوي', '8': 'فقكلم', '9': 'طظعغ', '0': ' ' };
  const T9LAT = { '1': 'oo', '2': 'abc', '3': 'def', '4': 'ghi', '5': 'jkl', '6': 'mno', '7': 'pqrs', '8': 'tuv', '9': 'wxyz', '0': '⎵' };
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
        else b.innerHTML = `<b>${k}</b><small>${k === '0' ? 'مسافة' : k === '1' ? '. ، ؟' : k === '3' ? 'ا ء' : T9[k].split('').join(' ')}</small><em>${T9LAT[k]}</em>`;
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
        if (f === target) { commit(); const ms = R.elapsed(); beep(990, 0.15, 'triangle', 0.05); R.timeDone(ms); draw(); }
      }
      function draw() {
        const f = full();
        tgt.innerHTML = 'اكتب: <b>' + target.split('').map((ch, i) => `<i class="${i < f.length ? (f[i] === ch ? 'ok' : 'no') : ''}">${ch === ' ' ? '&nbsp;' : ch}</i>`).join('') + '</b>';
        typed.innerHTML = (text.replace(/ /g, '&nbsp;')) + (pend ? `<u>${pend}</u>` : '') + (R.done ? ' ✓' : '<span class="cur"></span>');
      }
      draw();
      const iv = setInterval(() => { if (!R.done && R.started() && R.left() <= 0) { const f = full(); let ok = 0; while (ok < f.length && f[ok] === target[ok]) ok++; R.timePartial(ok / target.length, ok + '/' + target.length + ' حرف'); } }, 250);
      return { destroy() { clearInterval(iv); clearTimeout(pendT); }, forceEnd() { const f = full(); let ok = 0; while (ok < f.length && f[ok] === target[ok]) ok++; R.timePartial(ok / target.length, ok + '/' + target.length + ' حرف'); } };
    }
  };

  // ═══════════════ 6) الكلل ═══════════════
  // معك 5 كلل، بترميهن عالخط المرسوم. كل كلّة بتضل مكان ما وقفت، ومنقيس بُعد كل وحدة عن الخط. أقل مجموع بيربح.
  const marbles = {
    mount(el, X) {
      const WW = 100, HH = 160, CM = 2; // كل وحدة = 2 سم
      const S = Stage(el, { w: WW, h: HH }), ctx = S.ctx, R = Runner(X);
      const lineY = 30 + X.rng() * 26;
      const start = { x: 50, y: 142 };
      const MR = 3.4, N = 5;
      const COLS = ['--c1', '--c6', '--c5', '--c7', '--c3'];
      const balls = [];
      let cur = null, shots = 0, state = 'aim', drag = null, aimV = null, msg = '', msgT = 0, P = pal();
      function newBall() { cur = { x: start.x, y: start.y, vx: 0, vy: 0, col: COLS[shots % 5] }; }
      newBall();
      function down(e) { if (!R.started() || R.done || state !== 'aim') return; S.cv.setPointerCapture(e.pointerId); drag = S.toWorld(e); aimV = { x: 0, y: 0 }; }
      function move(e) {
        if (!drag) return; const p = S.toWorld(e);
        let dx = p.x - drag.x, dy = p.y - drag.y; const L = Math.hypot(dx, dy), max = 44;
        if (L > max) { dx *= max / L; dy *= max / L; } aimV = { x: dx, y: dy };
      }
      function up() {
        if (!drag) return; drag = null;
        if (!aimV || Math.hypot(aimV.x, aimV.y) < 3) { aimV = null; return; }
        cur.vx = -aimV.x * 3.2; cur.vy = -aimV.y * 3.2; aimV = null; balls.push(cur); state = 'roll'; shots++;
        beep(400, 0.05, 'triangle', 0.05); buzz(15);
      }
      S.cv.addEventListener('pointerdown', down); S.cv.addEventListener('pointermove', move); S.cv.addEventListener('pointerup', up); S.cv.addEventListener('pointercancel', up);
      function collide(a, b) {
        const dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy), min = MR * 2;
        if (d > 0 && d < min) {
          const nx = dx / d, ny = dy / d, ov = (min - d) / 2; a.x -= nx * ov; a.y -= ny * ov; b.x += nx * ov; b.y += ny * ov;
          const rv = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny;
          if (rv < 0) { const j = -rv * 0.93; a.vx -= j * nx; a.vy -= j * ny; b.vx += j * nx; b.vy += j * ny; if (Math.abs(rv) > 6) beep(1500, 0.02, 'square', 0.03); }
        }
      }
      function step(dt) {
        for (const b of balls) {
          b.x += b.vx * dt; b.y += b.vy * dt; const f = Math.pow(0.3, dt); b.vx *= f; b.vy *= f;
          if (b.x < MR) { b.x = MR; b.vx = Math.abs(b.vx) * 0.5; } if (b.x > WW - MR) { b.x = WW - MR; b.vx = -Math.abs(b.vx) * 0.5; }
          if (b.y < MR) { b.y = MR; b.vy = Math.abs(b.vy) * 0.5; } if (b.y > HH - MR) { b.y = HH - MR; b.vy = -Math.abs(b.vy) * 0.5; }
        }
        for (let i = 0; i < balls.length; i++) for (let j = i + 1; j < balls.length; j++) collide(balls[i], balls[j]);
      }
      const dist = b => Math.abs(b.y - lineY) * CM; // سم
      function total() { return balls.reduce((a, b) => a + dist(b), 0) + (N - shots) * 200; }
      function fin(done) { const t = Math.round(total()); R.finish(-t, t + ' سم', done, t, 'سم'); }
      const stop = loop((dt) => {
        P = pal();
        if (state === 'roll') {
          for (let i = 0; i < 3; i++) step(dt / 3);
          if (!balls.some(b => Math.hypot(b.vx, b.vy) > 1.1)) {
            for (const b of balls) b.vx = b.vy = 0;
            const last = balls[balls.length - 1]; msg = Math.round(dist(last)) + ' سم عن الخط'; msgT = performance.now();
            if (Math.round(dist(last)) <= 2) { beep(1046, 0.15, 'triangle', 0.06); buzz([20, 30, 40]); msg = 'عالخط! 🎯'; }
            R.prog(shots / N);
            if (shots >= N) { state = 'over'; fin(true); } else { state = 'aim'; newBall(); }
          }
        }
        if (!R.done && R.started() && R.left() <= 0) fin(false);
        S.screenT(); ctx.clearRect(0, 0, S.W, S.H); S.worldT();
        ctx.fillStyle = '#C9A774'; rr(ctx, 0, 0, WW, HH, 6); ctx.fill();
        ctx.fillStyle = 'rgba(90,58,42,.12)'; for (let i = 0; i < 40; i++) { const x = (i * 37.3) % WW, y = (i * 61.7) % HH; ctx.beginPath(); ctx.arc(x, y, 0.7 + (i % 3) * 0.4, 0, TAU); ctx.fill(); }
        // خط الرمي (تحت) وخط الهدف (فوق)
        ctx.setLineDash([2, 2]); ctx.strokeStyle = 'rgba(243,234,216,.7)'; ctx.lineWidth = 0.7; ctx.beginPath(); ctx.moveTo(6, start.y + 7); ctx.lineTo(WW - 6, start.y + 7); ctx.stroke(); ctx.setLineDash([]);
        ctx.strokeStyle = '#FFFDF6'; ctx.lineWidth = 1.8; ctx.beginPath(); ctx.moveTo(4, lineY); for (let x = 4; x <= WW - 4; x += 4) ctx.lineTo(x, lineY + Math.sin(x * 1.3) * 0.35); ctx.stroke();
        for (const b of balls) {
          marble(b.x, b.y, css(b.col));
          if (Math.hypot(b.vx, b.vy) < 1.1) { ctx.strokeStyle = 'rgba(27,34,56,.45)'; ctx.lineWidth = 0.4; ctx.setLineDash([1, 1]); ctx.beginPath(); ctx.moveTo(b.x, b.y); ctx.lineTo(b.x, lineY); ctx.stroke(); ctx.setLineDash([]); }
        }
        if (state === 'aim' && cur) marble(cur.x, cur.y, css(cur.col), true);
        if (aimV && state === 'aim') {
          const L = Math.hypot(aimV.x, aimV.y);
          ctx.setLineDash([1.5, 2.5]); ctx.strokeStyle = '#F3EAD8'; ctx.lineWidth = 1.1; ctx.beginPath(); ctx.moveTo(cur.x, cur.y); ctx.lineTo(cur.x - aimV.x * 1.4, cur.y - aimV.y * 1.4); ctx.stroke(); ctx.setLineDash([]);
          ctx.beginPath(); ctx.arc(cur.x, cur.y, MR + 1 + L / 44 * 5, 0, TAU); ctx.strokeStyle = L > 36 ? P.rose : P.butter; ctx.lineWidth = 1; ctx.stroke();
        }
        S.screenT();
        for (let i = 0; i < N; i++) { const used = i < shots; ctx.beginPath(); ctx.arc(18 + i * 17, 20, 6, 0, TAU); ctx.fillStyle = used ? 'rgba(27,34,56,.15)' : css(COLS[i]); ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = '#1B2238'; ctx.stroke(); }
        const shownT = Math.round(balls.reduce((a, b) => a + dist(b), 0));
        txt(ctx, 'المجموع: ⁦' + shownT + ' سم⁩', S.W - 14, 20, 13, '#1B2238', 700, FONT, 'right');
        if (performance.now() - msgT < 1300 && msg) { const w0 = Math.min(S.W - 30, 220); rr(ctx, S.W / 2 - w0 / 2, S.H * 0.6 - 20, w0, 40, 20); ctx.fillStyle = 'rgba(27,34,56,.88)'; ctx.fill(); txt(ctx, msg, S.W / 2, S.H * 0.6, 16, '#F3EAD8'); }
        if (state === 'aim' && !R.done && R.started() && shots === 0) txt(ctx, 'اسحب لورا وفلّت، وخلّي الكلّة توقف عالخط الأبيض', S.W / 2, S.H - 14, 12.5, '#1B2238', 700);
        if (R.done) txt(ctx, 'المجموع: ' + Math.round(total()) + ' سم', S.W / 2, S.H * 0.82, 20, '#1B2238', 700, TFONT);
      });
      function marble(x, y, col, mine) {
        const r = MR;
        ctx.beginPath(); ctx.arc(x + 0.6, y + 0.8, r, 0, TAU); ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.fill();
        ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fillStyle = col; ctx.fill(); ctx.lineWidth = mine ? 1 : 0.6; ctx.strokeStyle = '#0A0E19'; ctx.stroke();
        ctx.beginPath(); ctx.ellipse(x, y, r * 0.5, r * 0.18, 0.8, 0, TAU); ctx.fillStyle = 'rgba(255,255,255,.55)'; ctx.fill();
        ctx.beginPath(); ctx.arc(x - r * 0.35, y - r * 0.35, r * 0.22, 0, TAU); ctx.fillStyle = 'rgba(255,255,255,.85)'; ctx.fill();
        if (mine) { ctx.beginPath(); ctx.arc(x, y, r + 1.4, 0, TAU); ctx.strokeStyle = 'rgba(255,255,255,.75)'; ctx.lineWidth = 0.6; ctx.stroke(); }
      }
      return { destroy() { stop(); S.destroy(); }, forceEnd() { fin(false); } };
    }
  };

  // ═══════════════ 7) طاق طاق طاقية ═══════════════
  // كل 4 لاعبين طاقية. لكل طاقية فتيل بيبيّن للكل. كبسة على حدا = بترمي الطاقية عليه. اللي بتحترق معه بيطلع.
  const hat = {
    server: true,
    mount(el, X) {
      el.innerHTML = `<div class="hat2"><div class="hat-top"><span class="hat-alive"></span><span class="hat-hats"></span></div><div class="hat-ring"></div><div class="hat-say"></div><div class="hat-msg"></div></div>`;
      const root = el.querySelector('.hat2'), ring = el.querySelector('.hat-ring'), say = el.querySelector('.hat-say'), msg = el.querySelector('.hat-msg');
      const aliveEl = el.querySelector('.hat-alive'), hatsEl = el.querySelector('.hat-hats');
      let s = null, built = '', lastMine = false, lastBurnAt = 0, raf = 0;
      function layout(ids) {
        const n = ids.length;
        ring.innerHTML = ids.map((id, i) => {
          const a = (i / n) * TAU - Math.PI / 2; const x = 50 + Math.cos(a) * 39, y = 50 + Math.sin(a) * 41;
          return `<button class="hp" data-id="${id}" style="left:${x}%;top:${y}%;--pc:var(--c${X.player(id).color})">${X.avatar(id, n > 10 ? 40 : 48)}<span class="hp-n">${X.esc(X.nameOf(id))}</span><i class="hp-hat">${X.icon('hatCap')}<svg class="fuse" viewBox="0 0 40 40"><circle cx="20" cy="20" r="17"/></svg></i></button>`;
        }).join('');
        ring.querySelectorAll('.hp').forEach(b => b.addEventListener('pointerdown', (e) => { e.preventDefault(); tap(b.dataset.id); }));
      }
      function tap(to) {
        if (!s || !s.cur || !s.cur.hat) return;
        const h = s.cur.hat; if (X.now() < h.pause) return;
        if (!h.hats.some(x => x.holder === X.me)) return;
        if (to === X.me || !h.alive.includes(to) || h.hats.some(x => x.holder === to)) { buzz(30); return; }
        X.hatPass(to); beep(720, 0.05, 'triangle', 0.05); buzz(12);
      }
      function render() {
        if (!s || !s.cur || !s.cur.hat) return;
        const c = s.cur, h = c.hat;
        const key = c.active.join('|'); if (key !== built) { built = key; layout(c.active); }
        const now = X.now();
        const mine = h.hats.find(x => x.holder === X.me);
        const imAlive = h.alive.includes(X.me);
        const outSet = new Set([].concat(...h.out));
        ring.querySelectorAll('.hp').forEach(b => {
          const id = b.dataset.id; const hat = h.hats.find(x => x.holder === id);
          b.classList.toggle('out', outSet.has(id));
          b.classList.toggle('has', !!hat);
          b.classList.toggle('me', id === X.me);
          b.classList.toggle('can', !!mine && now >= h.pause && id !== X.me && h.alive.includes(id) && !hat);
          b.classList.toggle('burn', !!(h.msg && h.msg.burned.includes(id) && now - h.msg.at < 2500));
          if (hat) {
            const left = Math.max(0, hat.fuseEnd - Math.max(now, hat.fuseStart)), total = hat.fuseEnd - hat.fuseStart;
            const f = b.querySelector('.fuse circle'); const fr = Math.max(0, Math.min(1, left / total));
            f.style.strokeDashoffset = String(107 * (1 - fr));
            b.style.setProperty('--heat', fr < 0.25 ? 'var(--c2)' : fr < 0.5 ? 'var(--c0)' : 'var(--c4)');
            b.classList.toggle('hot', fr < 0.25);
          } else b.classList.remove('hot');
        });
        aliveEl.textContent = 'صامدين: ' + h.alive.length;
        hatsEl.textContent = (h.hats.length || '') + (h.hats.length ? ' طاقية' : '');
        if (mine && !lastMine) { buzz([60, 40, 60]); beep(330, 0.1, 'triangle', 0.05); }
        lastMine = !!mine;
        root.classList.toggle('mine', !!mine);
        if (h.msg && h.msg.at !== lastBurnAt) { lastBurnAt = h.msg.at; beep(160, 0.35, 'sawtooth', 0.05); buzz([80, 40, 80]); }
        if (now < c.startAt) { say.textContent = ''; msg.textContent = 'جهّزوا حالكن…'; }
        else if (h.msg && now - h.msg.at < 2500) { say.textContent = '🔥 احترقت!'; msg.innerHTML = 'طلع: <b>' + h.msg.burned.map(id => X.esc(X.nameOf(id))).join(' و ') + '</b>'; }
        else if (!imAlive) { say.textContent = ''; msg.textContent = X.g('طلعت، بس ضل شوف مين بيحترق 👀', 'طلعتي، بس ضلّي شوفي مين بيحترق 👀'); }
        else if (mine) {
          const left = (mine.fuseEnd - now) / 1000;
          say.textContent = left < 2 ? 'ارميها هلأ!' : 'معك طاقية!';
          msg.textContent = 'اكبس على أي حدا ما معه طاقية لترميها عليه';
        } else { say.textContent = ''; msg.textContent = h.hats.length ? 'انتبه… ممكن تجيك بأي لحظة' : ''; }
      }
      const loopRender = () => { raf = requestAnimationFrame(loopRender); render(); };
      raf = requestAnimationFrame(loopRender);
      return { onState(ns) { s = ns; }, destroy() { cancelAnimationFrame(raf); } };
    }
  };

  // ═══════════════ الكراسي الموسيقية ═══════════════
  // الموسيقى بتشتغل، وفجأة بتوقف: كل واحد بيكبس على كرسي فاضي بسرعة. الكراسي أقل بواحد، واللي ما بيقعد بيطلع.
  const chairs = {
    server: true,
    mount(el, X) {
      el.innerHTML = `<div class="ch"><div class="ch-vol">🔊 علّي صوت الموبايل!</div><div class="ch-top"><span class="ch-round"></span><span class="ch-alive"></span></div><div class="ch-ring"></div><div class="ch-center"><div class="ch-notes">♪ ♫ ♪</div><div class="ch-say"></div></div><div class="ch-msg"></div></div>`;
      const root = el.querySelector('.ch'), ring = el.querySelector('.ch-ring'), say = el.querySelector('.ch-say'), msg = el.querySelector('.ch-msg');
      let s = null, built = '', raf = 0, melody = null, lastPhase = '', tapped = -1;
      const NOTES = [523, 587, 659, 523, 659, 784, 659, 587, 523, 494, 523, 587];
      function music(on) {
        if (on && !melody) { let k = 0; melody = setInterval(() => { beep(NOTES[k % NOTES.length], 0.17, 'square', 0.09); if (k % 2 === 0) beep(NOTES[k % NOTES.length] / 2, 0.12, 'triangle', 0.08); k++; }, 210); }
        if (!on && melody) { clearInterval(melody); melody = null; }
      }
      function layout(ch) {
        const n = ch.n; const r0 = X.mulberry(ch.layout);
        const order = Array.from({ length: n }, (_, i) => i).sort(() => r0() - 0.5);
        ring.innerHTML = order.map((idx, k) => {
          const a = (k / n) * TAU - Math.PI / 2 + r0() * 0.15; const rad = n <= 3 ? 30 : 38;
          const x = 50 + Math.cos(a) * rad, y = 50 + Math.sin(a) * (rad + 3);
          return `<button class="chair" data-i="${idx}" style="left:${x}%;top:${y}%">${X.icon('chair')}<span class="seat"></span></button>`;
        }).join('');
        ring.querySelectorAll('.chair').forEach(b => b.addEventListener('pointerdown', (e) => { e.preventDefault(); tapped = +b.dataset.i; X.sit(+b.dataset.i); beep(880, 0.04, 'square', 0.04); buzz(10); }));
      }
      function render() {
        if (!s || !s.cur || !s.cur.chairs) return;
        const c = s.cur, ch = c.chairs, now = X.now();
        const key = ch.round + ':' + ch.n + ':' + ch.layout; if (key !== built) { built = key; layout(ch); tapped = -1; }
        const alive = ch.alive.includes(X.me), seated = ch.seats.includes(X.me), frozen = (ch.frozen[X.me] || 0) > now;
        const started = now >= c.startAt;
        const phase = !started ? 'wait' : ch.phase;
        music(phase === 'music');
        if (phase !== lastPhase) { if (phase === 'sit') { buzz([80]); beep(220, 0.2, 'square', 0.05); } lastPhase = phase; }
        root.dataset.phase = phase;
        root.classList.toggle('frozen', alive && frozen);
        ring.querySelectorAll('.chair').forEach(b => {
          const i = +b.dataset.i, who = ch.seats[i];
          b.classList.toggle('taken', !!who); b.classList.toggle('mine', who === X.me);
          const seat = b.querySelector('.seat');
          if (who && seat.dataset.who !== who) { seat.dataset.who = who; seat.innerHTML = X.avatar(who, 34); }
          if (!who && seat.dataset.who) { seat.dataset.who = ''; seat.innerHTML = ''; }
        });
        el.querySelector('.ch-round').textContent = 'جولة ' + ch.round;
        el.querySelector('.ch-alive').textContent = ch.n + ' كرسي · ' + ch.alive.length + ' لاعب';
        if (phase === 'wait') { say.textContent = ''; msg.textContent = 'جهّزوا حالكن…'; }
        else if (phase === 'music') { say.textContent = '🎵'; msg.textContent = alive ? (frozen ? X.g('تجمّدت! كبست قبل ما توقف الموسيقى', 'تجمّدتي! كبستي قبل ما توقف الموسيقى') : 'استنى توقف الموسيقى… لا تكبس هلأ!') : X.g('طلعت، شجّع الباقيين 👀', 'طلعتي، شجّعي الباقيين 👀'); }
        else if (phase === 'sit') { say.textContent = 'اقعد!'; msg.textContent = !alive ? 'مين رح يضل واقف؟' : seated ? X.g('قعدت ✓', 'قعدتي ✓') : frozen ? 'متجمّد… لحظة!' : 'اكبس على كرسي فاضي بسرعة!'; }
        else if (phase === 'out') { say.textContent = ''; msg.innerHTML = ch.lastOut && ch.lastOut.length ? 'ضلّ واقف: <b>' + ch.lastOut.map(id => X.esc(X.nameOf(id))).join(' و ') + '</b>' : ''; }
      }
      const loopRender = () => { raf = requestAnimationFrame(loopRender); render(); };
      raf = requestAnimationFrame(loopRender);
      return { onState(ns) { s = ns; }, destroy() { cancelAnimationFrame(raf); music(false); } };
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
      function done() { const s = score(); R.finish(s.rk, s.label, true, placed, 'حجرة'); }
      S.cv.addEventListener('pointerdown', tap);
      const stop = loop((dt) => {
        P = pal();
        if (cur && R.started() && !R.done) { cur.x += dirv * speed * dt; if (cur.x + cur.w > WW + 6) { cur.x = WW + 6 - cur.w; dirv = -1; } if (cur.x < -6) { cur.x = -6; dirv = 1; } }
        if (!R.done && R.started() && R.left() <= 0) { const s = score(); R.finish(s.rk, s.label, false, placed, 'حجرة'); cur = null; }
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
      return { destroy() { stop(); S.destroy(); }, forceEnd() { const s = score(); R.finish(s.rk, s.label, false, placed, 'حجرة'); } };
    }
  };

  // ═══════════════ 10) الدولاب والعصاية ═══════════════
  // طريق بيلفّ، والدولاب لازم يضل ماشي وما يطلع برّا الطريق. كبسة يمين = ضربة بتدفشه يمين، وشمال = شمال.
  const hoop = {
    mount(el, X) {
      const S = Stage(el), ctx = S.ctx, R = Runner(X);
      const s1 = X.rng() * 6, s2 = X.rng() * 6, s3 = X.rng() * 6;
      const center = d => { const k = Math.min(1, d / 260); return (9 + 5 * k) * Math.sin(d / 21 + s1) + (5 + 6 * k) * Math.sin(d / 8.5 + d * d / 16000 + s2) + (2 + 5 * k) * Math.sin(d / 4.2 + d * d / 9000 + s3); };
      const halfW = d => Math.max(4.6, 8.5 - d * 0.016);
      let d = 0, x = center(0), vx = 0, v = 0, started = false, fallen = false, fallT = 0, hitT = -1, hitSide = 0, slowT = 0, roll = 0, camX = x, P = pal(), msg = '', why = '';
      function hit(e) {
        if (!R.started() || R.done || fallen) return;
        const p = S.local(e); const side = p.x < S.W / 2 ? -1 : 1;
        started = true; v = Math.min(8.5, v + 1.05); vx += side * 2.6; hitT = performance.now(); hitSide = side;
        beep(side < 0 ? 520 : 620, 0.04, 'square', 0.035); buzz(10);
      }
      S.cv.addEventListener('pointerdown', hit);
      function fall(reason) { if (fallen) return; fallen = true; why = reason; fallT = 0; beep(180, 0.3, 'sawtooth', 0.05); buzz([60, 40, 60]); fin(); }
      function fin() { const m = Math.floor(d); R.finish(m, m + ' م', true, m, 'م'); }
      const stop = loop((dt) => {
        P = pal();
        if (R.started() && !R.done && started && !fallen) {
          v = Math.max(0, v - (0.85 + v * 0.09) * dt);
          d += v * dt; roll += v * dt * 2.2;
          x += vx * dt; vx *= Math.pow(0.18, dt);
          x += Math.sin(performance.now() / 260) * (v < 2.5 ? (2.5 - v) * 0.6 : 0.15) * dt; // رجفة الدولاب لما يبطّئ
          if (v < 1.1) { slowT += dt; if (slowT > 0.7) fall('وقف الدولاب ووقع'); } else slowT = 0;
          if (Math.abs(x - center(d)) > halfW(d)) fall('طلع برّا الطريق');
          R.prog(Math.min(1, d / 150));
        }
        if (fallen) fallT = Math.min(1, fallT + dt * 2.5);
        if (!R.done && R.started() && R.left() <= 0) fin();
        camX += (x - camX) * Math.min(1, dt * 3);
        const W = S.W, H = S.H; ctx.clearRect(0, 0, W, H);
        const k = W / 32, ppm = H / 40, by = H * 0.74;
        const sx = wx => W / 2 + (wx - camX) * k, sy = wd => by - (wd - d) * ppm;
        // التراب والطريق
        ctx.fillStyle = '#6E8F4E'; ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = 'rgba(0,0,0,.08)'; for (let i = 0; i < 30; i++) { const yy = ((i * 53 + d * ppm) % (H + 40)) - 20, xx = (i * 97) % W; ctx.fillRect(xx, yy, 3, 8); }
        ctx.beginPath();
        for (let wd = d - 12; wd <= d + 44; wd += 0.8) { const yy = sy(wd), xx = sx(center(wd) - halfW(wd)); wd === d - 12 ? ctx.moveTo(xx, yy) : ctx.lineTo(xx, yy); }
        for (let wd = d + 44; wd >= d - 12; wd -= 0.8) ctx.lineTo(sx(center(wd) + halfW(wd)), sy(wd));
        ctx.closePath(); ctx.fillStyle = '#C9A774'; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = '#0A0E19'; ctx.stroke();
        // حجار الطريق
        ctx.fillStyle = 'rgba(90,58,42,.25)';
        for (let wd = Math.floor(d - 12); wd < d + 44; wd += 1.6) { const c0 = center(wd); for (const o of [-0.5, 0.3]) { ctx.beginPath(); ctx.ellipse(sx(c0 + o * halfW(wd) + Math.sin(wd * 3) * 1.5), sy(wd), 3, 2, 0, 0, TAU); ctx.fill(); } }
        // علامات المسافة
        for (let m = Math.ceil((d - 12) / 10) * 10; m < d + 44; m += 10) { if (m <= 0) continue; const yy = sy(m); ctx.setLineDash([4, 6]); ctx.strokeStyle = 'rgba(243,234,216,.6)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(sx(center(m) - halfW(m)), yy); ctx.lineTo(sx(center(m) + halfW(m)), yy); ctx.stroke(); ctx.setLineDash([]); txt(ctx, m + ' م', sx(center(m) + halfW(m)) + 22, yy, 12, '#F3EAD8', 700); }
        // الدولاب
        const hx = sx(x), hy = by;
        ctx.save(); ctx.translate(hx, hy);
        const tilt = fallen ? (Math.sign(vx || 1) * fallT * 1.3) : Math.max(-0.5, Math.min(0.5, vx * 0.07 + (v < 2.5 ? Math.sin(performance.now() / 150) * (2.5 - v) * 0.08 : 0)));
        ctx.rotate(tilt);
        const hr = Math.min(W, H) * 0.09;
        ctx.beginPath(); ctx.ellipse(0, hr * 0.15, hr * 0.32, hr * 0.12, 0, 0, TAU); ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.fill();
        // دولاب من ورا: إهليلج رفيع مع خطوط بتمشي
        ctx.beginPath(); ctx.ellipse(0, -hr, hr * 0.26, hr, 0, 0, TAU); ctx.lineWidth = 7; ctx.strokeStyle = '#0A0E19'; ctx.stroke(); ctx.lineWidth = 4; ctx.strokeStyle = P.orange; ctx.stroke();
        for (let i = 0; i < 6; i++) { const a = roll + i * TAU / 6; const yy = -hr - Math.cos(a) * hr; if (Math.sin(a) > 0) { ctx.fillStyle = '#0A0E19'; ctx.fillRect(-hr * 0.28, yy - 2, hr * 0.56, 4); } }
        ctx.restore();
        // العصاية: بتضرب من الجهة اللي كبست عليها
        const ht = (performance.now() - hitT) / 1000;
        if (ht < 0.25 && !fallen) {
          const side = hitSide; ctx.save(); ctx.translate(hx - side * hr * 0.35, hy - hr * 0.9); ctx.rotate(side * (0.9 - ht * 2));
          ctx.lineCap = 'round'; ctx.lineWidth = 7; ctx.strokeStyle = '#0A0E19'; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-side * hr * 1.6, hr * 1.3); ctx.stroke();
          ctx.lineWidth = 3.5; ctx.strokeStyle = P.butter; ctx.stroke(); ctx.restore();
        }
        // السرعة والمسافة
        rr(ctx, 12, 12, 130, 34, 17); ctx.fillStyle = 'rgba(15,20,36,.78)'; ctx.fill();
        txt(ctx, '⁦' + Math.floor(d) + ' م⁩', 77, 29, 20, '#F3EAD8', 700, 'ui-monospace, monospace');
        const bw = Math.min(W * 0.4, 150); rr(ctx, W - bw - 12, 22, bw, 12, 6); ctx.fillStyle = 'rgba(15,20,36,.6)'; ctx.fill();
        rr(ctx, W - 12 - bw * Math.min(1, v / 8.5), 22, bw * Math.min(1, v / 8.5), 12, 6); ctx.fillStyle = v < 2 ? P.rose : P.butter; ctx.fill();
        if (!started && R.started()) { rr(ctx, W / 2 - 150, H * 0.36 - 24, 300, 48, 24); ctx.fillStyle = 'rgba(15,20,36,.85)'; ctx.fill(); txt(ctx, 'اكبس يمين أو شمال لتضرب الدولاب', W / 2, H * 0.36, 15, '#F3EAD8'); }
        else if (!R.done) { ctx.globalAlpha = 0.5; txt(ctx, '⟵ شمال', W * 0.18, H - 22, 14, '#F3EAD8'); txt(ctx, 'يمين ⟶', W * 0.82, H - 22, 14, '#F3EAD8'); ctx.globalAlpha = 1; }
        if (fallen || R.done) { rr(ctx, W / 2 - 140, H * 0.36 - 30, 280, 60, 20); ctx.fillStyle = 'rgba(15,20,36,.88)'; ctx.fill(); txt(ctx, why || 'خلص الوقت', W / 2, H * 0.36 - 10, 15, P.butter); txt(ctx, 'المسافة: ' + Math.floor(d) + ' م', W / 2, H * 0.36 + 14, 16, '#F3EAD8'); }
        void msg;
      });
      return { destroy() { stop(); S.destroy(); }, forceEnd: fin };
    }
  };

  // ═══════════════ 11) القبّان ═══════════════
  // ميزان البقالة: حرّك الثقل على الذراع لحد ما يوقف القبّان مستوي. 3 أغراض، والأسرع بيربح.
  const ITEMS = [['🥔', 'بطاطا'], ['🍅', 'بندورة'], ['🧅', 'بصل'], ['🍋', 'ليمون'], ['🍉', 'بطيخة'], ['🍆', 'باذنجان'], ['🥒', 'خيار'], ['🍊', 'برتقان'], ['🍇', 'عنب'], ['🧀', 'جبنة']];
  const qabban = {
    mount(el, X) {
      const S = Stage(el), ctx = S.ctx, R = Runner(X);
      const picks = []; while (picks.length < 3) { const i = Math.floor(X.rng() * ITEMS.length); if (!picks.includes(i)) picks.push(i); }
      const weights = picks.map(() => Math.round((0.8 + X.rng() * 8.6) * 20) / 20); // كيلو، لأقرب 50 غرام
      const MAXKG = 10, TOL = 0.12, SENS = 0.45;
      let n = 0, pos = 0.5 + X.rng() * 2, ang = 0, angV = 0, hold = 0, drag = null, dragPos = 0, okT = -9, P = pal(), shown = null;
      function geo() {
        const W = S.W, H = S.H, px = W * 0.3, py = H * 0.34, Lr = W * 0.62, Ll = W * 0.16;
        return { W, H, px, py, Lr, Ll };
      }
      function down(e) { if (!R.started() || R.done) return; S.cv.setPointerCapture(e.pointerId); drag = S.local(e).x; dragPos = pos; }
      function move(e) { if (drag == null) return; const G = geo(); pos = Math.max(0, Math.min(MAXKG, dragPos + (S.local(e).x - drag) / G.Lr * MAXKG * SENS)); }
      function up() { drag = null; }
      S.cv.addEventListener('pointerdown', down); S.cv.addEventListener('pointermove', move); S.cv.addEventListener('pointerup', up); S.cv.addEventListener('pointercancel', up);
      function fin(done) { const ms = R.elapsed(); if (done) R.timeDone(ms); else R.timePartial(n / 3, n + '/3 أغراض'); }
      const stop = loop((dt) => {
        P = pal();
        const w = weights[Math.min(n, 2)];
        const torque = (pos - w) / MAXKG; // موجب = الذراع الطويل تقيل → بينزل يمين
        const targetAng = Math.max(-0.32, Math.min(0.32, torque * 2.4));
        angV += ((targetAng - ang) * 38 - angV * 4.2) * dt; ang += angV * dt; // تأرجح مخمّد
        if (R.started() && !R.done) {
          const level = Math.abs(pos - w) <= TOL && Math.abs(ang) < 0.045 && Math.abs(angV) < 0.25 && drag == null;
          if (level) hold += dt; else hold = Math.max(0, hold - dt * 2);
          if (hold >= 0.9) {
            shown = { kg: w, t: performance.now() }; n++; hold = 0; okT = performance.now(); beep(990, 0.12, 'triangle', 0.05); buzz(30); R.prog(n / 3);
            if (n >= 3) fin(true); else { pos = Math.max(0, Math.min(MAXKG, pos + (X.rng() < 0.5 ? -1 : 1) * (1.5 + X.rng() * 2))); angV += 1.5; }
          }
          if (!R.done && R.left() <= 0) fin(false);
        }
        const G = geo(); ctx.clearRect(0, 0, G.W, G.H);
        // الدكانة: رفّ خشب
        ctx.fillStyle = 'rgba(201,167,116,.16)'; ctx.fillRect(0, G.H * 0.78, G.W, G.H * 0.22); ctx.fillStyle = '#5A3A2A'; ctx.fillRect(0, G.H * 0.78, G.W, 6);
        // التعليقة
        ctx.strokeStyle = '#F3EAD8'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(G.px, 0); ctx.lineTo(G.px, G.py - 22); ctx.stroke();
        ctx.beginPath(); ctx.arc(G.px, G.py - 14, 9, Math.PI * 1.1, Math.PI * 1.9 + Math.PI, false); ctx.stroke();
        ctx.save(); ctx.translate(G.px, G.py); ctx.rotate(ang);
        // الذراع
        ctx.lineCap = 'round'; ctx.lineWidth = 10; ctx.strokeStyle = '#0A0E19'; ctx.beginPath(); ctx.moveTo(-G.Ll, 0); ctx.lineTo(G.Lr, 0); ctx.stroke();
        ctx.lineWidth = 6; ctx.strokeStyle = '#B9AF9B'; ctx.stroke();
        // التدريج
        for (let kg = 0; kg <= MAXKG * 2; kg++) { const xx = G.Lr * 0.08 + (kg / 2) / MAXKG * G.Lr * 0.9; ctx.strokeStyle = '#0A0E19'; ctx.lineWidth = kg % 2 ? 1.2 : 2; ctx.beginPath(); ctx.moveTo(xx, -3); ctx.lineTo(xx, kg % 2 ? 3 : 7); ctx.stroke(); if (kg % 4 === 0) { ctx.save(); ctx.rotate(-ang); txt(ctx, String(kg / 2), xx * Math.cos(ang), 18 + xx * Math.sin(ang) * 0, 11, 'rgba(243,234,216,.75)', 700, 'ui-monospace, monospace'); ctx.restore(); } }
        ctx.beginPath(); ctx.arc(0, 0, 7, 0, TAU); ctx.fillStyle = P.butter; ctx.fill(); ctx.lineWidth = 2.5; ctx.strokeStyle = '#0A0E19'; ctx.stroke();
        // الثقل (الرمّانة)
        const wx = G.Lr * 0.08 + pos / MAXKG * G.Lr * 0.9;
        ctx.save(); ctx.translate(wx, 0); ctx.rotate(-ang);
        ctx.strokeStyle = '#0A0E19'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, 22); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(-15, 22); ctx.quadraticCurveTo(-19, 50, 0, 52); ctx.quadraticCurveTo(19, 50, 15, 22); ctx.closePath(); ctx.fillStyle = drag != null ? P.butter : P.denim; ctx.fill(); ctx.lineWidth = 3; ctx.stroke();
        ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.fillRect(-9, 27, 4, 16);
        ctx.restore();
        // الكفّة والغرض
        ctx.save(); ctx.translate(-G.Ll * 0.85, 0); ctx.rotate(-ang);
        const pr = Math.min(G.W * 0.13, 52);
        ctx.strokeStyle = '#0A0E19'; ctx.lineWidth = 2; for (const o of [-pr * 0.9, 0, pr * 0.9]) { ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(o, pr * 1.4); ctx.stroke(); }
        ctx.beginPath(); ctx.moveTo(-pr, pr * 1.4); ctx.quadraticCurveTo(0, pr * 2.1, pr, pr * 1.4); ctx.closePath(); ctx.fillStyle = '#C9CED8'; ctx.fill(); ctx.lineWidth = 3; ctx.stroke();
        if (n < 3) { ctx.font = `${pr * 1.05}px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic'; ctx.fillText(ITEMS[picks[n]][0], 0, pr * 1.45); }
        ctx.restore();
        ctx.restore();
        // مؤشر الاستواء
        const lv = Math.max(-1, Math.min(1, ang / 0.32));
        const mx = G.W / 2, my = G.H * 0.66, mw = Math.min(G.W * 0.7, 260);
        rr(ctx, mx - mw / 2, my - 10, mw, 20, 10); ctx.fillStyle = 'rgba(15,20,36,.7)'; ctx.fill();
        rr(ctx, mx - 16, my - 10, 32, 20, 6); ctx.fillStyle = 'rgba(63,167,156,.45)'; ctx.fill();
        ctx.beginPath(); ctx.arc(mx + lv * mw * 0.45, my, 8, 0, TAU); ctx.fillStyle = Math.abs(ang) < 0.045 ? P.aqua : P.butter; ctx.fill(); ctx.lineWidth = 2.5; ctx.strokeStyle = '#0A0E19'; ctx.stroke();
        if (hold > 0) { rr(ctx, mx - 50, my + 18, 100 * Math.min(1, hold / 0.9), 7, 3.5); ctx.fillStyle = P.aqua; ctx.fill(); }
        // الأغراض
        for (let i = 0; i < 3; i++) { const bx = G.W / 2 + (i - 1) * 46; rr(ctx, bx - 19, G.H * 0.83, 38, 38, 10); ctx.fillStyle = i < n ? P.aqua : 'rgba(255,255,255,.12)'; ctx.fill(); ctx.lineWidth = 2.5; ctx.strokeStyle = '#0A0E19'; ctx.stroke(); ctx.font = '22px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.globalAlpha = i <= n ? 1 : 0.35; ctx.fillText(ITEMS[picks[i]][0], bx, G.H * 0.83 + 20); ctx.globalAlpha = 1; }
        if (shown && performance.now() - shown.t < 1300) { rr(ctx, G.W / 2 - 90, G.H * 0.08 - 18, 180, 36, 18); ctx.fillStyle = 'rgba(15,20,36,.9)'; ctx.fill(); txt(ctx, '✓ ' + shown.kg.toFixed(2) + ' كيلو', G.W / 2, G.H * 0.08, 17, P.butter); }
        if (!R.done && R.started()) txt(ctx, 'اسحب يمين وشمال لتحرّك الثقل، وخلّي القبّان مستوي', G.W / 2, G.H - 14, 12.5, '#F3EAD8', 600);
        if (R.done) txt(ctx, n >= 3 ? 'وزّنت التلاتة! ⚖️' : n + '/3', G.W / 2, G.H * 0.08, 20, P.butter, 700, TFONT);
      });
      return { destroy() { stop(); S.destroy(); }, forceEnd() { fin(false); } };
    }
  };

  // ═══════════════ 12) نطّ الحبل ═══════════════
  // اتنين عم يلفّوا الحبل وهو بيسرع. اكبس لتنطّ لما ينزل الحبل لتحت. 3 أرواح.
  const jumprope = {
    mount(el, X) {
      const S = Stage(el), ctx = S.ctx, R = Runner(X);
      const AIR = 0.46;
      let phase = Math.PI, period = 1.35, jumps = 0, lives = 3, jumpAt = -9, stumbleT = -9, lastPass = 0, t = 0, msgT = -9, msg = '', P = pal(), passes = 0;
      function tap() {
        if (!R.started() || R.done) return;
        if (t - jumpAt < AIR || t - stumbleT < 0.7) return;
        jumpAt = t; beep(660, 0.04, 'triangle', 0.03); buzz(8);
      }
      S.cv.addEventListener('pointerdown', tap);
      function fin() { R.finish(jumps, jumps + ' نطّة', true, jumps, 'نطّة'); }
      const stop = loop((dt) => {
        P = pal();
        if (R.started() && !R.done) {
          t += dt;
          const before = phase; phase += dt / period * TAU;
          // الحبل بيمرّ تحت الرجلين لما الطور يعدّي مضاعفات 2π
          if (Math.floor(before / TAU) !== Math.floor(phase / TAU)) {
            passes++;
            const air = t - jumpAt, inAir = air > 0.03 && air < AIR;
            if (t - stumbleT < 0.7) { /* لسّا عم يقوم */ }
            else if (inAir) { jumps++; msg = String(jumps); msgT = t; beep(880, 0.05, 'square', 0.03); R.prog(Math.min(1, jumps / 40)); period = Math.max(0.52, period * 0.968); }
            else { lives--; stumbleT = t; msg = 'علق الحبل!'; msgT = t; beep(200, 0.25, 'sawtooth', 0.05); buzz([50, 30, 50]); period = Math.min(1.35, period * 1.12); if (lives <= 0) fin(); }
          }
          if (!R.done && R.left() <= 0) fin();
        }
        const W = S.W, H = S.H; ctx.clearRect(0, 0, W, H);
        const gy = H * 0.78, cx = W / 2;
        ctx.fillStyle = 'rgba(201,167,116,.18)'; ctx.fillRect(0, gy, W, H - gy); ctx.strokeStyle = 'rgba(243,234,216,.35)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(W, gy); ctx.stroke();
        // اللفّيفة
        const hx = Math.min(W * 0.42, 170), hy = gy - H * 0.22;
        const R0 = (gy - hy) + 6;
        const ry = Math.cos(phase) * R0, front = Math.sin(phase) < 0; // ورا لما يكون فوق
        function rope(behind) {
          if (behind === front) return;
          ctx.lineWidth = 5; ctx.strokeStyle = '#0A0E19'; ctx.beginPath(); ctx.moveTo(cx - hx, hy); ctx.quadraticCurveTo(cx, hy + ry * 2 - (ry > 0 ? 0 : 0), cx + hx, hy); ctx.stroke();
          ctx.lineWidth = 2.5; ctx.strokeStyle = P.rose; ctx.stroke();
        }
        rope(true);
        // اللاعب
        const air = t - jumpAt; const jh = air > 0 && air < AIR ? Math.sin(air / AIR * Math.PI) * H * 0.1 : 0;
        const stum = t - stumbleT < 0.7;
        const fy = gy - jh; const sc = Math.min(W, H) / 380;
        ctx.save(); ctx.translate(cx, fy); ctx.scale(sc, sc); if (stum) ctx.rotate(Math.sin((t - stumbleT) * 30) * 0.12);
        ctx.lineCap = 'round'; ctx.strokeStyle = '#0A0E19'; ctx.lineWidth = 7;
        const kneel = jh > 0 ? 8 : 0;
        ctx.beginPath(); ctx.moveTo(-10, 0 - kneel); ctx.lineTo(-6, -38); ctx.moveTo(10, 0 - kneel); ctx.lineTo(6, -38); ctx.stroke();
        ctx.lineWidth = 16; ctx.strokeStyle = P.orange; ctx.beginPath(); ctx.moveTo(0, -38); ctx.lineTo(0, -78); ctx.stroke();
        ctx.lineWidth = 6; ctx.strokeStyle = '#0A0E19'; ctx.beginPath(); ctx.moveTo(-6, -72); ctx.lineTo(-24, jh > 0 ? -92 : -56); ctx.moveTo(6, -72); ctx.lineTo(24, jh > 0 ? -92 : -56); ctx.stroke();
        ctx.beginPath(); ctx.arc(0, -96, 15, 0, TAU); ctx.fillStyle = '#E9C9A0'; ctx.fill(); ctx.lineWidth = 3.5; ctx.stroke();
        ctx.fillStyle = '#0A0E19'; ctx.beginPath(); ctx.arc(-5, -98, 2, 0, TAU); ctx.arc(5, -98, 2, 0, TAU); ctx.fill();
        ctx.beginPath(); ctx.arc(0, -92, 5, 0.2, Math.PI - 0.2, stum); ctx.lineWidth = 2; ctx.stroke();
        ctx.restore();
        // ضلّ
        ctx.beginPath(); ctx.ellipse(cx, gy + 4, 26 * sc * (1 - jh / (H * 0.25)), 5, 0, 0, TAU); ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.fill();
        rope(false);
        // اللي عم يلفّوا
        for (const sd of [-1, 1]) {
          const x0 = cx + sd * (hx + 26 * sc);
          ctx.save(); ctx.translate(x0, gy); ctx.scale(sc * 0.85, sc * 0.85);
          ctx.lineCap = 'round'; ctx.strokeStyle = '#0A0E19'; ctx.lineWidth = 7; ctx.beginPath(); ctx.moveTo(-8, 0); ctx.lineTo(-4, -38); ctx.moveTo(8, 0); ctx.lineTo(4, -38); ctx.stroke();
          ctx.lineWidth = 16; ctx.strokeStyle = sd < 0 ? P.denim : P.avocado; ctx.beginPath(); ctx.moveTo(0, -38); ctx.lineTo(0, -78); ctx.stroke();
          ctx.beginPath(); ctx.arc(0, -96, 14, 0, TAU); ctx.fillStyle = '#E9C9A0'; ctx.fill(); ctx.lineWidth = 3.5; ctx.strokeStyle = '#0A0E19'; ctx.stroke();
          ctx.restore();
          const ax = x0 - sd * 18 * sc, ay = gy - 70 * sc * 0.85;
          ctx.lineWidth = 5; ctx.strokeStyle = '#0A0E19'; ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(cx + sd * hx, hy); ctx.stroke();
          rr(ctx, cx + sd * hx - 5, hy - 9, 10, 18, 3); ctx.fillStyle = P.butter; ctx.fill(); ctx.lineWidth = 2; ctx.stroke();
        }
        // العدّاد والأرواح
        txt(ctx, '⁦' + jumps + '⁩', W / 2, H * 0.12, 46, '#F3EAD8', 700, 'ui-monospace, monospace');
        txt(ctx, 'نطّة', W / 2, H * 0.12 + 34, 14, 'rgba(243,234,216,.7)', 600);
        for (let i = 0; i < 3; i++) txt(ctx, i < lives ? '❤' : '♡', W - 24 - i * 24, 26, 20, i < lives ? P.rose : 'rgba(243,234,216,.4)', 700);
        // مؤشر الإيقاع: الحبل جاي
        const toBottom = ((TAU - (phase % TAU)) % TAU) / TAU * period;
        if (!R.done && R.started() && toBottom < 0.35) { ctx.beginPath(); ctx.arc(cx, gy + 14, 6 + (0.35 - toBottom) * 30, 0, TAU); ctx.strokeStyle = `rgba(242,193,78,${(0.35 - toBottom) * 2.5})`; ctx.lineWidth = 3; ctx.stroke(); }
        if (t - msgT < 0.6 && msg && isNaN(+msg)) txt(ctx, msg, W / 2, H * 0.3, 20, P.rose, 700, TFONT);
        if (!R.done && R.started() && jumps === 0 && lives === 3) txt(ctx, 'اكبس لتنطّ لما ينزل الحبل لتحت', W / 2, H - 16, 13.5, '#F3EAD8', 600);
        if (R.done) txt(ctx, lives <= 0 ? 'خلصت الأرواح · ' + jumps + ' نطّة' : jumps + ' نطّة! 🎉', W / 2, H * 0.3, 19, P.butter, 700, TFONT);
        void passes; void lastPass;
      });
      return { destroy() { stop(); S.destroy(); }, forceEnd: fin };
    }
  };

  // ═══════════════ البيانات الوصفية ═══════════════
  const META = {
    cassette: { name: 'لفّ الكاسيت', year: 1985, how: 'الشريط طالع ومدلّى برّا الكاسيت! لفّ القلم بالبكرة بالاتجاه المطلوب ليفوت الشريط لجوّا. انتبه: فجأة بيطلع «اعكس!» ولازم تلفّ بالاتجاه التاني. اللي بيرجّع الشريط كله أسرع بيربح.', mode: 'الأسرع',
      facts: ['زمان كنا نرجّع الشريط بقلم الرصاص، كرمال ما تخلص بطاريات المسجّلة.', 'إذا علق الشريط بالمسجّلة، كنا نطلعه بالراحة ونلفّه بإيدينا شبر شبر.', 'الكاسيت كان إله وجهين، وكنا نقلبه بنص السهرة.'] },
    antenna: { name: 'ظبّط الأنتين', year: 1980, how: 'الشاشة كلها تشويش! ميّل الموبايل (أو اسحب) لحد ما تصفى الصورة وتثبت. 3 قنوات، والأسرع بيربح.', mode: 'الأسرع', sensor: true,
      facts: ['كان في واحد يطلع عالسطح يدوّر الأنتين، وواحد تحت يصرّخ: «هيك! لا لا، رجعها شوي!»', 'التشويش كان جزء من السهرة، وبعض الناس كانت تضرب التلفزيون عجنبه ليصفى.', 'كانت المحطات قليلة، وكل البيت يتفرج عنفس الشي.'] },
    rotary: { name: 'التلفون أبو دولاب', year: 1975, how: 'دوّر الرقم المطلوب: حط إصبعك بفتحة الرقم ولفّه لعند المسكة، واستنى الدولاب يرجع. الأسرع بيربح.', mode: 'الأسرع',
      facts: ['بالتلفون أبو دولاب، الرقم 0 كان الأطول، وإذا غلطت برقم بترجع من الأول.', 'التلفون كان واحد بالبيت، ومربوط بشريط، وكل العيلة بتعرف مين عم يحكي.', 'كنا نحفظ أرقام كل الأقارب غيب، بلا ما نسجّلها بمكان.'] },
    t9: { name: 'رسالة T9', year: 2003, how: 'اكتب الجملة متل ما هي على كيبورد الأزرار: كل حرف بكبسة أو أكتر على نفس الزر. الأسرع بلا غلط بيربح.', mode: 'الأسرع',
      facts: ['الرسالة الوحدة كانت 70 حرف عربي بس، فكنا نختصر الكلام لنوفّر الرصيد.', 'كان في ناس بتكتب الرسالة والموبايل بجيبتها، بلا ما تطلّع عالشاشة.', 'الرنّة كانت رسالة لحالها: رنّة يعني «وصلت»، رنّتين يعني «انزل».'] },
    chairs: { name: 'الكراسي الموسيقية', year: 1970, how: '🔊 علّوا صوت الموبايلات! الموسيقى بتشتغل، وفجأة بتوقف: اكبس بسرعة على كرسي فاضي. الكراسي أقل بواحد، واللي بيضل واقف بيطلع. اللي بيكبس قبل ما توقف الموسيقى بيتجمّد ثانية. آخر واحد قاعد بيربح.', mode: 'آخر واحد',
      facts: ['الكراسي كانت لعبة أعياد الميلاد والحفلات المدرسية، والموسيقى من مسجّلة الكاسيت.', 'كان دايماً في واحد ماسك زر الـ«Pause» وعامل حاله مش شايف.', 'أصعب لحظة كانت لما يضل كرسي واحد واتنين عم يلفّوا حواليه.'] },
    marbles: { name: 'الكلل', year: 1978, how: 'معك 5 كلل. اسحب لورا وفلّت لترميهن وحدة ورا التانية، وخلّي كل كلّة توقف أقرب شي عالخط الأبيض. كل كلّة بتضل مكانها، ومنقيس بُعدها عن الخط. أقل مجموع سنتيمترات بيربح.', mode: 'الأقرب',
      facts: ['كل ولد كان عنده كيس كلل، والكلّة اللي فيها لون من جوّا كانت أغلى شي.', 'كنا نحفر الجورة بكعب الصباط، ونرسم خط البداية بعود.', 'الكلل كانت عملة الحارة: بتربح كلل، بتخسر كلل.'] },
    hat: { name: 'طاق طاق طاقية', year: 1965, how: 'كل 4 لاعبين في طاقية، ولكل طاقية فتيل عم يقصر قدّام الكل. إذا إجت لعندك اكبس على أي حدا ما معه طاقية لترميها عليه، أو خليها معك وارميها بآخر لحظة. اللي بتحترق معه بيطلع، واللعبة بتكمّل لحد ما يبقى واحد.', mode: 'آخر واحد',
      facts: ['كنا نقعد بدائرة، وواحد يلفّ ورانا بالطاقية ويغنّي، ولما يحطها ورا حدا لازم يلحقه.', 'اللي ما بينتبه إنو الطاقية وراه، كان بيقعد بنص الدائرة.', 'كانت تنلعب بساحة المدرسة، والطاقية ممكن تكون منديل أو كنزة.'] },
    tug: { name: 'شدّ الحبل', year: 1972, how: 'اكبس «شدّ!» بأسرع ما فيك لحد ما يخلص الوقت. بالفرق: معدّل الفريق هو اللي بيشدّ.', mode: 'الأقوى',
      facts: ['شدّ الحبل كانت لعبة الرحلات والأعراس، ودايماً في واحد قوي بيحطّوه بالآخر.', 'كنا نرسم خط بالطبشورة بالنص، واللي بيتعدّى الخط بيخسر.', 'السر مو بالقوة بس، بالشدّة سوا بنفس اللحظة.'] },
    stones: { name: 'السبع حجار', year: 1968, how: 'معك 25 ثانية بس! الحجرة بتتحرك فوق البرج: اكبس لتنزلها فوق اللي قبلها، واللي بيطلع برّا بينقص. اللي بيعمّر أكتر حجار بيربح، وإذا تساووا الأعرض.', mode: 'الأعلى',
      facts: ['السبع حجار: كنا نعمّرها فوق بعض ونضربها بالطابة، وبعدين نرجع نعمّرها قبل ما ينضربنا.', 'كانت الحجار تنلمّ من الطريق، وكل حجرة إلها شكلها.', 'الفريق اللي بيعمّر البرج لازم يركض أسرع من الطابة.'] },
    hoop: { name: 'الدولاب والعصاية', year: 1960, how: 'اكبس يمين أو شمال الشاشة لتضرب الدولاب بالعصاية: كل ضربة بتسرّعه وبتدفشه لهديك الجهة. لا تخلّيه يبطّئ ويوقع، ولا يطلع برّا الطريق. أبعد مسافة بتربح.', mode: 'الأبعد',
      facts: ['الدولاب كان طوق حديد من برميل أو من دولاب بسكليت قديم، والعصاية سلك معقوف.', 'ولاد الحارة كانوا يسوقوا الدولاب لمشوار الفرن ويرجعوا، بلا ما يوقع ولا مرة.', 'الشطارة كانت تخلّي الدولاب يلفّ الزاوية بلا ما تمسكه بإيدك.'] },
    qabban: { name: 'القبّان', year: 1950, how: 'بالكفّة في غرض، وإنت ما بتعرف وزنه. اسحب لتحرّك الثقل على الذراع لحد ما يوقف القبّان مستوي وثابت، وبينتقل للغرض الجاي. 3 أغراض، والأسرع بيربح.', mode: 'الأسرع',
      facts: ['القبّان كان بكل دكانة وسوق خضرة، وما بدّه كهربا ولا بطاريات.', 'البيّاع الشاطر كان يقرا الوزن من أول نظرة، قبل ما يوقف الذراع.', 'الثقل اللي بيمشي على الذراع كانوا يسمّوه «الرمّانة».'] },
    jumprope: { name: 'نطّ الحبل', year: 1975, how: 'اتنين عم يلفّوا الحبل، وكل ما نطّيت بيسرع. اكبس لتنطّ لما ينزل الحبل لتحت رجليك. معك 3 أرواح، وأكتر نطّات بتربح.', mode: 'الأكتر',
      facts: ['نطّ الحبل كان لعبة البنات بساحة المدرسة، ومعها أغاني بتعدّ النطّات.', 'كانوا يجيبوا حبل الغسيل من البيت، ويلفّوه اتنين والباقي يفوتوا واحد ورا التاني.', 'أصعب شي كان «الفوتة»: إنك تفوت عالحبل وهو عم يلفّ بلا ما يعلق.'] },
  };
  const IMPL = { cassette, antenna, rotary, t9, chairs, marbles, hat, tug, stones, hoop, qabban, jumprope };
  function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  window.ZG = { META, IMPL, mulberry32, beep, buzz, noise };
})();
