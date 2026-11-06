#!/usr/bin/env node
// noun-ledger.mjs: the vocabulary law, checked by machine.
//
// Usage: node tools/noun-ledger.mjs <file-or-folder> [...] [--words <wordlist>]
//
// Reads HTML, Markdown and JS (string literals only) under the paths given (a
// folder is walked; v2/ is the usual argument), keeps the text a traveler reads,
// and holds every noun it can recognise against the lexicon ledger in
// COSMOLOGY.md section 2 and the budget in WRITING.md "The vocabulary budget".
// Exit code 1 on any finding, 0 when clean. Each finding prints as
// file:line: kind: term: "excerpt". The ledger at the end counts every coined
// term met, with its tier.
//
// Kinds:
//   retired    a noun retired on 14 Aug (lantern, sigil, sounding, the Current,
//              the Lights, the Keepers, the Skies as quadrants, Step as a label)
//              or "mansion", which a traveler never reads (the word is station)
//   unspent    the Moonroad: locked, never surfaced, kept that way until
//              "station" is second nature (COSMOLOGY.md section 2)
//   unlisted   a capitalised term mid-sentence that is neither in the lexicon
//              nor free vocabulary (planets, signs, houses, aspects, phases, the
//              four positions, ordinary proper nouns of the sky): a coined noun
//              nobody ratified. Queue it for Justin; never ship it unlisted.
//   unknown    with --words, a lower-case word that is in neither the wordlist
//              nor the lexicon: a possible lower-case coinage
//
// What it cannot do: the house style writes nearly everything in lower case,
// and without a wordlist a lower-case coinage ("walker", "the cast") looks like
// English to a regular expression. Give it --words /usr/share/dict/words (or any
// one-word-per-line file) and those are reported too. The one-noun-per-surface
// budget is a count a human makes from the ledger printed at the end.

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';

// COSMOLOGY.md section 2, the locked terms, by tier. Case-insensitive match on
// whole words; multi-word terms first so "Star Shard" is not read as "Shard".
const LEXICON = [
  { term: 'Star Shard', tier: 0 }, { term: 'shard', tier: 0 }, { term: 'station', tier: 0 },
  { term: 'the Becoming', tier: 0 },
  { term: 'Seedborn', tier: 0 }, { term: 'Homebound', tier: 0 }, { term: 'Outbound', tier: 0 },
  { term: 'Emberwake', tier: 0 }, { term: 'Farbank', tier: 0 },
  { term: 'Recollection', tier: 1 }, { term: 'the Silverway', tier: 2 }, { term: 'the Great Sowing', tier: 3 },
  // the 28 epithets, the approved slate
  ...['The Gate', 'The Bearer', 'The Gathered Stars', 'The Follower', 'The Blaze', 'The Storm', 'The Return',
    'The Ghost', 'The Glance', 'The Throne', 'The Mane', 'The Turning', 'The Hand', 'The Jewel', 'The Veil',
    'The Claws', 'The Crown', 'The Heart', 'The Root', 'The Flock', 'The Empty District', 'The Listener',
    'The Drum', 'The Void', 'The Hideaway', 'The Chamber', 'The Guide', 'The Thread'].map(term => ({ term, tier: 0, epithet: true })),
];
const UNSPENT = [{ term: 'the Moonroad', why: 'locked but never surfaced: a second new noun on a surface that already spent its one' }];
const RETIRED = [
  { re: /\bmansions?\b/gi, say: 'station' },
  { re: /\b(the )?lanterns?\b/gi, say: 'the moon' },
  { re: /\bsigils?\b/gi, say: 'your chart' },
  { re: /\bsoundings?\b/gi, say: 'tonight' },
  { re: /\b(the|your|a) Currents?\b/g, say: 'nothing: a computed input, not a reading' },
  { re: /\b(the|your) Lights?\b/g, say: "the day's planet" },
  { re: /\b(the|your|a) Keepers?\b/g, say: 'the planet by name' },
  { re: /\b(the|four) Skies\b/g, say: 'this stretch of the road' },
  { re: /\b(the|your|a|each|every) Steps?\b/g, say: 'Entering, Dwelling, Turning or Leaving: the values ship, the label does not' },
];
// Free vocabulary (WRITING.md): shared words with Wikipedia pages, plus the
// ordinary proper nouns a sky page uses. Never a finding.
const FREE = new Set([
  'Sun', 'Moon', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto', 'Earth',
  'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces',
  'Entering', 'Dwelling', 'Turning', 'Leaving',
  'New Moon', 'Full Moon', 'First Quarter', 'Last Quarter', 'Ascendant', 'Descendant', 'Midheaven',
  'Arabic', 'Indian', 'Chinese', 'Japanese', 'Greek', 'Maya', 'Roman', 'Persian', 'Egyptian', 'Babylonian', 'Vedic', 'Hellenistic',
  'Orion', 'Pleiades', 'Sirius', 'Polaris', 'Milky Way', 'Aldebaran', 'Antares', 'Regulus', 'Spica', 'Fomalhaut',
  'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December',
  'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday',
  'Manzil', 'Deck Bench', 'Bjur Media', 'New York', 'Qixi', 'Tanabata', 'Timaeus', 'Plato',
  'UTC', 'GMT', 'EST', 'PST', 'CET', 'OK', 'PDF', 'HTML', 'CSS', 'JS', 'SVG', 'API', 'URL', 'FAQ', 'ID',
  'Justin', 'Claude', 'Python', 'JavaScript', 'React', 'Node', 'Swiss Ephemeris', 'Wikipedia', 'Google', 'Apple', 'Android',
]);

const DROP_BLOCKS = /<(script|style|code|pre)\b[\s\S]*?<\/\1>/gi;

function visibleLines(source, kind) {
  if (kind === 'js') {
    // string literals only: the text a traveler can read out of a script
    const out = source.split('\n').map(() => '');
    const re = /(["'`])((?:\\.|(?!\1)[^\\\n])*)\1/g;
    let m;
    while ((m = re.exec(source)) !== null) {
      const line = source.slice(0, m.index).split('\n').length - 1;
      if (m[2].length > 2 && /[a-z]/i.test(m[2])) out[line] += ' ' + m[2];
    }
    return out;
  }
  let text = source.replace(DROP_BLOCKS, m => m.replace(/[^\n]/g, ''));
  if (kind === 'html') {
    text = text.replace(/<!--[\s\S]*?-->/g, m => m.replace(/[^\n]/g, ''));
    text = text.replace(/<[^>]+>/g, ' ');
    text = text.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ').replace(/&#x27;/g, "'");
  } else {
    text = text.replace(/```[\s\S]*?```/g, m => m.replace(/[^\n]/g, ''));
    text = text.replace(/`[^`\n]*`/g, ' ');
    text = text.replace(/\[([^\]]*)\]\([^)]*\)/g, '$1');   // links keep their text
    text = text.replace(/^#+\s*/gm, '');
  }
  return text.split('\n');
}

function kindOf(file) {
  const ext = extname(file).toLowerCase();
  if (ext === '.html' || ext === '.htm') return 'html';
  if (ext === '.md' || ext === '.txt') return 'md';
  if (['.js', '.mjs', '.cjs', '.jsx', '.ts', '.tsx'].includes(ext)) return 'js';
  return null;
}

function walk(path, out) {
  const st = statSync(path);
  if (st.isDirectory()) {
    for (const name of readdirSync(path)) {
      if (name === 'node_modules' || name === 'dist' || name.startsWith('.') || /^README/i.test(name)) continue;   // a README is an engineer's, not a traveler's
      walk(join(path, name), out);
    }
  } else if (kindOf(path)) out.push(path);
}

// epithets are counted only in their capitalised form: lower-case "the gate" is
// English as often as it is the card, and the ledger is a count, not a gate
const lexRes = LEXICON.map(l => ({ ...l, re: new RegExp('\\b' + l.term.replace(/^the /i, '(?:[Tt]he )?') + 's?\\b', l.epithet ? 'g' : 'gi') }));
const unspentRes = UNSPENT.map(u => ({ ...u, re: new RegExp('\\b' + u.term.replace(/^the /i, '(?:the )?') + 's?\\b', 'gi') }));
// a capitalised run of one to three words, not at the start of a sentence
// a capitalised run of one to three words, mid-sentence, or at the start of a
// line only after a lower-case article (a heading's first word is not a noun)
const CAP = /(^(?=(?:the |your |a |an |tonight's ))|[^.!?:"\n]\s+|\(|["'“‘])((?:the |your |a |an |tonight's )?)([A-Z][a-z]+(?: [A-Z][a-z]+){0,2})\b(?!-)/g;   // Twenty-eight is a number, not a noun

function excerpt(line, idx, len) {
  const s = Math.max(0, idx - 30);
  return line.slice(s, idx + len + 30).trim();
}

function lintFile(file, words) {
  const kind = kindOf(file);
  const lines = visibleLines(readFileSync(file, 'utf8'), kind);
  const findings = []; const ledger = new Map();
  const bump = (term, tier) => ledger.set(term, { tier, n: (ledger.get(term)?.n || 0) + 1 });
  lines.forEach((line, i) => {
    const seen = [];                         // spans already claimed by the lexicon
    for (const l of lexRes) {
      l.re.lastIndex = 0; let m;
      while ((m = l.re.exec(line)) !== null) {
        if (seen.some(([a, b]) => m.index < b && m.index + m[0].length > a)) continue;
        seen.push([m.index, m.index + m[0].length]); bump(l.term, l.tier);
      }
    }
    for (const u of unspentRes) {
      u.re.lastIndex = 0; let m;
      while ((m = u.re.exec(line)) !== null) {
        seen.push([m.index, m.index + m[0].length]);
        findings.push(`${file}:${i + 1}: unspent: ${u.term}: "${excerpt(line, m.index, m[0].length)}" (${u.why})`);
      }
    }
    for (const r of RETIRED) {
      r.re.lastIndex = 0; let m;
      while ((m = r.re.exec(line)) !== null) {
        seen.push([m.index, m.index + m[0].length]);
        findings.push(`${file}:${i + 1}: retired: ${m[0].trim()}: "${excerpt(line, m.index, m[0].length)}" (say ${r.say})`);
      }
    }
    CAP.lastIndex = 0; let m;
    while ((m = CAP.exec(line)) !== null) {
      const term = m[3]; const at = m.index + m[1].length + m[2].length;
      if (seen.some(([a, b]) => at < b && at + term.length > a)) continue;
      if (FREE.has(term) || term.split(' ').every(w => FREE.has(w))) continue;
      if (/^(I|A|An|The|And|But|Or|Of|In|On|At|To|For|By|With|From|If|When|Then|So|Yes|No)$/.test(term)) continue;
      findings.push(`${file}:${i + 1}: unlisted: ${term}: "${excerpt(line, at, term.length)}" (a coined noun not in COSMOLOGY.md section 2: queue it, do not ship it)`);
    }
    if (words) {
      const wre = /\b[a-z][a-z']{3,}\b/g; let w;
      while ((w = wre.exec(line)) !== null) {
        const t = w[0].replace(/'s$/, '');
        if (words.has(t) || words.has(t.replace(/s$/, '')) || words.has(t.replace(/es$/, '')) || words.has(t.replace(/ies$/, 'y'))) continue;
        if (lexRes.some(l => l.term.toLowerCase() === t)) continue;
        findings.push(`${file}:${i + 1}: unknown: ${t}: "${excerpt(line, w.index, t.length)}" (not in the wordlist or the lexicon)`);
      }
    }
  });
  return { findings, ledger };
}

const argv = process.argv.slice(2);
let words = null; const paths = [];
for (let i = 0; i < argv.length; i++) {
  if (argv[i] === '--words') { words = new Set(readFileSync(argv[++i], 'utf8').split('\n').map(s => s.trim().toLowerCase()).filter(Boolean)); }
  else paths.push(argv[i]);
}
if (paths.length === 0) {
  console.error('usage: node tools/noun-ledger.mjs <file-or-folder> [...] [--words <wordlist>]');
  process.exit(2);
}
const files = []; for (const p of paths) walk(p, files);
let total = 0; const ledger = new Map();
for (const file of files) {
  const r = lintFile(file, words);
  total += r.findings.length;
  for (const f of r.findings) console.log(f);
  for (const [term, { tier, n }] of r.ledger) {
    const cur = ledger.get(term) || { tier, n: 0 }; cur.n += n; ledger.set(term, cur);
  }
  console.log(`# ${file}: ${r.findings.length === 0 ? 'clean' : r.findings.length + ' finding(s)'}`);
}
if (ledger.size) {
  console.log('# ledger (coined terms met, by tier):');
  for (const [term, { tier, n }] of [...ledger].sort((a, b) => a[1].tier - b[1].tier || b[1].n - a[1].n))
    console.log(`#   tier ${tier}  ${term.padEnd(22)} ${n}`);
}
console.log(`# ${files.length} file(s), ${total === 0 ? 'clean' : total + ' finding(s)'}`);
process.exit(total === 0 ? 0 : 1);
