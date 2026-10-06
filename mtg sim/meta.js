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
    if (!line) { if (main.length) cur = side; continue; }
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

module.exports = { parseList, goldfishMeta, goldfishDeck, top8Meta, top8Deck, edhrecMeta, edhrecDeck, importUrl, GOLDFISH_FORMATS, TOP8_FORMATS };
