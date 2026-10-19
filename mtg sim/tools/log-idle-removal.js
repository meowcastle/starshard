// idle removal: own turns that ended with the card in hand (at turn start and not cast), enough lands untapped at
// the turn's end to have cast it, and a fitting target on the opponent's side at the turn's start
const fs = require('fs'), path = require('path'), zlib = require('zlib');
const [DIR] = process.argv.slice(2);
const CARDS = {
  'Deadly Precision': { deck: 'Jund Sacrifice', mana: 1, sorcery: true, ok: c => (c.power || 0) >= 2, extra: (me) => me.sac || me.lands >= 5 },
  'Requiting Hex': { mana: 1, ok: c => (c.mv || 0) <= 2 && (c.power || 0) >= 1 },
  'Impractical Joke': { mana: 1, sorcery: true, ok: c => (c.toughness || 0) <= 3 && (c.power || 0) >= 2 },
  'Burst Lightning': { mana: 1, ok: c => (c.toughness || 0) <= 2 && (c.power || 0) >= 2 },
  'Get Out': { mana: 2, skip: true },
};
const out = {};
for (const pd of fs.readdirSync(DIR)) for (const f of fs.readdirSync(path.join(DIR, pd))) {
  const lines = zlib.gunzipSync(fs.readFileSync(path.join(DIR, pd, f))).toString().split('\n').filter(Boolean).map(JSON.parse);
  const g = lines[0], decks = g.decks; const end = lines.find(r => r.t === 'end'); const winner = end ? end.winner : null;
  let start = null; const castThis = new Set();
  for (const r of lines) {
    if (r.t === 'turn') { start = r; castThis.clear(); }
    else if (r.t === 'cast' && r.spell) castThis.add(r.seat + '|' + r.name);
    else if (r.t === 'turn_end' && start) {
      const s = r.active, me = start.views && start.views[s] && start.views[s].me; if (!me || !me.hand) continue;
      const deck = decks[s];
      const opp = start.board.filter(x => x.seat !== s && x.kind === 'creature');
      const mine = start.board.filter(x => x.seat === s && (x.kind === 'creature' || x.kind === 'artifact'));
      const left = r.seats[s].landsUntapped;
      for (const [name, c] of Object.entries(CARDS)) {
        if (c.skip || !me.hand.some(h => h.name === name)) continue;
        const k = deck + ' · ' + name, o = out[k] = out[k] || { held: 0, idleWithTarget: 0, castTurns: 0, won: 0, lost: 0 };
        o.held++;
        if (castThis.has(s + '|' + name)) { o.castTurns++; continue; }
        const tgt = opp.filter(c.ok);
        const extra = c.extra ? c.extra({ sac: mine.length > 0, lands: left }) : true;
        if (tgt.length && left >= c.mana && extra) { o.idleWithTarget++; winner === s ? o.won++ : o.lost++; }
      }
    }
  }
}
console.log('deck · card'.padEnd(46), 'own turns held', 'cast that turn', 'idle with target+mana', '(in games won/lost)');
for (const [k, o] of Object.entries(out).sort((a, b) => b[1].idleWithTarget / b[1].held - a[1].idleWithTarget / a[1].held))
  if (o.held >= 100) console.log(k.padEnd(46), String(o.held).padStart(8), String(o.castTurns).padStart(10), String(o.idleWithTarget).padStart(10), (100 * o.idleWithTarget / o.held).toFixed(0).padStart(4) + '%', `(${o.won}/${o.lost})`);
