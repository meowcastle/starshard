// Card search for editing a list (Design's change 7, NOTE-TO-CODE-13OCT-DECK-EDITING.md): as you type,
// up to 8 cards, prefix matches first, each with its legality in the brew's format and what Forge's
// AI makes of it.
//
// Standard (the sim's field) searches a local index of every Standard-legal card: one Scryfall search,
// paged (about 25 requests), kept in DATA_DIR/standard-cards.json and refreshed weekly. Other formats
// ask Scryfall's autocomplete (built for typing; the page debounces) and look the names up in the
// card cache.
const fs = require('fs');
const path = require('path');
const config = require('./config');
const { writeJson, readJson } = require('./store');
const meta = require('./meta');
const aihints = require('./aihints');

const WEEK = 7 * 864e5;
const FILE = () => path.join(config.DATA_DIR, 'standard-cards.json');
const nk = n => String(n).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const sleep = ms => new Promise(r => setTimeout(r, ms));
const UA = { Accept: 'application/json', 'User-Agent': 'sim.starshard.net' };

let index = null, loading = null;
// one Scryfall search, every page, politely (Scryfall rate-limits its search hard and the server shares an IP)
async function pages(q, keep) {
  let url = 'https://api.scryfall.com/cards/search?q=' + encodeURIComponent(q) + '&unique=cards&order=name', tries = 0;
  while (url) {
    const r = await fetch(url, { headers: UA });
    if (r.status === 429) { if (++tries > 6) return false; await sleep((+r.headers.get('retry-after') || 2 ** tries) * 1000); continue; }
    const j = await r.json(); if (j.object === 'error') return j.code === 'not_found';
    j.data.forEach(keep); url = j.has_more ? j.next_page : null; tries = 0;
    await sleep(300);
  }
  return true;
}
// v2 (20 Oct): each card carries its rules text, colour identity, rarity and the newest sets it is in, for the coach
// A set Scryfall lists that the index hasn't seen (a release day) rebuilds it at once rather than at the week's end;
// the set list itself is asked for at most once a day.
const unseen = async c => { const have = new Set((c.sets || []).map(x => x.code)); return (await newSets().catch(() => [])).some(x => !have.has(x.code)); };
async function standardIndex() {
  if (index && Date.now() - index.at < WEEK && !(await unseen(index))) return index;
  if (loading) return loading;
  loading = (async () => {
    let c = readJson(FILE(), null);
    if (!c || c.v !== 2 || Date.now() - c.at > WEEK || await unseen(c)) {
      const cards = [], fresh = await newSets().catch(() => []);
      const ok = await pages('legal:standard', k => { const f = (k.card_faces && k.card_faces[0]) || k;
        cards.push({ name: meta.forgeName(k), type: f.type_line || k.type_line || '', cmc: k.cmc || 0, cost: f.mana_cost || k.mana_cost || '',
          text: meta.textOf(k), id: (k.color_identity || []).join('').toLowerCase(), rarity: k.rarity || '', sets: [] }); });
      // the card list keeps one printing per card, so a new set's reprints are tagged from a search of the set itself
      for (const st of fresh) { const by = new Map(cards.map(x => [x.name, x])); await pages(`set:${st.code} legal:standard`, k => { const x = by.get(meta.forgeName(k)); if (x) x.sets.push(st.code); }); }
      if (ok && cards.length) { c = { v: 2, at: Date.now(), cards, sets: fresh }; writeJson(FILE(), c, { keep: 0 }); }
      else if (!c) c = { at: 0, cards: [] };
    }
    index = { at: c.at || Date.now(), sets: c.sets || [], cards: c.cards.map(x => ({ ...x, key: nk(x.name) })) };
    return index;
  })().finally(() => { loading = null; });
  return loading;
}

// what Forge makes of a card: ok, limited (casts it only situationally), unplayable (won't cast it;
// our pilot casts the dead-card list), missing (not in this Forge)
function forgeView(name, version) {
  const h = aihints.hintOf(name, version);
  if (h === 'unplayable') return 'unplayable';
  if (h === 'limited') return 'limited';
  if (h === null && aihints.hasCard(name, version) === false) return 'missing';
  return 'ok';
}

/** Up to n cards matching q for a brew in `format`: [{ name, type, cmc, cost, legal, forge, owned }]. */
async function search(q, format = 'standard', { n = 8, version, owned = null } = {}) {
  const key = nk(q).trim(); if (key.length < 2) return [];
  let names;
  if (format === 'standard') {
    // answered from the index alone: every card in it is Standard-legal, and Forge's view is local
    const ix = await standardIndex();
    const pre = ix.cards.filter(c => c.key.startsWith(key)), sub = ix.cards.filter(c => !c.key.startsWith(key) && c.key.includes(key));
    const hits = [...pre, ...sub].map(c => ({ name: c.name, type: c.type, cmc: c.cmc, cost: c.cost, legal: true, legality: 'legal', forge: forgeView(c.name, version), owned: owned ? owned.has(c.key) : null }));
    if (owned) hits.sort((a, b) => b.owned - a.owned);
    return hits.slice(0, n);
  } else {
    const r = await fetch('https://api.scryfall.com/cards/autocomplete?q=' + encodeURIComponent(q), { headers: UA });
    names = r.ok ? ((await r.json()).data || []).slice(0, n * 2) : [];
  }
  const find = await meta.cards(names);
  const out = [];
  for (const nm of names) {
    const k = find(nm); if (!k) continue;
    const st = k.legalities?.[format];
    const f = (k.card_faces && k.card_faces[0]) || k;
    out.push({ name: meta.forgeName(k), type: f.type_line || k.type_line || '', cmc: k.cmc || 0, cost: f.mana_cost || k.mana_cost || '',
      legal: ['legal', 'restricted'].includes(st), legality: st || 'not_legal', forge: forgeView(meta.forgeName(k), version), owned: owned ? owned.has(nk(meta.forgeName(k))) : null });
  }
  // owned first when a collection is known, legal before not, then the match order
  if (owned) out.sort((a, b) => (b.owned - a.owned));
  return out.sort((a, b) => (b.legal - a.legal)).slice(0, n);
}

// For the coach (Justin, 20 Oct: "the coach should have all the standard legal cards and understand them"). Its model
// was trained before the newest sets, so it looks cards up instead of remembering them: by name, or by a Scryfall
// query held to the brew's format. Both answer with the printed rules text.
async function lookup(names, format = 'standard') {
  const find = await meta.cards(names).catch(() => () => null), out = [];
  const ix = format === 'standard' ? await standardIndex() : null;
  for (const n of names) {
    const local = ix && ix.cards.find(c => c.key === nk(n) || c.key === nk(n.split(' // ')[0]));
    if (local && local.text) { out.push(local.text); continue; }
    const k = find(n);
    if (!k) { out.push(`${n}: no card by that name${ix ? ' in Standard' : ''}.`); continue; }
    const st = k.legalities?.[format];
    out.push(meta.textOf(k) + (['legal', 'restricted'].includes(st) ? '' : ` [not legal in ${format}]`));
  }
  return out.join('\n');
}
// The coach's search, from the local index (no network, so no rate limit). Every filter must hold. `text` is a list of
// phrases that must all appear in the rules text; one phrase may give alternatives as "gain life OR lifelink".
// `colors` is colour identity within (e.g. "wb": white, black, both or colourless).
async function find({ text = [], name, type, colors, mv_max, mv_min, set, rarity, limit = 30 } = {}, format = 'standard') {
  if (format !== 'standard') return findLive({ text, name, type, colors, mv_max, mv_min, set, rarity, limit }, format);
  const ix = await standardIndex(); if (!ix.cards.length) return 'Error: the card list is not loaded yet; try card_text with exact names.';
  const low = x => nk(x || '');
  const phrases = [].concat(text).filter(Boolean).map(p => String(p).split(/\s+OR\s+/).map(low));
  const st = set && ix.sets.find(x => low(x.code) === low(set) || low(x.name) === low(set));
  const idOk = colors != null && String(colors).trim() !== '' ? new Set(low(colors).replace(/[^wubrg]/g, '')) : null;
  const rows = ix.cards.filter(c => {
    const t = low(c.text);
    if (phrases.some(alts => !alts.some(a => t.includes(a)))) return false;
    if (name && !c.key.includes(low(name))) return false;
    if (type && !low(c.type).includes(low(type))) return false;
    if (idOk && [...(c.id || '')].some(x => !idOk.has(x))) return false;
    if (mv_max != null && c.cmc > mv_max) return false;
    if (mv_min != null && c.cmc < mv_min) return false;
    if (rarity && low(c.rarity) !== low(rarity)) return false;
    if (set && (st ? !(c.sets || []).includes(st.code) : !t.includes('(' + low(set) + ')'))) return false;
    return true;
  });
  const n = Math.min(Math.max(+limit || 30, 1), 40), shown = rows.slice(0, n);
  if (!rows.length) return 'No Standard cards match.' + (set && !st ? ` (Set filters only know the newest sets: ${ix.sets.map(x => x.name).join(', ')}; older cards match on the set named after their text.)` : '');
  return `${rows.length} Standard card${rows.length === 1 ? '' : 's'} match${rows.length > n ? `; the first ${n} by name (narrow it for the rest)` : ''}:\n` + shown.map(c => c.text || c.name).join('\n');
}

// Other formats (Commander's pool is every card ever printed, too big to keep): the same filters as a Scryfall search,
// one page, backing off when Scryfall asks.
async function findLive({ text = [], name, type, colors, mv_max, mv_min, set, rarity, limit = 30 }, format) {
  const qs = s => '"' + String(s).replace(/"/g, '') + '"';
  const q = [`legal:${format}`,
    ...[].concat(text).filter(Boolean).map(p => { const alts = String(p).split(/\s+OR\s+/).map(a => 'o:' + qs(a)); return alts.length > 1 ? '(' + alts.join(' or ') + ')' : alts[0]; }),
    name ? 'name:' + qs(name) : '', type ? 't:' + qs(type) : '', colors ? 'id<=' + (String(colors).toLowerCase().replace(/[^wubrg]/g, '') || 'c') : '',
    mv_max != null ? 'mv<=' + (+mv_max) : '', mv_min != null ? 'mv>=' + (+mv_min) : '', set ? 'set:' + qs(set) : '', rarity ? 'r:' + rarity : ''].filter(Boolean).join(' ');
  const url = 'https://api.scryfall.com/cards/search?unique=cards&order=edhrec&q=' + encodeURIComponent(q);
  for (let t = 1; t <= 4; t++) {
    const r = await fetch(url, { headers: UA }).catch(() => null);
    if (!r) return 'Error: Scryfall did not answer; try again.';
    if (r.status === 429) { await sleep((+r.headers.get('retry-after') || 2 ** t) * 1000); continue; }
    const j = await r.json();
    if (j.object === 'error') return j.code === 'not_found' ? 'No cards match.' : 'Error: ' + (j.details || j.code);
    const n = Math.min(Math.max(+limit || 30, 1), 40), rows = j.data.slice(0, n).map(k => meta.textOf(k));
    return `${j.total_cards} card${j.total_cards === 1 ? '' : 's'} match${j.total_cards > rows.length ? `; the ${rows.length} most played in Commander shown (narrow it for the rest)` : ''}:\n` + rows.join('\n');
  }
  return 'Error: Scryfall is busy; try again in a minute.';
}

// Standard sets released since the model's training ended: the coach is told it has to look these up.
const CUTOFF = '2026-06-01';
let sets = null;
async function newSets() {
  if (sets && Date.now() - sets.at < 864e5) return sets.list;
  try {
    const j = await (await fetch('https://api.scryfall.com/sets', { headers: UA })).json(), today = new Date().toISOString().slice(0, 10);
    const list = (j.data || []).filter(x => ['expansion', 'core'].includes(x.set_type) && x.released_at >= CUTOFF && x.released_at <= today).map(x => ({ code: x.code, name: x.name, released: x.released_at }));
    sets = { at: Date.now(), list };
  } catch { if (!sets) return []; }
  return sets.list;
}

module.exports = { search, standardIndex, forgeView, lookup, find, newSets };
