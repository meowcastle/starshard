// E4, the strategy-aware pilot (STRATEGY-FIRST-REBUILD §4): the brew's seat plays by its strategy's piloting rules.
// It owns only the decisions those rules are about and hands every other question back to Forge's AI ({ delegate }):
//
//   attackAlone   the champions (strategy.piloting attackAlone cards, else the engine's creatures) attack alone, the
//                 best one that can survive the swing; the rest stay home, unless the whole team is lethal or no
//                 champion can attack (then Forge decides).
//   holdProtection keep N mana up in your own main phase while a champion is on the battlefield and a protection
//                 card is in hand; spend protection only when the opponent's spell or ability on the stack targets
//                 one of your creatures, and aim it at that creature.
//   tutor         what the tutor fetches, by opponent (the strategy's table), else its order of preference.
//   equip         equipment goes on a champion.
//
// cfg: { kind: 'strategy', champions: [names], protection: [names], holdMana: n, equipment: [names],
//        tutor: { card, byOpponent: { deck: card }, order: [cards] } | null, opponent: deck name }
const OWNS = ['priority', 'attackers', 'choose_entity', 'targets'];
const nk = n => String(n || '').split(' // ')[0].toLowerCase();
const has = (list, n) => (list || []).some(x => nk(x) === nk(n));

function landOf(find) { return c => { const k = find(c.name); return !!k && /\bLand\b/.test(k.type_line || (k.card_faces || []).map(f => f.type_line).join(' ')); }; }
const pt = c => { const m = String(c.pt || '').match(/(-?\d+)\/(-?\d+)/); return m ? [+m[1], +m[2]] : [0, 0]; };

function attackers(m, cfg) {
  const st = m.state || {}, opts = (m.options || []).filter(o => /Attack opponent with/.test(o.label || ''));
  if (!opts.length) return null;
  const oppLife = st.opponent && st.opponent.life != null ? st.opponent.life : 20;
  const seen = new Set(), total = opts.reduce((s, o) => { if (seen.has(o.card)) return s; seen.add(o.card); return s + Math.max(0, (o.meta && o.meta.power) || 0); }, 0);
  if (total >= oppLife) return null;                                   // the whole team is lethal: Forge's alpha strike
  const champs = opts.filter(o => has(cfg.champions, o.card));
  if (!champs.length) return null;                                      // no champion can attack: Forge decides
  const maxBlock = (m.hints && m.hints.opponentMaxUntappedPower) || 0;
  const safe = champs.filter(o => o.meta && (o.meta.evasive || maxBlock < o.meta.toughness));
  const pick = (safe.length ? safe : []).sort((a, b) => (b.meta.power - a.meta.power) || (b.meta.evasive - a.meta.evasive))[0];
  return { choice: pick ? [pick.id] : [] };                              // alone, or nobody (the champion would only trade away)
}

// the stack's opponent objects targeting one of my creatures: { source, target id }
function threatened(st) {
  const mine = new Set(((st.you && st.you.battlefield) || []).filter(c => c.pt).map(c => c.id));
  for (const e of st.stack || []) if (e.controller === 'opponent') for (const t of e.targets || []) if (mine.has(t)) return { source: e.source, target: t };
  return null;
}
// the mana an option costs: a spell's mana value; an ability's from its label ("Equip {2}", "{3}{W}: ...")
function costOf(o) {
  if (o.meta && o.meta.type === 'spell') return o.meta.cmc || 0;
  const s = String(o.label || ''), m = s.match(/Equip\s*(?:—|-)?\s*((?:\{[^}]+\})+)/i) || s.match(/: ((?:\{[^}]+\})+)/);
  if (!m) return 0;
  return (m[1].match(/\{([^}]+)\}/g) || []).reduce((t, x) => { const v = x.slice(1, -1); return t + (/^\d+$/.test(v) ? +v : /^[WUBRGC]$/.test(v) ? 1 : 0); }, 0);
}

function priority(m, cfg, find) {
  const st = m.state || {}, opts = m.options || [], me = (st.you && st.you.battlefield) || [], hand = (st.you && st.you.hand) || [];
  const protOpts = opts.filter(o => o.meta && o.meta.type === 'spell' && has(cfg.protection, o.card));
  // protection answers a threat on the stack, and only then
  const th = threatened(st);
  if (th && protOpts.length) { cfg._aim = th.target; return { choice: [protOpts[0].id] }; }
  const myTurn = st.activePlayer === 'you', main = /MAIN/.test(st.phase || ''), empty = !(st.stack || []).length;
  const champOut = me.some(c => has(cfg.champions, c.name));
  const holding = cfg.holdMana > 0 && champOut && hand.some(c => has(cfg.protection, c.name));
  if (!(myTurn && main && empty) || !holding) {
    // no protection fired early: with nothing on the stack aimed at us, a protection spell isn't cast (others are Forge's)
    if (protOpts.length && !th && opts.every(o => o.meta && (o.meta.type !== 'spell' || has(cfg.protection, o.card)) || o.id === 'pass' || !o.meta)) return { choice: ['pass'] };
    return null;
  }
  const untapped = me.filter(landOf(find)).filter(c => !c.tapped).length, budget = untapped - cfg.holdMana;
  const land = opts.find(o => o.meta && o.meta.type === 'land'); if (land) return { choice: [land.id] };
  const plays = opts.filter(o => o.meta && (o.meta.type === 'spell' || o.meta.type === 'ability') && !has(cfg.protection, o.card));
  if (plays.every(o => costOf(o) <= budget) && !protOpts.length) return null;   // nothing breaks the hold: Forge picks
  const fits = plays.filter(o => costOf(o) <= budget).sort((a, b) => costOf(b) - costOf(a));
  return { choice: [fits.length ? fits[0].id : 'pass'] };
}

function chooseEntity(m, cfg) {
  const T = cfg.tutor; if (!T) return null;
  const src = ((m.state && m.state.stack) || [])[0], prompt = String(m.prompt || '');
  if (!(src && nk(src.source) === nk(T.card)) && !new RegExp(String(T.card).split(',')[0].replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i').test(prompt)) return null;
  const opts = m.options || [], want = [(T.byOpponent || {})[cfg.opponent], ...(T.order || [])].filter(Boolean);
  for (const w of want) { const o = opts.find(x => nk(x.card) === nk(w)); if (o) return { choice: [o.id] }; }
  return null;
}

function targets(m, cfg) {
  const prompt = String(m.prompt || ''), src = (prompt.match(/Choose target\(s\) for ([^:]+):/) || [])[1] || '';
  const opts = m.options || [];
  if (has(cfg.protection, src) && cfg._aim) { const o = opts.find(x => x.id === cfg._aim || (x.meta && x.meta.id === cfg._aim)); cfg._aim = null; if (o) return { choice: [o.id] }; }
  if (has(cfg.equipment, src) || has(cfg.protection, src)) {
    for (const c of cfg.champions || []) { const o = opts.find(x => nk(x.card) === nk(c)); if (o) return { choice: [o.id] }; }
  }
  return null;
}

function answer(m, cfg, find) {
  if (m.kind === 'attackers') return attackers(m, cfg);
  if (m.kind === 'priority') return priority(m, cfg, find);
  if (m.kind === 'choose_entity') return chooseEntity(m, cfg);
  if (m.kind === 'targets') return targets(m, cfg);
  return null;
}

// the pilot's config from a strategy (server side): champions, protection, the mana to hold, the tutor's table
function fromStrategy(strategy, list, find, opponent = null) {
  const names = (list.main || []).map(c => c.name), inList = n => names.some(x => nk(x) === nk(n));
  const type = n => { const k = find(n); return k ? (k.type_line || (k.card_faces || []).map(f => f.type_line).join(' ')) : ''; };
  const rules = (strategy && strategy.piloting) || [];
  const alone = rules.find(r => r.rule === 'attackAlone'), hold = rules.find(r => r.rule === 'holdProtection'), tut = rules.find(r => r.rule === 'tutor');
  let champions = ((alone && alone.cards) || []).filter(n => inList(n) && /Creature/.test(type(n)));
  if (!champions.length) champions = ((strategy && strategy.engine) || []).map(e => e.name || e).filter(n => inList(n) && /Creature/.test(type(n)));
  const protection = ((hold && hold.cards) || []).filter(n => inList(n) && !/Creature/.test(type(n)));
  const holdMana = hold ? Math.max(1, Math.min(3, +((String(hold.text || '').match(/(\d+)\s*mana|keep (\d+)/i) || [])[1] || 1))) : 0;
  const equipment = names.filter(n => /Equipment/.test(type(n)));
  let tutor = null;
  if (tut && tut.cards && tut.cards.length) { const card = tut.cards.find(n => inList(n) && /search your library/i.test((find(n) || {}).oracle_text || '')) || tut.cards[0];
    tutor = { card, byOpponent: {}, order: tut.cards.filter(n => n !== card && inList(n)) }; }
  return { kind: 'strategy', champions, protection, holdMana: protection.length ? holdMana : 0, equipment, tutor, opponent };
}

module.exports = { OWNS, answer, fromStrategy, costOf, threatened };
