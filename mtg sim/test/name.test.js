// FS1 (BACKLOG.md §4): the product is Deck Bench. The old name was the engine's and may survive only as
// `forge sim`, Forge's own command. Everything a person reads (public/, mail/) carries the new name, the
// about page states the non-affiliation, and the Fan Content notice stays verbatim in the footer and the page.
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const OLD = /forge[ _-]?sim\b/i;
const NOTICE = 'is unofficial Fan Content permitted under the Fan Content Policy. Not approved/endorsed by Wizards. Portions of the materials used are property of Wizards of the Coast. ©Wizards of the Coast LLC.';
const LINE = 'a test bench for deck changes, not affiliated with Forge or Wizards of the Coast';

const textFiles = (dir) => fs.readdirSync(dir).filter(f => /\.(html|js|txt|webmanifest|md)$/.test(f)).map(f => path.join(dir, f));

test('nothing a person reads carries the old name', () => {
  const hits = [];
  for (const f of [...textFiles(path.join(ROOT, 'public')), ...textFiles(path.join(ROOT, 'mail'))]) {
    fs.readFileSync(f, 'utf8').split('\n').forEach((line, i) => { if (OLD.test(line)) hits.push(`${path.relative(ROOT, f)}:${i + 1}`); });
  }
  assert.deepStrictEqual(hits, []);
});

test('the about page is served, says what the product is and is not, and keeps the notice', () => {
  const about = fs.readFileSync(path.join(ROOT, 'public', 'about.html'), 'utf8');
  assert.match(about, /<title>About Deck Bench<\/title>/);
  assert.ok(about.includes(LINE[0].toUpperCase() + LINE.slice(1) + '.'), 'the affiliation line');
  assert.ok(about.includes('Deck Bench ' + NOTICE), 'the Fan Content notice, verbatim');
  assert.ok(about.includes('github.com/Card-Forge/forge') && about.includes('scryfall.com'), 'attribution links');
  const server = fs.readFileSync(path.join(ROOT, 'server.js'), 'utf8');
  assert.ok(server.includes("if (p === '/about') return serveStatic(req, res, '/about.html');"), 'the /about route');
});

test('the page footer links the about page and keeps the notice; the manifest and mail carry the name', () => {
  const index = fs.readFileSync(path.join(ROOT, 'public', 'index.html'), 'utf8');
  const footer = (index.match(/<footer data-fan-content[^>]*>([\s\S]*?)<\/footer>/) || [])[1] || '';
  assert.ok(footer.includes('href="/about"'), 'the link');
  assert.ok(footer.includes(LINE + '.'), 'the affiliation line');
  assert.ok(footer.includes('Deck Bench ' + NOTICE), 'the notice, verbatim');
  const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, 'public', 'manifest.webmanifest'), 'utf8'));
  assert.strictEqual(manifest.name, 'Deck Bench'); assert.strictEqual(manifest.short_name, 'Deck Bench');
  assert.match(fs.readFileSync(path.join(ROOT, 'mail.js'), 'utf8'), /const FAN = 'Deck Bench is unofficial Fan Content/);
  assert.match(fs.readFileSync(path.join(ROOT, 'config.js'), 'utf8'), /'Deck Bench <noreply@sim\.starshard\.net>'/);
});
