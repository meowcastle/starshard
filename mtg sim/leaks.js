// A player's leaks with a deck, from their own game logs (research's app-value item A, change 10): the
// pilot statistics for one seat, with the moments behind them. Factored out of research's
// tools/log-leaks.js so the Mac worker can count each Arena match and the server can pool a brew's.
//
//   tally(games, seat)  games = [[record, ...], ...] in the sim's log format -> counts and moments
//   merge(tallies)      sums several tallies (a brew's matches)
//   view(tally)         { games, wins, turns, stats: { key: { value, n, unit } }, moments } (brew.real.leaks)
// Each stat's value is per-turn mana or a share (0..1); n = 0 means the log did not carry what it needs
// ("not measured yet" on the page). Targets live on the page, not here.
const KEYS = ['unspentOwn', 'unspentOpp', 'heldUsed', 'threatsAnswered', 'openBoardAttacked', 'lethalTaken', 'earlyInstants', 'keeps7'];
const UNIT = k => k.startsWith('unspent') ? 'mana' : 'share';
const isEarly = p => /UPKEEP|DRAW|Beginning|Step_Upkeep|Step_Draw/.test(p || '');
const isThreat = r => r.kind === 'creature' || r.kind === 'planeswalker';
// the grading's version: a match graded by an older one is regraded when the worker sends it again
// (2, 16 Oct: protection-only instants are not held mana; the conceded turn is not graded)
const GRADE = 2;
const empty = () => ({ grade: GRADE, games: 0, wins: 0, turns: 0, acc: Object.fromEntries(KEYS.map(k => [k, [0, 0]])), moments: [] });

function tally(games, SEAT = 'player') {
  const S = empty(), acc = S.acc;
  for (const recs of games) {
    const head = recs.find(r => r.t === 'game'), end = recs.find(r => r.t === 'end');
    if (!head || !end) continue;
    const me = head.decks.indexOf(SEAT); if (me < 0) continue;
    const opp = 1 - me, M = { match: head.match, game: head.game };
    S.games++; if (end.winner === me) S.wins++;
    const mom = (turn, kind, text) => S.moments.push({ ...M, turn, kind, text });
    // mulligans: the first turn's hand size for this seat (7 = kept)
    const t1 = recs.find(r => r.t === 'turn'); if (t1 && t1.views && t1.views[me]) { acc.keeps7[1]++; if (t1.views[me].me.handSize >= 7) acc.keeps7[0]++; }
    let turn = null, heldInstant = null, oppThreatThisTurn = false, answeredThisTurn = false, castOnOppTurn = false;
    for (let i = 0; i < recs.length; i++) {
      const r = recs[i];
      if (r.t === 'turn') { turn = r; oppThreatThisTurn = false; answeredThisTurn = false; castOnOppTurn = false; if (r.active === me) S.turns++; continue; }
      if (r.t === 'cast') {
        if (r.seat === me && r.active !== me) { castOnOppTurn = true; if (oppThreatThisTurn && r.instant) answeredThisTurn = true; }
        if (r.seat === opp && r.active === opp && isThreat(r)) oppThreatThisTurn = true;
        if (r.seat === me && r.instant) { acc.earlyInstants[1]++; if ((r.stack || 1) <= 1 && isEarly(r.phase)) { acc.earlyInstants[0]++; mom(r.turn, 'timing', `${r.name} cast in ${r.active === me ? 'your own' : "the opponent's"} ${/Beginning|UPKEEP|Upkeep/.test(r.phase) ? 'upkeep' : 'draw step'} with nothing to respond to; the end step or main phase gives the same effect with more information`); } }
        continue;
      }
      if (r.t === 'attack' && r.seat === me && turn) {
        const mine = turn.board.filter(b => b.seat === me && b.kind === 'creature' && !(b.kw || []).includes('defender'));
        const avail = Math.max(mine.length, r.attackers.length), power = Math.max(mine.reduce((a, b) => a + (b.power || 0), 0), r.attackers.reduce((a, b) => a + (b.power || 0), 0));
        const oppLife = turn.views && turn.views[me] ? turn.views[me].opp.life : null;
        if (avail && (r.untappedDefenders || 0) === 0) {
          acc.openBoardAttacked[1]++; if (r.attackers.length >= avail) acc.openBoardAttacked[0]++;
          else mom(r.turn, 'attack', `${avail - r.attackers.length} of ${avail} creatures stayed home against an empty board (${power} power available, opponent at ${oppLife})`);
          if (oppLife != null && power >= oppLife) { acc.lethalTaken[1]++; if (r.attackers.length >= avail) acc.lethalTaken[0]++; else mom(r.turn, 'lethal', `lethal on board (${power} power, opponent at ${oppLife}) and the attack was ${r.attackers.length ? 'partial' : 'skipped'}`); }
        }
        continue;
      }
      if (r.t === 'turn_end') {
        const s = r.seats[me]; if (!s) continue;
        if (r.active === me) {
          acc.unspentOwn[0] += s.manaAvailable || 0; acc.unspentOwn[1]++;
          const castable = (s.castable || []).filter(c => c.mv >= 0);
          // an instant that only protects (arena.js `protect`) is no reason to hold mana: it neither excuses
          // an unspent turn nor counts as held when nothing threatened (16 Oct: Restoration Magic, Celestial Armor)
          const answer = c => c.instant && !c.protect, main = castable.filter(c => !c.instant);
          // the turn the game ended in (a concession mid-turn) is not a turn the mana went unspent
          const final = recs.slice(i + 1).every(x => x.t === 'end');
          if (!final && (s.manaAvailable || 0) >= 2 && main.length && !castable.some(answer)) mom(r.turn, 'mana', `${s.manaAvailable} mana unspent with ${main.map(c => c.name).join(', ')} castable`);
          heldInstant = castable.some(answer) ? castable.filter(answer).map(c => c.name) : null;
          if (heldInstant) acc.heldUsed[1]++;
        } else {
          acc.unspentOpp[0] += s.manaAvailable || 0; acc.unspentOpp[1]++;
          if (heldInstant) { if (castOnOppTurn) acc.heldUsed[0]++; else if ((s.manaAvailable || 0) >= 2) mom(r.turn, 'held', `held ${heldInstant.join(', ')} through the opponent's turn with ${s.manaAvailable} mana open and cast nothing`); }
          if (oppThreatThisTurn && heldInstant) { acc.threatsAnswered[1]++; if (answeredThisTurn) acc.threatsAnswered[0]++; }
          heldInstant = null;
        }
      }
    }
  }
  return S;
}

function merge(list) {
  const S = empty();
  for (const t of list) {
    if (!t) continue;
    S.games += t.games || 0; S.wins += t.wins || 0; S.turns += t.turns || 0;
    for (const k of KEYS) { const x = t.acc?.[k]; if (Array.isArray(x)) { S.acc[k][0] += +x[0] || 0; S.acc[k][1] += +x[1] || 0; } }
    S.moments.push(...(t.moments || []));
  }
  return S;
}

const stat = ([a, n], unit) => ({ value: n ? (unit === 'mana' ? +(a / n).toFixed(2) : +(a / n).toFixed(3)) : null, n, unit });
const view = (t, seat = 'player') => ({ seat, games: t.games, wins: t.wins, turns: t.turns,
  stats: Object.fromEntries(KEYS.map(k => [k, stat(t.acc[k], UNIT(k))])),
  moments: [...t.moments].sort((a, b) => (a.match > b.match ? 1 : a.match < b.match ? -1 : 0) || a.turn - b.turn) });

module.exports = { tally, merge, view, KEYS, GRADE };
