// E5 and E6 (STRATEGY-FIRST-REBUILD §4): what stops a deck's strategy, which field decks bring it, and the best
// answers in all of Standard. The thread's method: name the obstacle, find who brings it, search every legal card in
// the deck's colours for what beats it, rank by fit to the strategy (what the deck's tutor can fetch, what its
// engine already uses, the mana slot), owned cards first.
//
// Every "why" shown for an answer is the keyword or phrase matched in that card's own rules text (the Standard
// index's Oracle text), so a claim like "has trample" can't appear for a card that doesn't (E5's verification).
const cards = require('./cards');
const meta = require('./meta');
const tags = require('./tags');
const planjs = require('./plan');

// the obstacle kinds: how the strategy's words name one, what a field deck brings, and what answers it
const KINDS = [
  { id: 'removal', label: 'targeted removal', words: /removal|kill spell|targeted|exile effects|answers? to (?:the|your) (?:champion|threat)/i,
    answers: [[/\bhexproof\b/i, 'hexproof', 3], [/can't be the target/i, "can't be targeted", 3], [/\bward\b/i, 'ward', 2], [/\bindestructible\b/i, 'indestructible', 2], [/protection from/i, 'protection', 2]] },
  { id: 'blockers', label: 'big ground blockers', words: /block|wall|ground|toughness|big creatures/i,
    // trample first: it carries a lone attacker's damage past the blocker, which is what a one-champion deck needs
    answers: [[/\btrample\b/i, 'trample', 3.5], [/\bdeathtouch\b/i, 'deathtouch', 3], [/can't be blocked/i, "can't be blocked", 3], [/\bmenace\b/i, 'menace', 2], [/\bflying\b/i, 'flying', 2], [/destroy target creature with (?:power|toughness)[^.]*4 or greater/i, 'kills a big creature', 2]] },
  { id: 'fliers', label: 'fliers', words: /flier|flying|air/i,
    answers: [[/\breach\b/i, 'reach', 2], [/(?:destroy|exile) target creature with flying/i, 'kills a flier', 3], [/\bflying\b/i, 'flying', 2], [/\bdeathtouch\b/i, 'deathtouch', 1]] },
  { id: 'racing', label: 'racing', words: /rac(?:e|ing)|aggro|burn|fast|damage|speed/i,
    answers: [[/\blifelink\b/i, 'lifelink', 3], [/\byou gain \d+ life|you gain life|gain that much life/i, 'gains life', 2], [/\bdeathtouch\b/i, 'deathtouch', 1]] },
  { id: 'sweepers', label: 'sweepers', words: /sweep|wipe|board ?wipe|wrath|mass removal/i,
    answers: [[/(?:creatures|permanents) you control gain indestructible/i, 'saves your board', 3], [/\bhaste\b/i, 'haste', 2], [/return [^.]* from your graveyard to (?:the battlefield|your hand)/i, 'comes back', 2], [/\bindestructible\b/i, 'indestructible', 1]] },
  { id: 'counters', label: 'counterspells', words: /counter(?:spell|s)?\b|blue mana up/i,
    answers: [[/can't be countered/i, "can't be countered", 3], [/\bflash\b/i, 'flash', 2], [/reveals? (?:their|his or her) hand[^.]*discard/i, 'takes a card first', 2]] },
  { id: 'cards', label: 'running out of cards', words: /running out|out of cards|card advantage|grind|card flow|run out/i,
    // real card advantage over looting (draw then discard) and one-shot cantrips (sacrifice it: draw a card)
    answers: [[/deals combat damage to a player, (?:you )?draw (?:a card|two cards)(?!, then discard)/i, 'draws on hit', 3], [/(?<!: )\bdraw (?:a card|two cards|three cards|cards)(?!, then discard)/i, 'draws', 2], [/put (?:that|it|a) card into your hand/i, 'card into hand', 2], [/draw a card, then discard/i, 'loots', 1.5], [/sacrifice [^.:]*: draw a card/i, 'cashes in for a card', 1], [/\bsurveil\b|\bscry\b/i, 'card selection', 1]] },
];
const kindOf = name => KINDS.find(k => k.words.test(name || '')) || null;

// E6: what each field deck brings. From its list: removal (answers that aren't sweepers or counters), sweepers,
// counters, big ground creatures (toughness 4+ without flying), fliers, speed (plan.js aggro), card flow.
async function fieldModel(field, shares = {}) {
  const out = [];
  for (const d of field) {
    const [p, pl] = await Promise.all([tags.profileOf(d, d.name).catch(() => null), planjs.planOf(d, d.name).catch(() => null)]);
    const find = await meta.cards((d.main || []).map(c => c.name));
    let big = 0, fly = 0;
    for (const c of d.main || []) { const k = find(c.name); if (!k || !/Creature/.test(k.type_line || '')) continue; const t = +k.toughness || 0, f = /\bflying\b/i.test(k.oracle_text || (k.card_faces || []).map(x => x.oracle_text).join(' ')); if (f) fly += c.qty; else if (t >= 4) big += c.qty; }
    const n = k => (p && p.counts[k]) || 0;
    const brings = { removal: Math.max(0, n('answer') - n('sweeper') - n('counter')), sweepers: n('sweeper'), counters: n('counter'), blockers: big, fliers: fly, racing: pl && pl.strategy === 'aggro' ? 1 : 0, cards: n('card-advantage') };
    const core = (d.main || []).filter(c => c.qty >= 3 && !/^(plains|island|swamp|mountain|forest)$/i.test(c.name)).map(c => c.name);
    out.push({ name: d.name, share: shares[d.name] ?? null, plan: pl ? pl.plan : null, how: pl ? pl.why : null, core, brings });
  }
  return out;
}
// who brings an obstacle, strongest share first: the threshold is how much makes it a real problem
const THRESH = { removal: 8, sweepers: 2, counters: 4, blockers: 6, fliers: 8, racing: 1, cards: 8 };
const whoBrings = (model, kind) => model.filter(d => d.brings[kind] >= THRESH[kind]).sort((a, b) => (b.share || 0) - (a.share || 0) || b.brings[kind] - a.brings[kind]);

// what the deck's tutors fetch: "search your library for an Equipment card" -> Equipment (Cloud)
function tutorsOf(list, find) {
  const out = [];
  for (const c of list.main || []) { const k = find(c.name); if (!k) continue; const t = (k.oracle_text || (k.card_faces || []).map(f => f.oracle_text).join('\n')).match(/search your library for an? ([A-Za-z ]+?) card/i);
    if (t && !/land/i.test(t[1])) out.push({ card: c.name.split(',')[0], type: t[1].replace(/\b(an?|or)\b/gi, ' ').trim() }); }
  return out;
}

// E5: answers to one obstacle for one deck. deck: { list, colors, read, owned (name -> copies) }
// also: the deck's other obstacles (kind ids): an answer that beats two of them at once (a toolbox piece) ranks higher
async function answersFor(kindId, deck, { limit = 3, also = [] } = {}) {
  const K = KINDS.find(k => k.id === kindId); if (!K) return { yours: [], best: [] };
  const ix = await cards.standardIndex();
  const find = await meta.cards((deck.list.main || []).map(c => c.name));
  const colors = new Set((deck.colors || []).map(c => c.toLowerCase()));
  const inList = new Set((deck.list.main || []).map(c => c.name));
  const tutors = tutorsOf(deck.list, find);
  const shape = deck.read && deck.read.shape || '', plans = new Set(((deck.read && deck.read.plans) || []).filter(p => p.copies >= 6).map(p => p.id));
  const scoreOf = c => {
    const rules = c.text.split(' · ').slice(2).join(' · ');
    let solve = 0, why = null; for (const [re, w, pts] of K.answers) if (re.test(rules) && pts > solve) { solve = pts; why = w; }
    if (!solve) return null;
    let fit = 0; const notes = [];
    const tu = tutors.find(t => t.type.split(/\s+/).some(w => new RegExp('\\b' + w + '\\b', 'i').test(c.type)));
    if (tu) { fit += 2.5; notes.push(tu.card + ' fetches it'); }
    if (/voltron/.test(shape) && /Equipment|Aura/.test(c.type)) fit += 1;
    if (plans.has('lifegain') && /\blifelink\b|you gain/i.test(rules)) fit += 1;
    if (plans.has('legendary') && /Legendary/.test(c.type)) fit += 0.5;
    // pays off what the deck already does (Enlightened Confidant on a lifegain deck)
    if (plans.has('lifegain') && /whenever you gain life|if you(?:'ve)? gained (?:\d+ or more )?life/i.test(rules)) { fit += 1.5; notes.push('uses your lifegain'); }
    // equipment that makes the champion much bigger
    const pt = rules.match(/gets \+(\d+)\/\+(\d+)/); if (pt && /Equipment/.test(c.type) && +pt[1] + +pt[2] >= 3) fit += 0.5;
    if (/Creature/.test(c.type) && kindId !== 'blockers' && kindId !== 'fliers' && !/lifelink|draw/i.test(rules)) fit -= 0.5;
    const slot = c.cmc <= 2 ? 0.5 : c.cmc >= 5 ? -1 : 0;
    // a card that lists many keywords (it copies or chooses among them) answers each one only sometimes: half weight,
    // and no credit for covering a second obstacle
    const soup = ['flying', 'first strike', 'double strike', 'deathtouch', 'haste', 'hexproof', 'indestructible', 'lifelink', 'menace', 'reach', 'trample', 'vigilance', 'ward'].filter(w => new RegExp('\\b' + w + '\\b', 'i').test(rules)).length >= 5;
    if (soup) solve /= 2;
    else for (const o of also) { if (o === kindId || notes.some(n => n.startsWith('also '))) continue; const K2 = KINDS.find(k => k.id === o); const best2 = K2 ? Math.max(0, ...K2.answers.filter(([re]) => re.test(rules)).map(a => a[2])) : 0; if (best2 >= 2) { fit += 0.75; notes.push('also ' + K2.label); } }
    return { name: c.name, type: c.type, cmc: c.cmc, why, solve, fit, score: solve + fit + slot, delivered: tu ? tu.card + ' fetches it' : null, also: notes.filter(n => n.startsWith('also ')).map(n => n.slice(5)) };
  };
  const pool = ix.cards.filter(c => !/\bLand\b/.test(c.type) && [...(c.id || '')].every(x => colors.has(x)));
  const scored = pool.map(scoreOf).filter(Boolean);
  const owned = deck.owned || {};
  const yours = scored.filter(x => inList.has(x.name)).sort((a, b) => b.score - a.score).map(x => ({ ...x, owned: 'deck' }));
  const rest = scored.filter(x => !inList.has(x.name)).sort((a, b) => (b.score + (owned[b.name] ? 0.5 : 0)) - (a.score + (owned[a.name] ? 0.5 : 0)) || a.cmc - b.cmc).slice(0, limit + 3);
  await meta.cards(rest.map(x => x.name));
  const best = rest.map(x => ({ ...x, owned: owned[x.name] ? 'binder' : null, price: meta.cardFacts(x.name).price ?? null })).slice(0, limit);
  return { yours: yours.slice(0, 4), best };
}

// the rows for a deck: its strategy's obstacles (or the usual six), who brings each, and the answers
async function rows({ list, colors, read, strategy, owned, field, shares }) {
  const model = await fieldModel(field, shares);
  const named = (strategy && strategy.obstacles && strategy.obstacles.length ? strategy.obstacles : []).map(o => ({ name: o.name, kind: kindOf(o.name) }));
  const seen = new Set(), list2 = [];
  for (const o of named) if (o.kind && !seen.has(o.kind.id)) { seen.add(o.kind.id); list2.push({ name: o.name, kind: o.kind.id }); }
  if (!list2.length) for (const k of ['removal', 'blockers', 'racing', 'fliers', 'sweepers', 'cards']) list2.push({ name: KINDS.find(x => x.id === k).label, kind: k });
  const out = [];
  for (const o of list2) {
    const who = whoBrings(model, o.kind).slice(0, 4).map(d => ({ deck: d.name, share: d.share, n: d.brings[o.kind] }));
    const a = await answersFor(o.kind, { list, colors, read, owned }, { also: list2.map(x => x.kind) });
    out.push({ name: o.name, kind: o.kind, label: KINDS.find(k => k.id === o.kind).label, who, yours: a.yours.map(x => ({ name: x.name, why: x.why })), answers: a.best });
  }
  return { rows: out, field: model.map(d => ({ name: d.name, share: d.share, plan: d.plan, how: d.how, core: d.core.slice(0, 8), brings: d.brings })) };
}

module.exports = { KINDS, kindOf, fieldModel, whoBrings, answersFor, rows, tutorsOf };
