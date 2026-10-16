// The distill scorecard (FORGE-SIM-DISTILL.md §1 and §3), measured on public/index.html.
// Strings are the page's visible text: markup text between tags, plus string literals in the script
// that hold a space or a capital (UI copy, not keys). Code identifiers never count.
// Usage: node tools/distill-count.js [public/index.html] [--list word]
const fs = require('fs');
const file = process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : 'public/index.html';
const s = fs.readFileSync(file, 'utf8');
const at = s.indexOf('<script type="text/x-dc"');
const body = s.slice(0, at), code = s.slice(at).replace(/^[ \t]*\/\/.*$/gm, m => m.replace(/./g, ' ')); // comment lines aren't UI

const strings = [];
const lineOf = (src, i, base) => base + src.slice(0, i).split('\n').length - 1;
for (const m of body.replace(/<style[\s\S]*?<\/style>/g, x => x.replace(/[^\n]/g, ' ')).matchAll(/>([^<>]+)</g)) {
  const t = m[1].replace(/\{\{[^}]*\}\}/g, ' ').replace(/\s+/g, ' ').trim();
  if (/[A-Za-z]{2}/.test(t)) strings.push({ line: lineOf(body, m.index, 1), kind: 'M', t });
}
const base = body.split('\n').length;
for (const m of code.matchAll(/'((?:[^'\\\n]|\\.)*)'|"((?:[^"\\\n]|\\.)*)"|`((?:[^`\\]|\\.)*)`/g)) {
  const t = (m[1] ?? m[2] ?? m[3] ?? '').replace(/\$\{[^}]*\}/g, ' ');
  if (!/[a-z]/.test(t) || !(/ /.test(t.trim()) || /^[A-Z][a-z]/.test(t))) continue;
  if (/^[\w.\-/:#?=&%]+$/.test(t) && !/^[A-Z][a-z]+$/.test(t)) continue; // paths, keys, urls
  if (/[{}]|=>|var\(--|\dpx|rgba?\(|^(?:\.|#)?[a-z-]+:[^ ]/.test(t)) continue; // css and code fragments (a ';' alone is prose)
  strings.push({ line: lineOf(code, m.index, base), kind: 'L', t });
}

const count = re => strings.reduce((n, x) => n + (x.t.match(re) || []).length, 0);
const where = re => strings.filter(x => re.test(x.t));
const rows = [
  ['Words for the deck', { deck: /\bdecks?\b/gi, brew: /\bbrews?\b/gi, list: /\blists?\b/gi }],
  ['Words for a run', { run: /\bruns?\b/gi, sim: /\bsim\b/gi, games: /\bgames\b/gi, Forge: /\bForge\b(?! Sim)/g }],
  ['Words for a pairing', { matchup: /\bmatchups?\b/gi, opponent: /\bopponents?\b/gi, against: /\bagainst\b/gi }],
  ['Words for the meta', { field: /\bfield\b/gi, meta: /\bmeta\b/gi, gauntlet: /\bgauntlet\b/gi }],
  ['Words for the write-up', { plan: /\bplans?\b/gi, guide: /\bguides?\b/gi }],
  ['Noise band', { 'inside the noise': /inside the noise/gi, 'within the noise': /within the noise/gi, '±10 is noise': /±10 is noise/gi }],
  ['Run-state words', { finished: /\bfinished\b/gi, cancelled: /\bcancell?ed\b/gi, crashed: /\bcrashed\b/gi, restarted: /\brestarted\b/gi, 'stopped early': /stopped early/gi }],
  ['"Safe to close the tab"', { n: /safe to close the tab/gi }],
  ['Arena strings', { Arena: /\bArena\b/g, wildcard: /\bwildcards?\b/gi }],
  ['Sign-in labels', { 'Already a member': /Already a member/g, 'Members sign in': /Members sign in/g, 'a name and a password': /a name and a password/g }],
  ['Infra words (§8 law 4)', { server: /\bserver\b/gi, worker: /\bworker\b/gi, Mac: /\bMac\b/g, bridge: /\bbridge\b/gi }],
];
const out = [];
for (const [label, res] of rows) out.push(label.padEnd(26) + Object.entries(res).map(([k, re]) => k + ' ' + count(re)).join(' · '));
// the §3 grep rule, on visible strings instead of raw lines (the raw grep also hits ids and attributes)
const g1 = /\b(brew|Forge(?! Sim)|meta|gauntlet|guide|binder|shelf|wildcard|Arena|opponent|within the noise|within the margin|crashed|cancelled|restarted|stopped early|fidelity)\b/i;
const hits = where(g1).filter(x => !(/opponent/i.test(x.t) && /life|counter|Table/i.test(x.t)));
out.push('§3 grep (visible strings)'.padEnd(26) + hits.length + ' hits');
console.log(out.join('\n'));
const li = process.argv.indexOf('--list');
if (li > 0) { const re = new RegExp(process.argv[li + 1], 'i'); for (const x of where(re)) console.log(x.line, x.kind, x.t.slice(0, 160)); }
if (process.argv.includes('--grep')) for (const x of hits) console.log(x.line, x.kind, x.t.slice(0, 160));
