// The Codex: a reference that only knows what the sim has seen. Entries exist for
// every nonland card in a member's brew or in the field the sim plays against,
// every archetype in that field, the hand-written terms, and the characters on
// legendary cards. Nothing is stored that can be derived: the index is rebuilt
// from brews + field on request, card facts come from Scryfall, usage and records
// from the lists and runs. What IS stored (data/codex.json) is what costs a model
// call to make (a card's plain-English read, an archetype's plan, a character's
// summary) and members' notes.
//
// Model-written parts are made on first view and come back `pending` until done;
// the page asks again. An archetype's text is keyed by its list, so a new week's
// list is written fresh and an unchanged one is not.
const fs = require('fs');
const { writeJson, readJson } = require('./store');
const path = require('path');
const crypto = require('crypto');
const meta = require('./meta');
const claude = require('./claude');
const TERMS = require('./terms');

const FILE = () => path.join(process.env.DATA_DIR || '/data', 'codex.json');
let store = null;
const load = () => { if (!store) { store = readJson(FILE(), {}); store.gen = store.gen || {}; store.notes = store.notes || {}; } return store; };
const save = () => writeJson(FILE(), store);

const slug = s => String(s).toLowerCase().normalize('NFKD').replace(/[^\w\s-]/g, '').trim().replace(/[\s_]+/g, '-');
const faceOf = k => k?.card_faces?.[0] || k || {};
const artOf = (k, size = 'art_crop') => (k?.image_uris || faceOf(k).image_uris || {})[size] || '';
const colorsOf = k => k?.colors || faceOf(k).colors || [];
const oracleOf = k => k ? (k.card_faces ? k.card_faces.map(f => (k.card_faces.length > 1 ? f.name + '\n' : '') + (f.oracle_text || '')).join('\n\n') : k.oracle_text || '') : '';
const typeOf = k => { const f = faceOf(k), t = f.type_line || k?.type_line || ''; return t + (f.power != null ? ` · ${f.power}/${f.toughness}` : f.loyalty != null ? ` · loyalty ${f.loyalty}` : ''); };
const isLegend = k => /\bLegendary\b/.test(faceOf(k).type_line || '') && /\b(Creature|Planeswalker)\b/.test(faceOf(k).type_line || '');
const charName = name => name.split(' // ')[0].split(',')[0].trim();
const firstLine = s => (String(s).split(/(?<=\.)\s/)[0] || '').slice(0, 140);

// Franchise wikis for Universes Beyond sets; everything else is MTG Wiki.
const WIKI = { fin: 'finalfantasy', fca: 'finalfantasy', tmt: 'tmnt', tla: 'avatar', spm: 'marvel', ltr: 'lotr', pip: 'fallout', who: 'tardis', '40k': 'warhammer40k', acr: 'assassinscreed' };
const wikiOf = k => { const host = WIKI[k?.set] || 'mtg'; return { host: `${host}.fandom.com`, name: host === 'mtg' ? 'MTG Wiki' : k.set_name + ' wiki' }; };

// ---------- the index ----------
// ctx: { brews, field: [{ name, main, side }], shares: { name: pct }, snapshot, me }
async function build(ctx) {
  const lists = [...ctx.brews.map(b => b.versions[b.versions.length - 1].list), ...ctx.field];
  const names = [...new Set(lists.flatMap(l => [...(l.main || []), ...(l.side || []), ...(l.commander || [])].map(c => c.name)))];
  const find = await meta.cards(names);
  const cards = new Map(), chars = new Map();
  for (const n of names) {
    const k = find(n); if (!k || meta.isLand(k)) continue;
    const id = 'card:' + slug(meta.forgeName(k)); if (cards.has(id)) continue;
    cards.set(id, { id, kind: 'Card', type: 'card', title: meta.forgeName(k), k });
    if (isLegend(k)) { const c = charName(meta.forgeName(k)), cid = 'char:' + slug(c); const e = chars.get(cid) || { id: cid, kind: 'Character', type: 'char', title: c, cards: [] }; e.cards.push(id); e.k = e.k || k; chars.set(cid, e); }
  }
  const archs = new Map(ctx.field.map(d => ['arch:' + slug(d.name), { id: 'arch:' + slug(d.name), kind: 'Archetype', type: 'arch', title: d.name, list: d }]));
  const archColors = d => [...new Set((d.main || []).flatMap(c => { const k = find(c.name); return k && !meta.isLand(k) ? colorsOf(k) : []; }))];
  for (const a of archs.values()) a.colors = ['W', 'U', 'B', 'R', 'G'].filter(c => archColors(a.list).includes(c));
  return { find, cards, chars, archs };
}

const listItem = (e, ix) => {
  if (e.type === 'card') return { id: e.id, kind: 'card', title: e.title, blurb: typeOf(e.k) + ' · ' + firstLine(oracleOf(e.k)), art: artOf(e.k), colors: colorsOf(e.k) };
  if (e.type === 'arch') { const top = (e.list.main || []).map(c => ix.find(c.name)).find(k => k && !meta.isLand(k)); return { id: e.id, kind: 'deck', title: e.title, blurb: (ix.gen?.[e.id]?.blurb) || 'In this week\'s field.', art: artOf(top), colors: e.colors }; }
  if (e.type === 'char') return { id: e.id, kind: 'character', title: e.title, blurb: 'On ' + e.cards.map(c => ix.cards.get(c).title).join(', '), art: artOf(e.k), colors: colorsOf(e.k) };
  return { id: e.id, kind: 'term', title: e.title, blurb: e.say, art: '', colors: e.colors };
};

async function index(ctx) {
  load();
  const ix = await build(ctx); ix.gen = store.gen;
  const all = [...ix.archs.values(), ...ix.cards.values(), ...ix.chars.values(), ...TERMS.map(t => ({ ...t, type: 'term' }))];
  return { snapshot: ctx.snapshot, entries: all.map(e => listItem(e, ix)) };
}

// ---------- model-written parts, made once ----------
const pending = new Set();
function generate(key, fn) {
  if (store.gen[key] || pending.has(key) || !claude.available()) return;
  pending.add(key);
  fn().then(v => { store.gen[key] = { ...v, at: Date.now() }; save(); })
    .catch(e => { store.gen[key + ':error'] = { error: e.message, at: Date.now() }; console.error('codex', key, e.message); })
    .finally(() => pending.delete(key));
}
const SYSTEM = 'You write the reference entries of a Magic: The Gathering deck-testing tool for a small group of players, some of them new to the game. Plain words, short sentences, no hype. Explain any jargon you use. Be accurate: say nothing about a card or deck that the text given to you does not support.';

function cardPlain(e, usage) {
  return claude.ask({ system: SYSTEM, prompt: `Card: ${e.title}\nType: ${typeOf(e.k)}\nRules text:\n${oracleOf(e.k)}\n\nDecks in this week's field that play it: ${usage.map(u => u.deck + ' (' + u.copies + ', ' + u.where + ')').join('; ') || 'none'}.\n\nWrite what the card does and why a deck plays it, for a newer player: two or three sentences.`,
    tool: { name: 'card_entry', description: 'The plain-English read of a card.', schema: { type: 'object', properties: { plain: { type: 'string' } }, required: ['plain'] } }, maxTokens: 4000 });
}
function archText(e) {
  const list = l => l.map(c => c.qty + ' ' + c.name).join('\n');
  return claude.ask({ system: SYSTEM, prompt: `Archetype: ${e.title}\nMain deck:\n${list(e.list.main)}\nSideboard:\n${list(e.list.side || [])}\n\nDescribe this deck: a one-sentence blurb, how it wins (two or three sentences), how it loses (two or three sentences), and a role of four words or fewer for each of the cards that define it (up to six nonland cards).`,
    tool: { name: 'archetype_entry', description: 'A reference entry for one archetype.', schema: { type: 'object', properties: { blurb: { type: 'string' }, plan: { type: 'string' }, weak: { type: 'string' }, roles: { type: 'array', items: { type: 'object', properties: { name: { type: 'string' }, role: { type: 'string' } }, required: ['name', 'role'] } } }, required: ['blurb', 'plan', 'weak', 'roles'] } } });
}
async function wikiText(host, title) {
  const api = `https://${host}/api.php`;
  const hit = await (await fetch(`${api}?action=query&list=search&srsearch=${encodeURIComponent(title)}&srlimit=1&format=json`, { headers: { 'User-Agent': 'sim.starshard.net' } })).json();
  const page = hit?.query?.search?.[0]?.title; if (!page) return null;
  const p = await (await fetch(`${api}?action=parse&page=${encodeURIComponent(page)}&prop=wikitext&format=json&redirects=1`, { headers: { 'User-Agent': 'sim.starshard.net' } })).json();
  const text = p?.parse?.wikitext?.['*']; if (!text) return null;
  return { page: p.parse.title, url: `https://${host}/wiki/${encodeURIComponent(p.parse.title.replace(/ /g, '_'))}`, text: text.slice(0, 14000) };
}
async function charText(e, cardTitles) {
  const w = wikiOf(e.k);
  let src = await wikiText(w.host, cardTitles[0].split(',')[0].includes(' ') ? cardTitles[0].split(',')[0] : e.title);
  let srcName = w.name;
  if (!src && w.host !== 'mtg.fandom.com') { src = await wikiText('mtg.fandom.com', e.title); srcName = 'MTG Wiki'; }
  if (!src) throw new Error('no wiki page found');
  const out = await claude.ask({ system: SYSTEM + ' Summarise only what the source says; do not add story from memory.', prompt: `Character: ${e.title}, on the card(s) ${cardTitles.join(', ')}.\nSource (${srcName}, "${src.page}", wikitext):\n${src.text}\n\nSummarise who this is for a player who has only seen the card: the world they come from, a one-sentence blurb, and three short sections (heading plus two or three sentences each).`,
    tool: { name: 'character_entry', description: 'A character summary.', schema: { type: 'object', properties: { world: { type: 'string' }, blurb: { type: 'string' }, sections: { type: 'array', items: { type: 'object', properties: { h: { type: 'string' }, p: { type: 'string' } }, required: ['h', 'p'] } } }, required: ['world', 'blurb', 'sections'] } } });
  return { ...out, src: srcName, srcUrl: src.url };
}

// ---------- one entry ----------
// ctx as for index, plus: records(archName) -> [{ brew, note, rec, bad }], real(archName) -> { w, l } | null, myCards: Set of card ids
async function entry(id, ctx) {
  load();
  const ix = await build(ctx);
  const notes = store.notes[id] || [];
  const fieldN = ctx.field.length;
  const usageOf = (title) => ctx.field.map(d => {
    const m = (d.main || []).filter(c => meta.forgeName(ix.find(c.name) || { name: c.name }) === title).reduce((s, c) => s + c.qty, 0);
    const s = (d.side || []).filter(c => meta.forgeName(ix.find(c.name) || { name: c.name }) === title).reduce((s2, c) => s2 + c.qty, 0);
    const q = m || s;
    return q ? { deck: d.name, id: 'arch:' + slug(d.name), copies: q + (q === 1 ? ' copy' : ' copies'), where: m ? 'main' : 'side', share: ctx.shares[d.name] != null ? ctx.shares[d.name].toFixed(1) + '%' : '—' } : null;
  }).filter(Boolean);

  if (id.startsWith('card:')) {
    const e = ix.cards.get(id); if (!e) return null;
    const usage = usageOf(e.title);
    const g = store.gen[id]; if (!g) generate(id, () => cardPlain(e, usage));
    const char = isLegend(e.k) ? 'char:' + slug(charName(e.title)) : null;
    const mine = ctx.brews.filter(b => b.owner === ctx.me && [...b.versions[b.versions.length - 1].list.main, ...(b.versions[b.versions.length - 1].list.side || [])].some(c => meta.forgeName(ix.find(c.name) || { name: c.name }) === e.title));
    return { id, type: 'card', kind: 'Card', title: e.title, set: e.k.set_name, colors: colorsOf(e.k), type_line: typeOf(e.k), oracle: oracleOf(e.k), art: artOf(e.k, 'normal') || artOf(e.k),
      plain: g?.plain || null, pending: !g && claude.available(), lore: char, loreName: char ? charName(e.title) : null,
      usage, usageHead: usage.length ? `${usage.length} of the top ${fieldN} decks run it` : `None of the top ${fieldN} decks run it`,
      simHead: mine.length ? `In ${mine.length === 1 ? 'your ' + mine[0].name : mine.length + ' of your brews'}` : 'Not in your brews',
      simNote: 'Card-by-card results (how a game goes when it is cast, and by which turn) need Forge\'s game logs, which runs do not record yet. Each brew\'s record against the field is on its Results tab.',
      notes };
  }
  if (id.startsWith('arch:')) {
    const e = ix.archs.get(id); if (!e) return null;
    const lk = id + ':' + crypto.createHash('sha1').update(JSON.stringify(e.list.main)).digest('hex').slice(0, 10);
    const g = store.gen[lk]; if (!g) generate(lk, () => archText(e));
    if (g?.blurb) store.gen[id] = { blurb: g.blurb };
    const real = ctx.real(e.title), recs = ctx.records(e.title);
    const top = (e.list.main || []).map(c => ({ ...c, k: ix.find(c.name) })).filter(c => c.k && !meta.isLand(c.k)).sort((a, b) => b.qty - a.qty || (b.k.cmc || 0) - (a.k.cmc || 0)).slice(0, 6);
    const role = n => (g?.roles || []).find(r => r.name.toLowerCase() === n.toLowerCase())?.role || '';
    const bg = top[0] ? artOf(top[0].k) : '';
    return { id, type: 'arch', kind: 'Archetype', title: e.title, colors: e.colors, art: bg, blurb: g?.blurb || '', plan: g?.plan || null, weak: g?.weak || null, pending: !g && claude.available(),
      stats: [
        { k: 'Share of field', v: ctx.shares[e.title] != null ? ctx.shares[e.title].toFixed(1) + '%' : '—', n: `MTGGoldfish · top ${fieldN}` },
        { k: 'Paper win rate', v: real && real.w + real.l ? Math.round(real.w / (real.w + real.l) * 100) + '%' : '—', n: real && real.w + real.l ? `${real.w + real.l} games at RCQs and opens` : 'not enough paper games yet' },
        { k: 'Your record', v: recs[0] ? recs[0].rec : '—', n: recs[0] ? recs[0].brew + ' · ' + recs[0].note : 'no runs against it yet' },
      ],
      cards: top.map(c => ({ qty: c.qty, name: meta.forgeName(c.k), role: role(meta.forgeName(c.k)) || role(c.name), id: 'card:' + slug(meta.forgeName(c.k)) })),
      vs: recs, notes };
  }
  if (id.startsWith('term:')) {
    const t = TERMS.find(x => x.id === id); if (!t) return null;
    const related = [...ix.archs.values()].filter(a => t.match.test(a.title) || (t.colors.length && a.colors.length === t.colors.length && t.colors.every(c => a.colors.includes(c))))
      .map(a => ({ title: a.title, note: ctx.shares[a.title] != null ? ctx.shares[a.title].toFixed(1) + '% of the field' : 'in the field', id: a.id }));
    return { id, type: 'term', kind: 'Term', title: t.title, colors: t.colors, say: t.say, body: t.body, related, notes };
  }
  if (id.startsWith('char:')) {
    const e = ix.chars.get(id); if (!e) return null;
    const titles = e.cards.map(c => ix.cards.get(c).title);
    const g = store.gen[id]; if (!g) generate(id, () => charText(e, titles));
    const err = !g && store.gen[id + ':error'];
    return { id, type: 'char', kind: 'Character', title: e.title, world: g?.world || '', blurb: g?.blurb || (err ? 'No wiki page found for this character yet.' : ''), sections: g?.sections || [], src: g?.src || '', srcUrl: g?.srcUrl || '', art: artOf(e.k, 'normal'),
      pending: !g && !err && claude.available(), cards: e.cards.map(c => ({ name: ix.cards.get(c).title, role: typeOf(ix.cards.get(c).k).split(' · ')[0], id: c })), notes };
  }
  return null;
}

function addNote(id, who, t) {
  load();
  const text = String(t || '').trim().slice(0, 500); if (!text) return null;
  (store.notes[id] = store.notes[id] || []).push({ who, t: text, at: Date.now() }); save();
  return store.notes[id];
}

module.exports = { index, entry, addNote, slug };
