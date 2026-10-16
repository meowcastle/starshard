// A player's collection, an input to brewing (Design's changes 20 and 22, NOTE-TO-CODE-16OCT-CRAFT.md and
// -BREWFROM.md): two shelves per account.
//   paper  pasted on the Account screen: ManaBox CSV, Moxfield CSV, or lines like "1 Mind Twist (SPG) 166 *F*".
//          Printings are summed by name; tokens and art cards are dropped; a new paste replaces the shelf.
//   arena  from the Mac's Player.log: the wildcards only. Arena stopped logging the card collection
//          (PlayerInventory.GetPlayerCardsV3 is gone from current logs; 16 Oct), so the shelf has no cards
//          until there is another honest source for them.
//
//   get(owner) -> { paper?, arena? }      setPaper(owner, text) -> shelf      setArena(owner, wildcards) -> shelf
const path = require('path');
const config = require('./config');
const { writeJson, readJson } = require('./store');
const meta = require('./meta');

const FILE = () => path.join(config.DATA_DIR, 'collections.json');
let all = null; // owner (lower case) -> { paper, arena }
const load = () => (all = all || readJson(FILE(), {}));
const save = () => writeJson(FILE(), all);
const key = owner => String(owner || '').toLowerCase();

// one CSV line, with quoted fields ("Jace, the Mind Sculptor")
function csvLine(s) {
  const out = []; let cur = '', q = false;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (q) { if (c === '"' && s[i + 1] === '"') { cur += '"'; i++; } else if (c === '"') q = false; else cur += c; }
    else if (c === '"') q = true; else if (c === ',') { out.push(cur); cur = ''; } else cur += c;
  }
  out.push(cur); return out.map(x => x.trim());
}

// text -> { source, lines: [{ qty, name }] } (names as written; not yet checked against the card data)
function parse(text) {
  const rows = String(text || '').replace(/\r/g, '').split('\n').map(x => x.trim()).filter(Boolean).slice(0, 20000);
  if (!rows.length) return { source: null, lines: [] };
  const head = csvLine(rows[0]).map(x => x.toLowerCase());
  const ni = head.indexOf('name'), qi = ['quantity', 'count', 'qty'].map(h => head.indexOf(h)).find(i => i >= 0);
  if (rows[0].includes(',') && ni >= 0 && qi != null) {
    const source = head.includes('manabox id') || head.includes('set code') ? 'ManaBox export' : head.includes('tradelist count') || head.includes('edition') ? 'Moxfield export' : 'CSV export';
    const lines = rows.slice(1).map(csvLine).map(c => ({ qty: parseInt(c[qi], 10), name: c[ni] })).filter(x => x.name && x.qty > 0);
    return { source, lines };
  }
  // "4 Card Name", "1 Mind Twist (SPG) 166", "1 Expropriate (SLD) 2396 *F*", "4x Card Name"
  const lines = [];
  for (const r of rows) {
    const m = r.match(/^(\d+)\s*[xX]?\s+(.+)$/); if (!m) continue; // section headers ("Deck", "Sideboard") and notes
    const name = m[2].replace(/\s+\*[A-Za-z]+\*\s*$/, '').replace(/\s+\([A-Za-z0-9]{2,6}\)(?:\s+[\w★\-]+)?\s*$/, '').trim();
    if (name && +m[1] > 0) lines.push({ qty: +m[1], name });
  }
  return { source: 'pasted list', lines };
}

const NOT_CARDS = new Set(['token', 'double_faced_token', 'art_series', 'emblem']);
async function setPaper(owner, text) {
  const { source, lines } = parse(text);
  if (!lines.length) { const e = new Error("That doesn't read as a collection. Paste a ManaBox or Moxfield export, or one card per line, like \"4 Lightning Bolt\"."); e.status = 400; throw e; }
  const find = await meta.cards([...new Set(lines.map(l => l.name))]);
  const cards = {}, unknown = new Set();
  for (const l of lines) {
    const k = find(l.name);
    if (!k) { unknown.add(l.name); continue; }
    if (NOT_CARDS.has(k.layout)) continue;
    const n = meta.forgeName(k); cards[n] = (cards[n] || 0) + l.qty;
  }
  const shelf = { at: Date.now(), source, cards, size: Object.values(cards).reduce((a, b) => a + b, 0), ...(unknown.size ? { unknown: [...unknown].slice(0, 50) } : {}) };
  load()[key(owner)] = { ...(all[key(owner)] || {}), paper: shelf }; save();
  return shelf;
}

function setArena(owner, wildcards) {
  const n = x => Math.max(0, Math.min(1e5, +x || 0));
  const w = { common: n(wildcards?.common), uncommon: n(wildcards?.uncommon), rare: n(wildcards?.rare), mythic: n(wildcards?.mythic) };
  const prev = load()[key(owner)]?.arena;
  if (prev && JSON.stringify(prev.wildcards) === JSON.stringify(w)) return prev;
  const shelf = { at: Date.now(), source: 'arena-log', cards: {}, wildcards: w };
  all[key(owner)] = { ...(all[key(owner)] || {}), arena: shelf }; save();
  return shelf;
}

const get = owner => load()[key(owner)] || {};
function remove(owner) { if (load()[key(owner)]) { delete all[key(owner)]; save(); } }

module.exports = { get, setPaper, setArena, remove, parse };
