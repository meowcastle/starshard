// Card function tags (RESEARCH-ARCHETYPES-PROFILES-13OCT.md, "Card function tags"): what each card
// does for a deck's plan, so a list can be read as a plan and the pilot can tell an answer from a
// threat.
//
// Two sources. Scryfall's community Tagger, which is a search filter (otag:), not a field on a
// card: one search per tag over the Standard-legal pool, paged, cached in DATA_DIR/otags.json and
// refreshed weekly (about 40 requests, spaced for Scryfall's rate limit). And rules on the card
// itself: type, keywords, rules text, for what the Tagger doesn't say (threats, evasion, instant
// speed, tokens) and for cards too new to be tagged. Measured 13 Oct 2026: 86% of the top-20 meta
// decks' nonland cards carry at least one Tagger tag.
const fs = require('fs');
const path = require('path');
const config = require('./config');
const { writeJson, readJson } = require('./store');

// our tag <- the Scryfall Tagger tags that mean it
const OTAGS = {
  'answer': ['removal', 'counterspell', 'bounce'],
  'counter': ['counterspell'],
  'sweeper': ['board-wipe'],
  'card-advantage': ['card-advantage', 'draw'],
  'selection': ['cantrip'],
  'reach': ['burn'],
  'ramp': ['ramp', 'mana-rock'],
  'lifegain': ['lifegain'],
  'tutor': ['tutor'],
  'discard': ['discard'],
  'recursion': ['recursion', 'reanimate'],
  'self-mill': ['self-mill'],
  'sacrifice': ['sacrifice-outlet'],
  'landfall': ['landfall'],
  'protection': ['protection'],
  'anthem': ['anthem'],
};
const WEEK = 7 * 864e5;
const FILE = () => path.join(config.DATA_DIR, 'otags.json');
const nk = n => String(n).split(' // ')[0].normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

let byName = null; // card name -> Set of Scryfall tags
async function load({ refresh = false } = {}) {
  if (byName && !refresh) return byName;
  let c = readJson(FILE(), null);
  if (!c || refresh || Date.now() - c.at > WEEK) {
    const tags = {}, sleep = ms => new Promise(r => setTimeout(r, ms));
    for (const t of [...new Set(Object.values(OTAGS).flat())]) {
      const names = [];
      let url = 'https://api.scryfall.com/cards/search?q=' + encodeURIComponent(`otag:${t} legal:standard`) + '&unique=cards';
      while (url) {
        const r = await fetch(url, { headers: { Accept: 'application/json', 'User-Agent': 'sim.starshard.net' } });
        if (r.status === 429) { await sleep(2000); continue; }
        const j = await r.json();
        if (j.object === 'error') break; // a tag Scryfall doesn't know: none
        names.push(...j.data.map(x => x.name));
        url = j.has_more ? j.next_page : null;
        await sleep(150);
      }
      tags[t] = names;
      await sleep(150);
    }
    if (Object.values(tags).some(a => a.length)) { c = { at: Date.now(), tags }; writeJson(FILE(), c, { keep: 0 }); }
    else if (!c) c = { at: 0, tags: {} }; // offline: rules only
  }
  byName = new Map();
  for (const [t, names] of Object.entries(c.tags)) for (const n of names) { const k = nk(n); if (!byName.has(k)) byName.set(k, new Set()); byName.get(k).add(t); }
  return byName;
}

const faces = k => k.card_faces && k.card_faces.length ? k.card_faces : [k];
const typeOf = k => faces(k)[0].type_line || k.type_line || '';
const textOf = k => faces(k).map(f => f.oracle_text || '').join('\n');

/** The tags of one Scryfall card object (meta.cards), from the Tagger and the card's own rules. */
function tagsOf(k, scry) {
  const out = new Set(), t = typeOf(k), text = textOf(k), kw = (k.keywords || []).map(x => x.toLowerCase());
  if (/\bLand\b/.test(t)) { out.add('land'); return out; }
  const st = (scry && scry.get(nk(k.name))) || new Set();
  for (const [tag, ots] of Object.entries(OTAGS)) if (ots.some(o => st.has(o))) out.add(tag);
  // threats: creatures and planeswalkers, and engines (permanents with a repeating trigger)
  if (/Creature|Planeswalker/.test(t)) out.add('threat');
  else if (/Enchantment|Artifact|Battle/.test(t) && /\b(whenever|at the beginning of)\b/i.test(text)) { out.add('threat'); out.add('engine'); }
  // keywords from the rules text too: the card cache keeps no keyword field
  const has = w => kw.includes(w) || new RegExp('(^|\\n|, )' + w + '\\b', 'i').test(text);
  if (['flying', 'menace', 'trample'].some(has) || /can't be blocked/i.test(text)) out.add('evasive');
  if (/\bcreate\b[^.]*\btokens?\b/i.test(text)) out.add('tokens');
  if (/Instant/.test(t) || has('flash')) out.add('instant');
  if (/Instant|Sorcery/.test(t)) out.add('spell');
  // a payoff for discarding your own cards (Mardu Discard's plan), not making the opponent discard
  if (/whenever you discard|discard a card[,:]|if you discarded/i.test(text)) out.add('discard-payoff');
  // finisher, research's generic rule: a card that wins or loses the game, 5+ damage to a player,
  // or a creature or planeswalker of mana value 5+ (the curated lists add the rest)
  const big = (k.cmc || 0) >= 5 && /Creature|Planeswalker/.test(t);
  const burn5 = [...text.matchAll(/deals? (\d+) damage to (target player|each opponent|target opponent|any target|each player)/gi)].some(m => +m[1] >= 5);
  if (/you win the game|loses the game/i.test(text) || burn5 || big) out.add('finisher');
  // rules for what the Tagger may not have yet (a new card): the common answer, counter and wipe wordings
  if (!st.size) {
    if (/\b(destroy|exile) target\b|deals? \d+ damage to target (creature|any)|return target [^.]* to its owner's hand/i.test(text)) out.add('answer');
    if (/\bcounter target\b/i.test(text)) { out.add('answer'); out.add('counter'); }
    if (/\b(destroy|exile) all\b|each creature/i.test(text)) out.add('sweeper');
    if (/\bdraw (two|three|\w+ cards)\b/i.test(text)) out.add('card-advantage');
    if (/deals? \d+ damage to (any target|target player|each opponent)/i.test(text)) out.add('reach');
  }
  return out;
}

// research's curated lists (curated-standard-*.json beside this file, newest wins): the tags no rule
// derives, per meta deck. An entry applies to a list by its exact name, or by an alias only when the
// list holds at least half the entry's cards (one research alias named a different field deck).
const CURATED = (() => {
  try {
    const f = fs.readdirSync(__dirname).filter(x => /^curated-standard-.*\.json$/.test(x)).sort().pop();
    return f ? JSON.parse(fs.readFileSync(path.join(__dirname, f), 'utf8')).decks || {} : {};
  } catch { return {}; }
})();
const curatedCards = e => [...(e.finisher || []), ...(e['finisher-enabler'] || []), ...(e.engine || []), ...(e['combo-enabler'] || []), ...((e['combo-piece'] || []).map(x => x.card))];
function curatedFor(name, list) {
  if (name && CURATED[name]) return CURATED[name];
  const have = new Set([...(list.main || []), ...(list.side || [])].map(c => nk(c.name)));
  const share = e => { const cs = curatedCards(e); return cs.length ? cs.filter(c => have.has(nk(c))).length / cs.length : 0; };
  // by alias, when the list holds half the entry's cards
  if (name) for (const e of Object.values(CURATED)) if ((e.aliases || []).some(a => a.toLowerCase() === String(name).toLowerCase()) && share(e) >= 0.5) return e;
  // a brew has no meta name: the entry whose cards it holds most of, if that is half or more
  let best = null, bs = 0.5;
  for (const e of Object.values(CURATED)) { const x = share(e); if (x >= bs) { best = e; bs = x; } }
  return best;
}
function curatedTags(e, card) {
  const out = [], k = nk(card);
  if (!e) return out;
  for (const t of ['finisher', 'finisher-enabler', 'engine', 'combo-enabler']) if ((e[t] || []).some(c => nk(c) === k)) out.push(t);
  const piece = (e['combo-piece'] || []).find(x => nk(x.card) === k);
  if (piece) out.push('combo-piece');
  return out;
}

/** A list's tag counts over its main deck (copies counted); name: the deck's name, for the curated lists. */
async function profileOf(list, name = '') {
  const meta = require('./meta');
  const main = (list && list.main) || [];
  const [scry, find] = await Promise.all([load().catch(() => new Map()), meta.cards(main.map(c => c.name))]);
  const counts = {}, cards = {}, untagged = [], cur = curatedFor(name, list);
  for (const c of main) {
    const k = find(c.name); if (!k) continue;
    const ts = tagsOf(k, scry);
    for (const t of curatedTags(cur, c.name)) ts.add(t);
    cards[c.name] = [...ts];
    if (!ts.size) untagged.push(c.name);
    for (const t of ts) counts[t] = (counts[t] || 0) + c.qty;
    if (ts.has('answer') && ts.has('instant')) counts['answer.instant'] = (counts['answer.instant'] || 0) + c.qty;
  }
  return { counts, cards, untagged, curated: cur ? true : false };
}

module.exports = { load, tagsOf, profileOf, OTAGS };
