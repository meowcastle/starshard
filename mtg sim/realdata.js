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
const path = require('path');

const REPO = 'Jiliac/MTGODecklistCache';
const SOURCES = ['melee.gg', 'topdeck.gg'];
const UA = { 'User-Agent': 'sim.starshard.net', Accept: 'application/vnd.github+json' };
const DAY = 864e5;

const cacheDir = () => path.join(process.env.DATA_DIR || '/data', 'realdata');
const readJson = (f, d) => { try { return JSON.parse(fs.readFileSync(f, 'utf8')); } catch { return d; } };

async function gh(url) {
  const r = await fetch(url, { headers: process.env.GITHUB_TOKEN ? { ...UA, Authorization: 'Bearer ' + process.env.GITHUB_TOKEN } : UA });
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
      try { const e = await event(p); if (e.format.toLowerCase().includes(format.toLowerCase()) && e.matches.length) out.push(e); } catch {}
    }
  }
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
  const pairs = {}, seen = Object.fromEntries(field.map(d => [d.name, 0]));
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
    for (const m of e.matches) {
      const A = arch.get(m.a), B = arch.get(m.b); if (!A || !B || !m.b) continue;
      const [w, l, dr] = String(m.r).split('-').map(Number); if (!(w + l)) continue;
      matches++;
      const mw = w > l ? 1 : 0, ml = l > w ? 1 : 0, md = w === l ? 1 : 0;
      add(A, B, w, l, mw, ml, md); add(B, A, l, w, ml, mw, md); // a mirror lands on both sides of its own cell, so it reads 50%
    }
  }
  return { pairs, seen, decks, other, matches, events: evs.length, days, sources: SOURCES, newest: evs[0]?.date || null };
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

module.exports = { matrix, events, sideboards, overlap, vec, MATCH_AT };
