// Meta-site readers. Server-side because none of these send CORS headers.
// Everything is cached in memory (6h) so we hit each site rarely.
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129 Safari/537.36 sim.starshard.net';
const cache = new Map();
const TTL = 6 * 3600e3;

async function get(url, type = 'text') {
  const hit = cache.get(url);
  if (hit && Date.now() - hit.t < TTL) return hit.v;
  const r = await fetch(url, { headers: { 'User-Agent': UA, Accept: type === 'json' ? 'application/json' : 'text/html,*/*' } });
  if (!r.ok) throw new Error(`${new URL(url).host} answered ${r.status}`);
  const v = type === 'json' ? await r.json() : await r.text();
  cache.set(url, { t: Date.now(), v });
  return v;
}

const decode = s => s.replace(/&#39;|&#x27;/g, "'").replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();

// "4 Opt\n...\n\n2 Annul" or with a "Sideboard" line -> {main, side}
function parseList(text) {
  const main = [], side = [], commander = [];
  let cur = main;
  for (let raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    // A blank line ends the commander block, or (once there is a main deck) starts the sideboard.
    if (!line) { if (cur === commander && commander.length) cur = main; else if (main.length) cur = side; continue; }
    if (/^(\/\/\s*)?side\s*board:?$/i.test(line) || /^SB:?$/i.test(line)) { cur = side; continue; }
    if (/^(\/\/\s*)?commander:?$/i.test(line)) { cur = commander; continue; }
    if (/^(\/\/\s*)?(main\s*deck|deck|companion):?$/i.test(line)) { cur = main; continue; }
    let sb = false;
    let l = line;
    if (/^SB:\s*/i.test(l)) { sb = true; l = l.replace(/^SB:\s*/i, ''); }
    const m = l.match(/^(\d+)x?\s+(.+?)(\s+\([A-Z0-9]{2,6}\)\s*[\w-]*)?(\s+\*F\*)?$/);
    if (!m) continue;
    (sb ? side : cur).push({ qty: +m[1], name: m[2].trim() });
  }
  return { main, side, commander };
}

// ---------- MTGGoldfish ----------
const GOLDFISH_FORMATS = ['standard', 'pioneer', 'modern', 'legacy', 'vintage', 'pauper', 'premodern', 'timeless', 'historic', 'explorer', 'alchemy'];
async function goldfishMeta(format) {
  if (!GOLDFISH_FORMATS.includes(format)) throw new Error('unknown format');
  const html = await get(`https://www.mtggoldfish.com/metagame/${format}/full#paper`);
  const out = [];
  const tiles = html.split('class=\'archetype-tile\'').slice(1).concat(html.split('class="archetype-tile"').slice(1));
  for (const t of tiles) {
    const href = (t.match(/href=["'](\/archetype\/[^"'#]+)/) || [])[1];
    const name = (t.match(/archetype-tile-title[\s\S]*?<a[^>]*>([\s\S]*?)<\/a>/) || [])[1];
    const pct = (t.match(/metagame-percentage[\s\S]*?archetype-tile-statistic-value[^>]*>\s*([\d.]+)%/) || [])[1];
    const count = (t.match(/value-extra-data[^>]*>\s*\((\d+)\)/) || [])[1];
    if (href && name && !out.some(o => o.id === href)) out.push({ id: href, name: decode(name), pct: pct ? +pct : null, count: count ? +count : null, source: 'MTGGoldfish' });
  }
  return out.sort((a, b) => (b.pct || 0) - (a.pct || 0));
}
async function goldfishDeck(archetypePath) {
  if (!/^\/(archetype|deck)\/[\w-]+$/.test(archetypePath)) throw new Error('bad archetype');
  let id = (archetypePath.match(/^\/deck\/(\d+)/) || [])[1];
  if (!id) {
    const html = await get('https://www.mtggoldfish.com' + archetypePath);
    id = (html.match(/\/deck\/download\/(\d+)/) || [])[1];
  }
  if (!id) throw new Error('no decklist found on MTGGoldfish');
  return parseList(await get(`https://www.mtggoldfish.com/deck/download/${id}`));
}

// ---------- MTGTop8 ----------
const TOP8_FORMATS = { standard: 'ST', pioneer: 'PI', modern: 'MO', legacy: 'LE', vintage: 'VI', pauper: 'PAU', premodern: 'PREM', 'duel-commander': 'EDH', cedh: 'cEDH' };
async function top8Meta(format) {
  const f = TOP8_FORMATS[format]; if (!f) throw new Error('unknown format');
  const html = await get(`https://www.mtgtop8.com/format?f=${f}`);
  const out = [];
  const re = /href=["']?(archetype\?a=(\d+)&(?:amp;)?meta=(\d+)&(?:amp;)?f=\w+)["']?[^>]*>([^<]+)<\/a>([\s\S]{0,600}?)>\s*(\d+)\s*%\s*</g;
  let m;
  while ((m = re.exec(html))) {
    const id = `${m[2]}:${m[3]}:${f}`;
    if (!out.some(o => o.id === id)) out.push({ id, name: decode(m[4]), pct: +m[6], source: 'MTGTop8' });
  }
  return out.sort((a, b) => (b.pct || 0) - (a.pct || 0));
}
async function top8Deck(id) {
  const [a, meta, f] = id.split(':');
  if (!/^\d+$/.test(a) || !/^\d+$/.test(meta) || !/^\w+$/.test(f)) throw new Error('bad archetype');
  const html = await get(`https://www.mtgtop8.com/archetype?a=${a}&meta=${meta}&f=${f}`);
  const d = (html.match(/[?&]d=(\d+)/) || [])[1];
  if (!d) throw new Error('no decklist found on MTGTop8');
  return parseList(await get(`https://www.mtgtop8.com/mtgo?d=${d}`));
}

// ---------- EDHREC ----------
async function edhrecMeta() {
  const j = await get('https://json.edhrec.com/pages/commanders/week.json', 'json');
  const list = j.container?.json_dict?.cardlists?.[0]?.cardviews || [];
  return list.slice(0, 100).map(c => ({ id: c.sanitized || c.slug, name: c.name, count: c.num_decks, source: 'EDHREC' }));
}
async function edhrecDeck(slug) {
  if (!/^[a-z0-9-]+$/.test(slug)) throw new Error('bad commander');
  const j = await get(`https://json.edhrec.com/pages/average-decks/${slug}.json`, 'json');
  const commander = (j.deck?.commander || []).map(n => ({ qty: 1, name: n }));
  const main = [];
  for (const cards of Object.values(j.deck?.cards || {})) for (const [name, qty] of cards) main.push({ qty, name });
  // Some average decks omit basics from the category map; fill from the flat list.
  const have = main.reduce((s, c) => s + c.qty, 0) + commander.length;
  if (have < 100 && Array.isArray(j.basic)) for (const b of j.basic) { const n = b.name || b[0]; const q = b.num || b[1]; if (n && q && !main.some(c => c.name === n)) main.push({ qty: q, name: n }); }
  return { main, side: [], commander };
}

// ---------- Deck URL import (Moxfield, Archidekt, MTGGoldfish, MTGTop8) ----------
async function importUrl(url) {
  const u = new URL(url);
  if (/moxfield\.com$/.test(u.hostname)) {
    const id = u.pathname.split('/').filter(Boolean).pop();
    const j = await get(`https://api2.moxfield.com/v3/decks/all/${id}`, 'json');
    const board = b => Object.values(j.boards?.[b]?.cards || {}).map(c => ({ qty: c.quantity, name: c.card.name }));
    return { name: j.name, ...{ main: board('mainboard'), side: board('sideboard'), commander: board('commanders') } };
  }
  if (/archidekt\.com$/.test(u.hostname)) {
    const id = (u.pathname.match(/decks\/(\d+)/) || [])[1];
    const j = await get(`https://archidekt.com/api/decks/${id}/`, 'json');
    const deck = { name: j.name, main: [], side: [], commander: [] };
    for (const c of j.cards || []) {
      const cats = c.categories || [];
      if (cats.includes('Maybeboard')) continue;
      const card = { qty: c.quantity, name: c.card?.oracleCard?.name || c.card?.name };
      (cats.includes('Commander') ? deck.commander : cats.includes('Sideboard') ? deck.side : deck.main).push(card);
    }
    return deck;
  }
  if (/mtggoldfish\.com$/.test(u.hostname)) return goldfishDeck(u.pathname.replace(/\/$/, ''));
  if (/mtgtop8\.com$/.test(u.hostname)) {
    const d = u.searchParams.get('d'); if (!/^\d+$/.test(d || '')) throw new Error('need a ?d= deck link');
    return parseList(await get(`https://www.mtgtop8.com/mtgo?d=${d}`));
  }
  throw new Error('supported: Moxfield, Archidekt, MTGGoldfish, MTGTop8 links');
}

// ---------- Scryfall: names -> card data ----------
// Kept on disk (data/scryfall.json) as well as in memory: the Codex looks up every
// card in the field, and a restart should not ask Scryfall for hundreds again.
// Unknown names are not persisted, so a card printed after the miss is found later.
const fs = require('fs'), path = require('path');
const { writeJson } = require('./store');
const SCRY_FILE = () => path.join(process.env.DATA_DIR || '/data', 'scryfall.json');
const scry = new Map(); // lowercased name -> card | null
const KEEP = ['name', 'layout', 'card_faces', 'type_line', 'oracle_text', 'mana_cost', 'cmc', 'colors', 'legalities', 'games', 'set', 'set_name', 'image_uris', 'power', 'toughness', 'loyalty'];
// misses are remembered for a day, so a restart does not ask about them again straight away
const missed = new Map(); // key -> when
try { const d = JSON.parse(fs.readFileSync(SCRY_FILE(), 'utf8')); for (const [k, c] of Object.entries(d.cards || d)) if (k !== 'missed') scry.set(nk(k), c); for (const [k, at] of Object.entries(d.missed || {})) if (Date.now() - at < 864e5) { missed.set(k, at); scry.set(k, null); } } catch {}
let scrySave = null;
const persist = () => { clearTimeout(scrySave); scrySave = setTimeout(() => { try { writeJson(SCRY_FILE(), { cards: Object.fromEntries([...scry].filter(([, c]) => c)), missed: Object.fromEntries(missed) }, { keep: 0 }); } catch {} }, 2000); };
const slim = c => Object.fromEntries(KEEP.filter(k => c[k] != null).map(k => [k, c[k]]));
const FRONT_ONLY = new Set(['transform', 'modal_dfc', 'flip', 'adventure', 'meld', 'reversible_card', 'prepare']);
const forgeName = c => (FRONT_ONLY.has(c.layout) && c.card_faces ? c.card_faces[0].name : c.name);
// Names are keyed without case or accents: decklists write "Dain's Company" for Dáin's Company.
const nk = n => String(n).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
const findCard = n => scry.get(nk(n)) ?? scry.get(nk(n.split(' // ')[0]));
async function scryfall(names) {
  const need = [...new Set(names.map(nk))].filter(n => !scry.has(n));
  for (let i = 0; i < need.length; i += 75) {
    let r;
    // 429 means slow down: wait (Scryfall's Retry-After if it gives one) and try again, four times at most
    for (let t = 0; t < 5; t++) {
      r = await fetch('https://api.scryfall.com/cards/collection', {
        method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json', 'User-Agent': 'sim.starshard.net' },
        body: JSON.stringify({ identifiers: need.slice(i, i + 75).map(n => ({ name: n.split(' // ')[0] })) }),
      });
      if (r.status !== 429) break;
      await new Promise(ok => setTimeout(ok, (+r.headers.get('retry-after') || 2 ** t) * 1000));
    }
    if (!r.ok) throw new Error(`Scryfall answered ${r.status}`);
    const j = await r.json();
    const keep = c0 => { const c = slim(c0); [c.name, c.card_faces?.[0]?.name, forgeName(c)].filter(Boolean).forEach(k => scry.set(nk(k), c)); return c; };
    (j.data || []).forEach(keep);
    // an exact miss is often a spelling variant (accents, punctuation): one fuzzy try each
    for (const nf of j.not_found || []) {
      const want = nk(nf.name);
      await new Promise(ok => setTimeout(ok, 100));
      const f = await fetch('https://api.scryfall.com/cards/named?fuzzy=' + encodeURIComponent(nf.name), { headers: { Accept: 'application/json', 'User-Agent': 'sim.starshard.net' } }).catch(() => null);
      if (f && f.ok) { const c = keep(await f.json()); scry.set(want, c); } else { scry.set(want, null); missed.set(want, Date.now()); }
    }
    persist();
    await new Promise(ok => setTimeout(ok, 100)); // Scryfall asks for ~10 requests a second at most
  }
  return findCard;
}
const COLORS = ['W', 'U', 'B', 'R', 'G'];
const isLand = c => /\bLand\b/.test((c?.type_line || '').split('//')[0]);
const costOf = c => c ? (c.mana_cost ?? c.card_faces?.[0]?.mana_cost ?? '') : '';
// The card a deck is "about": the commander, else the most-played nonland, heaviest first.
function coverOf(deck, find) {
  if (deck.commander?.length) return deck.commander[0].name;
  const spells = deck.main.filter(c => !isLand(find(c.name)));
  spells.sort((a, b) => b.qty - a.qty || (find(b.name)?.cmc || 0) - (find(a.name)?.cmc || 0));
  return (spells[0] || deck.main[0])?.name || '';
}
function colorsOf(deck, find) {
  const set = new Set();
  for (const c of [...deck.main, ...(deck.commander || [])]) { const k = find(c.name); if (k && !isLand(k)) (k.colors || k.card_faces?.[0]?.colors || []).forEach(x => set.add(x)); }
  return COLORS.filter(x => set.has(x));
}
// Narrowest constructed format every card is legal in; commander decks are commander.
function formatOf(deck, find) {
  if (deck.commander?.length) return 'commander';
  const all = [...deck.main, ...(deck.side || [])].map(c => find(c.name)).filter(Boolean);
  return ['standard', 'pioneer', 'modern', 'legacy', 'vintage'].find(f => all.every(k => ['legal', 'restricted'].includes(k.legalities?.[f]))) || 'casual';
}
// Validate a list against Scryfall, convert names to Forge's front-face spelling,
// and return the rows the Deck tab shows. Unknown names stay in the list, flagged.
async function describeDeck(deck) {
  const all = [...deck.main, ...(deck.side || []), ...(deck.commander || [])];
  const find = await scryfall(all.map(c => c.name));
  const row = (c, section) => {
    const k = find(c.name);
    const type = (k?.card_faces?.[0]?.type_line || k?.type_line || '');
    return { qty: c.qty, name: k ? forgeName(k) : c.name, section, cost: costOf(k), land: isLand(k), cmc: k?.cmc || 0, arena: k ? (k.games || []).includes('arena') : false, status: k ? 'ok' : 'unknown', legend: /\bLegendary\b/.test(type) && /\b(Creature|Planeswalker)\b/.test(type) };
  };
  const rows = [...deck.main.map(c => row(c, 'main')), ...(deck.side || []).map(c => row(c, 'side')), ...(deck.commander || []).map(c => row(c, 'commander'))];
  const list = { main: rows.filter(r => r.section === 'main').map(({ qty, name }) => ({ qty, name })), side: rows.filter(r => r.section === 'side').map(({ qty, name }) => ({ qty, name })), commander: rows.filter(r => r.section === 'commander').map(({ qty, name }) => ({ qty, name })) };
  return { list, rows, format: formatOf(deck, find), coverCard: coverOf(list, find), colors: colorsOf(list, find), style: styleOf('', list, find) };
}
// What a list is built to do, as far as Forge's AI is concerned. The AI plays
// creatures on curve and attacks well; it holds counterspells, plays at instant
// speed and assembles combos badly, so a matchup against a deck built that way
// says more about the AI than about the deck. Counted from the main deck only.
function statsOf(deck, find) {
  let spells = 0, creatures = 0, counters = 0, instants = 0;
  for (const c of deck.main) {
    const k = find(c.name); if (!k || isLand(k)) continue;
    const face = k.card_faces?.[0] || k, type = face.type_line || k.type_line || '';
    const text = [k.oracle_text, ...(k.card_faces || []).map(f => f.oracle_text)].filter(Boolean).join('\n');
    spells += c.qty;
    if (/\bCreature\b/.test(type)) creatures += c.qty;
    if (/counter target (?:\w+ )*spell/i.test(text)) counters += c.qty;
    if (/\bInstant\b/.test(type) || /\bFlash\b/.test(text)) instants += c.qty;
  }
  return { spells, creatures, counters, instants };
}
function styleOf(name, deck, find) {
  const s = statsOf(deck, find);
  if (/\bcombo\b/i.test(name)) return { kind: 'combo', why: 'a combo deck' };
  if (/\bcontrol\b/i.test(name)) return { kind: 'control', why: 'a control deck' };
  if (s.spells && s.counters >= 6) return { kind: 'control', why: s.counters + ' counterspells' };
  if (s.spells && s.creatures <= 8 && s.instants >= s.spells / 2) return { kind: 'control', why: 'mostly instants, ' + s.creatures + ' creatures' };
  return null;
}
// Cover card + colours for an opponent's list, best effort.
async function faceOf(deck, name) {
  try { const find = await scryfall([...deck.main, ...(deck.commander || [])].map(c => c.name)); return { coverCard: coverOf(deck, find), colors: colorsOf(deck, find), style: styleOf(name || '', deck, find) }; }
  catch { return { coverCard: deck.commander?.[0]?.name || deck.main[0]?.name || '', colors: [] }; }
}

// Raw Scryfall cards for a set of names (for the Codex): a lookup function, or null per unknown name.
async function cards(names) { await scryfall(names); return findCard; }

module.exports = { cards, isLand, forgeName, describeDeck, faceOf, parseList, goldfishMeta, goldfishDeck, top8Meta, top8Deck, edhrecMeta, edhrecDeck, importUrl, GOLDFISH_FORMATS, TOP8_FORMATS };
