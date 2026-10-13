// Durable JSON files for the sim's state (WORKORDER-DESIGN-CODE-13OCT.md item 7).
//
// writeJson: write to <file>.tmp, fsync, then rename over <file>, so a crash mid-save leaves
// the old file or the new one, never half of one; the file it replaces is kept as <file>.1,
// shifting older copies to .2 and .3 (keep: 0 for caches, which need no history).
// readJson: the file, else the newest backup that parses, else the fallback. Reading an
// unparseable file as empty used to be the worse failure: the next save wrote the empty value
// over everything (brews.json lost every brew).
const fs = require('fs');

function writeJson(file, obj, { keep = 3 } = {}) {
  const tmp = file + '.tmp', text = JSON.stringify(obj);
  const fd = fs.openSync(tmp, 'w');
  try { fs.writeSync(fd, text); fs.fsyncSync(fd); } finally { fs.closeSync(fd); }
  if (keep > 0 && fs.existsSync(file)) {
    for (let i = keep; i > 1; i--) if (fs.existsSync(`${file}.${i - 1}`)) fs.renameSync(`${file}.${i - 1}`, `${file}.${i}`);
    fs.copyFileSync(file, file + '.1');
  }
  fs.renameSync(tmp, file);
}

function readJson(file, fallback, { keep = 3 } = {}) {
  for (const f of [file, ...Array.from({ length: keep }, (_, i) => `${file}.${i + 1}`)]) {
    let text;
    try { text = fs.readFileSync(f, 'utf8'); } catch { continue; }
    try { const v = JSON.parse(text); if (f !== file) console.warn(`${file} was unreadable; loaded ${f}`); return v; }
    catch { console.warn(`${f} is not valid JSON; trying the next copy`); }
  }
  return fallback;
}

module.exports = { writeJson, readJson };
