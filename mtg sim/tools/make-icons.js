// The phone app's icons (change 18): the green diamond (--accent #C5EC7A) on the page colour (#0C0C0B), as PNGs
// at 180 (apple-touch-icon), 192 and 512, plus a maskable 512 with the diamond inside the safe zone.
//   node tools/make-icons.js   -> public/icon-*.png
const fs = require('fs'), path = require('path'), zlib = require('zlib');
const BG = [0x0c, 0x0c, 0x0b], FG = [0xc5, 0xec, 0x7a];
const crcT = Array.from({ length: 256 }, (_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c >>> 0; });
const crc = b => { let c = ~0; for (const x of b) c = crcT[(c ^ x) & 255] ^ (c >>> 8); return (~c) >>> 0; };
const chunk = (t, d) => { const l = Buffer.alloc(4); l.writeUInt32BE(d.length); const td = Buffer.concat([Buffer.from(t), d]); const c = Buffer.alloc(4); c.writeUInt32BE(crc(td)); return Buffer.concat([l, td, c]); };
function png(size, scale) {
  const rows = [], r = size * scale / 2, c = size / 2, S = 4; // 4x4 supersampling for a clean edge
  for (let y = 0; y < size; y++) {
    const row = Buffer.alloc(1 + size * 3);
    for (let x = 0; x < size; x++) {
      let hit = 0; for (let i = 0; i < S; i++) for (let j = 0; j < S; j++) if (Math.abs(x + (i + .5) / S - c) + Math.abs(y + (j + .5) / S - c) <= r) hit++;
      const a = hit / (S * S); for (let k = 0; k < 3; k++) row[1 + x * 3 + k] = Math.round(BG[k] + (FG[k] - BG[k]) * a);
    }
    rows.push(row);
  }
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(size, 0); ihdr.writeUInt32BE(size, 4); ihdr[8] = 8; ihdr[9] = 2;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(Buffer.concat(rows))), chunk('IEND', Buffer.alloc(0))]);
}
const out = path.join(__dirname, '..', 'public');
for (const [name, size, scale] of [['icon-180.png', 180, 0.62], ['icon-192.png', 192, 0.62], ['icon-512.png', 512, 0.62], ['icon-maskable-512.png', 512, 0.5]]) fs.writeFileSync(path.join(out, name), png(size, scale));
console.log('icons written');
