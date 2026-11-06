// house.js: the house style, applied where corpus text meets a reader (SS7, 1 Nov 2026).
//
// reading-copy.js and stations.js are generated from the research corpus, written before
// WRITING.md fixed two rules that tools/writing-lint.mjs now enforces on every page: no em
// dashes in anything a reader reads, and the 28 are stations, never mansions, on any surface
// a visitor sees (STARSHARD-LAUNCH.md section 2.2). The corpus files are not in the night
// shift's write list and reading.js is reused unchanged, so the two mechanical rules are
// applied here, at render, the way the lint itself says to fix them: an em dash becomes a
// comma pair (or a colon when it introduces a clause ending the sentence), and the word
// becomes station. Nothing else in the prose is touched; the rest of the house style is the
// corpus's own job and the lint reports what remains.
//
// Pure: a string in, a string out. test/shard.test.mjs holds it to the lint's own patterns.

/** Em dashes out. A dash that opens an aside closed by a second dash becomes a comma pair;
 * a lone dash becomes a comma; a dash after a sentence end or before nothing is dropped. */
export function dashes(text) {
  if (!text) return text;
  let s = String(text);
  // a spaced en dash is an em dash in disguise (the lint's own rule); the en dash inside
  // a numeric range (13–17) is left alone
  // a spaced en dash between two numbers is a range the corpus wrote with spaces: "to"
  s = s.replace(/\s+–\s+(?=\d)/g, ' to ');
  s = s.replace(/\s+–\s+/g, ' — ').replace(/\s+--\s+/g, ' — ');
  // "word — word" and "word—word": a comma, keeping one space
  s = s.replace(/\s*—\s*/g, ', ');
  // a comma that lands on punctuation it does not belong beside
  s = s.replace(/([,:;.!?])\s*,\s+/g, '$1 ');
  s = s.replace(/,\s+([.!?;:,])/g, '$1');
  s = s.replace(/\(\s*,\s+/g, '(').replace(/,\s+\)/g, ')');
  // a comma at the start of a line or paragraph
  s = s.replace(/(^|\n)\s*,\s+/g, '$1');
  return s;
}

/** The word a visitor never reads, in every case the corpus wrote it. */
export function stations(text) {
  if (!text) return text;
  return String(text)
    .replace(/\bmansions\b/g, 'stations')
    .replace(/\bMansions\b/g, 'Stations')
    .replace(/\bmansion\b/g, 'station')
    .replace(/\bMansion\b/g, 'Station');
}

// the 28 epithets and the five traveler types as reading.js interpolates them, in title case;
// the page is lowercase everywhere (the shipped game's own rule), so they are lowered here
const EPITHETS = ['Gate', 'Bearer', 'Gathered Stars', 'Follower', 'Blaze', 'Storm', 'Return', 'Ghost', 'Glance', 'Throne', 'Mane', 'Turning', 'Hand', 'Jewel', 'Veil', 'Claws', 'Crown', 'Heart', 'Root', 'Flock', 'Empty District', 'Listener', 'Drum', 'Void', 'Hideaway', 'Chamber', 'Guide', 'Thread'];
const TYPES = ['Seedborn', 'Homebound', 'Outbound', 'Emberwake', 'Farbank'];
const EPITHET_RE = new RegExp(`\\bThe (${EPITHETS.join('|')})\\b`, 'g');
const TYPE_RE = new RegExp(`\\b(${TYPES.join('|')})\\b`, 'g');

/** Title-case names the corpus interpolates, lowered: "The Gate" to "the gate". */
export function lowerNames(text) {
  if (!text) return text;
  return String(text).replace(EPITHET_RE, (m, e) => `the ${e.toLowerCase()}`).replace(TYPE_RE, m => m.toLowerCase());
}

/** The pass a corpus string goes through on its way to the page. */
export function house(text) {
  return lowerNames(stations(dashes(text)));
}

/** Corpus text as paragraphs, each a list of runs: { text } or { em: text } for the corpus's
 * *emphasis*. The reader's text, not markup, so the renderer owns the elements. */
export function paragraphs(text) {
  const out = [];
  for (const para of house(text || '').split(/\n\s*\n/)) {
    const p = para.replace(/\s*\n\s*/g, ' ').trim();
    if (!p) continue;
    const runs = [];
    const re = /\*([^*\n]+)\*/g;
    let last = 0, m;
    while ((m = re.exec(p))) {
      if (m.index > last) runs.push({ text: p.slice(last, m.index) });
      runs.push({ em: m[1] });
      last = m.index + m[0].length;
    }
    if (last < p.length) runs.push({ text: p.slice(last) });
    out.push(runs);
  }
  return out;
}
