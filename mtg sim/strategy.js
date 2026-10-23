// E0, read the strategy (STRATEGY-FIRST-REBUILD §4): what a deck is trying to do, from its cards alone. Layers 1
// and 2 live here and are instant; layer 3 (how games are won, from a background run) and layer 4 (the coach's
// draft and its two questions) build on what this returns.
//
// Layer 1, the role table: every main-deck card gets one role (engine and enablers come from layer 2; then mana,
// answers, protection, card flow, threats) plus its tags, with the curve and colours.
// Layer 2, the engine: a link graph between the cards. Each rule below names a payoff (a card whose text builds
// around something) and the enablers it links to (the cards that are that something). A card's score is its
// copies times the copies it links to, both ways; the best-linked 2 to 4 cards are the engine candidates, and the
// rule that links them most names the shape. No rule linking at least eight cards: no clear engine, and the read
// says so with the half-plans it did find, rather than inventing one.
const meta = require('./meta');
const tags = require('./tags');
const planjs = require('./plan');

const faces = k => k ? (k.card_faces && k.card_faces.length ? k.card_faces : [k]) : [];
const textOf = k => faces(k).map(f => f.oracle_text || '').join('\n');
const typeOf = k => faces(k).map(f => f.type_line || '').join(' // ') || (k && k.type_line) || '';
const kwOf = (k, w) => (k.keywords || []).some(x => x.toLowerCase() === w) || new RegExp('(^|\\n|, )' + w + '\\b', 'i').test(textOf(k));

// payoff test and enabler test per rule; label is the half-plan's name, shape the archetype it points at
const RULES = [
  { id: 'equipment', label: 'equipment', shape: 'voltron',
    payoff: k => /\bequipped\b|equipment you control|for each equipment|search your library for an? (?:artifact or )?equipment|attach(?:ed)? to it|if [^.]* is equipped/i.test(textOf(k)) && !/Equipment/.test(typeOf(k)),
    enabler: k => /Equipment/.test(typeOf(k)) },
  { id: 'alone', label: 'one attacker alone', shape: 'voltron',
    payoff: k => /attacks alone/i.test(textOf(k)),
    enabler: k => /Equipment|Aura/.test(typeOf(k)) || /target creature you control (?:gets|gains)|(?:hexproof|indestructible)/i.test(textOf(k)) && !/Creature/.test(typeOf(k)) },
  { id: 'tutor', label: 'a tutor and its targets', shape: 'toolbox',
    payoff: k => /search your library for an? ([a-z ]+?) card/i.test(textOf(k)) && !/basic land|land card/i.test(textOf(k).match(/search your library for an? ([a-z ]+?) card/i)[0]),
    enabler: (k, payoff) => { const m = textOf(payoff).match(/search your library for an? ([a-z ]+?) card/i); const want = m ? m[1].replace(/\b(an?|or)\b/g, ' ').trim().split(/\s+/) : []; return want.some(w => new RegExp('\\b' + w + '\\b', 'i').test(typeOf(k))); } },
  { id: 'lifegain', label: 'lifegain', shape: 'lifegain engine',
    payoff: k => /whenever you gain life|if you(?:'ve)? gained (?:\d+ or more )?life|for each life|life you gained/i.test(textOf(k)),
    enabler: k => kwOf(k, 'lifelink') || /\byou gain (?:\d+|x|that much|life)|gains? lifelink/i.test(textOf(k)) },
  { id: 'legendary', label: 'legendary creatures', shape: null,
    payoff: k => /legendary (?:creature|spell|permanent)s? you control|whenever you cast a legendary|each legendary creature/i.test(textOf(k)),
    enabler: k => /Legendary/.test(typeOf(k)) && /Creature/.test(typeOf(k)) },
  { id: 'counters', label: '+1/+1 counters', shape: null,
    payoff: k => /with (?:a|one or more) \+1\/\+1 counters? on (?:it|them)|for each \+1\/\+1 counter|whenever (?:one or more )?\+1\/\+1 counters? (?:are|is) put/i.test(textOf(k)),
    enabler: k => /put (?:a|an|\w+|x) \+1\/\+1 counters? on|enters with (?:a|\w+) \+1\/\+1 counter/i.test(textOf(k)) },
  { id: 'sacrifice', label: 'sacrifice', shape: 'sacrifice engine',
    payoff: k => /sacrifice (?:another|a) (?:creature|artifact|permanent|token)[^.]*:|whenever you sacrifice/i.test(textOf(k)),
    enabler: k => /when (?:this creature|[^.]{0,40}) dies|create[^.]*token/i.test(textOf(k)) },
  { id: 'tokens', label: 'going wide', shape: 'go-wide',
    payoff: k => /creatures you control get \+|for each creature you control|whenever (?:a|another) creature (?:you control )?enters|other creatures you control get/i.test(textOf(k)),
    enabler: k => /create[^.]*creature tokens?|create (?:a|two|three|x) [^.]*token/i.test(textOf(k)) },
  { id: 'spells', label: 'instants and sorceries', shape: 'spells-matter',
    payoff: k => /whenever you cast (?:an? )?(?:instant|noncreature) |prowess|instant (?:and|or) sorcery spells you cast/i.test(textOf(k)),
    enabler: k => /Instant|Sorcery/.test(typeOf(k)) },
  { id: 'landfall', label: 'landfall', shape: 'landfall engine',
    payoff: k => /landfall|whenever a land (?:you control )?enters/i.test(textOf(k)),
    enabler: k => /additional land|search your library for (?:a |up to \w+ )?(?:basic )?lands?|land cards?[^.]*onto the battlefield|play lands from your graveyard/i.test(textOf(k)) || /\bLand\b/.test(typeOf(k)) && /fetch|search/i.test(textOf(k)) },
  { id: 'graveyard', label: 'the graveyard', shape: 'reanimator',
    payoff: k => /from your graveyard to the battlefield|return target creature card from your graveyard|cast [^.]* from your graveyard/i.test(textOf(k)),
    enabler: k => /\bmill\b|surveil|discard a card|put [^.]* into your graveyard/i.test(textOf(k)) },
];

const ROLE_ORDER = ['engine', 'enablers', 'threats', 'answers', 'protection', 'card flow', 'mana'];

async function read(list, name = '') {
  const main = (list && list.main || []).filter(c => c.qty > 0);
  const [scry, find] = await Promise.all([tags.load().catch(() => new Map()), meta.cards(main.map(c => c.name))]);
  const cards = main.map(c => ({ name: c.name, qty: c.qty, k: find(c.name) })).filter(c => c.k);
  const nonland = cards.filter(c => !/\bLand\b/.test(typeOf(c.k)));
  for (const c of cards) c.tags = [...tags.tagsOf(c.k, scry)];

  // layer 2: the links
  const links = new Map(nonland.map(c => [c.name, new Map()]));   // name -> other -> { rule, weight }
  const ruleCards = {};
  for (const r of RULES) {
    const payoffs = nonland.filter(c => { try { return r.payoff(c.k); } catch { return false; } });
    for (const p of payoffs) for (const e of nonland) {
      if (e === p) continue;
      let ok = false; try { ok = r.enabler(e.k, p.k); } catch {}
      if (!ok) continue;
      const w = Math.sqrt(p.qty * e.qty);
      for (const [a, b] of [[p, e], [e, p]]) { const m = links.get(a.name), x = m.get(b.name); if (!x || x.weight < w) m.set(b.name, { rule: r.id, weight: w }); }
      (ruleCards[r.id] = ruleCards[r.id] || { payoffs: new Set(), enablers: new Set() });
      ruleCards[r.id].payoffs.add(p.name); ruleCards[r.id].enablers.add(e.name);
    }
  }
  const qtyOf = n => (nonland.find(c => c.name === n) || { qty: 0 }).qty;
  const score = n => { let s = 0; for (const [o, x] of links.get(n)) s += x.weight * (1 + 0.15 * Math.min(4, qtyOf(o))); return s * (0.5 + Math.min(4, qtyOf(n)) / 8); };
  // the plans: each rule's cards and copies
  const plans = Object.entries(ruleCards).map(([id, x]) => { const r = RULES.find(y => y.id === id), names = new Set([...x.payoffs, ...x.enablers]);
    return { id, label: r.label, shape: r.shape, cards: [...names], copies: [...names].reduce((s, n) => s + qtyOf(n), 0), payoffs: [...x.payoffs], enablers: [...x.enablers] }; })
    .sort((a, b) => b.copies - a.copies);
  // engine candidates: one hub per plan. The deck's biggest plans (6+ copies) each give their best-linked payoff (an
  // engine card builds around something), so two payoffs of the same plan (Aerith and Ajani on lifegain) don't crowd
  // out the card that holds a second plan (Cloud on equipment). Up to four, biggest plan first.
  const ranked = nonland.map(c => ({ name: c.name, qty: c.qty, score: score(c.name) })).filter(x => x.score > 0).sort((a, b) => b.score - a.score);
  const big = plans.filter(p => p.copies >= 6), engine = [];
  for (const p of big) { const hub = ranked.find(x => p.payoffs.includes(x.name) && !engine.some(e => e.name === x.name)); if (hub && engine.length < 4) engine.push({ ...hub, plan: p.id }); }
  // consistency: a plan is built from copies. Real lists keep most of their spells at 2+ copies; a pile of singletons
  // (or a list where the engine cards are all one-ofs) has no plan to read yet, whatever its text links.
  const nlCopies = nonland.reduce((t, c) => t + c.qty, 0), multi = nonland.filter(c => c.qty >= 2).reduce((t, c) => t + c.qty, 0);
  const consistent = nlCopies > 0 && multi / nlCopies >= 0.4;
  // and the main plan has to be the deck's: at least 40% of its spells (every real list read so far is 43-87%; random
  // piles of 3-ofs top out near a third), with its payoffs at 4+ copies
  // Plans of one shape count together: voltron is a lone attacker plus the equipment it wears (Squall's 3 copies alone
  // don't carry the deck; with Cloud and the equipment they do). The lead is the shape with the most cards.
  const groups = {};
  for (const p of big) { const k = p.shape || p.id, g = groups[k] = groups[k] || { shape: p.shape, cards: new Set(), payoffs: new Set() }; p.cards.forEach(n => g.cards.add(n)); p.payoffs.forEach(n => g.payoffs.add(n)); }
  if (groups.voltron && plans.some(p => p.id === 'tutor' && p.copies >= 6)) { const t = plans.find(p => p.id === 'tutor'); t.cards.forEach(n => groups.voltron.cards.add(n)); t.payoffs.forEach(n => groups.voltron.payoffs.add(n)); }
  const sum = set => [...set].reduce((t, n) => t + qtyOf(n), 0);
  const lead = Object.values(groups).sort((x, y) => sum(y.cards) - sum(x.cards))[0] || null;
  const leadCopies = lead ? sum(lead.cards) : 0, leadPayoffs = lead ? sum(lead.payoffs) : 0;
  const coherent = consistent && !!lead && leadCopies >= 8 && leadCopies >= 0.4 * nlCopies && leadPayoffs >= 4 && engine.some(e => e.qty >= 2) && engine[0].score >= 4;

  // the shape: the archetypes of the big plans, weighted by copies; voltron and toolbox read together when a tutor
  // fetches what a lone attacker wears
  const shapeVotes = {};
  for (const p of big) if (p.shape) shapeVotes[p.shape] = (shapeVotes[p.shape] || 0) + p.copies;
  const shapes = Object.entries(shapeVotes).sort((a, b) => b[1] - a[1]).map(([s]) => s);
  let shape = (lead && lead.shape) || shapes[0] || null;
  if (shapes.includes('voltron') && plans.some(p => p.id === 'tutor' && p.copies >= 6)) shape = 'voltron toolbox';

  // layer 1: one role per card
  const engineNames = new Set(engine.map(e => e.name));
  const enablerNames = new Set(); for (const e of engine) for (const [o] of links.get(e.name)) if (!engineNames.has(o)) enablerNames.add(o);
  const roleOf = c => {
    if (/\bLand\b/.test(typeOf(c.k))) return 'mana';
    if (engineNames.has(c.name)) return 'engine';
    const t = new Set(c.tags), text = textOf(c.k);
    if (t.has('answer') || t.has('counter') || t.has('sweeper') || t.has('discard')) return 'answers';
    if (t.has('ramp') && !/Creature|Equipment|Planeswalker/.test(typeOf(c.k))) return 'mana';
    if (enablerNames.has(c.name)) return 'enablers';
    if (t.has('protection') || /(?:gains?|have) (?:hexproof|indestructible|protection)/i.test(text) && !/Creature/.test(typeOf(c.k))) return 'protection';
    if (t.has('card-advantage') || t.has('selection')) return 'card flow';
    if (/Creature|Planeswalker/.test(typeOf(c.k))) return 'threats';
    return 'enablers';
  };
  const roles = Object.fromEntries(ROLE_ORDER.map(r => [r, []]));
  for (const c of cards) roles[roleOf(c)].push({ name: c.name, qty: c.qty, cmc: c.k.cmc || 0, tags: c.tags });
  const count = r => roles[r].reduce((s, c) => s + c.qty, 0);
  const curve = {}; for (const c of nonland) { const m = Math.min(6, Math.round(c.k.cmc || 0)); curve[m] = (curve[m] || 0) + c.qty; }
  const colors = [...new Set(nonland.flatMap(c => c.k.color_identity || c.k.colors || []))].sort();

  // no engine: the archetype read on tag counts and curve (plan.js), when its rule is a decisive one
  const ARCH = { 'draw-go control': 'control', 'tap-out control': 'control', 'disrupt-and-clock': 'midrange', 'evasive aggro': 'aggro', 'go-wide aggro': 'go-wide aggro', 'spells-matter': 'spells-matter tempo', 'fast combo': 'combo', 'discard-as-value': 'aggro' };
  const pl = await planjs.planOf(list, name).catch(() => null);
  // ...and only for a deck with no half-built engine: one whose text builds around little (no plan of 6+ copies)
  const arch = !coherent && consistent && !big.length && pl && ARCH[pl.plan] ? { shape: ARCH[pl.plan], why: pl.why } : null;
  return {
    coherent: !!(coherent || arch), engineless: !coherent && !!arch, shape: coherent ? shape : arch ? arch.shape : null, archetypeWhy: arch ? arch.why : null, plan: pl ? pl.plan : null,
    engine: coherent ? engine.map(e => ({ name: e.name, qty: e.qty, why: [...links.get(e.name).values()].map(x => RULES.find(r => r.id === x.rule).label).filter((v, i, a) => a.indexOf(v) === i) })) : [],
    plans: plans.map(p => ({ id: p.id, label: p.label, shape: p.shape, cards: p.cards.length, copies: p.copies })),
    roles: ROLE_ORDER.map(r => ({ role: r, count: count(r), cards: roles[r] })).filter(r => r.cards.length),
    curve, colors, cards: cards.reduce((s, c) => s + c.qty, 0), consistency: nlCopies ? +(multi / nlCopies).toFixed(2) : 0,
    // the half-plans, for "this deck doesn't have one plan yet"
    halfPlans: coherent || arch ? [] : plans.slice(0, 3).map(p => `${p.label} (${p.copies} cards)`),
    links: Object.fromEntries([...links].filter(([, m]) => m.size).map(([n, m]) => [n, [...m].map(([o, x]) => ({ to: o, rule: x.rule }))])),
  };
}

module.exports = { read, RULES, ROLE_ORDER };
