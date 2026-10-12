// Our own pilot on Forge's rules engine (forge-pilot/, SCOPE-EXTERNAL-PILOT-12OCT.md).
//
// Plays best-of-three matches through the bridge: each seat owns some decision kinds and
// Forge's AI makes the rest. Phase 1 owns mulligans (pilot.keep) and between-game
// sideboarding (a plan per seat, the same { in, out } sideboard.js writes).
//
//   runMatches({ decks: [a, b], matches, seed, own: [['mulligan'], []], plans: [planA, planB] })
//     -> { games: [{ match, game, winner, onThePlay, turns, reason }], decisions, errors, ms }
//
// Self-play, the strength check (the pilot's seat against stock Forge, mirror decks, seats
// swapped, fixed seeds; 50% = no stronger):
//   FORGE_DIR=... DATA_DIR=... node pilot.js selfplay <calibration.json> <out dir> [matches per half=8] [at once=4] [decks=12]
const net = require('net');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { toDck } = require('./forge');
const meta = require('./meta');

const FORGE_DIR = process.env.FORGE_DIR || '/opt/forge';
const BRIDGE = process.env.PILOT_BRIDGE || path.join(__dirname, 'forge-pilot', 'bridge', 'build', 'mtg-bench-bridge.jar');
const XMX = process.env.FORGE_XMX || '3g';
const forgeJar = () => path.join(FORGE_DIR, fs.readdirSync(FORGE_DIR).find(f => /^forge-gui-desktop-.*jar-with-dependencies\.jar$/.test(f)));

// ---------------------------------------------------------------- mulligans

const faces = k => k ? (k.card_faces && k.card_faces.length ? k.card_faces : [k]) : [];
const landish = k => faces(k).some(f => /\bLand\b/.test(f.type_line || k.type_line || ''));
const pips = k => new Set(((faces(k)[0] || {}).mana_cost || k?.mana_cost || '').match(/[WUBRG]/g) || []);

// The colours a land makes, from its type line and rules text (our card cache keeps no
// produced_mana): basic land types, "Add {U}", "any color", and fetches, which find any.
const BASIC = { Plains: 'W', Island: 'U', Swamp: 'B', Mountain: 'R', Forest: 'G' };
function produced(k) {
  const out = new Set();
  for (const f of faces(k)) {
    const type = f.type_line || k.type_line || '', text = f.oracle_text || '';
    if (!/\bLand\b/.test(type)) continue;
    for (const [t, c] of Object.entries(BASIC)) if (new RegExp('\\b' + t + '\\b').test(type)) out.add(c);
    for (const m of text.matchAll(/Add ([^.]*)/g)) for (const c of m[1].match(/\{([WUBRG])\}/g) || []) out.add(c[1]);
    if (/any colou?r|any one colou?r|search your library for an? (basic )?land/i.test(text)) 'WUBRG'.split('').forEach(c => out.add(c));
  }
  return [...out];
}

// Keep or mulligan, from the hand's names and the size it would be kept at.
// Forge's AI mulligans only on 0-1 lands, all lands, or 6+ of 7: it never asks whether
// the hand can cast anything. This keeps 2-5 lands (2-4 at six cards) only with a spell
// the hand's lands can cast early, and always keeps five or fewer.
function keep(hand, size, find) {
  if (size <= 5) return true;
  const ks = hand.map(find);
  const lands = ks.filter(landish), spells = ks.filter(k => k && !landish(k));
  const L = lands.length;
  if (L < 2 || L > (size >= 7 ? 5 : 4)) return false;
  const colours = new Set(lands.flatMap(produced));
  const castable = spells.filter(k => (k.cmc || 0) <= Math.max(2, Math.min(L, 3)) && [...pips(k)].every(c => colours.has(c)));
  return castable.length > 0 || ks.some(k => !k); // an unknown card: give the hand the benefit of the doubt
}

// ---------------------------------------------------------------- sideboarding

// a plan { in: [{qty,name}], out: [{qty,name}] } applied to the bridge's main deck { name: qty }
function boarded(main, plan) {
  const out = { ...main };
  for (const c of plan.out || []) out[c.name] = (out[c.name] || 0) - c.qty;
  for (const c of plan.in || []) out[c.name] = (out[c.name] || 0) + c.qty;
  for (const k of Object.keys(out)) if (out[k] <= 0) delete out[k];
  return out;
}

// ---------------------------------------------------------------- matches

function runMatches({ decks, matches = 1, seed = 1, own = [[], []], plans = [null, null], workDir, maxTurns = 60, keepLogs = false, onGame }) {
  fs.mkdirSync(workDir, { recursive: true });
  const files = decks.map((d, i) => { const f = path.join(workDir, `seat${i}.dck`); fs.writeFileSync(f, toDck(d.name, d)); return f; });
  const names = [...new Set(decks.flatMap(d => [...d.main, ...(d.side || [])].map(c => c.name)))];
  const token = crypto.randomBytes(16).toString('hex');
  const res = { games: [], decisions: 0, warnings: [], errors: [], ms: 0 };
  const t0 = Date.now();
  // this match's mulligans so far, per seat, to know the size a hand would be kept at
  let match = 0, mulls = [0, 0], lastGame = 0;
  return meta.cards(names).then(find => new Promise((resolve) => {
    const answer = m => {
      if (m.game !== lastGame) { mulls = [0, 0]; lastGame = m.game; }
      if (m.kind === 'mulligan') {
        res.decisions++;
        const hand = (m.state && m.state.you && m.state.you.hand || []).map(c => c.name);
        const k = keep(hand, 7 - mulls[m.seat], find);
        if (!k) mulls[m.seat]++;
        return { choice: [k ? 'keep' : 'mulligan'] };
      }
      return { delegate: true };
    };
    const srv = net.createServer(sock => {
      let buf = '', authed = false;
      const send = o => sock.write(JSON.stringify(o) + '\n');
      sock.on('data', d => {
        buf += d; const ls = buf.split('\n'); buf = ls.pop();
        for (const l of ls) {
          if (!l) continue;
          let m; try { m = JSON.parse(l); } catch { continue; }
          if (!authed) { if (m.type === 'hello' && m.token === token) authed = true; else sock.destroy(); continue; }
          if (m.type === 'decision') send({ type: 'answer', rid: m.rid, ...answer(m) });
          else if (m.type === 'sideboard') { const p = plans[m.seat]; send({ type: 'answer', rid: m.rid, ...(p ? { main: boarded(m.main, p) } : {}) }); }
          else if (m.type === 'between_games') send({ type: 'answer', rid: m.rid });
          else if (m.type === 'game_start') { match = m.match || 0; if (m.game === 1) lastGame = 0; }
          else if (m.type === 'game_end') { const g = { match: m.match || 0, game: m.game, winner: m.winner ?? -1, onThePlay: m.onThePlay, turns: m.turns, reason: m.reason }; if (keepLogs) g.log = m.log; res.games.push(g); onGame && onGame(g); }
          else if (m.type === 'warning') res.warnings.length < 50 && res.warnings.push(m.msg);
          else if (m.type === 'error') res.errors.push(m.msg);
        }
      });
    });
    srv.listen(0, '127.0.0.1', () => {
      const ownArg = s => (own[s] && own[s].length ? own[s] : ['none']).join(',');
      const args = [`-Xmx${XMX}`, '-Djava.awt.headless=true', '--add-opens', 'java.base/java.lang=ALL-UNNAMED', '--add-opens', 'java.base/java.util=ALL-UNNAMED', '--add-opens', 'java.desktop/java.awt=ALL-UNNAMED',
        '-cp', forgeJar() + path.delimiter + BRIDGE, 'forge.bridge.AgentBridge', '--port', String(srv.address().port), '--token', token,
        '--deck0', files[0], '--deck1', files[1], '--external0', 'true', '--external1', 'true', '--games', '3', '--seed', String(seed),
        '--max-turns', String(maxTurns), '--stops', 'all', '--own0', ownArg(0), '--own1', ownArg(1), '--matches', String(matches)];
      const ch = spawn('java', args, { cwd: FORGE_DIR, env: { ...process.env, HOME: process.env.DATA_DIR || '/data' }, stdio: ['ignore', 'ignore', 'pipe'] });
      let err = ''; ch.stderr.on('data', d => { err = (err + d).slice(-4000); });
      ch.on('close', code => { res.ms = Date.now() - t0; res.code = code; if (code) res.errors.push('bridge exited ' + code + ': ' + err.slice(-600)); srv.close(); resolve(res); });
    });
  }));
}

module.exports = { runMatches, keep, boarded, produced };

// ---------------------------------------------------------------- self-play

if (require.main === module && process.argv[2] === 'selfplay') {
  const [, , , CAL, OUT, M = '8', PAR = '4', NDECKS = '12'] = process.argv;
  const lists = JSON.parse(fs.readFileSync(CAL, 'utf8')).standard.lists.slice(0, +NDECKS);
  fs.mkdirSync(OUT, { recursive: true });
  const file = path.join(OUT, 'selfplay-pilot.json');
  const done = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : {};
  const log = (...a) => console.log(new Date().toTimeString().slice(0, 8), ...a);
  const seedOf = s => { let h = 2166136261; for (const ch of s) h = Math.imul(h ^ ch.charCodeAt(0), 16777619); return (h >>> 0) % 2147483647; };
  const todo = lists.flatMap(l => [0, 1].map(at => ({ l, at }))).filter(({ l, at }) => !(done[l.name] && done[l.name][at]));
  log(`self-play pilot: ${lists.length} decks, ${M} matches a half, ${todo.length} halves to play`);
  let i = 0;
  const slot = async () => {
    for (;;) {
      const t = todo[i++]; if (!t) return;
      const own = t.at === 0 ? [['mulligan'], []] : [[], ['mulligan']];
      const r = await runMatches({ decks: [0, 1].map(k => ({ name: t.l.name + (k === t.at ? ' A' : ' B'), main: t.l.main })), matches: +M, seed: seedOf(t.l.name), own, workDir: path.join(OUT, 'work', seedOf(t.l.name) + '-' + t.at) });
      const won = r.games.filter(g => g.winner === t.at).length, lost = r.games.filter(g => g.winner === 1 - t.at).length;
      const mw = [0, 1].map(s => new Set(r.games.map(g => g.match)).size && [...new Set(r.games.map(g => g.match))].filter(m => r.games.filter(g => g.match === m && g.winner === s).length >= 2).length);
      (done[t.l.name] = done[t.l.name] || {})[t.at] = { won, lost, draws: r.games.length - won - lost, matchesWon: mw[t.at], matchesLost: mw[1 - t.at], decisions: r.decisions, ms: r.ms, errors: r.errors.slice(0, 3) };
      fs.writeFileSync(file, JSON.stringify(done));
      log(`${t.l.name} (pilot in seat ${t.at + 1}): games ${won}-${lost}, matches ${mw[t.at]}-${mw[1 - t.at]}${r.errors.length ? ', errors: ' + r.errors[0].slice(0, 120) : ''}`);
    }
  };
  Promise.all(Array.from({ length: +PAR }, slot)).then(() => {
    let W = 0, N = 0, MW = 0, MN = 0; const per = [];
    for (const l of lists) {
      const h = done[l.name]; if (!h || !h[0] || !h[1]) continue;
      const w = h[0].won + h[1].won, n = w + h[0].lost + h[1].lost; W += w; N += n;
      MW += h[0].matchesWon + h[1].matchesWon; MN += h[0].matchesWon + h[1].matchesWon + h[0].matchesLost + h[1].matchesLost;
      per.push(w / n); log(`  ${l.name.padEnd(24)} ${w}/${n} = ${Math.round(w / n * 100)}%`);
    }
    const m = per.reduce((s, x) => s + x, 0) / per.length, sd = Math.sqrt(per.reduce((s, x) => s + (x - m) ** 2, 0) / Math.max(1, per.length - 1)), se = sd / Math.sqrt(per.length);
    log(`pilot: wins ${Math.round(W / N * 100)}% of mirror games (${W}/${N}), ${Math.round(MW / MN * 100)}% of matches (${MW}/${MN}); by deck ${Math.round(m * 100)}%, likely ${Math.round((m - 1.96 * se) * 100)}-${Math.round((m + 1.96 * se) * 100)}%`);
  }).catch(e => { console.error(e); process.exit(1); });
}
