// store.js: saves survive a crash mid-write, and an unreadable file falls back to a backup.   node --test test/
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawn } = require('child_process');
const { writeJson, readJson } = require('../store');

const dir = () => fs.mkdtempSync(path.join(os.tmpdir(), 'sim-store-'));

test('writes, keeps three backups, newest first', () => {
  const f = path.join(dir(), 'b.json');
  for (let i = 1; i <= 5; i++) writeJson(f, { i });
  assert.deepStrictEqual([f, f + '.1', f + '.2', f + '.3'].map(x => JSON.parse(fs.readFileSync(x, 'utf8')).i), [5, 4, 3, 2]);
  assert.ok(!fs.existsSync(f + '.4') && !fs.existsSync(f + '.tmp'));
});

test('an unreadable file loads the newest good backup instead of an empty value', () => {
  const f = path.join(dir(), 'b.json');
  writeJson(f, ['a']); writeJson(f, ['a', 'b']);
  fs.writeFileSync(f, '[{"half a fi');
  const warn = console.warn; console.warn = () => {};
  try { assert.deepStrictEqual(readJson(f, []), ['a']); } finally { console.warn = warn; }
  assert.deepStrictEqual(readJson(path.join(dir(), 'none.json'), 'fallback'), 'fallback');
});

test('kill -9 during saves leaves a valid file', async () => {
  const f = path.join(dir(), 'big.json');
  // a child saving a ~2MB object as fast as it can, killed at a random moment, ten times
  const child = `const { writeJson } = require(${JSON.stringify(path.join(__dirname, '..', 'store.js'))});
    const big = Array.from({ length: 40000 }, (_, i) => ({ i, name: 'card ' + i, text: 'x'.repeat(30) }));
    for (let n = 0; ; n++) writeJson(${JSON.stringify(f)}, { n, big });`;
  for (let round = 0; round < 10; round++) {
    const p = spawn(process.execPath, ['-e', child], { stdio: 'ignore' });
    await new Promise(r => setTimeout(r, 150 + Math.random() * 300));
    p.kill('SIGKILL');
    await new Promise(r => p.on('exit', r));
    if (!fs.existsSync(f)) continue; // killed before its first save finished
    const v = JSON.parse(fs.readFileSync(f, 'utf8')); // throws if half-written
    assert.strictEqual(v.big.length, 40000);
  }
});
