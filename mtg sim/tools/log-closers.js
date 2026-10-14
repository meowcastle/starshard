// Do the decks turn their win conditions on? (research's engine order, item 3.) From the per-turn game logs:
// creature-lands (a land that "becomes a ... creature") and planeswalkers, per deck, split by whether the game
// was won or lost.
//
//   DATA_DIR=... node tools/log-closers.js <logs dir> [--decks "Azorius Control,4c Control"] [--json out.json]
//
// Creature-land: an own turn counts as a chance when the land was on the battlefield at the start of the turn
// and the seat had at least (activation cost + 1) lands, the land itself included; each chance is then an
// animation and an attack, an animation only (to block, or wasted), or nothing.
// Planeswalker: own turns it was on the battlefield at the start of the turn, against loyalty activations made
// on those turns (the log doesn't say which ability, so it can't tell a +1 from the ultimate).
// Also the turn the deck's games end on, won and lost.
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const args = process.argv.slice(2);
const take = f => { const i = args.indexOf(f); return i >= 0 ? args.splice(i, 2)[1] : null; };
const ONLY = (take('--decks') || '').split(',').map(x => x.trim()).filter(Boolean), JSON_OUT = take('--json');
const [DIR] = args;
const files = [];
(function walk(d) { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const f = path.join(d, e.name); if (e.isDirectory()) walk(f); else if (e.name.endsWith('.jsonl.gz')) files.push(f); } })(DIR);

const games = files.map(f => { try { return zlib.gunzipSync(fs.readFileSync(f)).toString('utf8').split('\n').filter(Boolean).map(l => JSON.parse(l)); } catch { return null; } }).filter(g => g && g.find(r => r.t === 'game'));
const names = [...new Set(games.flatMap(g => g.flatMap(r => r.t === 'turn' ? (r.board || []).map(c => c.name) : r.t === 'cast' ? [r.name] : [])))].filter(Boolean);

require('../meta').cards(names).then(find => {
  const oracle = k => !k ? '' : k.oracle_text || (k.card_faces || []).map(f => f.oracle_text || '').join('\n');
  const isManland = n => { const k = find(n); return k && /Land/.test(k.type_line || '') && /becomes a .*creature/i.test(oracle(k)); };
  const animCost = n => { const m = oracle(find(n)).match(/((?:\{[^}]+\})+):\s*Until end of turn, [^.]*becomes a/i); return m ? (m[1].match(/\{[^}]+\}/g) || []).reduce((a, t) => a + (/^\{\d+\}$/.test(t) ? +t.slice(1, -1) : 1), 0) : 3; };
  const isWalker = n => { const k = find(n); return k && /Planeswalker/.test(k.type_line || ''); };
  const out = {};
  const D = (deck) => out[deck] = out[deck] || { games: { won: 0, lost: 0 }, endTurn: { won: [], lost: [] }, manlands: {}, walkers: {} };
  for (const g of games) {
    const head = g.find(r => r.t === 'game'), end = g.find(r => r.t === 'end'); if (!end) continue;
    for (const seat of [0, 1]) {
      const deck = head.decks[seat]; if (ONLY.length && !ONLY.includes(deck)) continue;
      const res = end.winner === seat ? 'won' : end.winner === -1 ? null : 'lost'; if (!res) continue;
      const o = D(deck); o.games[res]++; o.endTurn[res].push(end.turns);
      const turns = g.filter(r => r.t === 'turn' && r.active === seat);
      for (const t of turns) {
        const mine = (t.board || []).filter(c => c.seat === seat), lands = mine.filter(c => c.kind === 'land').length;
        const casts = g.filter(r => r.t === 'cast' && r.seat === seat && r.turn === t.turn);
        const attack = g.find(r => r.t === 'attack' && r.seat === seat && r.turn === t.turn);
        for (const n of new Set(mine.map(c => c.name))) {
          if (isManland(n)) {
            const m = o.manlands[n] = o.manlands[n] || { won: { chances: 0, attacked: 0, animatedOnly: 0 }, lost: { chances: 0, attacked: 0, animatedOnly: 0 } };
            if (lands < animCost(n) + 1) continue;
            const x = m[res]; x.chances++;
            const anim = casts.some(c => c.name === n && c.spell === false), att = attack && (attack.attackers || []).some(a => a.name === n);
            if (att) x.attacked++; else if (anim) x.animatedOnly++;
          } else if (isWalker(n)) {
            const w = o.walkers[n] = o.walkers[n] || { won: { turns: 0, activations: 0 }, lost: { turns: 0, activations: 0 } };
            w[res].turns++; w[res].activations += casts.filter(c => c.name === n && c.spell === false).length;
          }
        }
      }
    }
  }
  const pc = (a, b) => b ? Math.round(100 * a / b) + '%' : '—';
  const med = a => { const s = [...a].sort((x, y) => x - y); return s.length ? s[s.length >> 1] : '—'; };
  console.log(`${games.length} games`);
  for (const [deck, o] of Object.entries(out).sort()) {
    console.log(`\n${deck}: won ${o.games.won}, lost ${o.games.lost} · median last turn: won ${med(o.endTurn.won)}, lost ${med(o.endTurn.lost)}`);
    for (const [n, m] of Object.entries(o.manlands)) for (const r of ['won', 'lost']) { const x = m[r]; if (x.chances) console.log(`   ${n.padEnd(30)} ${r.padEnd(5)} attacked ${pc(x.attacked, x.chances)} of ${x.chances} turns it could · animated without attacking ${pc(x.animatedOnly, x.chances)}`); }
    for (const [n, w] of Object.entries(o.walkers)) for (const r of ['won', 'lost']) { const x = w[r]; if (x.turns) console.log(`   ${n.padEnd(30)} ${r.padEnd(5)} ${x.activations} loyalty activations on ${x.turns} own turns on the battlefield (${(x.activations / x.turns).toFixed(2)} a turn)`); }
  }
  if (JSON_OUT) fs.writeFileSync(JSON_OUT, JSON.stringify(out, null, 1));
});
