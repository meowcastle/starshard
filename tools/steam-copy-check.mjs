#!/usr/bin/env node
// steam-copy-check.mjs: the W3 gate (docs/BACKLOG-V2.md section 5), checked by machine.
//
//   node tools/steam-copy-check.mjs [content/steam]
//
// Three checks over the Steam page folder, exit code 1 on any failure:
//   lint      tools/writing-lint.mjs over every Markdown file there (the house style) and
//             tools/noun-ledger.mjs over copy.md, the strings a visitor reads (the vocabulary
//             law, no capitalised coinage a stranger meets); the guide files name Steam's own
//             fields and tools in capitals, so the ledger is held to the copy proper
//   short     the short description in copy.md (the ```short fence) is under 300 characters,
//             plain text, one paragraph, no URL; Steamworks says "a few hundred" and the editor's
//             own counter is the law, so 300 is the ceiling this check holds
//   assets    assets.md names every store, community and library asset Steam lists with a pixel
//             size, and every file in capsules/ carries its size in its name and matches it
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');
const dir = resolve(process.argv[2] || join(root, 'content', 'steam'));
let failures = 0;
const fail = m => { failures++; console.log(`  FAIL ${m}`); };
const ok = m => console.log(`  ok   ${m}`);

// 1. the lints
const mds = readdirSync(dir).filter(f => f.endsWith('.md')).map(f => join(dir, f));
for (const tool of ['writing-lint.mjs', 'noun-ledger.mjs']) {
  const files = tool === 'noun-ledger.mjs' ? [join(dir, 'copy.md')] : mds;
  const r = spawnSync(process.execPath, [join(here, tool), ...files], { encoding: 'utf8' });
  const out = (r.stdout || '') + (r.stderr || '');
  const findings = out.split('\n').filter(l => /^\S+:\d+: /.test(l));
  if (r.status === 0 && findings.length === 0) ok(`${tool}: clean over ${files.length} file(s)`);
  else { fail(`${tool}: ${findings.length} finding(s)`); for (const l of findings) console.log(`       ${l}`); }
}

// 2. the short description
const page = readFileSync(join(dir, 'copy.md'), 'utf8');
const m = page.match(/```short\n([\s\S]*?)\n```/);
if (!m) fail('copy.md: no ```short fence');
else {
  const s = m[1].trim();
  const n = [...s].length;
  if (n >= 300) fail(`short description is ${n} characters (ceiling 300)`); else ok(`short description: ${n} characters, under 300`);
  if (/\n/.test(s)) fail('short description has a line break (plain text, one paragraph)');
  if (/https?:|www\.|\.net\b|\.com\b/i.test(s)) fail('short description carries a URL (Steam forbids links in descriptions)');
}

// 3. the asset list and the rendered files
const assets = readFileSync(join(dir, 'assets.md'), 'utf8');
const NEEDED = [['header capsule', '920 x 430'], ['small capsule', '462 x 174'], ['main capsule', '1232 x 706'], ['vertical capsule', '748 x 896'],
  ['screenshots', '1920 x 1080'], ['page background', '1438 x 810'], ['app icon', '184 x 184'], ['shortcut icon', '256 x 256'],
  ['library capsule', '600 x 900'], ['library header', '920 x 430'], ['library hero', '3840 x 1240'], ['library logo', '1280']];
const before = failures;
for (const [name, size] of NEEDED) {
  const row = assets.split('\n').find(l => l.startsWith(`| ${name}`));
  if (!row) fail(`assets.md: no row for ${name}`);
  else if (!row.includes(size)) fail(`assets.md: ${name} row does not carry ${size}`);
}
if (failures === before) ok(`assets.md: ${NEEDED.length} assets listed with their sizes`);
const caps = join(dir, 'capsules');
if (existsSync(caps)) {
  let n = 0;
  for (const f of readdirSync(caps).filter(f => /\.(png|jpg)$/.test(f))) {
    const mm = f.match(/-(\d+)x(\d+)\.(png|jpg)$/);
    if (!mm) { fail(`capsules/${f}: no size in the name`); continue; }
    const buf = readFileSync(join(caps, f));
    let w = 0, h = 0;
    if (mm[3] === 'png') { w = buf.readUInt32BE(16); h = buf.readUInt32BE(20); }
    else { // JPEG: walk the markers to SOF0/SOF2
      let i = 2; while (i < buf.length) { if (buf[i] !== 0xff) { i++; continue; } const t = buf[i + 1]; if (t === 0xc0 || t === 0xc2) { h = buf.readUInt16BE(i + 5); w = buf.readUInt16BE(i + 7); break; } i += 2 + buf.readUInt16BE(i + 2); }
    }
    if (w !== Number(mm[1]) || h !== Number(mm[2])) fail(`capsules/${f}: file is ${w} x ${h}`); else n++;
  }
  ok(`capsules/: ${n} file(s) at the size their name says`);
}

console.log(failures === 0 ? 'W3 gate: pass' : `W3 gate: ${failures} failure(s)`);
process.exit(failures === 0 ? 0 : 1);
