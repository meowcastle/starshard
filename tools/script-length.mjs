#!/usr/bin/env node
// script-length.mjs: the W2 gate, checked by machine.
//
// Usage: node tools/script-length.mjs content/scripts/*.md
//
// For each video script it reads the "## Spoken" section (the words said on camera,
// nothing else), counts them, and prints the read-aloud time at 150 words a minute
// (an ordinary narration pace) and at 130 (slow, with the pauses a short needs).
// A script passes when the slow reading is under 90 seconds. It also checks that
// the script cites its agreement flag (a line beginning "- agreement flag:" naming
// STRONG, PARTIAL or DIVERGENT and the table it comes from), which is the second
// line of the W2 gate in docs/BACKLOG-V2.md. Exit code 1 on any failure.
//
// The count is of whitespace-separated tokens, so "al-Qalb" is one word and
// "心 Xīn" is two, which is how they are said.

import { readFileSync } from 'node:fs';

const FAST = 150, SLOW = 130, LIMIT = 90;
const files = process.argv.slice(2).filter(f => !/README\.md$/.test(f));
if (!files.length) { console.error('usage: node tools/script-length.mjs content/scripts/*.md'); process.exit(2); }

let failed = 0;
console.log('script                                      words  @150  @130  flag       result');
for (const file of files) {
  const text = readFileSync(file, 'utf8');
  const m = text.match(/## Spoken\s*([\s\S]*?)(?:\n## |$)/);
  const spoken = m ? m[1] : '';
  const words = spoken.split(/\s+/).filter(Boolean).length;
  const fast = Math.round(words / FAST * 60);
  const slow = Math.round(words / SLOW * 60);
  const flag = text.match(/^- agreement flag:\s*(STRONG|PARTIAL|DIVERGENT)\b.*mansions-table\.json/m);
  const problems = [];
  if (!m) problems.push('no "## Spoken" section');
  if (slow >= LIMIT) problems.push(`${slow}s at ${SLOW} wpm is not under ${LIMIT}`);
  if (!flag) problems.push('agreement flag not cited from research/mansions-table.json');
  if (problems.length) failed++;
  const name = file.replace(/^.*\//, '');
  console.log(`${name.padEnd(43)} ${String(words).padStart(5)} ${String(fast + 's').padStart(5)} ${String(slow + 's').padStart(5)}  ${(flag ? flag[1] : 'none').padEnd(10)} ${problems.length ? 'FAIL: ' + problems.join('; ') : 'PASS'}`);
}
console.log(`${files.length - failed}/${files.length} scripts pass (under ${LIMIT}s at ${SLOW} wpm, flag cited)`);
process.exit(failed ? 1 : 0);
