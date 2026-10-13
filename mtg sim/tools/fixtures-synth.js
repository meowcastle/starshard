// Adds the states a real fixtures capture may lack, made up from the brew's own finished run,
// so the Design canvas can show every view without spending a run (WORKORDER-DESIGN-CODE-13OCT.md
// item 1). Everything added carries synthetic: true and an id starting "synth-"; the numbers in it
// are invented and mean nothing.
//
//   node tools/fixtures-synth.js      (rewrites design/fixtures.json in place; safe to rerun)
//
// Adds, to the first brew with a finished run:
//  - a second version (one card changed), so the compare view has two versions;
//  - a finished run on it, the first run's results nudged, so the compare has numbers;
//  - a run in progress on it, so the running view shows;
//  - the method object on every run, in the shape server.js's methodOf() sends.
const fs = require('fs');
const path = require('path');

const FILE = path.join(__dirname, '..', 'design', 'fixtures.json');
const f = JSON.parse(fs.readFileSync(FILE, 'utf8'));
const clone = x => JSON.parse(JSON.stringify(x));
const brews = f['/api/brews'].brews;
const b = brews.find(x => x.runs.some(r => r.status === 'done'));
if (!b) { console.error('no brew with a finished run to build from'); process.exit(1); }

// start clean: drop anything an earlier pass added
b.versions = b.versions.filter(v => !v.synthetic);
b.runs = b.runs.filter(r => !r.synthetic);
const v1 = b.versions[b.versions.length - 1], base = b.runs.find(r => r.status === 'done');
const V = v1.v + 1, H = 3600e3;

// a second version: one copy of the most-played-but-not-maxed spell for one of the least-played
const spells = v1.list.main.filter(c => !(v1.rows.find(r => r.name === c.name) || {}).land);
const up = spells.filter(c => c.qty < 4).sort((a, c) => c.qty - a.qty)[0], down = spells.filter(c => c !== up && c.qty > 1).sort((a, c) => a.qty - c.qty)[0];
const v2 = clone(v1);
Object.assign(v2, { v: V, created: base.finished + H, synthetic: true, diff: [{ qty: -1, name: down.name, section: 'main' }, { qty: 1, name: up.name, section: 'main' }] });
for (const l of [v2.list.main, v2.rows]) for (const c of l) { if (c.name === down.name && (c.section || 'main') === 'main') c.qty--; if (c.name === up.name && (c.section || 'main') === 'main') c.qty++; }
b.versions.push(v2);

// deterministic small nudges
let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
const nudge = (w, n) => Math.max(0, Math.min(n, w + Math.round((rnd() - 0.45) * 4)));
const rescore = (s, d) => s && { ...s, p: Math.min(0.97, Math.max(0.03, s.p + d)), lo: Math.max(0, s.lo + d), hi: Math.min(1, s.hi + d), raw: s.raw != null ? s.raw + d : s.raw };

// a finished run on v2
const done = clone(base);
Object.assign(done, { id: 'synth-done', v: V, created: v2.created + 600e3, started: v2.created + 660e3, finished: v2.created + 3 * H, synthetic: true });
for (const o of done.opponents) {
  const n = o.wins[0] + o.wins[1], w = nudge(o.wins[0], n); o.wins = [w, n - w];
  if (o.post) { const m = o.post.wins[0] + o.post.wins[1], x = nudge(o.post.wins[0], m); o.post = { ...o.post, wins: [x, m - x] }; }
  o.score = rescore(o.score, 0.02);
}
done.score = rescore(done.score, 0.02);
if (done.coach) done.coach = { ...done.coach, at: done.finished + 60e3 };
b.runs.unshift(done);

// a run in progress on v2: the first 40% of the games played, opponent by opponent
const live = clone(done);
Object.assign(live, { id: 'synth-live', created: Date.now() - 20 * 60e3, started: Date.now() - 18 * 60e3, finished: null, status: 'running', synthetic: true, coach: null, event: null, benchScore: null, score: null, cards: null, extended: 0 });
const per = live.games || 20, total = per * live.opponents.length, playedN = Math.round(total * 0.4);
let left = playedN;
live.opponents = live.opponents.map(o => {
  const k = Math.min(per, left); left -= k;
  const w = Math.round(k * (o.wins[0] / Math.max(1, o.wins[0] + o.wins[1])));
  return { ...o, wins: [w, k - w], played: k, draws: 0, pairing: k === per ? 'done' : k > 0 ? 'running' : 'queued', post: null, pooled: null, score: null };
});
Object.assign(live, { played: playedN, total, pulse: live.opponents.flatMap(o => Array.from({ length: per }, (_, g) => g < o.played ? (g < o.wins[0] ? 1 : 0) : null)) });
b.runs.unshift(live);

// the method object (server.js methodOf), on every run of every brew
for (const x of brews) for (const r of x.runs) r.method = {
  forge: f['/api/me'].forge || '2.0.15',
  pilot: { tag: 'synth', decks: [{ name: 'Azorius Control', pilot: 'reactive' }] },
  gamesPerPairing: r.games || 20, extraGames: x.seats === 2 ? { target: 0.05, upTo: 1 } : null,
  clockSeconds: 180, bo3: r.bo3 || null,
  calibration: x.seats === 2 ? { realGames: 1063, events: 41, mtgoEvents: 12, days: 42, pairs: 51, at: Date.now() - 6 * H } : null,
  hatchUnder: 30,
  notCounted: x.seats === 2 ? 'A matchup against a deck Forge pilots badly (control or combo) is left out of the headline until real tournament results have calibrated it.' : null,
  cardStats: 'Read from Forge\'s game logs. Cast counts each game once. Forge doesn\'t log draws, so a low cast rate can mean not drawn or stuck in hand. Lands are left out.',
  field: r.field && r.field.source ? { source: r.field.source, label: r.field.label || null, date: r.field.date || null } : null,
};

f._synthetic = `Added by tools/fixtures-synth.js: ${b.name} v${V} (-1 ${down.name}, +1 ${up.name}), runs synth-done and synth-live, and method on every run. Invented numbers, for the canvas only.`;
fs.writeFileSync(FILE, JSON.stringify(f, null, 1));
console.log(f._synthetic);
