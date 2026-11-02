// قعدة زمان — سيرفر اللعبة (Express + WebSocket)
// إعداد م. إياد حلوبي · @eyad.hloubi · صار بدها قعدة.
'use strict';
const express = require('express');
const http = require('http');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const { WebSocketServer } = require('ws');
const QRCode = require('qrcode');

const PORT = process.env.PORT || 3000;
const ADMIN_KEY = process.env.ADMIN_KEY || 'zaman-admin';
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, 'data');
const HOST_GRACE_MS = 45000;
fs.mkdirSync(DATA_DIR, { recursive: true });

// ───────────────────────── الألعاب ─────────────────────────
// rk: رقم الترتيب (الأعلى أحسن) بيحسبه موبايل اللاعب
const GAMES = {
  cassette: { dur: 45 },
  antenna:  { dur: 50 },
  rotary:   { dur: 60 },
  t9:       { dur: 75 },
  top:      { dur: 55 },
  marbles:  { dur: 60 },
  hat:      { dur: 0, server: true },
  tug:      { dur: 0, server: true },
  stones:   { dur: 30 },
};
const GAME_IDS = Object.keys(GAMES);
const TEAM_NAMES = ['فريق الكاسيت', 'فريق الأنتين', 'فريق الدولاب', 'فريق البلبل'];

// ───────────────────────── الإحصائيات ─────────────────────────
const STATS_FILE = path.join(DATA_DIR, 'stats.json');
let stats = { rooms: 0, players: 0, finals: 0, rounds: 0, passes: 0, replays: 0, bets: 0, games: {}, days: {}, modes: {} };
try { stats = Object.assign(stats, JSON.parse(fs.readFileSync(STATS_FILE, 'utf8'))); } catch (e) {}
let pg = null;
if (process.env.DATABASE_URL) {
  try {
    const { Pool } = require('pg');
    pg = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
    pg.query('CREATE TABLE IF NOT EXISTS zaman_kv (k text primary key, v jsonb)')
      .then(() => pg.query("SELECT v FROM zaman_kv WHERE k='stats'"))
      .then(r => { if (r.rows[0]) stats = Object.assign(stats, r.rows[0].v); })
      .catch(e => console.error('pg', e.message));
  } catch (e) { console.error('pg not available', e.message); pg = null; }
}
function day() { return new Date().toISOString().slice(0, 10); }
function bump(key, sub) {
  if (sub) { stats[key] = stats[key] || {}; stats[key][sub] = (stats[key][sub] || 0) + 1; }
  else stats[key] = (stats[key] || 0) + 1;
  statsDirty = true;
}
let statsDirty = false;
setInterval(() => {
  if (!statsDirty) return; statsDirty = false;
  fs.writeFile(STATS_FILE, JSON.stringify(stats), () => {});
  if (pg) pg.query("INSERT INTO zaman_kv(k,v) VALUES('stats',$1) ON CONFLICT (k) DO UPDATE SET v=$1", [stats]).catch(() => {});
}, 5000);

// ───────────────────────── القعدات ─────────────────────────
const ROOMS_FILE = path.join(DATA_DIR, 'rooms.json');
const rooms = new Map();
try {
  const saved = JSON.parse(fs.readFileSync(ROOMS_FILE, 'utf8'));
  for (const r of saved) { r.kicked = new Set(r.kicked || []); r._t = {}; for (const p of Object.values(r.players)) p.connected = false; rooms.set(r.code, r); }
} catch (e) {}
function saveRooms() {
  const arr = [...rooms.values()].map(r => { const { _t, ...rest } = r; return { ...rest, kicked: [...r.kicked] }; });
  fs.writeFile(ROOMS_FILE, JSON.stringify(arr), () => {});
}
setInterval(saveRooms, 15000);
setInterval(() => { // تنظيف القعدات القديمة
  const now = Date.now();
  for (const [c, r] of rooms) if (now - r.lastActivity > 12 * 3600e3) rooms.delete(c);
}, 600e3);

const CODE_CH = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
function newCode() { let c; do { c = ''; for (let i = 0; i < 5; i++) c += CODE_CH[crypto.randomInt(CODE_CH.length)]; } while (rooms.has(c)); return c; }
function shuffle(a) { for (let i = a.length - 1; i > 0; i--) { const j = crypto.randomInt(i + 1); [a[i], a[j]] = [a[j], a[i]]; } return a; }

function makeRoom(hostId) {
  const code = newCode();
  const r = {
    code, hostKey: crypto.randomBytes(12).toString('hex'), hostId, hostLeftAt: null,
    createdAt: Date.now(), lastActivity: Date.now(),
    players: {}, order: [], kicked: new Set(),
    settings: { mode: 'solo', teamCount: 2, teams: [], gameCount: 9, family: false, reveal: 'now', sessionName: '', sessionType: 'شلة', groupPhoto: null },
    phase: 'lobby', pool: [], rounds: [], cur: null, relayIdx: {}, final: null, revealStep: -1, revealMode: null, photoVer: 0, _t: {},
  };
  rooms.set(code, r); bump('rooms'); bump('days', day());
  return r;
}

// ───────────────────────── مساعدات ─────────────────────────
const COLORS = 8;
function nextColor(r) {
  const used = new Set(Object.values(r.players).filter(p => !p.kicked).map(p => p.color));
  for (let i = 0; i < COLORS; i++) if (!used.has(i)) return i;
  return r.order.length % COLORS;
}
function activeIds(r) { return r.order.filter(id => r.players[id] && !r.players[id].kicked); }
function teamsOf(r) {
  const n = r.settings.teamCount;
  const t = [];
  for (let i = 0; i < n; i++) t.push({ i, name: (r.settings.teams[i] && r.settings.teams[i].name) || TEAM_NAMES[i], leader: (r.settings.teams[i] && r.settings.teams[i].leader) || null, members: [] });
  for (const id of activeIds(r)) { const p = r.players[id]; if (p.team != null && p.team < n) t[p.team].members.push(id); }
  for (const tm of t) if (!tm.leader || !tm.members.includes(tm.leader)) tm.leader = tm.members[0] || null;
  return t;
}
function isTeamMode(r) { return r.settings.mode !== 'solo'; }

// ───────────────────────── الإرسال ─────────────────────────
function publicState(r) {
  const players = {};
  for (const id of r.order) {
    const p = r.players[id]; if (!p) continue;
    players[id] = { id, name: p.name, gender: p.gender, gen: p.gen, color: p.color, team: p.team, connected: p.connected, kicked: p.kicked, hasPhoto: !!p.photo, ready: p.ready };
  }
  const cur = r.cur ? {
    n: r.cur.n, game: r.cur.game, seed: r.cur.seed, startAt: r.cur.startAt, endAt: r.cur.endAt,
    active: r.cur.active, bet: r.cur.bet, results: r.cur.results, prog: r.cur.prog,
    hat: r.cur.hat ? { holder: r.cur.hat.holder, from: r.cur.hat.from, passes: r.cur.hat.passes, burned: r.cur.hat.burned, hold: r.cur.hat.hold } : null,
    tug: r.cur.tug || null, outcome: r.cur.outcome || null, wheelAt: r.cur.wheelAt, picks: r.cur.picks,
  } : null;
  return {
    code: r.code, hostId: r.hostId, hostAway: !!r.hostLeftAt, hostLeftAt: r.hostLeftAt, now: Date.now(), phase: r.phase,
    players, order: r.order, settings: { ...r.settings, groupPhoto: undefined, hasGroupPhoto: !!r.settings.groupPhoto },
    teams: teamsOf(r), relayIdx: r.relayIdx, pool: r.pool, rounds: r.rounds, cur, final: r.final, revealStep: r.revealStep, revealMode: r.revealMode, photoVer: r.photoVer,
  };
}
function send(ws, msg) { if (ws && ws.readyState === 1) ws.send(JSON.stringify(msg)); }
const sockets = new Map(); // ws -> {code, pid}
function roomSockets(code) { const out = []; for (const [ws, m] of sockets) if (m.code === code) out.push(ws); return out; }
function broadcast(r, now) {
  if (r._t.bc && !now) return;
  const go = () => { r._t.bc = null; const s = JSON.stringify({ t: 'state', s: publicState(r) }); for (const ws of roomSockets(r.code)) if (ws.readyState === 1) ws.send(s); };
  if (now) { clearTimeout(r._t.bc); go(); } else r._t.bc = setTimeout(go, 120);
}
function sendPhotos(r, ws) {
  const map = {}; for (const id of r.order) if (r.players[id] && r.players[id].photo) map[id] = r.players[id].photo;
  const msg = { t: 'photos', map, group: r.settings.groupPhoto || null, ver: r.photoVer };
  if (ws) send(ws, msg); else for (const s of roomSockets(r.code)) send(s, msg);
}

// ───────────────────────── منطق الجولات ─────────────────────────
function startWheel(r) {
  if (!r.pool.length) return finish(r);
  r.phase = 'intro';
  for (const p of Object.values(r.players)) p.ready = false;
  const pick = r.pool[crypto.randomInt(r.pool.length)];
  r.cur = { n: r.rounds.length + 1, game: pick, seed: crypto.randomInt(1, 2 ** 31), wheelAt: Date.now(), bet: null, results: {}, prog: {}, active: [] };
  clearTimeout(r._t.auto);
  broadcast(r, true);
}
function pickActive(r) {
  const ids = activeIds(r);
  if (r.settings.mode === 'relay') {
    const out = [];
    for (const tm of teamsOf(r)) {
      if (!tm.members.length) continue;
      const k = (r.relayIdx[tm.i] || 0) % tm.members.length;
      out.push(tm.members[k]);
    }
    return out;
  }
  if (r.settings.mode === 'team') return ids.filter(id => r.players[id].team != null);
  return ids;
}
function beginCountdown(r) {
  const c = r.cur; if (!c) return;
  clearTimers(r);
  c.active = pickActive(r).filter(id => r.players[id] && !r.players[id].kicked);
  c.results = {}; c.prog = {}; c.outcome = null;
  c.startAt = Date.now() + 3600;
  const g = GAMES[c.game];
  if (c.game === 'hat') {
    const dur = 18000 + (c.seed % 15000);
    c.endAt = c.startAt + dur;
    const holder = c.active[c.seed % c.active.length];
    c.hat = { holder, from: null, since: c.startAt, passes: 0, hold: {}, burned: null };
    for (const id of c.active) c.hat.hold[id] = 0;
    r._t.end = setTimeout(() => endHat(r), c.endAt - Date.now());
    r._t.hatTick = setInterval(() => hatWatchdog(r), 1000);
  } else if (c.game === 'tug') {
    const dur = 10000 + (c.seed % 5) * 1000;
    c.endAt = c.startAt + dur;
    c.tug = { taps: {} };
    for (const id of c.active) c.tug.taps[id] = 0;
    r._t.end = setTimeout(() => endTug(r), c.endAt - Date.now() + 600);
  } else {
    c.endAt = c.startAt + g.dur * 1000;
    r._t.end = setTimeout(() => endRound(r), c.endAt - Date.now() + 2500);
  }
  r.phase = 'play';
  bump('rounds'); bump('games', c.game);
  broadcast(r, true);
}
function clearTimers(r) { clearTimeout(r._t.end); clearInterval(r._t.hatTick); r._t.end = null; r._t.hatTick = null; }

function hatHolderTime(c, now) { return Math.max(0, now - Math.max(c.hat.since, c.startAt)); }
function hatPass(r, from, to) {
  const c = r.cur; if (!c || c.game !== 'hat' || r.phase !== 'play' || c.hat.burned) return;
  const now = Date.now(); if (now < c.startAt || now >= c.endAt) return;
  if (c.hat.holder !== from || from === to || !c.active.includes(to)) return;
  if (isTeamMode(r) && r.players[to].team === r.players[from].team && teamsOf(r).filter(t => t.members.some(m => c.active.includes(m))).length > 1) return;
  c.hat.hold[from] += hatHolderTime(c, now);
  c.hat.from = from; c.hat.holder = to; c.hat.since = now; c.hat.passes++;
  broadcast(r, true);
}
function hatWatchdog(r) { // إذا اللي معه الطاقية فصل، بتنتقل لحالها
  const c = r.cur; if (!c || !c.hat || c.hat.burned) return;
  const h = r.players[c.hat.holder];
  if ((!h || !h.connected || h.kicked) && Date.now() - c.hat.since > 4000) {
    const opts = c.active.filter(id => id !== c.hat.holder && r.players[id] && r.players[id].connected);
    if (opts.length) hatPass(r, c.hat.holder, opts[crypto.randomInt(opts.length)]);
  }
}
function endHat(r) {
  const c = r.cur; if (!c || !c.hat || c.hat.burned) return;
  const now = c.endAt;
  c.hat.hold[c.hat.holder] += hatHolderTime(c, now);
  c.hat.burned = c.hat.holder;
  for (const id of c.active) {
    const burned = id === c.hat.burned;
    const ds = Math.round(c.hat.hold[id] / 100); // لأقرب عُشر ثانية
    c.results[id] = { rk: -ds - (burned ? 1e7 : 0), label: burned ? 'احترق بالطاقية' : `${(ds / 10).toFixed(1)} ث معه`, done: true, burned };
  }
  clearTimers(r);
  broadcast(r, true);
  setTimeout(() => endRound(r), 2600);
}
function endTug(r) {
  const c = r.cur; if (!c || !c.tug) return;
  for (const id of c.active) { const n = c.tug.taps[id] || 0; c.results[id] = { rk: n, label: `${n} شدّة`, done: true }; }
  endRound(r);
}
function checkAllDone(r) {
  const c = r.cur; if (!c || GAMES[c.game].server) return;
  const live = c.active.filter(id => r.players[id] && r.players[id].connected && !r.players[id].kicked);
  if (live.every(id => c.results[id] && c.results[id].final)) endRound(r);
}

const SOLO_PTS = [5, 3, 2];
const TEAM_PTS = [3, 2, 1, 0];
function rankList(entries) { // entries: [{id, rk}] → with place (ties share)
  entries.sort((a, b) => b.rk - a.rk);
  let place = 0;
  entries.forEach((e, i) => { if (i === 0 || e.rk !== entries[i - 1].rk) place = i; e.place = place; });
  return entries;
}
function endRound(r) {
  const c = r.cur; if (!c || r.phase !== 'play') return;
  clearTimers(r);
  const mult = c.bet && c.bet.status === 'ok' ? 2 : 1;
  const indiv = rankList(c.active.filter(id => r.players[id]).map(id => ({ id, rk: c.results[id] ? c.results[id].rk : -1e12, missing: !c.results[id] })));
  const n = indiv.length;
  const outcome = { mult, players: [], teams: [] };
  for (const e of indiv) {
    let pts;
    if (e.missing) pts = 0;
    else if (r.settings.mode === 'solo') pts = (SOLO_PTS[e.place] != null ? SOLO_PTS[e.place] : 1) * mult;
    else pts = Math.max(1, n - e.place); // نقاط داخلية لحساب الفريق
    outcome.players.push({ id: e.id, place: e.place, pts, label: c.results[e.id] ? c.results[e.id].label : 'ما لحّق' });
  }
  if (isTeamMode(r)) {
    const tms = teamsOf(r).map(tm => {
      const mine = outcome.players.filter(p => r.players[p.id].team === tm.i);
      const avg = mine.length ? mine.reduce((s, p) => s + p.pts, 0) / mine.length : -1;
      return { id: tm.i, rk: Math.round(avg * 1000), playing: mine.length > 0 };
    }).filter(t => t.playing);
    rankList(tms);
    outcome.teams = tms.map(t => ({ team: t.id, place: t.place, pts: (TEAM_PTS[t.place] || 0) * mult }));
  }
  c.outcome = outcome;
  r.rounds.push({ n: c.n, game: c.game, mult, outcome, results: c.results });
  if (r.settings.mode === 'relay') for (const tm of teamsOf(r)) r.relayIdx[tm.i] = (r.relayIdx[tm.i] || 0) + 1;
  r.pool = r.pool.filter(g => g !== c.game);
  r.phase = 'result';
  broadcast(r, true);
}

function computeFinal(r) {
  const totals = {}; const tTotals = {};
  for (const id of activeIds(r)) totals[id] = 0;
  for (const rd of r.rounds) {
    for (const p of rd.outcome.players) if (r.settings.mode === 'solo' && totals[p.id] != null) totals[p.id] += p.pts;
    for (const t of rd.outcome.teams) tTotals[t.team] = (tTotals[t.team] || 0) + t.pts;
  }
  let ranking;
  if (r.settings.mode === 'solo') {
    ranking = rankList(Object.keys(totals).map(id => ({ id, rk: totals[id] }))).map(e => ({ id: e.id, place: e.place, pts: totals[e.id] }));
  } else {
    const tms = teamsOf(r).filter(t => t.members.length).map(t => ({ id: t.i, rk: tTotals[t.i] || 0 }));
    ranking = rankList(tms).map(e => ({ team: e.id, place: e.place, pts: tTotals[e.id] || 0 }));
  }
  let family = null;
  if (r.settings.family) {
    const g = { old: [], neu: [] };
    for (const id of activeIds(r)) {
      const p = r.players[id]; if (!p.gen) continue;
      let pts = 0;
      for (const rd of r.rounds) { const x = rd.outcome.players.find(q => q.id === id); if (x) pts += r.settings.mode === 'solo' ? x.pts : x.pts / Math.max(1, rd.outcome.players.length); }
      g[p.gen === 'old' ? 'old' : 'neu'].push(pts);
    }
    const avg = a => a.length ? a.reduce((s, x) => s + x, 0) / a.length : 0;
    const a = avg(g.old), b = avg(g.neu);
    if (g.old.length && g.neu.length) family = { old: a, neu: b, oldN: g.old.length, neuN: g.neu.length, pctOld: a + b ? Math.round(a / (a + b) * 100) : 50 };
  }
  return { mode: r.settings.mode, ranking, family, rounds: r.rounds.length, at: Date.now() };
}
function finish(r) {
  clearTimers(r);
  r.final = computeFinal(r);
  r.phase = 'reveal'; r.revealMode = null; r.revealStep = -1;
  bump('finals');
  broadcast(r, true);
}

// ───────────────────────── أوامر الريس ─────────────────────────
function hostAction(r, m, pid) {
  const s = r.settings;
  switch (m.a) {
    case 'settings': {
      const allowed = ['mode', 'teamCount', 'gameCount', 'family', 'reveal', 'sessionName', 'sessionType'];
      if (r.phase !== 'lobby') { for (const k of ['sessionName', 'sessionType']) if (k in m.v) s[k] = String(m.v[k]).slice(0, 40); break; }
      for (const k of allowed) if (k in m.v) s[k] = m.v[k];
      s.teamCount = Math.min(4, Math.max(2, +s.teamCount || 2));
      s.gameCount = [3, 5, 7, 9].includes(+s.gameCount) ? +s.gameCount : 9;
      if (s.mode !== 'solo') { // ضمان إنو كل لاعب بفريق
        for (const id of activeIds(r)) { const p = r.players[id]; if (p.team == null || p.team >= s.teamCount) p.team = smallestTeam(r); }
      }
      break;
    }
    case 'teamName': { if (!s.teams[m.i]) s.teams[m.i] = {}; s.teams[m.i].name = String(m.name || '').slice(0, 24) || TEAM_NAMES[m.i]; break; }
    case 'leader': { const p = r.players[m.id]; if (p && p.team != null) { if (!s.teams[p.team]) s.teams[p.team] = {}; s.teams[p.team].leader = m.id; } break; }
    case 'moveTeam': { const p = r.players[m.id]; if (p && r.phase === 'lobby') p.team = Math.min(s.teamCount - 1, Math.max(0, +m.team)); break; }
    case 'shuffleTeams': {
      if (r.phase !== 'lobby') break;
      const ids = shuffle(activeIds(r)); ids.forEach((id, i) => { r.players[id].team = i % s.teamCount; });
      s.teams = []; break;
    }
    case 'rename': { const p = r.players[m.id]; if (p) p.name = String(m.name || '').slice(0, 20); break; }
    case 'kick': {
      const p = r.players[m.id]; if (!p || m.id === pid) break;
      p.kicked = true; p.connected = false; r.kicked.add(m.id);
      for (const [ws, meta] of sockets) if (meta.code === r.code && meta.pid === m.id) { send(ws, { t: 'kicked' }); meta.code = null; }
      if (r.cur && r.cur.hat && r.cur.hat.holder === m.id) hatWatchdog(r);
      break;
    }
    case 'makeHost': { const p = r.players[m.id]; if (p && !p.kicked && p.connected) { r.hostId = m.id; r.hostLeftAt = null; } break; }
    case 'groupPhoto': { if (typeof m.photo === 'string' && m.photo.length < 600000) { s.groupPhoto = m.photo; r.photoVer++; sendPhotos(r); } break; }
    case 'start': {
      if (r.phase !== 'lobby') break;
      const ids = activeIds(r);
      if (ids.length < 2) break;
      if (!s.sessionName.trim()) break;
      if (s.mode !== 'solo' && teamsOf(r).filter(t => t.members.length).length < 2) break;
      r.pool = shuffle(GAME_IDS.slice()).slice(0, s.gameCount);
      bump('modes', s.mode);
      startWheel(r); return;
    }
    case 'pass': { // تمرير لعبة ما حبوها
      if (r.phase !== 'intro') break;
      bump('passes');
      r.pool = r.pool.filter(g => g !== r.cur.game);
      startWheel(r); return;
    }
    case 'go': { if (r.phase === 'intro') { clearTimeout(r._t.auto); if (r.cur.bet && r.cur.bet.status === 'wait') r.cur.bet.status = 'no'; beginCountdown(r); return; } break; }
    case 'stopRound': {
      if (r.phase !== 'play') break;
      const c = r.cur;
      if (c.game === 'hat') { clearTimers(r); c.endAt = Math.max(c.startAt, Date.now()); endHat(r); return; }
      if (c.game === 'tug') { endTug(r); return; }
      // نعطي الموبايلات لحظة لتبعت نتيجتها الجزئية
      clearTimers(r); c.endAt = Math.max(c.startAt, Date.now());
      r._t.end = setTimeout(() => endRound(r), 1500);
      broadcast(r, true); return;
    }
    case 'replay': { // إعادة اللعبة والنتيجة بتنلغى
      if (r.phase !== 'result' && r.phase !== 'play') break;
      clearTimers(r);
      const g = r.cur.game;
      if (r.phase === 'result') {
        r.rounds.pop();
        if (r.settings.mode === 'relay') for (const tm of teamsOf(r)) r.relayIdx[tm.i] = Math.max(0, (r.relayIdx[tm.i] || 1) - 1);
        if (!r.pool.includes(g)) r.pool.push(g);
      }
      bump('replays');
      r.cur = { n: r.rounds.length + 1, game: g, seed: crypto.randomInt(1, 2 ** 31), wheelAt: null, bet: null, results: {}, prog: {}, active: [] };
      for (const p of Object.values(r.players)) p.ready = false;
      r.phase = 'intro'; break;
    }
    case 'next': { if (r.phase === 'result') { startWheel(r); return; } break; }
    case 'finish': { if (['intro', 'play', 'result'].includes(r.phase)) { clearTimeout(r._t.auto); finish(r); return; } break; }
    case 'revealMode': { if (r.phase === 'reveal') { r.revealMode = m.v === 'party' ? 'party' : 'all'; r.revealStep = r.revealMode === 'all' ? 999 : 0; if (r.revealMode === 'all') r.phase = 'final'; } break; }
    case 'revealNext': { if (r.phase === 'reveal' && r.revealMode === 'party') { r.revealStep++; if (r.revealStep >= new Set(r.final.ranking.map(x => x.place)).size) r.phase = 'final'; } break; }
    case 'again': { // قعدة جديدة بنفس الناس
      clearTimers(r); clearTimeout(r._t.auto);
      for (const p of Object.values(r.players)) p.ready = false;
      r.phase = 'lobby'; r.rounds = []; r.cur = null; r.final = null; r.pool = []; r.relayIdx = {}; r.revealStep = -1; r.revealMode = null;
      break;
    }
  }
  broadcast(r);
}
function smallestTeam(r) {
  const n = r.settings.teamCount; const c = Array(n).fill(0);
  for (const id of activeIds(r)) { const t = r.players[id].team; if (t != null && t < n) c[t]++; }
  return c.indexOf(Math.min(...c));
}

// ───────────────────────── WebSocket ─────────────────────────
const app = express();
app.disable('x-powered-by');
const server = http.createServer(app);
const wss = new WebSocketServer({ server, maxPayload: 2 * 1024 * 1024 });

wss.on('connection', (ws) => {
  sockets.set(ws, { code: null, pid: null });
  ws.isAlive = true; ws.on('pong', () => { ws.isAlive = true; });
  ws.on('message', (raw) => {
    let m; try { m = JSON.parse(raw); } catch (e) { return; }
    const meta = sockets.get(ws); if (!meta) return;
    if (m.t === 'ping') return send(ws, { t: 'pong', c: m.c, s: Date.now() });
    if (m.t === 'create') {
      const pid = String(m.pid || '').slice(0, 40); if (!pid) return;
      const r = makeRoom(pid);
      meta.code = r.code; meta.pid = pid;
      return send(ws, { t: 'created', code: r.code, hostKey: r.hostKey });
    }
    if (m.t === 'join') {
      const code = String(m.code || '').toUpperCase().trim();
      const pid = String(m.pid || '').slice(0, 40);
      const r = rooms.get(code);
      if (!r) return send(ws, { t: 'error', e: 'noroom' });
      if (r.kicked.has(pid)) return send(ws, { t: 'kicked' });
      meta.code = code; meta.pid = pid;
      if (m.hostKey && m.hostKey === r.hostKey && !r.players[pid] && r.order.length === 0) r.hostId = pid;
      const p = r.players[pid];
      if (p) { p.connected = true; if (r.hostId === pid) r.hostLeftAt = null; }
      send(ws, { t: 'joined', code, isNew: !p });
      send(ws, { t: 'state', s: publicState(r) });
      sendPhotos(r, ws);
      r.lastActivity = Date.now();
      broadcast(r);
      return;
    }
    const r = meta.code && rooms.get(meta.code); if (!r) return;
    const pid = meta.pid; r.lastActivity = Date.now();
    if (m.t === 'profile') {
      let p = r.players[pid];
      const isNew = !p;
      if (isNew) {
        if (r.phase !== 'lobby' && r.order.length >= 30) return;
        p = r.players[pid] = { id: pid, name: '', gender: 'm', gen: null, color: nextColor(r), team: null, connected: true, kicked: false, photo: null, joinedAt: Date.now() };
        r.order.push(pid); bump('players');
        if (isTeamMode(r)) p.team = smallestTeam(r);
      }
      if (typeof m.name === 'string') p.name = m.name.trim().slice(0, 20);
      if (m.gender === 'f' || m.gender === 'm') p.gender = m.gender;
      if (m.gen === 'old' || m.gen === 'new' || m.gen === null) p.gen = m.gen;
      if ('photo' in m) { p.photo = (typeof m.photo === 'string' && m.photo.length < 300000) ? m.photo : null; r.photoVer++; sendPhotos(r); }
      if (m.team != null && r.phase === 'lobby' && isTeamMode(r)) p.team = Math.min(r.settings.teamCount - 1, Math.max(0, +m.team));
      broadcast(r); return;
    }
    const p = r.players[pid]; if (!p || p.kicked) return;
    if (m.t === 'host') { if (r.hostId === pid) hostAction(r, m, pid); return; }
    if (m.t === 'claimHost') {
      const h = r.players[r.hostId];
      const away = !h || !h.connected || h.kicked;
      if (away && r.hostLeftAt && Date.now() - r.hostLeftAt >= HOST_GRACE_MS - 1500) { r.hostId = pid; r.hostLeftAt = null; broadcast(r, true); }
      return;
    }
    if (m.t === 'ready') {
      p.ready = !!m.v; broadcast(r, true);
      clearTimeout(r._t.auto);
      if (r.phase === 'intro') {
        const live = activeIds(r).filter(id => r.players[id].connected);
        if (live.length >= 2 && live.every(id => r.players[id].ready)) {
          r._t.auto = setTimeout(() => {
            if (r.phase !== 'intro') return;
            const l2 = activeIds(r).filter(id => r.players[id].connected);
            if (!l2.every(id => r.players[id].ready)) return;
            if (r.cur.bet && r.cur.bet.status === 'wait') r.cur.bet.status = 'no';
            beginCountdown(r);
          }, 900);
        }
      }
      return;
    }
    const c = r.cur;
    if (m.t === 'bet') { // رهان من قائد الفريق
      if (r.phase !== 'intro' || !isTeamMode(r) || (c.bet && c.bet.status !== 'no')) return;
      const tm = teamsOf(r).find(t => t.leader === pid); if (!tm) return;
      const others = teamsOf(r).filter(t => t.i !== tm.i && t.members.length && t.leader);
      c.bet = { by: tm.i, status: 'wait', ok: {}, need: others.map(t => t.i) };
      bump('bets'); broadcast(r, true); return;
    }
    if (m.t === 'betReply') {
      if (!c || !c.bet || c.bet.status !== 'wait') return;
      const tm = teamsOf(r).find(t => t.leader === pid && c.bet.need.includes(t.i)); if (!tm) return;
      if (!m.ok) c.bet.status = 'no';
      else { c.bet.ok[tm.i] = true; if (c.bet.need.every(i => c.bet.ok[i])) c.bet.status = 'ok'; }
      broadcast(r, true); return;
    }
    if (!c || r.phase !== 'play' || !c.active.includes(pid)) return;
    if (m.t === 'prog') { c.prog[pid] = Math.max(0, Math.min(1, +m.p || 0)); broadcast(r); return; }
    if (m.t === 'result') {
      if (GAMES[c.game].server) return;
      c.results[pid] = { rk: +m.rk || 0, label: String(m.label || '').slice(0, 30), done: !!m.done, final: true };
      c.prog[pid] = m.done ? 1 : (c.prog[pid] || 0);
      broadcast(r); checkAllDone(r); return;
    }
    if (m.t === 'tap' && c.game === 'tug') {
      const now = Date.now(); if (now < c.startAt || now > c.endAt + 300) return;
      const n = Math.max(0, Math.min(8, +m.n || 0)); // حد أقصى معقول لكل دفعة
      c.tug.taps[pid] = (c.tug.taps[pid] || 0) + n; broadcast(r); return;
    }
    if (m.t === 'hatPass') { hatPass(r, pid, String(m.to)); return; }
  });
  ws.on('close', () => {
    const meta = sockets.get(ws); sockets.delete(ws);
    if (!meta || !meta.code) return;
    const r = rooms.get(meta.code); if (!r) return;
    const still = roomSockets(r.code).some(s => sockets.get(s).pid === meta.pid);
    const p = r.players[meta.pid];
    if (p && !still) {
      p.connected = false;
      if (r.hostId === meta.pid) r.hostLeftAt = Date.now();
      broadcast(r);
      if (r.phase === 'play') checkAllDone(r);
    }
  });
});
setInterval(() => { for (const ws of wss.clients) { if (!ws.isAlive) { ws.terminate(); continue; } ws.isAlive = false; try { ws.ping(); } catch (e) {} } }, 25000);

// ───────────────────────── HTTP ─────────────────────────
app.get('/qr/:code.svg', async (req, res) => {
  const proto = req.headers['x-forwarded-proto'] || req.protocol;
  const url = `${proto}://${req.get('host')}/?r=${encodeURIComponent(req.params.code)}`;
  const svg = await QRCode.toString(url, { type: 'svg', margin: 1, color: { dark: '#1B2238', light: '#00000000' } });
  res.type('image/svg+xml').set('Cache-Control', 'public, max-age=3600').send(svg);
});
app.get('/healthz', (req, res) => res.send('ok'));

function esc(s) { return String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }
const GAME_AR = { cassette: 'لفّ الكاسيت', antenna: 'ظبّط الأنتين', rotary: 'التلفون أبو دولاب', t9: 'رسالة T9', top: 'البلبل', marbles: 'الكلل', hat: 'طاق طاق طاقية', tug: 'شدّ الحبل', stones: 'السبع حجار' };
const MODE_AR = { solo: 'فردي', team: 'الفريق كاملاً', relay: 'عضو لكل جولة' };
function statsPage(admin) {
  const days = Object.entries(stats.days || {}).sort().slice(-14);
  const maxD = Math.max(1, ...days.map(d => d[1]));
  const games = GAME_IDS.map(g => [GAME_AR[g], (stats.games || {})[g] || 0]).sort((a, b) => b[1] - a[1]);
  const maxG = Math.max(1, ...games.map(g => g[1]));
  const top = games[0] && games[0][1] ? games[0][0] : '—';
  const live = [...rooms.values()].filter(r => Object.values(r.players).some(p => p.connected));
  const roomsRows = admin ? [...rooms.values()].sort((a, b) => b.lastActivity - a.lastActivity).slice(0, 40).map(r => {
    const on = Object.values(r.players).filter(p => p.connected && !p.kicked).length;
    return `<tr><td dir="ltr">${r.code}</td><td>${esc(r.settings.sessionName || '—')}</td><td>${MODE_AR[r.settings.mode]}</td><td>${r.phase}</td><td>${on}/${activeIds(r).length}</td><td>${new Date(r.lastActivity).toLocaleTimeString('en-GB')}</td><td><form method="post" action="/admin/close?key=${encodeURIComponent(ADMIN_KEY)}&code=${r.code}" onsubmit="return confirm('إغلاق القعدة ${r.code}؟')"><button>إغلاق</button></form></td></tr>`;
  }).join('') : '';
  return `<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${admin ? 'إدارة' : 'إحصائيات'} قعدة زمان</title>
<link href="/fonts/fonts.css" rel="stylesheet">
<style>body{margin:0;background:#F1E6D0;color:#1B2238;font-family:'IBM Plex Sans Arabic',sans-serif;padding:20px 16px 60px}main{max-width:820px;margin:auto}h1{font-family:Marhey;font-size:28px;margin:4px 0 2px}p.s{margin:0 0 18px;opacity:.7}
.g{display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:12px;margin-bottom:22px}.c{background:#fff8ea;border:3px solid #1B2238;border-radius:14px;box-shadow:4px 4px 0 #1B2238;padding:12px 14px}.c b{display:block;font-size:28px}.c span{font-size:13px;opacity:.75}
h2{font-size:18px;margin:22px 0 10px}.bar{display:flex;align-items:center;gap:10px;margin:6px 0;font-size:14px}.bar i{display:block;height:16px;background:#EE7B30;border:2px solid #1B2238;border-radius:6px}.bar em{font-style:normal;min-width:110px}
table{width:100%;border-collapse:collapse;background:#fff8ea;border:3px solid #1B2238;border-radius:12px;overflow:hidden;font-size:13px}td,th{padding:8px;border-bottom:1px solid #1B223833;text-align:right}button{font:inherit;border:2px solid #1B2238;background:#D9637A;color:#fff;border-radius:8px;padding:3px 10px;cursor:pointer}.ov{overflow-x:auto}</style></head><body><main>
<h1>${admin ? 'لوحة إدارة' : 'إحصائيات'} «قعدة زمان»</h1><p class="s">أرقام إجمالية فقط، دون أسماء أو صور · إعداد م. إياد حلوبي</p>
<div class="g"><div class="c"><b>${stats.rooms || 0}</b><span>قعدة أُنشئت</span></div><div class="c"><b>${stats.players || 0}</b><span>لاعب دخل</span></div><div class="c"><b>${stats.rounds || 0}</b><span>لعبة لُعبت</span></div><div class="c"><b>${stats.finals || 0}</b><span>قعدة اكتملت</span></div><div class="c"><b>${live.length}</b><span>قعدة نشطة الآن</span></div><div class="c"><b style="font-size:20px">${top}</b><span>اللعبة الأكثر لعباً</span></div></div>
<div class="g"><div class="c"><b>${stats.passes || 0}</b><span>مرة تمرير للعبة</span></div><div class="c"><b>${stats.replays || 0}</b><span>مرة إعادة لعبة</span></div><div class="c"><b>${stats.bets || 0}</b><span>رهان طُلب</span></div><div class="c"><b style="font-size:18px">${Object.entries(stats.modes || {}).map(([k, v]) => `${MODE_AR[k] || k}: ${v}`).join(' · ') || '—'}</b><span>أنماط اللعب</span></div></div>
<h2>الألعاب حسب عدد مرات اللعب</h2>${games.map(([n, v]) => `<div class="bar"><em>${n}</em><i style="width:${Math.max(4, v / maxG * 60)}%"></i><span>${v}</span></div>`).join('')}
<h2>القعدات خلال آخر 14 يوماً</h2>${days.length ? days.map(([d, v]) => `<div class="bar"><em dir="ltr">${d}</em><i style="width:${Math.max(4, v / maxD * 60)}%;background:#4FB3A9"></i><span>${v}</span></div>`).join('') : '<p>لا توجد بيانات بعد.</p>'}
${admin ? `<h2>القعدات الأخيرة</h2><div class="ov"><table><tr><th>الرمز</th><th>الاسم</th><th>النمط</th><th>المرحلة</th><th>متصل</th><th>آخر نشاط</th><th></th></tr>${roomsRows || '<tr><td colspan="7">لا توجد قعدات.</td></tr>'}</table></div>` : ''}
</main></body></html>`;
}
app.get('/stats', (req, res) => { if (req.query.key !== ADMIN_KEY) return res.status(403).send('مفتاح غير صحيح'); res.send(statsPage(false)); });
app.get('/admin', (req, res) => { if (req.query.key !== ADMIN_KEY) return res.status(403).send('مفتاح غير صحيح'); res.send(statsPage(true)); });
app.post('/admin/close', (req, res) => {
  if (req.query.key !== ADMIN_KEY) return res.status(403).send('مفتاح غير صحيح');
  const r = rooms.get(String(req.query.code)); if (r) { for (const [ws, m] of sockets) if (m.code === r.code) { send(ws, { t: 'error', e: 'closed' }); m.code = null; } rooms.delete(r.code); }
  res.redirect('/admin?key=' + encodeURIComponent(ADMIN_KEY));
});

app.use(express.static(path.join(__dirname, 'public'), { extensions: ['html'], setHeaders(res, p) { if (p.endsWith('sw.js')) res.set('Cache-Control', 'no-cache'); } }));
app.use((req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));

server.listen(PORT, () => console.log('قعدة زمان شغّالة على', PORT));
process.on('SIGTERM', () => { saveRooms(); fs.writeFileSync(STATS_FILE, JSON.stringify(stats)); process.exit(0); });
