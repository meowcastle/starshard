// Real match results, for calibrating what Forge's AI says against what people do.
//
// Source: Jiliac/MTGODecklistCache on GitHub, an open, actively kept archive of
// paper tournaments (Melee: RCQs, SCG events, store championships; topdeck.gg)
// with every decklist and every round's result. Two GitHub API calls per source
// list the year's files; the files themselves come from raw.githubusercontent,
// which has no API rate limit. Results are cached on disk, so a restart or a
// GitHub outage costs nothing but freshness.
//
// Each real deck is filed under the nearest deck in the field we were handed
// (the MTGGoldfish lists the run plays against), by overlap of main-deck
// nonland cards. Decks near nothing are "other" and only count toward volume.
const fs = require('fs');
const config = require('./config');
const path = require('path');

const REPO = 'Jiliac/MTGODecklistCache';
const SOURCES = ['melee.gg', 'topdeck.gg'];
const UA = { 'User-Agent': 'sim.starshard.net', Accept: 'application/vnd.github+json' };
const DAY = 864e5;

const cacheDir = () => path.join(config.DATA_DIR, 'realdata');
const readJson = (f, d) => { try { return JSON.parse(fs.readFileSync(f, 'utf8')); } catch { return d; } };

async function gh(url) {
  const r = await fetch(url, { headers: config.GITHUB_TOKEN ? { ...UA, Authorization: 'Bearer ' + config.GITHUB_TOKEN } : UA });
  if (!r.ok) throw new Error(`GitHub answered ${r.status} for ${url.replace(/^https:\/\/[^/]+/, '')}`);
  return r.json();
}

// Paths of every tournament file for a source and year, cached for six hours.
async function listYear(source, year) {
  const f = path.join(cacheDir(), `list-${source}-${year}.json`);
  const c = readJson(f, null);
  if (c && Date.now() - c.at < 6 * 3600e3) return c.paths;
  try {
    const dir = await gh(`https://api.github.com/repos/${REPO}/contents/Tournaments/${source}`);
    const y = dir.find(x => x.name === String(year)); if (!y) return [];
    const tree = await gh(`https://api.github.com/repos/${REPO}/git/trees/${y.sha}?recursive=1`);
    const paths = tree.tree.filter(x => x.type === 'blob' && x.path.endsWith('.json')).map(x => `Tournaments/${source}/${year}/${x.path}`);
    fs.mkdirSync(cacheDir(), { recursive: true }); fs.writeFileSync(f, JSON.stringify({ at: Date.now(), paths }));
    return paths;
  } catch (e) { if (c) return c.paths; throw e; }
}

const dateOf = p => { const m = p.match(/\/(\d{4})\/(\d{2})\/(\d{2})\//); return m ? Date.UTC(+m[1], m[2] - 1, +m[3]) : 0; };

// One tournament, reduced to what calibration and the sideboard audit need, cached
// forever (they don't change). v2 keeps sideboards; an older cache entry is fetched again.
async function event(p) {
  const f = path.join(cacheDir(), 'events', p.replace(/[^\w.-]+/g, '_'));
  const c = readJson(f, null); if (c && c.v === 2) return c;
  const r = await fetch(`https://raw.githubusercontent.com/${REPO}/master/${p.split('/').map(encodeURIComponent).join('/')}`, { headers: { 'User-Agent': UA['User-Agent'] } });
  if (!r.ok) throw new Error(`raw ${r.status}`);
  const e = await r.json();
  const out = { v: 2,
    name: e.Tournament?.Name, date: e.Tournament?.Date, uri: e.Tournament?.Uri, format: e.Tournament?.Formats || '',
    decks: (e.Decks || []).map(d => ({ player: d.Player, main: (d.Mainboard || []).map(c => ({ qty: c.Count, name: c.CardName })), side: (d.Sideboard || []).map(c => ({ qty: c.Count, name: c.CardName })) })),
    matches: (e.Rounds || []).flatMap(r => (r.Matches || []).map(m => ({ a: m.Player1, b: m.Player2, r: m.Result }))),
  };
  fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, JSON.stringify(out));
  return out;
}

// MTGO's own results (www.mtgo.com/decklist/<event>): each Challenge page embeds its data as
// window.MTGO.decklists.data, with the published decklists, each published player's Swiss
// match record (winloss) and the top-8 bracket as real head-to-head matches. Only the top 32
// are published, so a record is a fair sample of an archetype only when every player in the
// event was published (complete); otherwise the published players are the ones who did well
// (a 61-player event's top 32 went 63% together). Brackets count from every event: whoever
// reached the top 8, the matches between them are real results. Leagues publish only 5-0
// decks and are left out. Fetched one page at a time with a pause; each event cached forever.
const MTGO = 'https://www.mtgo.com';
const sleep = ms => new Promise(r => setTimeout(r, ms));
async function mtgoMonth(y, m) {
  const f = path.join(cacheDir(), `mtgo-${y}-${String(m).padStart(2, '0')}.json`);
  const c = readJson(f, null), old = y * 12 + m < new Date().getUTCFullYear() * 12 + new Date().getUTCMonth() + 1;
  if (c && (old || Date.now() - c.at < 6 * 3600e3)) return c.urls;
  const r = await fetch(`${MTGO}/decklists/${y}/${String(m).padStart(2, '0')}`, { headers: { 'User-Agent': UA['User-Agent'] } });
  if (!r.ok) { if (c) return c.urls; throw new Error(`mtgo.com answered ${r.status}`); }
  const urls = [...new Set([...(await r.text()).matchAll(/href="(\/decklist\/[^"]+)"/g)].map(x => x[1]))];
  fs.mkdirSync(cacheDir(), { recursive: true }); fs.writeFileSync(f, JSON.stringify({ at: Date.now(), urls }));
  return urls;
}
async function mtgoEvent(u) {
  const f = path.join(cacheDir(), 'mtgo', u.replace(/[^\w.-]+/g, '_') + '.json');
  const c = readJson(f, null); if (c) return c;
  await sleep(1500);
  const r = await fetch(MTGO + u, { headers: { 'User-Agent': UA['User-Agent'] } });
  if (!r.ok) throw new Error(`mtgo.com answered ${r.status}`);
  const m = (await r.text()).match(/window\.MTGO\.decklists\.data\s*=\s*(\{[\s\S]*?\});\s*\n/);
  if (!m) throw new Error('no data on ' + u);
  const d = JSON.parse(m[1]);
  const cards = l => (l || []).map(x => ({ qty: +x.qty, name: x.card_attributes?.card_name || '' })).filter(x => x.name);
  const byId = new Map((d.decklists || []).map(x => [String(x.loginid), x.player]));
  const players = +(d.player_count?.players || d.player_count || 0);
  const out = { v: 2, source: 'mtgo.com', name: d.description, date: String(d.starttime || '').slice(0, 10), uri: MTGO + u, format: d.format || '',
    complete: !!players && (d.decklists || []).length >= players,
    decks: (d.decklists || []).map(x => ({ player: x.player, main: cards(x.main_deck), side: cards(x.sideboard_deck) })),
    records: (d.winloss || []).map(x => ({ player: byId.get(String(x.loginid)), w: +x.wins, l: +x.losses })).filter(x => x.player),
    matches: (d.brackets || []).flatMap(b => (b.matches || []).map(mm => { const [a, bb] = mm.players || []; return a && bb ? { a: a.player, b: bb.player, r: `${a.wins}-${a.losses}-0` } : null; }).filter(Boolean)) };
  fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, JSON.stringify(out));
  return out;
}
async function mtgoEvents(format, days) {
  const since = Date.now() - days * DAY, out = [], months = [];
  for (let t = new Date(since); t <= new Date(); t = new Date(Date.UTC(t.getUTCFullYear(), t.getUTCMonth() + 1, 1))) months.push([t.getUTCFullYear(), t.getUTCMonth() + 1]);
  const want = new RegExp(`^/decklist/${format.toLowerCase()}-(?!league)`);
  for (const [y, m] of months) {
    let urls; try { urls = await mtgoMonth(y, m); } catch { continue; }
    for (const u of urls.filter(u => want.test(u))) {
      const dm = u.match(/(\d{4})-(\d{2})-(\d{2})/); if (dm && Date.UTC(+dm[1], dm[2] - 1, +dm[3]) < since) continue;
      try { out.push(await mtgoEvent(u)); } catch {}
    }
  }
  return out;
}

// Every event in a format over the last `days`, newest first.
async function events(format, days = 42) {
  const since = Date.now() - days * DAY, out = [];
  const years = [...new Set([new Date().getUTCFullYear(), new Date(since).getUTCFullYear()])];
  const want = new RegExp(`(^|[^a-z])${format.toLowerCase()}([^a-z]|$)`);
  for (const s of SOURCES) for (const y of years) {
    let paths; try { paths = await listYear(s, y); } catch { continue; }
    // the file name carries the event name, so most of the filtering is free
    paths = paths.filter(p => dateOf(p) >= since && want.test(p.toLowerCase()));
    for (const p of paths) {
      // MTGO events come from mtgo.com itself (below); Jiliac's copies of them would count twice
      try { const e = await event(p); if (e.format.toLowerCase().includes(format.toLowerCase()) && e.matches.length && !/mtgo\.com/i.test(e.uri || '')) out.push(e); } catch {}
    }
  }
  try { out.push(...await mtgoEvents(format, days)); } catch {}
  return out.sort((a, b) => String(b.date).localeCompare(String(a.date)));
}

// Weighted overlap of two main decks, nonland cards only: sum of min / sum of max. Names are
// compared front face only and without accents, since sources spell two-part cards and
// accented names differently ("Unholy Annex/Ritual Chamber", "Dain's Company").
const BASICS = /^(plains|island|swamp|mountain|forest|wastes)$/i;
function vec(main, isLand) {
  const m = new Map();
  for (const c of main) { const k = c.name.split(/\s*\/\/?\s*/)[0].normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase(); if (BASICS.test(k) || (isLand && isLand(k))) continue; m.set(k, (m.get(k) || 0) + c.qty); }
  return m;
}
function overlap(a, b) {
  let lo = 0, hi = 0;
  for (const k of new Set([...a.keys(), ...b.keys()])) { const x = a.get(k) || 0, y = b.get(k) || 0; lo += Math.min(x, y); hi += Math.max(x, y); }
  return hi ? lo / hi : 0;
}
const MATCH_AT = 0.3; // below this a real deck is "other". Checked by hand on six weeks of Standard RCQs: scores split at 0.3, and decks at 0.3-0.4 are their archetype built differently

// Real results among the field's archetypes: pairs[a][b] = { games: [won, lost], matches: [won, lost, drawn] }
// from a's side, plus how many real decks each archetype had and how many fell in "other".
async function matrix(field, format, { days = 42, isLand } = {}) {
  const fv = field.map(d => vec(d.main, isLand));
  const evs = await events(format, days);
  const pairs = {}, seen = Object.fromEntries(field.map(d => [d.name, 0])), vsField = {};
  let decks = 0, other = 0, matches = 0;
  const add = (a, b, gw, gl, mw, ml, md) => {
    const p = (pairs[a] = pairs[a] || {})[b] = pairs[a][b] || { games: [0, 0], matches: [0, 0, 0] };
    p.games[0] += gw; p.games[1] += gl; p.matches[0] += mw; p.matches[1] += ml; p.matches[2] += md;
  };
  for (const e of evs) {
    const arch = new Map();
    for (const d of e.decks) {
      decks++;
      const v = vec(d.main, isLand); let best = -1, bi = -1;
      fv.forEach((f, i) => { const s = overlap(v, f); if (s > best) { best = s; bi = i; } });
      if (best >= MATCH_AT) { arch.set(d.player, field[bi].name); seen[field[bi].name]++; } else other++;
    }
    // MTGO events with every player published: each archetype's match record against the whole field
    if (e.complete) for (const r of e.records || []) { const A = arch.get(r.player); if (!A) continue; const x = vsField[A] = vsField[A] || { w: 0, l: 0, events: new Set() }; x.w += r.w; x.l += r.l; x.events.add(e.uri); }
    for (const m of e.matches) {
      const A = arch.get(m.a), B = arch.get(m.b); if (!A || !B || !m.b) continue;
      const [w, l, dr] = String(m.r).split('-').map(Number); if (!(w + l)) continue;
      matches++;
      const mw = w > l ? 1 : 0, ml = l > w ? 1 : 0, md = w === l ? 1 : 0;
      add(A, B, w, l, mw, ml, md); add(B, A, l, w, ml, mw, md); // a mirror lands on both sides of its own cell, so it reads 50%
    }
  }
  const complete = evs.filter(e => e.complete).length, mtgo = evs.filter(e => e.source === 'mtgo.com').length;
  return { pairs, seen, decks, other, matches, events: evs.length, mtgoEvents: mtgo, completeEvents: complete, days, sources: [...SOURCES, 'mtgo.com'], newest: evs[0]?.date || null,
    vsField: Object.fromEntries(Object.entries(vsField).map(([a, x]) => [a, { w: x.w, l: x.l, events: x.events.size }])) };
}

// What real pilots of each archetype carry in their sideboards: per archetype, how many
// real decks were filed under it and, per card, how many of them carry it and how many
// copies in all. The files hold each player's 75, not what came in for a given match, so
// this says what an archetype's pilots bring to the event, not what they board per matchup.
async function sideboards(field, format, { days = 42, isLand } = {}) {
  const fv = field.map(d => vec(d.main, isLand)), out = Object.fromEntries(field.map(d => [d.name, { pilots: 0, cards: {} }]));
  for (const e of await events(format, days)) for (const d of e.decks) {
    const v = vec(d.main, isLand); let best = -1, bi = -1;
    fv.forEach((f, i) => { const s = overlap(v, f); if (s > best) { best = s; bi = i; } });
    if (best < MATCH_AT || !d.side) continue;
    const a = out[field[bi].name]; a.pilots++;
    const here = new Map(); for (const c of d.side) here.set(c.name, (here.get(c.name) || 0) + c.qty);
    for (const [n, q] of here) { const x = a.cards[n] = a.cards[n] || { decks: 0, copies: 0 }; x.decks++; x.copies += q; }
  }
  return out;
}

// What real pilots of each archetype play in the main deck (the brew check's norms, shell.js): per archetype,
// the real lists filed under it (main decks only, newest first, 200 at most).
async function mains(field, format, { days = 42, isLand } = {}) {
  const fv = field.map(d => vec(d.main, isLand)), out = Object.fromEntries(field.map(d => [d.name, { pilots: 0, lists: [] }]));
  for (const e of await events(format, days)) for (const d of e.decks) {
    if (!d.main || !d.main.length) continue;
    const v = vec(d.main, isLand); let best = -1, bi = -1;
    fv.forEach((f, i) => { const s = overlap(v, f); if (s > best) { best = s; bi = i; } });
    if (best < MATCH_AT) continue;
    const a = out[field[bi].name]; a.pilots++; if (a.lists.length < 200) a.lists.push(d.main.map(c => ({ qty: c.qty, name: c.name })));
  }
  return out;
}

module.exports = { matrix, events, sideboards, mains, overlap, vec, MATCH_AT };
