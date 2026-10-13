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
async function standardIndex() {
  if (index && Date.now() - index.at < WEEK) return index;
  if (loading) return loading;
  loading = (async () => {
    let c = readJson(FILE(), null);
    if (!c || Date.now() - c.at > WEEK) {
      const cards = [];
      let url = 'https://api.scryfall.com/cards/search?q=' + encodeURIComponent('legal:standard') + '&unique=cards&order=name';
      while (url) {
        const r = await fetch(url, { headers: UA });
        if (r.status === 429) { await sleep(2000); continue; }
        const j = await r.json(); if (j.object === 'error') break;
        for (const k of j.data) { const f = (k.card_faces && k.card_faces[0]) || k; cards.push({ name: meta.forgeName(k), type: f.type_line || k.type_line || '', cmc: k.cmc || 0, cost: f.mana_cost || k.mana_cost || '' }); }
        url = j.has_more ? j.next_page : null;
        await sleep(120);
      }
      if (cards.length) { c = { at: Date.now(), cards }; writeJson(FILE(), c, { keep: 0 }); }
      else if (!c) c = { at: 0, cards: [] };
    }
    index = { at: c.at || Date.now(), cards: c.cards.map(x => ({ ...x, key: nk(x.name) })) };
    loading = null;
    return index;
  })();
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

module.exports = { search, standardIndex, forgeView };
