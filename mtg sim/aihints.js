// Cards Forge's AI won't play, or plays only situationally.
//
// Forge's card scripts carry AI hints: "AI:RemoveDeck:All" means the AI treats the card
// as unplayable (it strips the card's abilities from what it will cast), "Random" means
// it's situational and left out of random AI decks, "NonCommander" means the same
// outside Commander. Forge's own "AI can't play these cards well" warning is built from
// exactly these hints (Deck.getUnplayableAICards), but the sim command never prints it,
// so we read the scripts ourselves.
//
// The scripts ship zipped (res/cardsfolder/cardsfolder.zip, ~34,000 files). The first
// call reads every script's Name: and hint lines once and caches the result per Forge
// version in DATA_DIR, so later calls are a lookup.
const fs = require('fs');
const config = require('./config');
const path = require('path');
const zlib = require('zlib');

const FORGE_DIR = config.FORGE_DIR;
// names compared the way Forge's deck loader does: front face only, no accents, any case
const keyOf = n => String(n).split(/\s*\/\/?\s*/)[0].normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase();
const cacheFile = v => path.join(config.DATA_DIR, `aihints2-${String(v).replace(/[^\w.-]/g, '_')}.json`);

// every file in a zip, as { name, data } (stored or deflated; no zip64, which Forge's zip doesn't need)
function* zipEntries(buf) {
  let eocd = buf.length - 22;
  while (eocd >= 0 && buf.readUInt32LE(eocd) !== 0x06054b50) eocd--;
  if (eocd < 0) throw new Error('not a zip file');
  let p = buf.readUInt32LE(eocd + 16);
  const n = buf.readUInt16LE(eocd + 10);
  for (let i = 0; i < n; i++) {
    if (buf.readUInt32LE(p) !== 0x02014b50) throw new Error('bad zip directory');
    const method = buf.readUInt16LE(p + 10), csize = buf.readUInt32LE(p + 20), nlen = buf.readUInt16LE(p + 28), xlen = buf.readUInt16LE(p + 30), clen = buf.readUInt16LE(p + 32), off = buf.readUInt32LE(p + 42);
    const name = buf.toString('utf8', p + 46, p + 46 + nlen);
    p += 46 + nlen + xlen + clen;
    if (name.endsWith('/')) continue;
    const start = off + 30 + buf.readUInt16LE(off + 26) + buf.readUInt16LE(off + 28), raw = buf.subarray(start, start + csize);
    yield { name, data: () => method === 8 ? zlib.inflateRawSync(raw) : raw };
  }
}

// name (lowercase, front face) -> 'unplayable' | 'limited' | 'commander', plus the set of every known name
function build() {
  const dir = path.join(FORGE_DIR, 'res', 'cardsfolder'), zip = path.join(dir, 'cardsfolder.zip');
  const hints = {}, names = [];
  const read = (text) => {
    const nm = text.match(/^Name:(.+)$/m); if (!nm) return;
    const name = keyOf(nm[1]); names.push(name);
    const h = text.match(/^AI:RemoveDeck:(\w+)/m);
    if (h) hints[name] = h[1] === 'All' ? 'unplayable' : h[1] === 'NonCommander' ? 'commander' : 'limited';
  };
  if (fs.existsSync(zip)) { for (const e of zipEntries(fs.readFileSync(zip))) if (e.name.endsWith('.txt')) read(e.data().toString('utf8')); }
  else {
    const walk = d => { for (const f of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, f.name); if (f.isDirectory()) walk(p); else if (f.name.endsWith('.txt')) read(fs.readFileSync(p, 'utf8')); } };
    walk(dir);
  }
  return { hints, names };
}

let idx = null, known = null;
function load(version) {
  if (idx) return;
  const f = cacheFile(version || 'unknown');
  let c = null; try { c = JSON.parse(fs.readFileSync(f, 'utf8')); } catch {}
  if (!c) { c = build(); try { fs.writeFileSync(f, JSON.stringify(c)); } catch {} }
  idx = c.hints; known = new Set(c.names);
}

// a deck's cards Forge's AI won't play or plays only situationally, by section
// { unplayable: [{ qty, name }], limited: [...], missing: [...] } (missing: not in this Forge)
function scan(deck, { version, commander = false } = {}) {
  try { load(version); } catch (e) { return { unplayable: [], limited: [], missing: [], error: e.message }; }
  const out = { unplayable: [], limited: [], missing: [] };
  for (const sec of ['main', 'commander']) for (const c of deck[sec] || []) {
    const key = keyOf(c.name);
    if (!known.has(key)) { out.missing.push({ qty: c.qty, name: c.name }); continue; }
    const h = idx[key];
    if (h === 'unplayable') out.unplayable.push({ qty: c.qty, name: c.name });
    else if (h === 'limited' || (h === 'commander' && !commander)) out.limited.push({ qty: c.qty, name: c.name });
  }
  return out;
}
const hintOf = (name, version) => { try { load(version); } catch { return null; } return idx[keyOf(name)] || null; };

module.exports = { scan, hintOf };
