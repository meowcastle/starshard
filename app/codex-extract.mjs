#!/usr/bin/env node
// codex-extract.mjs: the codex's rows, gathered from the corpus (SS9, 2 Nov 2026).
//
// The codex is a generator, not hand prose: every line a visitor reads on /codex and on a
// station page traces to a row in one of these files, and this script is where the tracing
// happens. It writes app/src/codex.json, one record per station, and each record carries a
// `trace` map naming the source row of every field.
//
//   stations.js                 epithet, slug, kanji, range, stars, the Arabic and Chinese glosses
//   research/mansions-table.json  the Indian and Chinese rows (name, deity, symbol, quadrant, animal)
//   research/corpus-mansions.md   the Japanese star-name and the guardian (the metadata line under
//                                 each heading), the match flags (its "sixteen match flags" table),
//                                 the alignment note for stations 22 to 28
//   reading-copy.js             MANSION.nn.{claim,synthesis,election,archetype,keyword} (the
//                                 place itself) and STATION.nn.{strike,facing} (born under it)
//   the shipped game            the card table: the two faces (its `pool`) and the signature
//                                 (its `ABS`: the text, the verb, when it fires)
//   walker-sheet.js             the walkers of the house: name, figure, the line on the way in
//   app/src/station-poems.json  the game's line of observation (game-extract.mjs)
//
// Run from the repo root when any of those change: node app/codex-extract.mjs
// The build never reads the game file; it imports codex.json.
import { readFileSync, writeFileSync } from 'node:fs';
import { createContext, runInContext } from 'node:vm';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');
const GAME = join(root, 'Star Shard v3 Build Plan', 'Manzil - Game Prototype V2.dc.html');

const { STATIONS } = await import(pathToFileURL(join(root, 'stations.js')).href);
const { COPY } = await import(pathToFileURL(join(root, 'reading-copy.js')).href);
const { WALKERS } = await import(pathToFileURL(join(root, 'walker-sheet.js')).href);
const table = JSON.parse(readFileSync(join(root, 'research', 'mansions-table.json'), 'utf8'));
const corpus = readFileSync(join(root, 'research', 'corpus-mansions.md'), 'utf8');
const poems = JSON.parse(readFileSync(join(here, 'src', 'station-poems.json'), 'utf8'));
const game = readFileSync(GAME, 'utf8');

const nn = n => String(n).padStart(2, '0');
const SIGNS = { Ari: 'Aries', Tau: 'Taurus', Gem: 'Gemini', Can: 'Cancer', Vir: 'Virgo', Lib: 'Libra', Sco: 'Scorpio', Sag: 'Sagittarius', Cap: 'Capricorn', Aqu: 'Aquarius', Pis: 'Pisces' };
const byId = new Map(table.map(r => [r.id, r]));

// ── the corpus's metadata line under each heading ──────────────────────────────────────
// "*8°34′–21°26′ Taurus · Aldebaran + the Hyades · Arabia al-Dabarān · Rohiṇī, deity Brahmā,
// symbol the chariot · 畢 Bì · Japan あめふりぼし Amefuri-boshi · guardian: the crow · White Tiger*"
const meta = {};
for (const m of corpus.matchAll(/^## MANSION\.(\d\d) — (.+?)\n\n\*(.+?)\*\n/gms)) {
  const parts = m[3].split(/\s+/).join(' ').split(' · ');
  const japan = parts.find(p => p.startsWith('Japan '));
  const guardian = parts.find(p => p.startsWith('guardian: '));
  const india = parts.find(p => p.startsWith('India — '));
  meta[Number(m[1])] = {
    range: parts[0],
    stars: parts[1],
    japan: japan ? japan.slice('Japan '.length) : null,
    guardian: guardian ? guardian.slice('guardian: '.length) : null,
    indiaNote: india ? india.slice('India — '.length) : null,
    line: m[3].split(/\s+/).join(' '),
  };
}
if (Object.keys(meta).length !== 28) throw new Error(`${Object.keys(meta).length} metadata lines in corpus-mansions.md, wanted 28`);

// ── the match flags: the corpus's table resolves the sixteen nulls stations.js shipped ──
const flags = {};
const flagBlock = corpus.slice(corpus.indexOf('## The sixteen match flags'), corpus.indexOf('## Escalation'));
for (const m of flagBlock.matchAll(/^\| (\d+) \| [^|]+ \| \**(STRONG|PARTIAL|DIVERGENT)\** \| ([^|]+) \|$/gm)) flags[Number(m[1])] = { flag: m[2], why: m[3].trim() };
const FLAG_TEST = {};
for (const m of flagBlock.matchAll(/^\| \*\*(STRONG|PARTIAL|DIVERGENT)\*\* \| ([^|]+) \|$/gm)) FLAG_TEST[m[1]] = m[2].trim();
if (Object.keys(FLAG_TEST).length !== 3) throw new Error('the match-flag tests were not found in corpus-mansions.md');

// the alignment note the corpus says must be stated rather than assumed (its own words)
const alignNote = (() => {
  const i = corpus.indexOf('**One alignment note, and it is load-bearing.**');
  const j = corpus.indexOf('\n\n', i);
  return corpus.slice(i, j).split(/\s+/).join(' ').replace(/\*\*/g, '').replace(/^One alignment note, and it is load-bearing\.\s*/, '');
})();

// ── the card table, from the game: `pool` (epithet, left face, right face) and `ABS` ──
const poolSrc = /const pool = (\[\[[\s\S]*?\]\]);/.exec(game);
if (!poolSrc) throw new Error('no card pool in the game file');
const pool = runInContext(poolSrc[1], createContext({}));
if (pool.length !== 28) throw new Error(`${pool.length} cards in the pool, wanted 28`);
const absSrc = /const ABS = (\{[\s\S]*?\n {4}\});/.exec(game);
if (!absSrc) throw new Error('no ABS table in the game file');
const ABS = runInContext(`(${absSrc[1]})`, createContext({}));
if (Object.keys(ABS).length !== 28) throw new Error(`${Object.keys(ABS).length} signatures, wanted 28`);

const copy = (key) => { const c = COPY[key]; if (!c) throw new Error(`reading-copy.js has no ${key}`); return c.text; };
const gloss = s => { const m = /"([^"]+)"/.exec(s || ''); return m ? m[1] : null; };

const out = [];
for (const s of STATIONS) {
  const n = s.station + 1, id = nn(n);
  const row = byId.get(n);
  const md = meta[n];
  const arabia = s.crossCultural.find(x => x.sky === 'Arabia');
  const china = s.crossCultural.find(x => x.sky === 'China');
  if (pool[n - 1][0] !== s.epithet) throw new Error(`card ${n} is ${pool[n - 1][0]}, station is ${s.epithet}`);
  const flag = flags[n]?.flag || s.match;
  if (!flag) throw new Error(`no match flag for station ${n}`);
  const walkers = (WALKERS[n] || []).map(w => ({ name: w.name, fig: w.fig, them: w.them, in: w.in }));
  out.push({
    n, epithet: s.epithet, slug: s.slug, kanji: s.kanji,
    // the range as the home and tonight write it (the dash becomes "to"); stations.js abbreviates
    // one sign name ("8°34′ Tau"), written out here as the corpus writes it
    position: s.position.replace(/\s[–—-]\s/g, ' to ').replace(/\b(Ari|Tau|Gem|Can|Leo|Vir|Lib|Sco|Sag|Cap|Aqu|Pis)\b(?!\w)/g, a => SIGNS[a] || a),
    stars: s.stars,
    keyword: copy(`MANSION.${id}.keyword`),
    poem: poems[n - 1],
    skies: {
      arabia: { name: arabia?.name || row.translit_scholarly, meaning: arabia?.meaning || row.meaning_en },
      india: row.nakshatra ? { name: row.nakshatra.name, deity: row.nakshatra.deity, symbol: row.nakshatra.symbol } : { name: null, note: md.indiaNote },
      china: { name: `${row.xiu.char} ${row.xiu.pinyin}`, gloss: gloss(china?.meaning), quadrant: row.xiu.quadrant, animal: row.xiu.animal },
      japan: { name: md.japan, kanji: row.sukuyo_kanji || null },
    },
    guardian: md.guardian,
    match: { flag, test: FLAG_TEST[flag], why: flags[n]?.why || null },
    claim: copy(`MANSION.${id}.claim`),
    synthesis: copy(`MANSION.${id}.synthesis`),
    election: copy(`MANSION.${id}.election`),
    archetype: copy(`MANSION.${id}.archetype`),
    born: { strike: copy(`STATION.${id}.strike`), facing: copy(`STATION.${id}.facing`) },
    card: { left: pool[n - 1][1], right: pool[n - 1][2], ab: ABS[n].ab, text: ABS[n].abText, verb: ABS[n].verb, fires: ABS[n].fires },
    walkers,
    alignNote: n >= 22 ? alignNote : null,
    trace: {
      epithet: `stations.js[${s.station}].epithet`, position: `stations.js[${s.station}].position`, stars: `stations.js[${s.station}].stars`, kanji: `stations.js[${s.station}].kanji`,
      keyword: `reading-copy.js MANSION.${id}.keyword`, poem: `the game's _mPoem[${n - 1}] (station-poems.json)`,
      'skies.arabia': `stations.js[${s.station}].crossCultural Arabia`, 'skies.india': `mansions-table.json id ${n} nakshatra`, 'skies.china': `mansions-table.json id ${n} xiu; the gloss from stations.js crossCultural China`, 'skies.japan': `corpus-mansions.md MANSION.${id} metadata line`,
      guardian: `corpus-mansions.md MANSION.${id} metadata line`, match: flags[n] ? `corpus-mansions.md, the sixteen match flags, row ${n}` : `stations.js[${s.station}].match`,
      claim: `reading-copy.js MANSION.${id}.claim`, synthesis: `reading-copy.js MANSION.${id}.synthesis`, election: `reading-copy.js MANSION.${id}.election`, archetype: `reading-copy.js MANSION.${id}.archetype`,
      born: `reading-copy.js STATION.${id}.strike, STATION.${id}.facing`,
      card: `the game's pool[${n - 1}] and ABS[${n}]`, walkers: `walker-sheet.js WALKERS[${n}]`, alignNote: n >= 22 ? 'corpus-mansions.md, "One alignment note"' : null,
    },
  });
}
writeFileSync(join(here, 'src', 'codex.json'), JSON.stringify(out, null, 1) + '\n');
// the index the codex page and the ring read without the whole corpus: number, epithet, slug,
// range, keyword, kanji, stars (the full record loads on demand with the station page)
writeFileSync(join(here, 'src', 'codex-index.json'), JSON.stringify(out.map(s => ({ n: s.n, epithet: s.epithet, slug: s.slug, position: s.position, keyword: s.keyword, kanji: s.kanji, stars: s.stars })), null, 1) + '\n');
const bytes = readFileSync(join(here, 'src', 'codex.json')).length;
console.log(`codex.json: ${out.length} stations, ${out.reduce((a, s) => a + s.walkers.length, 0)} walkers, flags ${['STRONG', 'PARTIAL', 'DIVERGENT'].map(f => `${out.filter(s => s.match.flag === f).length} ${f}`).join(' · ')}, ${(bytes / 1024).toFixed(1)} KB`);
