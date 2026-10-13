// The "functional deck" check: does the list pass the basics before any matchup number
// means anything? (RESEARCH-LIMITED-PLAYER-12OCT.md, "What this means for the sim and the
// coach"; the constructed numbers from RESEARCH-STANDARD-PLAYER-12OCT.md, the mana-base table.)
//
// Two checks, for 60-card constructed decks, each against a published rule AND against what
// the current field's tuned lists actually do (the rules alone flag 11 of the 20 meta decks:
// low-curve aggro runs 20-22 lands and wins):
//  - land count: the rule is 24-26, one fewer under 2.5 average mana value, one more over 3.5;
//    flagged only when the list is also 2+ lands off what field decks of the same curve run
//    (a straight line through the field's lands against average mana value);
//  - colour sources: for each colour, the lands that make it against the most demanding card
//    of that colour, from Frank Karsten's sources-to-cast-on-curve table (90%); flagged only
//    when the shortfall is bigger than all but a fifth of the field's own.
// Plus facts the coach weighs itself, with no threshold: plays at two mana or less, and the curve.
const meta = require('./meta');
const { produced } = require('./pilot');

// Karsten, "How Many Sources Do You Need to Consistently Cast Your Spells? A 2022 Update"
// (TCGplayer Infinite, 8 Feb 2022), 60-card decks, as verified from the live page in
// KARSTEN-SOURCES-VERIFIED.md: coloured sources for an (89 + mana value)% chance to cast on
// curve, by coloured pips and mana value, at 20 / 25 / 30 lands. Between columns the count is
// interpolated by the deck's lands; past the end of a row the last entry stands.
const NEED = {
  1: { 1: [12, 14, 15], 2: [11, 13, 14], 3: [10, 12, 13], 4: [9, 10, 12], 5: [8, 9, 11], 6: [7, 9, 10] },
  2: { 2: [18, 21, 23], 3: [15, 18, 21], 4: [13, 16, 19], 5: [12, 15, 17], 6: [11, 13, 16], 7: [10, 12, 15] },
  3: { 3: [19, 23, 27], 4: [17, 21, 24], 5: [15, 19, 22], 6: [14, 17, 20], 7: [12, 16, 19] },
  4: { 4: [20, 24, 29], 5: [18, 22, 26] },
};
const need = (pips, mv, lands = 25) => {
  const row = NEED[Math.min(4, pips)], ks = Object.keys(row).map(Number);
  const [l20, l25, l30] = row[Math.min(Math.max(mv, ks[0]), ks[ks.length - 1])];
  const L = Math.min(30, Math.max(20, lands));
  return Math.round(L <= 25 ? l20 + (l25 - l20) * (L - 20) / 5 : l25 + (l30 - l25) * (L - 25) / 5);
};
const NAME = { W: 'white', U: 'blue', B: 'black', R: 'red', G: 'green' };

const faces = k => k.card_faces && k.card_faces.length ? k.card_faces : [k];
// Can this land be tapped for mana on turn 1? Not if it enters tapped, except the fast lands
// (untapped with two or fewer other lands) and the shocks (pay 2 life); a fetch that finds a
// tapped land (Fabled Passage, Evolving Wilds) doesn't either. Karsten counts only these for a one-drop.
const untappedT1 = k => {
  const t = faces(k).map(f => f.oracle_text || '').join('\n');
  if (/two or fewer other lands|you may pay 2 life/i.test(t)) return true;
  return !/enters (the battlefield )?tapped|onto the battlefield tapped/i.test(t);
};
const isLand = k => /\bLand\b/.test(faces(k)[0].type_line || k.type_line || '');
// coloured pips of the front face's cost; hybrid and Phyrexian pips are left out (they can be paid otherwise)
const pipsOf = k => {
  const out = {};
  for (const m of (faces(k)[0].mana_cost || k.mana_cost || '').matchAll(/\{([WUBRG])\}/g)) out[m[1]] = (out[m[1]] || 0) + 1;
  return out;
};

// mana value as the deck plays it: the front face's cost (split and adventure cards would
// otherwise count both halves), with X counted as 1
function mvOf(k) {
  const cost = faces(k)[0].mana_cost ?? k.mana_cost ?? '';
  if (!cost && !k.card_faces) return Math.round(k.cmc || 0);
  let mv = 0;
  for (const m of cost.matchAll(/\{([^}]+)\}/g)) mv += /^\d+$/.test(m[1]) ? +m[1] : 1; // a coloured, hybrid or X symbol: 1
  return mv;
}

function measure(main, find) {
  const unknown = [], src = { W: 0, U: 0, B: 0, R: 0, G: 0 }, src1 = { W: 0, U: 0, B: 0, R: 0, G: 0 }, worst = {};
  let lands = 0, spells = 0, mvSum = 0, early = 0;
  const curve = {}, spellList = [];
  for (const c of main) {
    const k = find(c.name);
    if (!k) { unknown.push(c.name); continue; }
    if (isLand(k)) {
      lands += c.qty;
      for (const col of produced(k)) { src[col] += c.qty; if (untappedT1(k)) src1[col] += c.qty; }
      continue;
    }
    // a spell with a land on its back (a modal double-faced card) still makes mana
    // ... and counts as 0.4 of a land (Karsten, for the non-mythic ones)
    if (faces(k).slice(1).some(f => /\bLand\b/.test(f.type_line || ''))) { lands += 0.4 * c.qty; for (const col of produced({ card_faces: faces(k).slice(1) })) { src[col] += c.qty; if (untappedT1({ card_faces: faces(k).slice(1) })) src1[col] += c.qty; } }
    const mv = mvOf(k);
    spells += c.qty; mvSum += mv * c.qty;
    if (mv <= 2) early += c.qty;
    curve[Math.min(mv, 6)] = (curve[Math.min(mv, 6)] || 0) + c.qty;
    spellList.push({ name: c.name, cost: faces(k)[0].mana_cost || k.mana_cost, mv, pips: pipsOf(k) });
  }
  // the land count sets the column, so the worst card per colour is found after counting
  // the worst card per colour is the one furthest short of its sources (a one-drop counts only
  // lands untapped on turn 1)
  for (const sp of spellList) for (const [col, n] of Object.entries(sp.pips)) {
    const want = need(n, Math.max(1, sp.mv), lands), have = sp.mv <= 1 ? src1[col] : src[col];
    if (!worst[col] || want - have > worst[col].need - worst[col].have) worst[col] = { need: want, have, card: sp.name, cost: sp.cost, mv: sp.mv };
  }
  const avgMV = spells ? mvSum / spells : 0;
  const colours = Object.keys(worst).map(c => ({ colour: NAME[c], sources: worst[c].have, untapped: worst[c].mv <= 1, need: worst[c].need, card: worst[c].card, cost: worst[c].cost, mv: worst[c].mv, short: Math.max(0, worst[c].need - worst[c].have) }));
  return { lands: Math.round(lands * 10) / 10, avgMV, colours, early, curve, unknown };
}

const sizeOf = main => main.reduce((s, c) => s + c.qty, 0);

// What the field's tuned lists do: lands against average mana value (least squares), and how
// far short of Karsten's table their worst colour runs.
const fieldSeen = new WeakMap();
async function fieldOf(field) {
  if (!field || !field.length) return null;
  if (fieldSeen.has(field)) return fieldSeen.get(field);
  const decks = field.filter(d => d.main && Math.abs(sizeOf(d.main) - 60) <= 2);
  const find = await meta.cards(decks.flatMap(d => d.main.map(c => c.name)));
  const ms = decks.map(d => measure(d.main, find)).filter(m => m.lands);
  if (ms.length < 5) return null;
  const n = ms.length, mx = ms.reduce((s, m) => s + m.avgMV, 0) / n, my = ms.reduce((s, m) => s + m.lands, 0) / n;
  const sxx = ms.reduce((s, m) => s + (m.avgMV - mx) ** 2, 0), sxy = ms.reduce((s, m) => s + (m.avgMV - mx) * (m.lands - my), 0);
  const slope = sxx ? sxy / sxx : 0;
  const shorts = ms.map(m => Math.max(0, ...m.colours.map(c => c.short))).sort((a, b) => a - b);
  const out = { decks: n, lands: x => my + slope * (x - mx), shortCut: shorts[Math.floor(0.8 * (n - 1))], landsMin: Math.min(...ms.map(m => m.lands)), landsMax: Math.max(...ms.map(m => m.lands)) };
  fieldSeen.set(field, out);
  return out;
}

// field: the current meta's lists ({name, main}), optional; without it the published rules
// alone flag. near: the meta deck the brew reads as closest to (calibration), optional: a rule
// that deck breaks the same way is the archetype's choice, not a fault, and isn't flagged.
async function check(list, field, near) {
  const main = (list && list.main) || [];
  const size = sizeOf(main);
  if (size < 58 || size > 62) return null; // 60-card constructed only
  const find = await meta.cards(main.map(c => c.name));
  const m = measure(main, find), f = await fieldOf(field).catch(() => null);
  const landRange = m.avgMV < 2.5 ? [23, 25] : m.avgMV > 3.5 ? [25, 27] : [24, 26];
  const typical = f ? f.lands(m.avgMV) : null;
  const base = near && field ? field.find(d => d.name === near) : null;
  const nm = base ? measure(base.main, await meta.cards(base.main.map(c => c.name))) : null;
  const flags = [], shared = [];
  const offRule = m.lands < landRange[0] || m.lands > landRange[1], offField = typical == null || Math.abs(m.lands - typical) >= 2;
  if (offRule && offField && nm && Math.abs(m.lands - nm.lands) <= 1) shared.push(`${m.lands} lands, as the stock ${near} list runs ${nm.lands}`);
  else if (offRule && offField) flags.push(`${m.lands} lands, where the rule for this curve (average mana value ${m.avgMV.toFixed(1)}) is ${landRange[0]}-${landRange[1]}${typical != null ? ` and field decks with this curve run about ${Math.round(typical)}` : ''}`);
  const cut = f ? Math.max(2, f.shortCut + 1) : 2;
  for (const c of m.colours) {
    if (c.short < cut) continue;
    const nc = nm && nm.colours.find(x => x.colour === c.colour);
    if (nc && c.short <= nc.short + 1) { shared.push(`${c.sources} ${c.untapped ? 'untapped ' : ''}${c.colour} sources, as the stock ${near} list runs ${nc.sources}`); continue; }
    flags.push(`${c.sources} ${c.untapped ? 'untapped ' : ''}${c.colour} sources; ${c.card} (${c.cost}) wants ${c.need} to be cast on turn ${Math.max(1, c.mv)} about 9 times in 10`);
  }
  return { size, ...m, near: nm ? near : null, shared, landRange, typical, fieldDecks: f ? f.decks : 0, shortCut: f ? f.shortCut : null, flags, ok: !flags.length };
}

// The check as text for the coach.
function text(f) {
  if (!f) return '';
  const curve = Object.entries(f.curve).map(([mv, n]) => `${n} at ${mv === '6' ? '6+' : mv}`).join(', ');
  const cols = f.colours.map(c => `${c.colour} ${c.sources} ${c.untapped ? 'untapped ' : ''}sources (the ${c.colour} card furthest short, ${c.card} ${c.cost}, wants ${c.need})`).join('; ');
  return `

Functional check (rules of thumb, before any matchup number): ${f.ok ? 'passes.' : 'flags ' + f.flags.join('; ') + '.'}${f.shared.length ? ` Breaks a rule the way its archetype does on purpose, not flagged: ${f.shared.join('; ')}.` : ''} Lands ${f.lands} of ${f.size} (rule for this curve ${f.landRange[0]}-${f.landRange[1]}: 24-26 in Standard, one fewer under 2.5 average mana value, one more over 3.5${f.typical != null ? `; meta decks with this curve run about ${Math.round(f.typical)}, from a line through the ${f.fieldDecks} meta lists` : ''}); average mana value of the spells ${f.avgMV.toFixed(1)}; ${f.early} plays at two mana or less; curve ${curve}. Colour sources counted from lands (and spells with a land on the back), against Frank Karsten's 2022 table of sources needed to cast a card on curve about 9 times in 10 (read at this deck's land count; a one-drop counts only lands untapped on turn 1, a spell with a land on its back counts 0.4 of a land): ${cols || 'colourless'}${f.shortCut != null ? ` (tuned meta lists commonly run up to ${f.shortCut} short of the table in their worst colour, so only a bigger gap is flagged)` : ''}.${f.unknown.length ? ' Not found in the card data, left out: ' + f.unknown.join(', ') + '.' : ''} If the deck fails the check, fixing that comes before any matchup advice, since a deck that stumbles on mana loses to everything; but a tuned list that breaks a rule of thumb on purpose (a low-curve aggro deck on 22 lands) is fine, so say why it matters for this list rather than quoting the rule.`;
}

module.exports = { check, text, need };
