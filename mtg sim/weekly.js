// The weekly rerun's comparison (Design's change 12): a brew's rerun on the new field against its previous
// field run. Both are run views (server.js runView): { id, v, score: { p }, opponents: [{ name, metaPct, score: { p } }] }.
// p is a fraction; metaPct a percent. Returns what goes on brew.weekly, less the server's own fields.
const MOVE_HEAD = 0.03, MOVE_ROW = 0.08, MOVE_SHARE = 3;

function compare(name, now, prev) {
  const find = (rv, n) => (rv.opponents || []).find(x => x.name === n) || null;
  const movers = (now.opponents || []).map(o => {
    const was = find(prev, o.name);
    return { opponent: o.name, metaPct: o.metaPct ?? null, prevPct: was ? was.metaPct ?? null : null, p: o.score ? o.score.p : null, prevP: was && was.score ? was.score.p : null, new: !was };
  }).filter(m => m.p != null && (m.new || (m.prevP != null && Math.abs(m.p - m.prevP) >= MOVE_ROW) || (m.metaPct != null && m.prevPct != null && Math.abs(m.metaPct - m.prevPct) >= MOVE_SHARE)))
    // what moved the headline most: share times how far the matchup moved (a new deck counts its distance from even)
    .sort((x, y) => weight(y) - weight(x));
  const delta = now.score.p - prev.score.p;
  const notify = Math.abs(delta) >= MOVE_HEAD || movers.some(m => m.prevP != null && Math.abs(m.p - m.prevP) >= MOVE_ROW);
  return { p: now.score.p, prev: prev.score.p, delta, movers: movers.slice(0, 6), notify, text: `${name} ${pc(prev.score.p)} → ${pc(now.score.p)} this week: ${why(movers[0])}.` };
}
const pc = x => Math.round(x * 100);
const weight = m => (m.metaPct || 0) * Math.abs(m.p - (m.prevP ?? 0.5)) + (m.metaPct != null && m.prevPct != null ? Math.abs(m.metaPct - m.prevPct) * 0.5 : 0);

// "Landfall rose to 28% and you are 38% against it (was 47%)"
function why(m) {
  if (!m) return 'no single matchup moved much';
  const share = m.metaPct == null ? null : Math.round(m.metaPct);
  const field = m.new ? 'is new in the field' : share == null ? 'moved' : m.prevPct == null || Math.round(m.prevPct) === share ? `is ${share}% of the field` : `${m.metaPct > m.prevPct ? 'rose' : 'fell'} to ${share}%`;
  const was = m.prevP != null && pc(m.prevP) !== pc(m.p) ? ` (was ${pc(m.prevP)}%)` : '';
  return `${m.opponent} ${field} and you are ${pc(m.p)}% against it${was}`;
}

module.exports = { compare, MOVE_HEAD, MOVE_ROW };
