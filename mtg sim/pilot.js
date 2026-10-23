// Our own pilot on Forge's rules engine (forge-pilot/, SCOPE-EXTERNAL-PILOT-12OCT.md).
//
// Plays best-of-three matches through the bridge: each seat owns some decision kinds and
// Forge's AI makes the rest. Phase 1 owns mulligans (pilot.keep) and between-game
// sideboarding (a plan per seat, the same { in, out } sideboard.js writes).
//
//   runMatches({ decks: [a, b], matches, seed, own: [['mulligan'], []], plans: [planA, planB] })
//   gameLog: a directory for the per-turn game logs (one m<match>-g<game>.jsonl.gz per game; GameLog.java)
//     -> { games: [{ match, game, winner, onThePlay, turns, reason }], decisions, errors, ms }
//
// Self-play, the strength check (the pilot's seat against stock Forge, mirror decks, seats
// swapped, fixed seeds; 50% = no stronger):
//   FORGE_DIR=... DATA_DIR=... node pilot.js selfplay <calibration.json> <out dir> [matches per half=8] [at once=4] [decks=12]
const net = require('net');
const config = require('./config');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { toDck } = require('./forge');
const meta = require('./meta');
const SP = require('./forge-pilot/strategy-pilot');

const FORGE_DIR = config.FORGE_DIR;
const BRIDGE = config.PILOT_BRIDGE;
const XMX = config.FORGE_XMX;
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

// ---------------------------------------------------------------- reactive play (the probe)

// Forge underrates exactly the decks built on instants (Azorius Control 19% under Forge,
// 38% in real play; the proactive decks the other way), so the probe gives such a deck a
// pilot for the moments a reactive deck lives on, and leaves every other decision to Forge:
//   1. their spell on top of the stack: counter it if it's a creature, planeswalker, or 2+ mana;
//   2. their attack: kill an attacker with instant-speed removal (Forge picks the target);
//   3. our main phase: play the land; while holding a counter, don't spend below its cost:
//      cast the biggest spell that keeps it open, or pass;
//   4. their end step: if they have a creature, instant removal on it (Forge picks which);
//      then spend what's left on the biggest instant or flash card that isn't a
//      counter or removal (draw spells, flash creatures). Forge leaves that mana unused and
//      never casts some of these at all (Jace's Machinations, Appa, Steadfast Guardian).
const textOf = k => faces(k).map(f => f.oracle_text || '').join('\n') || k?.oracle_text || '';
const roleOf = k => {
  if (!k) return {};
  const t = textOf(k), type = (faces(k)[0] || k).type_line || k.type_line || '';
  return {
    counter: /counter target (?:[\w-]+ )*spell/i.test(t),
    removal: /(?:destroy|exile) target (?:[\w-]+ )*(?:creature|permanent)|deals? (?:\d+|X) damage to (?:any target|target creature)/i.test(t),
    instant: /\bInstant\b/.test(type) || /\bFlash\b/.test(t),
    sweeper: /(?:destroy|exile) all (?:[\w-]+ )*creatures|deals? (?:\d+|X) damage to each creature|all creatures get -/i.test(t),
    permanent: /Creature|Planeswalker|Artifact|Enchantment|Battle/.test(type),
  };
};

// hold: rule 3, keep counter mana up in my own main phase. The 'answers' policy is the same rules
// without it (13 Oct 2026: the hold seemed to cost decks that need to deploy threats).
function reactive(m, find, { hold = true } = {}) {
  const s = m.state || {}, opts = m.options || [], you = s.you || {}, opp = s.opponent || {};
  const role = o => roleOf(find(o.card || ''));
  const top = (s.stack || [])[0];
  if (top) {
    if (top.controller !== 'opponent') return null;
    const k = find(top.source), onField = (opp.battlefield || []).some(c => c.name === top.source);
    const spell = k && !onField && !landish(k);
    const matters = spell && ((k.cmc || 0) >= 2 || /Creature|Planeswalker/.test((faces(k)[0] || k).type_line || k.type_line || ''));
    const c = matters && opts.find(o => o.meta && o.meta.type === 'spell' && role(o).counter);
    return c ? { choice: [c.id] } : null;
  }
  const mine = s.activePlayer === 'you';
  if (!mine && s.phase === 'COMBAT_DECLARE_ATTACKERS' && (s.combat || []).length) {
    const r = opts.find(o => o.meta && o.meta.type === 'spell' && role(o).removal);
    return r ? { choice: [r.id] } : null;
  }
  if (!mine && s.phase === 'END_OF_TURN') {
    const theirs = (opp.battlefield || []).some(c => c.pt);
    const kill = theirs && opts.find(o => o.meta && o.meta.type === 'spell' && role(o).removal && role(o).instant);
    if (kill) return { choice: [kill.id] };
    const spare = opts.filter(o => o.meta && o.meta.type === 'spell' && role(o).instant && !role(o).counter && !role(o).removal).sort((a, b) => (b.meta.cmc || 0) - (a.meta.cmc || 0))[0];
    return spare ? { choice: [spare.id] } : null;
  }
  if (hold && mine && /MAIN/.test(s.phase || '')) {
    const land = opts.find(o => o.meta && o.meta.type === 'land');
    if (land) return { choice: [land.id] };
    const held = (you.hand || []).map(c => find(c.name)).filter(k => k && roleOf(k).counter);
    if (!held.length) return null;
    const need = Math.min(...held.map(k => k.cmc || 0));
    const open = (you.battlefield || []).filter(c => !c.tapped && landish(find(c.name))).length;
    const spells = opts.filter(o => o.meta && o.meta.type === 'spell' && !role(o).counter);
    const dips = o => (o.meta.cmc || 0) > open - need;
    if (!spells.some(dips)) return null; // every play Forge might make keeps the counter up
    const safe = spells.filter(o => !dips(o)).sort((a, b) => (b.meta.cmc || 0) - (a.meta.cmc || 0))[0];
    return { choice: [safe ? safe.id : 'pass'] };
  }
  return null;
}

// The draw-go profile (15 Oct 2026). 'answers' on the opponent's turn, and on our own turn the hold that
// 'reactive' rule 3 only half kept: rule 3 looked at spells, but Azorius tapped below its counter for
// abilities (animating Restless Anchorage, Map tokens, Theorist's Sanctum) as often as for spells, and in 32%
// of the opponent's turns with a counter in hand it had under two lands open (two thirds of those, they cast
// a threat). So on our own turn, with the stack empty, Forge chooses as it likes, but a play that would leave
// fewer open lands than the cheapest counter in hand costs is vetoed (the seat passes instead). Free:
// lands, loyalty abilities, anything once the opponent's hand is empty, and a planeswalker onto a board
// where they have no creature (the walker is safe and is the deck's engine).
const COUNTER_COST = { 'Countersculpt': (jace) => jace ? 2 : 3 };
function costOf(o, find) {
  if (!o.meta) return 0;
  if (o.meta.type === 'spell') return o.meta.cmc || 0;
  if (o.meta.type !== 'ability') return 0;
  const m = /^Activate [^:]*: ((?:\{[^}]+\}(?:, )?)+)[^:]*:/.exec(o.label || '') || /^Activate [^:]*: ((?:\{[^}]+\})+)/.exec(o.label || '');
  if (!m) return 0; // a loyalty ability (+1: ...) or no mana in the cost
  let n = 0;
  for (const [, x] of m[1].matchAll(/\{([^}]+)\}/g)) n += /^\d+$/.test(x) ? +x : /^[WUBRGC](\/[WUBRGP])?$/.test(x) ? 1 : 0;
  // a land's own ability taps or animates the land itself: one land fewer for the counter
  if (landish(find(o.card || ''))) n++;
  return n;
}
function drawgo(m, find) {
  const s = m.state || {}, opts = m.options || [], you = s.you || {}, opp = s.opponent || {};
  const a = reactive(m, find, { hold: false });
  if (a || s.activePlayer !== 'you' || (s.stack || []).length) return a;
  const land = /MAIN/.test(s.phase || '') && opts.find(o => o.meta && o.meta.type === 'land');
  if (land) return { choice: [land.id] };
  if ((opp.handSize ?? 1) === 0) return null;
  const jace = [...(you.hand || []), ...(you.battlefield || [])].some(c => /\bJace\b/.test(c.name || '') && !/Machinations/.test(c.name || ''));
  const counters = (you.hand || []).map(c => c.name).filter(n => roleOf(find(n)).counter);
  if (!counters.length) return null;
  const need = Math.min(...counters.map(n => COUNTER_COST[n] ? COUNTER_COST[n](jace) : (find(n) || {}).cmc || 2));
  const open = (you.battlefield || []).filter(c => !c.tapped && landish(find(c.name))).length;
  const theirs = (opp.battlefield || []).some(c => c.pt);
  const veto = opts.filter(o => {
    if (!o.meta || (o.meta.type !== 'spell' && o.meta.type !== 'ability')) return false;
    if (o.meta.type === 'spell' && !theirs && /Planeswalker/.test(((faces(find(o.card || ''))[0]) || {}).type_line || '')) return false;
    // our own answers are interaction too: a sweeper, a Starcage, a Seam Rip on our turn is never vetoed
    // (the first trial vetoed them and lost: 34.6% -> 28.4% after five rounds, 15 Oct)
    if (o.meta.type === 'spell' && (roleOf(find(o.card || '')).removal || roleOf(find(o.card || '')).sweeper)) return false;
    return open - costOf(o, find) < need;
  }).map(o => o.id);
  return veto.length ? { delegate: true, veto } : null;
}

// The tap-out control profile (RESEARCH-ARCHETYPES-PROFILES-13OCT.md): a sweepers-into-finisher deck
// spends its mana on its own turn. Forge's AI plays any deck named "Control" as hold-mana-up, which is
// draw-go: 4c Control left 3-4 mana unspent on its own turn in the 13 Oct logs. On the opponent's turn
// it answers like 'answers'; on its own main phase it plays its land, then a sweeper only against 3+
// creatures (2 when its life is 10 or less), else its biggest castable spell that isn't a counter,
// permanents and finishers first.
function tapout(m, find) {
  const s = m.state || {}, opts = m.options || [], you = s.you || {}, opp = s.opponent || {};
  const mine = s.activePlayer === 'you';
  if ((s.stack || []).length || !mine || !/MAIN/.test(s.phase || '')) return reactive(m, find, { hold: false });
  const land = opts.find(o => o.meta && o.meta.type === 'land');
  if (land) return { choice: [land.id] };
  const spells = opts.filter(o => o.meta && o.meta.type === 'spell').map(o => ({ o, r: roleOf(find(o.card || '')), k: find(o.card || '') })).filter(x => !x.r.counter);
  if (!spells.length) return null;
  const theirs = (opp.battlefield || []).filter(c => c.pt).length, low = (you.life || 20) <= 10;
  const sweep = spells.find(x => x.r.sweeper);
  if (sweep && (theirs >= 3 || (theirs >= 2 && low))) return { choice: [sweep.o.id] };
  const rest = spells.filter(x => !x.r.sweeper && !(x.r.removal && !theirs));
  if (!rest.length) return null;
  const mv = x => (x.o.meta && x.o.meta.cmc) || (x.k && x.k.cmc) || 0;
  rest.sort((a, b) => (b.r.permanent - a.r.permanent) || (mv(b) - mv(a)));
  return { choice: [rest[0].o.id] };
}

// The spells-matter profile (NOTE-TO-RESEARCH-13OCT-TONIGHT.md §1): a deck whose payoffs get cheaper
// with spells in the graveyard (Spellementals: Eddymurk Crab, Hearth Elemental, then Sunderflock off the
// biggest Elemental) spends its cheap spells on its own turn, toward the payoff, rather than holding them
// as answers for the opponent's end step. Its own main phase: the land, then a payoff that has become
// castable (the most expensive first), then its cheapest draw or selection spell. A counter is kept for
// their spell that matters, as 'answers' does; everything else on their turn stays Forge's.
const payoff = k => /costs? \{(?:X|\d+)\} less to cast/i.test(textOf(k)) && /Creature/.test((faces(k)[0] || k).type_line || k.type_line || '');
const cantrip = k => /\bdraw (?:a|two|three) cards?\b|look at the top|surveil|scry/i.test(textOf(k));
function spells(m, find) {
  const s = m.state || {}, opts = m.options || [];
  const top = (s.stack || [])[0];
  if (top) return top.controller === 'opponent' ? reactive(m, find, { hold: false }) : null;
  if (s.activePlayer !== 'you' || !/MAIN/.test(s.phase || '')) return null;
  const land = opts.find(o => o.meta && o.meta.type === 'land');
  if (land) return { choice: [land.id] };
  const cast = opts.filter(o => o.meta && o.meta.type === 'spell').map(o => ({ o, k: find(o.card || '') })).filter(x => x.k);
  const big = cast.filter(x => payoff(x.k)).sort((a, b) => (b.k.cmc || 0) - (a.k.cmc || 0))[0];
  if (big) return { choice: [big.o.id] };
  const dig = cast.filter(x => cantrip(x.k) && !roleOf(x.k).counter && !payoff(x.k)).sort((a, b) => (a.o.meta.cmc || 0) - (b.o.meta.cmc || 0))[0];
  return dig ? { choice: [dig.o.id] } : null;
}

// ---------------------------------------------------------------- dead cards

// Only the cards Forge's AI never casts (tools/dead-cards.js, forge-pilot/dead-cards.json);
// every other decision stays Forge's. A dead counter answers their spell that matters, a dead
// instant or flash card goes at their end step, anything else in our main phase.
function deadcards(m, find, dead, xPlan = []) {
  const s = m.state || {}, opts = m.options || [], opp = s.opponent || {};
  const mine = opts.filter(o => o.meta && o.meta.type === 'spell' && dead.has(nk(o.card || '')));
  if (!mine.length) return null;
  const role = o => roleOf(find(o.card || ''));
  const top = (s.stack || [])[0];
  if (top) {
    if (top.controller !== 'opponent') return null;
    const k = find(top.source), onField = (opp.battlefield || []).some(c => c.name === top.source);
    const matters = k && !onField && !landish(k) && ((k.cmc || 0) >= 2 || /Creature|Planeswalker/.test((faces(k)[0] || k).type_line || k.type_line || ''));
    const c = matters && mine.find(o => role(o).counter);
    return c ? { choice: [c.id] } : null;
  }
  const yours = s.activePlayer === 'you';
  if (!yours && s.phase === 'END_OF_TURN') { const c = mine.filter(o => role(o).instant && !role(o).counter).sort((a, b) => (b.meta.cmc || 0) - (a.meta.cmc || 0))[0]; return c ? { choice: [c.id] } : null; }
  if (yours && /MAIN/.test(s.phase || '')) {
    const w = mine.find(o => wipeX(find(o.card || '')));
    if (w) { const x = wipeAt(s, find, find(w.card)); if (x != null) { xPlan[m.seat] = x; return { choice: [w.id] }; } }
    const c = mine.find(o => !role(o).instant && !role(o).counter && !wipeX(find(o.card || '')));
    return c ? { choice: [c.id] } : null;
  }
  return null;
}

// A board wipe with X in its cost (Day of Black Sun: "each creature with mana value X or less ... destroy those
// creatures"), which Forge's AI never casts: 0 of 2,380 chances in batches 1, 2 and 5. Cast it in our main phase
// only when, at the best X our untapped lands pay for, it kills at least two more of their creatures than of ours;
// the X goes to the bridge's announce_x question (a seat with a pilot owns it; any other X spell goes back to Forge).
const oracleOf = k => !k ? '' : k.oracle_text || (k.card_faces || []).map(f => f.oracle_text || '').join('\n');
const wipeX = k => /each creature with mana value X or less/i.test(oracleOf(k)) && /destroy/i.test(oracleOf(k));
function wipeAt(s, find, k) {
  const you = s.you || {}, opp = s.opponent || {};
  const lands = (you.battlefield || []).filter(c => !c.tapped && landish(find(c.name))).length;
  const top = lands - (k.cmc || 0); if (top < 0) return null;
  const mv = c => c.token || c.faceDown ? 0 : ((find(c.name) || {}).cmc || 0);
  const theirs = (opp.battlefield || []).filter(c => c.pt).map(mv), ours = (you.battlefield || []).filter(c => c.pt).map(mv);
  let best = null, gain = 1;
  for (let x = 0; x <= top; x++) { const g = theirs.filter(v => v <= x).length - ours.filter(v => v <= x).length; if (g > gain) { gain = g; best = x; } }
  return best;
}
// the X a seat's pilot chose when it cast its wipe; the bridge asks for it right after
function announceX(m, xPlan) {
  const x = xPlan[m.seat]; xPlan[m.seat] = null;
  const o = x != null && (m.options || []).find(o => o.id === 'n' + x);
  return o ? { choice: [o.id] } : { delegate: true };
}
const nk = n => String(n).split(' // ')[0].normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

// ---------------------------------------------------------------- the combo profile (Dimir Excruciator)

// Research's line (NOTE-TO-CODE-15OCT-EXCRUCIATOR-LINE.md, from the Pro Tour winner's deck and its coverage): put
// Doomsday Excruciator in the graveyard (Bitter Triumph's discard cost, Winternight Stories' discard), cast Superior
// Spider-Man as a copy of it (its "if it was cast" trigger leaves each player the bottom six cards), then finish:
// Restless Reef's attack mills four, Emeritus of Ideation's Ancestral Recall makes them draw three. Forge plays none
// of it: in the 160-game logs the trigger resolved in 617 of 1,542 games, Excruciator hard-cast at a median turn 18
// on 7 life (555 hard casts, 62 through Spider-Man). Go when (1) the copy (or a hard cast) is castable, (2) a
// finisher is in reach, (3) we survive two of their turns, (4) a likely counter is stripped first by Deceit if we
// can afford both. Until then the profile never lets the pieces go to waste: Spider-Man and Excruciator are not
// cast early, so the main phase is ours whenever one of them is castable. The rest stays Forge's, except the X
// wipe (deadcards' rule) and the choices the line needs (discards, the copy, targets, modes, Stock Up's picks).
const COMBO = { engine: 'Doomsday Excruciator', copy: 'Superior Spider-Man', mill: 'Restless Reef', recall: 'Emeritus of Ideation', avarice: 'Insatiable Avarice', strip: ['Deceit', 'Duress'], outlets: ['Bitter Triumph', 'Winternight Stories'] };
// the kinds a combo seat owns, beyond priority (pilot.js answers them or hands them back to Forge)
const COMBO_OWNS = ['priority', 'announce_x', 'discard', 'choose_entity', 'choose_ability', 'confirm', 'targets', 'choose_mode', 'choose_cards'];
const names = list => (list || []).map(c => c && (c.name || (typeof c === 'string' ? c : null))).filter(Boolean);
function comboState(s, find0) {
  const find = n => n ? find0(n) : null;   // a face-down card has no name
  const you = s.you || {}, opp = s.opponent || {};
  const hand = names(you.hand), gy = [...names(you.graveyard), ...names(opp.graveyard)];
  const ourLands = (you.battlefield || []).filter(c => landish(find(c.name)));
  const oppPower = (opp.battlefield || []).filter(c => c.pt && !c.tapped).reduce((a, c) => a + (+String(c.pt).split('/')[0] || 0), 0);
  const oppCards = [...(opp.battlefield || []), ...(opp.graveyard || [])].map(c => find(c.name)).filter(Boolean);
  const colour = c => oppCards.some(k => (k.colors || (k.card_faces || []).flatMap(f => f.colors || []) || []).includes(c) || (k.color_identity || []).includes(c));
  const oppOpen = (opp.battlefield || []).filter(c => !c.tapped && landish(find(c.name))).length;
  return {
    you, opp, hand, inGy: gy.includes(COMBO.engine), inHand: hand.includes(COMBO.engine),
    // after the trigger: their library is down to the bottom six (a natural late game rarely gets here before it)
    after: (opp.librarySize ?? 99) <= 7,
    // Emeritus can show under its prepared face's name (Ancestral Recall)
    finisher: hand.some(n => n.includes(COMBO.recall) || /Ancestral Recall/.test(n) || n.includes(COMBO.avarice)) || ourLands.some(c => c.name === COMBO.mill),
    copies: hand.filter(n => n === COMBO.copy).length,
    outlet: hand.includes('Winternight Stories') || (hand.includes('Bitter Triumph') && (opp.battlefield || []).some(c => c.pt)),
    safe: (you.life || 20) > 2 * oppPower + (colour('R') ? 3 : 0),
    counterRisk: colour('U') && oppOpen >= 2 && (opp.handSize || 0) >= 1,
    lands: ourLands.length,
  };
}
function combo(m, find0, dead, xPlan) {
  const find = n => n ? find0(n) : null;
  const s = m.state || {}, opts = m.options || [], st = comboState(s, find0), prompt = m.prompt || '';
  const pick = o => o ? { choice: [o.id] } : null;
  const byCard = n => opts.find(o => o.card === n);
  if (m.kind === 'priority') {
    if ((s.stack || []).length || s.activePlayer !== 'you' || !/MAIN/.test(s.phase || '')) return null;
    const spell = n => opts.find(o => o.card === n && o.meta && o.meta.type === 'spell');
    const ability = n => opts.find(o => o.card === n && o.meta && o.meta.type === 'ability');
    const land = opts.find(o => o.meta && o.meta.type === 'land');
    if (st.after) {
      // make them draw, and turn the Reef on before combat (Forge picks the attack)
      const draw = opts.find(o => o.meta && o.meta.type === 'spell' && (/Ancestral Recall/i.test(o.label) || o.card === COMBO.avarice));
      if (draw) return pick(draw);
      if (land) return pick(land);
      if (s.phase === 'MAIN1') { const reef = ability(COMBO.mill); if (reef && /becomes a 4\/4/i.test(reef.label)) return pick(reef); }
      return null;
    }
    const copy = spell(COMBO.copy), hard = spell(COMBO.engine);
    const go = st.finisher && st.safe;
    if (land) return pick(land);
    if (go && ((st.inGy && copy) || hard)) {
      // strip a likely counter first when the mana covers both
      const strip = opts.find(o => o.meta && o.meta.type === 'spell' && COMBO.strip.includes(o.card));
      const need = (st.inGy && copy ? 4 : 6) + (strip ? (strip.card === 'Duress' ? 1 : 2) : 0);
      if (st.counterRisk && strip && st.lands >= need) return pick(strip);
      return pick(st.inGy && copy ? copy : hard);
    }
    // set up: the engine into the graveyard
    if (!st.inGy && st.inHand) {
      const bt = spell('Bitter Triumph');
      if (bt && (s.opponent.battlefield || []).some(c => c.pt || /Planeswalker/.test((find(c.name) || {}).type_line || ''))) return pick(bt);
      const ws = spell('Winternight Stories'); if (ws) return pick(ws);
    }
    // the X wipe, as the deadcards profile casts it
    const dc = deadcards(m, find0, dead, xPlan); if (dc) return dc;
    // the pieces are castable but it isn't time: keep one Spider-Man for the copy when the line is live (the engine
    // already in the graveyard, or in hand with a way to discard it), and never hard-cast into a lost board; play
    // something else ourselves, so Forge doesn't spend them. A spare Spider-Man, or one with no line, is Forge's.
    // Under pressure (we wouldn't survive two of their turns) Spider-Man is a blocker first: the 318-game trial lost
    // its fair games to the fast creature decks while it held him (15 Oct 2026).
    const holdCopy = copy && st.safe && st.copies <= 1 && (st.inGy || (st.inHand && st.outlet));
    if (holdCopy || hard) {
      const rest = opts.filter(o => o.meta && o.meta.type === 'spell' && !(holdCopy && o.card === COMBO.copy) && o.card !== COMBO.engine).map(o => ({ o, k: find(o.card), r: roleOf(find(o.card)) }));
      const theirs = (s.opponent.battlefield || []).some(c => c.pt);
      const kill = theirs && rest.find(x => x.r.removal && !x.r.instant);
      if (kill) return pick(kill.o);
      const dig = rest.filter(x => x.k && cantrip(x.k)).sort((a, b) => (a.o.meta.cmc || 0) - (b.o.meta.cmc || 0))[0];
      if (dig) return pick(dig.o);
      const body = rest.filter(x => x.r.permanent && !x.r.instant).sort((a, b) => (b.o.meta.cmc || 0) - (a.o.meta.cmc || 0))[0];
      return body ? pick(body.o) : { choice: ['pass'] };
    }
    return null;
  }
  if (m.kind === 'announce_x') return null; // handled before the profile
  if (m.kind === 'choose_ability') {
    // Bitter Triumph: discard the engine; otherwise pay life while it's cheap
    if (/Bitter Triumph/.test(prompt)) {
      if (st.inHand && !st.inGy) return pick(opts.find(o => /discard/i.test(o.label)));
      if ((st.you.life || 20) > 8) return pick(opts.find(o => /life/i.test(o.label)));
    }
    // Deceit: evoke when it is the counter-stripper before the combo
    if (/Deceit/.test(prompt) && st.inGy && !st.after) return pick(opts.find(o => /evoke/i.test(o.label)));
    return null;
  }
  if (m.kind === 'discard' && !st.inGy) return pick(byCard(COMBO.engine));
  if (m.kind === 'confirm' && /Superior Spider-Man|copy of any creature/i.test(prompt)) return { choice: [st.inGy ? opts[0].id : opts[1].id] };
  if (m.kind === 'choose_entity' && /Superior Spider-Man|copy/i.test(prompt)) return pick(byCard(COMBO.engine));
  if (m.kind === 'targets') {
    const casting = (s.casting || '') + ' ' + prompt;
    if (/Restless Reef/.test(casting) && /mill/i.test(prompt)) return pick(opts.find(o => o.id === 'opponent'));
    if (/Ancestral Recall|Emeritus|Insatiable Avarice/.test(casting) && /draw/i.test(prompt)) return pick(opts.find(o => o.id === (st.after ? 'opponent' : 'you')));
    return null;
  }
  if (m.kind === 'choose_mode' && /Insatiable Avarice/.test(prompt) && st.after) return pick(opts.find(o => /draws three/i.test(o.label)));
  if (m.kind === 'choose_cards' && /Stock Up|top five/i.test(prompt)) {
    // to hand: what the line still lacks, then a finisher; the rest goes to the bottom, which is what the trigger keeps
    const want = [!st.inGy && !st.inHand && COMBO.engine, !st.hand.includes(COMBO.copy) && COMBO.copy, !st.inGy && !st.inHand && 'Bitter Triumph', !st.finisher && COMBO.recall, !st.inGy && 'Winternight Stories'].filter(Boolean);
    const got = []; for (const n of want) { const o = opts.find(o => o.card === n && !got.includes(o.id)); if (o && got.length < (m.max || 2)) got.push(o.id); }
    return got.length === (m.max || 2) ? { choice: got } : null;
  }
  return null;
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

const seatArg = v => { const x = [].concat(v); return String(x.length > 1 && x[0] !== x[1] ? x.join(',') : x[0]); };

function runMatches({ decks, matches = 1, seed = 1, own = [[], []], plans = [null, null], policy = [null, null], deadCards = [], games = 3, simLog = false, clock = 0, search = null, workDir, maxTurns = 60, keepLogs = false, gameLog = null, onGame, onChild, err = 0, errPlay = 0, errCombat = 0 }) {
  fs.mkdirSync(workDir, { recursive: true });
  const files = decks.map((d, i) => { const f = path.join(workDir, `seat${i}.dck`); fs.writeFileSync(f, toDck(d.name, d)); return f; });
  const names = [...new Set(decks.flatMap(d => [...d.main, ...(d.side || [])].map(c => c.name)))];
  const token = crypto.randomBytes(16).toString('hex');
  const res = { games: [], decisions: 0, warnings: [], errors: [], ms: 0 };
  const t0 = Date.now();
  // this match's mulligans so far, per seat, to know the size a hand would be kept at
  let match = 0, mulls = [0, 0], lastGame = 0;
  const sbDone = {};
  const dead = new Set([...deadCards].map(nk));
  const xPlan = [null, null];
  // the pilot-error knob (research's spread finding, 15 Oct 2026): real players miss plays and Forge doesn't,
  // which lets deck strength show through undiluted. With probability err, a seat with a spell it could cast
  // in its own main phase (empty stack) passes instead. Seeded per match so both arms of a test see the same.
  let rs = (seed * 48271 + 11) % 2147483647 || 1;
  const rnd = () => (rs = (rs * 48271) % 2147483647) / 2147483647;
  if (err > 0) own = own.map(o => [...new Set([...(o || []), 'priority'])]);
  // a combo seat owns the choices its line needs (anything it doesn't answer goes back to Forge)
  own = own.map((o, i) => policy[i] === 'combo' ? [...new Set([...(o || []), ...COMBO_OWNS])] : o);
  // a strategy seat (E4, forge-pilot/strategy-pilot.js) owns attackers, priority, the tutor's pick and equip targets, and
  // knows who it's playing
  own = own.map((o, i) => policy[i] && policy[i].kind === 'strategy' ? [...new Set([...(o || []), ...SP.OWNS])] : o);
  policy = policy.map((p, i) => p && p.kind === 'strategy' ? { ...p, opponent: p.opponent || (decks[1 - i] && decks[1 - i].name) || null } : p);
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
      if (m.kind === 'announce_x') return announceX(m, xPlan);
      if (err > 0 && m.kind === 'priority') {
        const st = m.state || {};
        if (st.activePlayer === 'you' && /MAIN/.test(st.phase || '') && !(st.stack || []).length && (m.options || []).some(o => o.meta && o.meta.type === 'spell') && rnd() < err) { res.missed = (res.missed || 0) + 1; return { choice: ['pass'] }; }
      }
      if (policy[m.seat] && policy[m.seat].kind === 'strategy') {
        res.decisions++;
        const a = SP.answer(m, policy[m.seat], find);
        if (a) { res.acted = (res.acted || 0) + 1; const s = res.strategy = res.strategy || {}; s[m.kind] = (s[m.kind] || 0) + 1; return a; }
        return { delegate: true };
      }
      if (policy[m.seat] === 'combo') {
        res.decisions++;
        const a = combo(m, find, dead, xPlan);
        // COMBO_TRACE=file: each question the combo seat was asked, and its answer (null: Forge's)
        if (process.env.COMBO_TRACE && m.kind !== 'priority' || process.env.COMBO_TRACE && a) fs.appendFileSync(process.env.COMBO_TRACE, JSON.stringify({ g: m.game, turn: (m.state || {}).turn, kind: m.kind, st: (({ inGy, inHand, after, finisher, safe, counterRisk, lands }) => ({ inGy, inHand, after, finisher, safe, counterRisk, lands }))(comboState(m.state || {}, n => n ? find(n) : null)), prompt: String(m.prompt || '').slice(0, 140), opts: (m.options || []).map(o => o.card || o.label).slice(0, 8), a: a && a.choice ? a.choice.map(id => { const o = (m.options || []).find(o => o.id === id); return o ? (o.card || o.label) : id; }) : null }) + '\n');
        if (a) { res.acted = (res.acted || 0) + 1; return a; }
        return { delegate: true };
      }
      if (m.kind === 'priority' && policy[m.seat]) {
        res.decisions++;
        const a = policy[m.seat] === 'reactive' ? reactive(m, find) : policy[m.seat] === 'answers' ? reactive(m, find, { hold: false }) : policy[m.seat] === 'drawgo' ? drawgo(m, find) : policy[m.seat] === 'tapout' ? tapout(m, find) : policy[m.seat] === 'spells' ? spells(m, find) : policy[m.seat] === 'deadcards' ? deadcards(m, find, dead, xPlan) : null;
        if (a && a.veto) { res.vetoes = (res.vetoes || 0) + 1; return a; }
        if (a) { res.acted = (res.acted || 0) + 1; return a; }
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
          // the plan is applied once per match: before game 3 the deck Forge sends may already be the boarded one,
          // so game 3 gets the list game 2 got (applying the plan twice asks for more copies than the pool has)
          else if (m.type === 'sideboard') { const p = plans[m.seat], k = (m.match || match) + ':' + m.seat; if (p && !sbDone[k]) sbDone[k] = boarded(m.main, p); send({ type: 'answer', rid: m.rid, ...(p ? { main: sbDone[k] } : {}) }); }
          else if (m.type === 'between_games') send({ type: 'answer', rid: m.rid });
          else if (m.type === 'game_start') { match = m.match || 0; if (m.game === 1) lastGame = 0; }
          else if (m.type === 'game_end') { const g = { match: m.match || 0, game: m.game, winner: m.winner ?? -1, onThePlay: m.onThePlay, turns: m.turns, ms: m.ms, slow: !!m.slow, reason: m.reason }; if (keepLogs) g.log = m.log; res.games.push(g); onGame && onGame(g); }
          else if (m.type === 'warning') res.warnings.length < 50 && res.warnings.push(m.msg);
          else if (m.type === 'log' && /^search: /.test(m.msg)) { (res.trace = res.trace || []).length < 400 && res.trace.push(m.msg); }
          else if (m.type === 'error') res.errors.push(m.msg);
        }
      });
    });
    srv.listen(0, '127.0.0.1', () => {
      // a missing Forge install fails this run, not the server that called it (an uncaught throw here
      // used to take the sim server down: 13 Oct 2026)
      let jar;
      try { jar = forgeJar(); } catch (e) { res.errors.push('no Forge to play with: ' + e.message); res.code = 1; srv.close(); return resolve(res); }
      const ownArg = s => (own[s] && own[s].length ? own[s] : ['none']).join(',');
      const args = [`-Xmx${XMX}`, '-Djava.awt.headless=true', '--add-opens', 'java.base/java.lang=ALL-UNNAMED', '--add-opens', 'java.base/java.util=ALL-UNNAMED', '--add-opens', 'java.desktop/java.awt=ALL-UNNAMED',
        '-cp', jar + path.delimiter + BRIDGE, 'forge.bridge.AgentBridge', '--port', String(srv.address().port), '--token', token,
        '--deck0', files[0], '--deck1', files[1], '--external0', 'true', '--external1', 'true', '--games', String(games), '--seed', String(seed), '--sim-log', String(simLog), '--clock', String(clock || 0),
        '--max-turns', String(maxTurns), '--stops', 'all', '--own0', ownArg(0), '--own1', ownArg(1), '--matches', String(matches), ...(gameLog ? ['--log', gameLog] : []),
        // the bridge's pilot-error knob (PlayerControllerExternal): any seat, any timing, and combat
        // a number for both seats, or [seat 0, seat 1]; one value when the seats agree, which a bridge from before
        // the per-seat knob also reads
        ...([].concat(errPlay).some(x => x > 0) ? ['--err-play', seatArg(errPlay)] : []), ...([].concat(errCombat).some(x => x > 0) ? ['--err-combat', seatArg(errCombat)] : []),
        ...(search && search.eval ? ['--search-eval', search.eval] : []), ...(search ? ['--search-rollouts', String(search.rollouts || 4), '--search-turns', String(search.turns || 8), '--search-max', String(search.max || 6), '--search-margin', String(search.margin ?? 2), '--search-screen', String(search.screen || 0)] : [])];
      const ch = spawn('java', args, { cwd: FORGE_DIR, env: config.childEnv({ HOME: config.DATA_DIR }), stdio: ['ignore', 'ignore', 'pipe'] });
      ch.on('error', e => { res.errors.push('could not start java: ' + e.message); res.code = 1; srv.close(); resolve(res); });
      onChild && onChild(ch);
      let err = ''; ch.stderr.on('data', d => { err = (err + d).slice(-4000); if (config.PILOT_STDERR) fs.appendFileSync(config.PILOT_STDERR, d); });
      ch.on('close', code => { res.ms = Date.now() - t0; res.code = code; if (code) res.errors.push('bridge exited ' + code + ': ' + err.slice(-600)); srv.close(); resolve(res); });
    });
  }));
}

module.exports = { runMatches, keep, boarded, produced, reactive, drawgo, costOf, tapout, spells, payoff, deadcards, roleOf, combo, COMBO_OWNS };

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
