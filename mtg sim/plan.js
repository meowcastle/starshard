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
  const [p, f] = await Promise.all([tags.profileOf(list), functional.check(list).catch(() => null)]);
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

module.exports = { planOf, nearest, STRATEGY, AXES };
