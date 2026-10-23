// E2 and E3 (STRATEGY-FIRST-REBUILD §4): is the strategy happening, and why the games were lost, read from one
// game's per-turn log (GameLog.java's records: turn, cast, attack, block, combat, leaves, end). One small summary
// per game travels with the game's result (forge.js runPiloted), so it works wherever the game was played; the
// server adds them up per matchup (aggregate) for the Test tab.
//
// spec: what to look for, from the deck's strategy: { seat, engine: [names], champions: [names] (the creatures meant
// to carry the attack), equipment: [names], protection: [names] }.
const fs = require('fs'), zlib = require('zlib');

function readLog(file) {
  try { return zlib.gunzipSync(fs.readFileSync(file)).toString().split('\n').filter(Boolean).map(l => JSON.parse(l)); } catch { return null; }
}

// one game
function extract(L, spec) {
  if (!L || !L.length) return null;
  const me = spec.seat || 0, opp = 1 - me, has = (list, n) => (list || []).includes(n);
  const turns = L.filter(r => r.t === 'turn'), end = L.find(r => r.t === 'end') || {};
  // my own turn count for each game turn (turn 1 of mine is the first turn I'm active)
  const mine = {}; let k = 0; for (const t of turns) if (t.active === me) mine[t.turn] = ++k;
  const ownTurn = gt => { let best = 0; for (const t of turns) if (t.turn <= gt && t.active === me) best = mine[t.turn]; return best || 1; };
  const out = { won: end.winner === me, turns: k, engineAt: null, soloAt: null, soloChampion: false, attacks: 0, alone: 0, geared5: false, firstRemoval: null, lifegain: 0 };
  // the engine: the own turn the first engine card was cast
  for (const r of L) if (r.t === 'cast' && r.spell && r.seat === me && has(spec.engine, r.name)) { out.engineAt = ownTurn(r.turn); break; }
  // attacks: how many of mine went alone, and the first solo attack
  for (const r of L) if (r.t === 'attack' && r.seat === me && r.attackers && r.attackers.length) {
    out.attacks++;
    if (r.attackers.length === 1) { out.alone++; if (out.soloAt == null) { out.soloAt = ownTurn(r.turn); out.soloChampion = has(spec.champions, r.attackers[0].name); } }
  }
  // geared by turn 5: one of the deck's equipment on my side of the battlefield at the start of my fifth turn (or earlier)
  for (const t of turns) { if (t.active !== me || mine[t.turn] > 5) continue; if (t.board.some(c => c.seat === me && has(spec.equipment, c.name)) && t.board.some(c => c.seat === me && c.kind === 'creature')) { out.geared5 = true; break; } }
  // the first removal aimed at an engine card or champion: did it survive, and was protection in hand
  const key = n => has(spec.engine, n) || has(spec.champions, n);
  for (let i = 0; i < L.length; i++) {
    const r = L[i]; if (r.t !== 'cast' || r.seat !== opp || !r.spell) continue;
    const tg = (r.targets || []).find(x => x.seat === me && key(x.name)); if (!tg) continue;
    const died = L.slice(i + 1).some(x => x.t === 'leaves' && x.seat === me && x.name === tg.name && x.turn === r.turn && x.to !== 'Hand');
    const before = [...turns].reverse().find(t => t.turn <= r.turn), hand = before && before.views && before.views[me] && before.views[me].me && before.views[me].me.hand || [];
    out.firstRemoval = { turn: ownTurn(r.turn), card: tg.name, by: r.name, survived: !died, protectionInHand: hand.some(h => has(spec.protection, h.name)) };
    break;
  }
  // lifegain: turns my life went up, life total by turn
  let last = 20; for (const t of turns) { const v = t.views && t.views[me] && t.views[me].me; if (!v) continue; if (v.life > last) out.lifegain += v.life - last; last = v.life; }
  if (!out.won && end.winner != null && end.winner !== -1) { const r = lossReason(L, spec, out, mine, ownTurn); out.loss = r.reason; out.lossLine = r.line; }
  return out;
}

// E3: one reason per lost game, the first that holds in this order
const REASONS = ['flooded or screwed', 'engine never deployed', 'swept', 'engine removed with no protection up', 'out-raced', 'out of cards', 'other'];
function lossReason(L, spec, out, mine, ownTurn) {
  const me = spec.seat || 0, opp = 1 - me, turns = L.filter(r => r.t === 'turn'), myTurns = turns.filter(t => t.active === me);
  const lands = n => { const t = myTurns[n - 1]; return t && t.views && t.views[me] && t.views[me].me ? t.views[me].me.lands : null; };
  const handAt = t => t && t.views && t.views[me] && t.views[me].me ? t.views[me].me.handSize : null;
  const l4 = lands(4), l7 = lands(7);
  if (l4 != null && l4 < 3) return { reason: 'flooded or screwed', line: `stuck on ${l4} lands on turn 4` };
  if (l7 != null && l7 >= 7 && (handAt(myTurns[6]) || 0) <= 1) return { reason: 'flooded or screwed', line: `${l7} lands and an empty hand by turn 7` };
  if (out.engineAt == null && myTurns.length >= 4) return { reason: 'engine never deployed', line: `no engine card cast in ${myTurns.length} turns` };
  // swept: three or more of my creatures gone in one of the opponent's turns, outside combat
  const byTurn = {}; for (const r of L) if (r.t === 'leaves' && r.seat === me && r.kind === 'creature' && r.to !== 'Hand' && !/COMBAT/i.test(r.phase || '')) byTurn[r.turn] = (byTurn[r.turn] || 0) + 1;
  const sw = Object.entries(byTurn).find(([, n]) => n >= 3);
  if (sw) { const c = L.find(r => r.t === 'cast' && r.seat === opp && r.spell && r.turn === +sw[0]); return { reason: 'swept', line: `${sw[1]} creatures lost on turn ${ownTurn(+sw[0])}${c ? ' to ' + c.name : ''}` }; }
  const fr = out.firstRemoval;
  if (fr && !fr.survived) return { reason: 'engine removed with no protection up', line: `${fr.card} removed by ${fr.by} on turn ${fr.turn}${fr.protectionInHand ? ', protection in hand but not used' : ', no protection in hand'}` };
  // out-raced: I was attacking and got them low, and died first
  const oppLow = turns.length ? Math.min(...turns.map(t => t.views && t.views[opp] && t.views[opp].me ? t.views[opp].me.life : 20)) : 20;
  if (out.attacks >= 2 && oppLow <= 8) return { reason: 'out-raced', line: `had them at ${oppLow} and died first` };
  const lastHands = myTurns.slice(-3).map(handAt).filter(x => x != null);
  if (lastHands.length >= 2 && lastHands.every(h => h <= 1)) return { reason: 'out of cards', line: `${lastHands.join(', ')} cards in hand over the last turns` };
  return { reason: 'other', line: `lost on turn ${myTurns.length}` };
}

// many games: the stats the Test tab shows, and the loss reasons with up to two example lines each
function aggregate(games) {
  const g = (games || []).filter(Boolean), n = g.length; if (!n) return null;
  const mean = xs => xs.length ? +(xs.reduce((a, b) => a + b, 0) / xs.length).toFixed(1) : null, share = (a, b) => b ? +(a / b).toFixed(3) : null;
  const solo = g.filter(x => x.soloAt != null), rem = g.filter(x => x.firstRemoval), losses = g.filter(x => !x.won && x.loss);
  const reasons = {}; for (const x of losses) { const r = reasons[x.loss] = reasons[x.loss] || { n: 0, examples: [] }; r.n++; if (r.examples.length < 2) r.examples.push(x.lossLine); }
  const attacks = g.reduce((a, x) => a + x.attacks, 0), alone = g.reduce((a, x) => a + x.alone, 0);
  return { games: n, wins: g.filter(x => x.won).length, winAt: mean(g.filter(x => x.won).map(x => x.turns)),
    soloAt: mean(solo.map(x => x.soloAt)), soloShare: share(solo.length, n), soloChampion: share(solo.filter(x => x.soloChampion).length, solo.length),
    aloneShare: share(alone, attacks), engineAt: mean(g.filter(x => x.engineAt != null).map(x => x.engineAt)), engineShare: share(g.filter(x => x.engineAt != null).length, n),
    geared5: share(g.filter(x => x.geared5).length, n), survivedFirstRemoval: share(rem.filter(x => x.firstRemoval.survived).length, rem.length), removalGames: rem.length,
    lifegainPerTurn: mean(g.map(x => x.turns ? x.lifegain / x.turns : 0)), losses: losses.length,
    reasons: REASONS.filter(r => reasons[r]).map(r => ({ reason: r, n: reasons[r].n, examples: reasons[r].examples })) };
}
// add aggregates (a running total across pairings: the per-game lists are what's summed)
const merge = parts => aggregate(parts.flatMap(p => (p && p.raw) || []));

module.exports = { readLog, extract, aggregate, merge, REASONS };
