// The brew check (Design's change 24, NOTE-TO-CODE-16OCT-CHECK.md §1): how a list compares with the shell real
// players build, before any games. Norms come from the real lists of each field archetype (realdata.mains: six
// weeks of paper events, filed under the nearest field deck); a deck is checked against the archetype whose core
// (cards in 80%+ of its real lists) it shares most of.
//
//   norms(field, format)  -> { [archetype]: { lists, core, rate, curve, mix, avgMv, big } }   cached for 6 hours
//   check(list, ctx)      -> ver.check: { archetype, shellPct, lists, avgMv, curve, mix, findings, collection }
//   roleOf(card)          -> { creature, removal, interaction, draw, land }
const meta = require('./meta');
const realdata = require('./realdata');
const functional = require('./functional');
const { produced } = require('./pilot');

const faces = k => k?.card_faces || [k || {}];
const textOf = k => faces(k).map(f => f.oracle_text || '').join('\n');
const typeOf = k => faces(k)[0]?.type_line || k?.type_line || '';
const BASIC = /^(plains|island|swamp|mountain|forest|wastes)$/i;

// A card's roles for the mix, read from its rules text (the tags the Codex and the pilot already use)
function roleOf(k) {
  if (!k) return {};
  const t = textOf(k), type = typeOf(k);
  return {
    land: meta.isLand(k),
    creature: /\bCreature\b/.test(type),
    removal: /(?:destroy|exile) target (?:[\w-]+ )*(?:creature|planeswalker|permanent)|deals? (?:\d+|X|that much) damage to (?:any target|target (?:[\w-]+ )*(?:creature|planeswalker))|target creature (?:an opponent controls )?gets -\d+\/-\d+|-X\/-X|fights? target/i.test(t),
    interaction: /counter target|target (?:player|opponent) (?:reveals|discards)|each opponent discards|discards? (?:a|two) cards?.*(?:target|each) opponent|can't cast/i.test(t),
    draw: /draws? (?:a|an|two|three|four|X|that many) cards?|\binvestigate\b|exile the top [\w ]+ of your library\. (?:you may|until)/i.test(t),
  };
}
const MIX = [['Creatures', 'creature', 3], ['Removal', 'removal', 2], ['Interaction', 'interaction', 2], ['Card draw', 'draw', 2], ['Lands', 'land', 1]];

// one list's shape: curve (nonland mana values 0..7+), counts per role, average mana value, cards at 5+
function shapeOf(main, find) {
  const curve = [0, 0, 0, 0, 0, 0, 0, 0], mix = { creature: 0, removal: 0, interaction: 0, draw: 0, land: 0 };
  let n = 0, mv = 0, big = 0, singles = 0;
  for (const c of main) {
    const k = find(c.name); if (!k) continue;
    const r = roleOf(k);
    for (const key of Object.keys(mix)) if (r[key]) mix[key] += c.qty;
    if (r.land) continue;
    if (c.qty === 1) singles++;
    const v = Math.min(7, Math.floor(k.cmc || 0)); curve[v] += c.qty; n += c.qty; mv += c.qty * (k.cmc || 0); if ((k.cmc || 0) >= 5) big += c.qty;
  }
  return { curve, mix, avgMv: n ? mv / n : 0, big, singles };
}

let cache = { key: null, at: 0, norms: null };
async function norms(field, format, days = 42) {
  const key = format + ':' + field.map(d => d.name).sort().join('|');
  if (cache.key === key && Date.now() - cache.at < 6 * 36e5) return cache.norms;
  const real = await realdata.mains(field, format, { days }).catch(() => ({}));
  const all = new Set(); for (const d of field) d.main.forEach(c => all.add(c.name));
  for (const a of Object.values(real)) for (const l of a.lists) l.forEach(c => all.add(c.name));
  const find = await meta.cards([...all]);
  const out = {};
  for (const d of field) {
    // an archetype with under five real lists is judged on its field list alone
    const lists = (real[d.name]?.lists || []).length >= 5 ? real[d.name].lists : [d.main];
    const seen = {};
    for (const l of lists) { const here = new Map(); for (const c of l) { const n = meta.forgeName(find(c.name) || { name: c.name }); here.set(n, (here.get(n) || 0) + c.qty); } for (const [n, q] of here) { const x = seen[n] = seen[n] || { decks: 0, copies: 0 }; x.decks++; x.copies += q; } }
    const rate = Object.fromEntries(Object.entries(seen).map(([n, x]) => [n, x.decks / lists.length]));
    const core = Object.entries(seen).filter(([n, x]) => x.decks / lists.length >= 0.8 && !BASIC.test(n) && !meta.isLand(find(n))).map(([name, x]) => ({ name, copies: Math.round(x.copies / x.decks) }));
    const shapes = lists.map(l => shapeOf(l, find)), avg = f => shapes.reduce((a, s) => a + f(s), 0) / shapes.length;
    out[d.name] = { lists: lists.length, real: lists.length >= 5, core, rate, copies: Object.fromEntries(Object.entries(seen).map(([n, x]) => [n, x.copies / x.decks])),
      curve: [0, 1, 2, 3, 4, 5, 6, 7].map(i => +avg(s => s.curve[i]).toFixed(1)), mix: Object.fromEntries(MIX.map(([, key]) => [key, +avg(s => s.mix[key]).toFixed(1)])),
      avgMv: +avg(s => s.avgMv).toFixed(2), big: +avg(s => s.big).toFixed(1), singles: +avg(s => s.singles).toFixed(1), main: d.main };
  }
  cache = { key, at: Date.now(), norms: out };
  return out;
}

const money = x => '$' + (x >= 10 ? Math.round(x) : x.toFixed(2));
const plural = (n, w) => `${n} ${w}${n === 1 ? '' : 's'}`;

// ctx: { field, format, legality, paper: { cards } | null, budget: { mode, usd } | null }
async function check(list, { field, format = 'standard', legality = null, paper = null, budget = null } = {}) {
  const main = (list && list.main) || [];
  if (!field || !field.length || !main.length) return null;
  const N = await norms(field, format);
  const find = await meta.cards([...new Set([...main.map(c => c.name), ...Object.values(N).flatMap(a => Object.keys(a.rate))])]);
  const have = new Map(); for (const c of main) { const n = meta.forgeName(find(c.name) || { name: c.name }); have.set(n, (have.get(n) || 0) + c.qty); }
  // the shell: the archetype whose core this list holds most of, by count
  let best = null, bestPct = -1;
  for (const [name, a] of Object.entries(N)) {
    const want = a.core.reduce((t, c) => t + c.copies, 0); if (!want) continue;
    const got = a.core.reduce((t, c) => t + Math.min(c.copies, have.get(c.name) || 0), 0);
    if (got / want > bestPct) { bestPct = got / want; best = name; }
  }
  if (!best) return null;
  // under this share of any shell's core the list is its own brew: comparing its curve and mix with the nearest
  // meta deck would be noise ("cut 16 at 4" against Lifegain for an equipment deck), so only the rules apply
  const NO_SHELL = 0.3, shelled = bestPct >= NO_SHELL, closest = best;
  const A = N[best], me = shapeOf(main, find), size = main.reduce((t, c) => t + c.qty, 0);
  const owned = paper && paper.cards ? paper.cards : null, ownedN = n => (owned && owned[n]) || 0;
  const price = n => meta.cardFacts(n).price;
  // the shell's picks for a role, owned ones first, then by how often the shell plays them; with a price if not owned
  const picks = (role, k = 3) => Object.entries(A.rate).filter(([n, r]) => r >= 0.15 && roleOf(find(n))[role] && (have.get(n) || 0) < Math.round(A.copies[n] || 1))
    .sort((x, y) => (ownedN(y[0]) > 0) - (ownedN(x[0]) > 0) || y[1] - x[1]).slice(0, k)
    .map(([n]) => ownedN(n) ? `${n} (you own ${ownedN(n)})` : price(n) != null ? `${n} (${money(price(n))})` : n);
  const findings = [], add = (sev, text, fix = '') => findings.push({ sev, text, fix });

  // high
  for (const x of legality && !legality.ok ? legality.illegal || [] : []) {
    const r = roleOf(find(x.name)), alt = picks(r.removal ? 'removal' : r.creature ? 'creature' : r.interaction ? 'interaction' : 'draw', 2);
    add('high', `${x.name} isn't legal in ${format}.`, alt.length ? `Swap it for ${alt.join(' or ')}.` : 'Swap it for a legal card.');
  }
  if (size < 60) add('high', `${size} cards. A constructed deck needs 60.`, `Add ${60 - size}.`);
  const mixOf = key => ({ mine: me.mix[key], norm: Math.round(A.mix[key]) });
  if (shelled) { const r = mixOf('removal'); if (r.norm - r.mine >= 4) add('high', `${plural(r.mine, 'removal spell')}. ${best} runs about ${r.norm}.`, `Add ${r.norm - r.mine}: ` + picks('removal').join(', ') + '.'); }
  const fc = await functional.check(list, field, shelled ? best : null).catch(() => null);
  if (fc) {
    const [lo, hi] = fc.landRange, off = fc.lands < lo ? lo - fc.lands : fc.lands > hi ? fc.lands - hi : 0;
    if (off >= 2 && fc.flags.some(f => /lands/.test(f))) add('high', `${fc.lands} lands for an average mana value of ${fc.avgMV.toFixed(1)}. Karsten's count is ${lo}–${hi}.`, fc.lands < lo ? `Add ${lo - fc.lands} lands; cut your highest-cost spells.` : `Cut ${fc.lands - hi} lands for spells.`);
    for (const f of fc.flags.filter(f => /sources/.test(f))) add('high', f.charAt(0).toUpperCase() + f.slice(1) + '.', 'More lands of that colour, or fewer cards that need it early.');
  }
  { // two colours and no land that makes both
    const cols = new Set(); for (const c of main) { const k = find(c.name); if (k && !meta.isLand(k)) for (const m of String(faces(k)[0].mana_cost || k.mana_cost || '').matchAll(/\{([WUBRG])/g)) cols.add(m[1]); }
    const duals = main.filter(c => { const k = find(c.name); return k && meta.isLand(k) && produced(k).filter(x => cols.has(x)).length >= 2; }).reduce((t, c) => t + c.qty, 0);
    if (cols.size >= 2 && !duals) {
      const lands = Object.entries(A.rate).filter(([n]) => { const k = find(n); return k && meta.isLand(k) && produced(k).filter(x => cols.has(x)).length >= 2; }).sort((x, y) => y[1] - x[1]).slice(0, 3).map(([n]) => ownedN(n) ? `${n} (you own ${ownedN(n)})` : price(n) != null ? `${n} (${money(price(n))})` : n);
      add('high', `${cols.size} colours and no land that makes two of them.`, lands.length ? 'Dual lands the shell plays: ' + lands.join(', ') + '.' : 'Add dual lands.');
    }
  }
  // mid
  const gaps = shelled ? me.curve.map((n, i) => ({ i, d: n - A.curve[i] })) : [];
  for (const g of gaps.filter(g => Math.abs(g.d) >= 3).sort((x, y) => Math.abs(y.d) - Math.abs(x.d)).slice(0, 2)) add('mid', `${me.curve[g.i]} cards at ${g.i === 7 ? '7+' : g.i} mana; ${best} runs about ${Math.round(A.curve[g.i])}.`, g.d > 0 ? `Cut ${Math.round(g.d)} at ${g.i === 7 ? '7+' : g.i}.` : `Add ${Math.round(-g.d)} at ${g.i}.`);
  const singles = main.filter(c => c.qty === 1 && !BASIC.test(c.name) && !meta.isLand(find(c.name)));
  if (singles.length >= 5 && (!shelled || singles.length >= Math.round(A.singles) + 3)) add('mid', `${singles.length} one-ofs. You'll rarely see the same card twice.`, `Play more copies of the best of them: ${singles.slice(0, 3).map(c => c.name).join(', ')}.`);
  if (shelled) for (const [k, role] of [['Interaction', 'interaction'], ['Card draw', 'draw']]) { const r = mixOf(role); if (r.norm - r.mine >= 2) add('mid', `${r.mine} ${k.toLowerCase()} cards; ${best} runs about ${r.norm}.`, picks(role).length ? 'Add ' + picks(role).join(', ') + '.' : ''); }
  if (me.big > 4 && (!shelled || A.big < 5)) add('mid', `${me.big} cards at 5+ mana. Outside a ramp deck, that's a slow hand.`, 'Trim to four.');
  if (shelled) { const r = mixOf('removal'); if (r.norm - r.mine >= 2 && r.norm - r.mine < 4) add('mid', `${plural(r.mine, 'removal spell')}; ${best} runs about ${r.norm}.`, 'Add ' + picks('removal').join(', ') + '.'); }
  // low
  if (shelled && fc && !findings.some(f => /lands for an average/.test(f.text))) { const want = Math.round(A.mix.land); if (Math.abs(fc.lands - want) === 1) add('low', `${fc.lands} lands; ${best} runs ${want}.`, fc.lands < want ? 'One more land.' : 'One fewer land.'); }
  if (shelled && !gaps.some(g => Math.abs(g.d) >= 3)) { const g = gaps.find(g => Math.abs(g.d) >= 2); if (g) add('low', `${me.curve[g.i]} at ${g.i === 7 ? '7+' : g.i} mana, about ${Math.round(A.curve[g.i])} in the shell.`, ''); }
  const odd = [...have.keys()].filter(n => !BASIC.test(n) && !meta.isLand(find(n)) && (A.rate[n] || 0) < 0.05);
  if (shelled && odd.length && A.real) add('low', `${odd.slice(0, 3).join(', ')}${odd.length > 3 ? ` and ${odd.length - 3} more` : ''}: ${best} lists almost never play ${odd.length === 1 ? 'it' : 'them'}.`, 'Fine if it is the point of the brew; otherwise the shell\'s own picks.');
  if (!shelled) add('low', `No meta deck shares more than ${Math.round(bestPct * 100)}% of its core with this list (closest: ${closest}), so it's checked against the rules, not a shell.`, 'Run it to see how it does against the field.');
  const order = { high: 0, mid: 1, low: 2 };
  findings.sort((a, b) => order[a.sev] - order[b.sev]);

  // the paper collection's cover of this list
  let collection = null;
  if (owned) {
    let got = 0, cost = 0; const short = [];
    for (const [n, q] of have) { const o = Math.min(q, BASIC.test(n) ? q : ownedN(n)); got += o; if (o < q) { short.push(`${q - o} ${n}`); const p = price(n); if (p != null) cost += (q - o) * p; } }
    collection = got >= size ? `Your paper collection covers all ${size}.` : `Your paper collection covers ${got} of ${size}; the ${short.length <= 2 ? short.join(' and ') : short.length + ' cards'} you're short cost about ${money(cost)}.`;
  }
  return { archetype: shelled ? best : null, closest, shellPct: Math.round(bestPct * 100), lists: shelled ? A.lists : 0, avgMv: shelled ? A.avgMv : null, mineAvgMv: +me.avgMv.toFixed(2),
    curve: shelled ? A.curve : null, mine: me.curve, mix: shelled ? MIX.map(([k, key, tol]) => ({ k, mine: me.mix[key], norm: Math.round(A.mix[key]), tol })) : [],
    findings: findings.slice(0, 8), collection, at: Date.now() };
}

module.exports = { norms, check, roleOf, shapeOf };
