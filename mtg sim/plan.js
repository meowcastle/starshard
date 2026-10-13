// What plan a list is on, and the meta deck it is closest to (RESEARCH-ARCHETYPES-PROFILES-13OCT.md,
// "Reading a brew"). Deterministic and explainable: rules on the tag counts (tags.js) and the
// curve (functional.js), each answer carrying the reason; the nearest meta deck by distance between
// tag-count vectors. Replaces the stopgap tools/deck-classes.js.
const tags = require('./tags');
const functional = require('./functional');

// plan -> the strategy class the statistics and calibration group by
const STRATEGY = {
  'go-wide aggro': 'aggro', 'evasive aggro': 'aggro', 'spells-matter': 'tempo', 'disrupt-and-clock': 'midrange',
  'landfall engine': 'midrange', 'sacrifice engine': 'midrange', 'lifegain engine': 'midrange', 'engine midrange': 'midrange',
  'discard-as-value': 'aggro', 'draw-go control': 'control', 'tap-out control': 'control', 'fast combo': 'combo', 'midrange': 'midrange',
};
// the counts a list is compared on, for the nearest meta deck
const AXES = ['spell', 'discard-payoff', 'threat', 'evasive', 'tokens', 'answer', 'answer.instant', 'counter', 'sweeper', 'card-advantage', 'reach', 'ramp', 'landfall', 'sacrifice', 'lifegain', 'discard', 'engine'];

/** The plan for one list: { plan, strategy, why, counts, avgMV, lands }. name: an optional deck name ("... Combo"). */
async function planOf(list, name = '') {
  const [p, f] = await Promise.all([tags.profileOf(list, name), functional.check(list).catch(() => null)]);
  const n = k => p.counts[k] || 0, mv = f ? f.avgMV : null, lands = f ? f.lands : null;
  const threats = n('threat'), answers = n('answer'), instantAnswers = n('answer.instant');
  let plan, why;
  if (/\bcombo\b/i.test(name)) { plan = 'fast combo'; why = 'its name'; }
  // an engine decides when there is one
  else if (n('landfall') >= 8) { plan = 'landfall engine'; why = n('landfall') + ' landfall cards'; }
  else if (n('sacrifice') >= 6 && threats >= 16) { plan = 'sacrifice engine'; why = n('sacrifice') + ' sacrifice outlets'; }
  else if (n('lifegain') >= 12 && threats >= 16) { plan = 'lifegain engine'; why = n('lifegain') + ' lifegain cards'; }
  // control: few threats, many answers
  // draw-go holds counters; tap-out answers on its own turn with sweepers
  else if (threats < 10 && instantAnswers >= 8 && n('counter') >= 6) { plan = 'draw-go control'; why = `${threats} threats, ${instantAnswers} instant-speed answers, ${n('counter')} counters`; }
  else if (threats < 10 && (n('sweeper') >= 3 || instantAnswers >= 8)) { plan = 'tap-out control'; why = `${threats} threats, ${n('sweeper')} sweepers, ${n('counter')} counters`; }
  else if (n('discard-payoff') >= 6 && threats >= 16) { plan = 'discard-as-value'; why = n('discard-payoff') + ' cards that pay off discarding'; }
  // spells-matter: a light creature count carried by cheap spells and card flow
  else if (threats <= 14 && answers + n('card-advantage') >= 30) { plan = 'spells-matter'; why = `${threats} threats, ${answers} answers and ${n('card-advantage')} card-flow cards`; }
  // disrupt-and-clock: threats backed by counters or discard
  else if (threats >= 10 && answers >= 12 && (n('counter') >= 2 || n('discard') >= 2)) { plan = 'disrupt-and-clock'; why = `${threats} threats, ${answers} answers incl. ${n('counter')} counters and ${n('discard')} discard`; }
  // evasive and go-wide before spells: fliers and token makers say what the deck is doing
  else if (n('evasive') >= 16 && threats >= 20) { plan = 'evasive aggro'; why = `${n('evasive')} evasive threats`; }
  else if (n('tokens') >= 12 && threats >= 16) { plan = 'go-wide aggro'; why = `${n('tokens')} token makers, ${threats} threats`; }
  // spells-matter beats: bodies pumped by a dense run of cheap spells
  else if (n('spell') >= 13 && threats <= 24) { plan = 'spells-matter'; why = `${n('spell')} instants and sorceries, ${threats} threats`; }
  // aggro: many cheap threats
  else if (threats >= 20 && mv != null && mv <= 2.3) {
    if (n('evasive') >= 12) { plan = 'evasive aggro'; why = `${threats} threats, ${n('evasive')} evasive, average mana value ${mv.toFixed(1)}`; }
    else { plan = 'go-wide aggro'; why = `${threats} threats, average mana value ${mv.toFixed(1)}`; }
  }
  else if (n('evasive') >= 16 && threats >= 20) { plan = 'evasive aggro'; why = `${n('evasive')} evasive threats`; }
  // midrange: threats and answers both
  else if (answers >= 8 && (n('counter') >= 2 || n('discard') >= 2 || n('evasive') >= 6)) { plan = 'disrupt-and-clock'; why = `${threats} threats, ${answers} answers incl. ${n('counter')} counters and ${n('discard')} discard`; }
  else if (n('engine') >= 6) { plan = 'engine midrange'; why = n('engine') + ' engine permanents'; }
  else { plan = 'midrange'; why = `${threats} threats, ${answers} answers`; }
  return { plan, strategy: STRATEGY[plan], why, counts: p.counts, avgMV: mv, lands, untagged: p.untagged };
}

/** The meta deck closest to a list: Euclidean distance over the tag counts, the same plan preferred. */
function nearest(me, field) {
  const d = (a, b) => Math.sqrt(AXES.reduce((s, k) => s + ((a.counts[k] || 0) - (b.counts[k] || 0)) ** 2, 0));
  const ranked = field.map(x => ({ name: x.name, plan: x.plan, dist: d(me, x) + (x.plan === me.plan ? 0 : 6) })).sort((a, b) => a.dist - b.dist);
  return ranked[0] || null;
}

// What each plan expects (RESEARCH-ARCHETYPES-PROFILES-13OCT.md, "What is missing for that plan?"),
// as ranges over the tag counts. [lo, hi]; null = no expectation.
const SHAPE = {
  'go-wide aggro': { lands: [20, 22], threat: [24, 30], answer: [0, 4] },
  'evasive aggro': { lands: [21, 23], threat: [16, 22], answer: [4, 8], evasive: [12, 60] },
  'spells-matter': { lands: [20, 22], threat: [8, 14], spell: [16, 60] },
  'disrupt-and-clock': { lands: [24, 26], threat: [10, 16], answer: [8, 12], 'card-advantage': [2, 60] },
  'landfall engine': { lands: [26, 28], threat: [12, 20], answer: [4, 8], landfall: [8, 60] },
  'sacrifice engine': { lands: [22, 26], threat: [12, 20], answer: [4, 8], sacrifice: [4, 60] },
  'lifegain engine': { lands: [22, 26], threat: [12, 20], answer: [4, 8], lifegain: [8, 60] },
  'engine midrange': { lands: [22, 26], threat: [12, 20], answer: [4, 8], engine: [6, 60] },
  'draw-go control': { lands: [26, 27], 'answer.instant': [10, 14], sweeper: [2, 4], 'card-advantage': [4, 60], finisher: [4, 8] },
  'tap-out control': { lands: [25, 27], answer: [8, 12], sweeper: [3, 4], finisher: [4, 10] },
  'fast combo': { lands: [20, 24] },
  'discard-as-value': { lands: [20, 23], threat: [20, 30], 'discard-payoff': [6, 60] },
};
const WORDS = { lands: 'lands', threat: 'threats', answer: 'answers', 'answer.instant': 'instant-speed answers', sweeper: 'sweepers', 'card-advantage': 'card-advantage cards', finisher: 'finishers', evasive: 'evasive threats', spell: 'instants and sorceries', landfall: 'landfall cards', sacrifice: 'sacrifice outlets', lifegain: 'lifegain cards', engine: 'engine permanents', 'discard-payoff': 'discard payoffs' };

/**
 * What the list is short or long of for its plan, as sentences a player would say. Research's ranges
 * are a first draft and most tuned meta lists fall outside some of them (13 Oct 2026: 14 of the top
 * 20), so the yardstick is the nearest meta deck on the same plan, usually the stock list a brew was
 * built from: a count is flagged when it is outside the plan's range AND at least 2 lands or 4 cards
 * further out than that list. With no same-plan meta deck, nothing is flagged.
 */
function missing(me, near) {
  const shape = SHAPE[me.plan]; if (!shape || !near || near.plan !== me.plan) return [];
  const val = (x, k) => k === 'lands' ? x.lands : (x.counts[k] || 0);
  const out = [];
  for (const [k, [lo, hi]] of Object.entries(shape)) {
    const v = val(me, k), nv = val(near, k); if (v == null || nv == null) continue;
    const thr = k === 'lands' ? 2 : 4;
    const short = v < lo && nv - v >= thr, long = v > hi && v - nv >= thr;
    if (!short && !long) continue;
    out.push(`${Math.round(v)} ${WORDS[k]} against ${Math.round(nv)} in ${near.name}${short ? ', short' : ', long'} for ${me.plan} (${lo}${hi >= 60 ? '+' : '-' + hi} is typical)`);
  }
  return out;
}

// The plans of a field's lists, once per field (an array identity), for nearest().
const fieldPlans = new WeakMap();
async function fieldOf(lists) {
  if (!lists || !lists.length) return [];
  if (fieldPlans.has(lists)) return fieldPlans.get(lists);
  const out = [];
  for (const l of lists) { try { out.push({ name: l.name, ...(await planOf(l, l.name)) }); } catch { /* left out */ } }
  fieldPlans.set(lists, out);
  return out;
}

/** A brew's reading: plan, nearest meta deck, what is missing. */
async function readList(list, field, name = '') {
  const me = await planOf(list, name);
  const f = await fieldOf(field);
  const nearFull = f.find(x => x.name === (nearest(me, f) || {}).name) || null;
  return { plan: me.plan, strategy: me.strategy, why: me.why, nearest: nearFull ? nearFull.name : null, nearestPlan: nearFull ? nearFull.plan : null, missing: missing(me, nearFull), counts: me.counts };
}

module.exports = { planOf, nearest, missing, readList, STRATEGY, AXES, SHAPE };
