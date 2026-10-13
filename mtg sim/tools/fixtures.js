// design/fixtures.json: the page's GET responses, so the Design canvas renders the Brewer with
// real data shapes and no server (WORKORDER-DESIGN-CODE-13OCT.md, item 1). Keyed by the exact
// paths the page's api() requests. The file holds real brews: it is git-ignored and must never
// go under public/ (the server sends public/ to anyone, signed in or not).
//
//   SIM_URL=https://... SIM_USER=you node tools/fixtures.js [codex ids...]
//
// The password is read from SIM_PASS if set, else asked for on the terminal (not echoed); it is
// never written anywhere. Codex ids default to the first card, archetype and term in the index;
// an entry nobody has opened yet is written by the model once on first fetch (then cached).
//
// Redacted: the admin spend line (spentToday), anything named like a password, token, email or
// cost, and every username other than yours (codex notes by others read "player").
const fs = require('fs');
const path = require('path');

const BASE = (process.env.SIM_URL || '').replace(/\/$/, ''), USER = process.env.SIM_USER;
const OUT = path.join(__dirname, '..', 'design', 'fixtures.json');
if (!BASE || !USER) { console.error('set SIM_URL and SIM_USER'); process.exit(1); }

function askHidden(q) {
  return new Promise((resolve, reject) => {
    let tty;
    try { tty = fs.openSync('/dev/tty', 'r+'); } catch { return reject(new Error('no terminal to ask on: set SIM_PASS')); }
    const rs = require('tty').ReadStream ? new (require('tty').ReadStream)(tty) : null;
    fs.writeSync(tty, q);
    rs.setRawMode(true);
    let pw = '';
    rs.on('data', b => {
      for (const ch of b.toString('utf8')) {
        if (ch === '\r' || ch === '\n') { rs.setRawMode(false); rs.destroy(); fs.writeSync(tty, '\n'); return resolve(pw); }
        if (ch === '\u0003') { rs.setRawMode(false); process.exit(130); }
        if (ch === '\u007f') pw = pw.slice(0, -1); else pw += ch;
      }
    });
  });
}

const SECRET = /pass(word)?|token|secret|email|cookie|session|spent|cost|usd|apikey|api_key/i;
const PEOPLE = /^(owner|by|who|user|author|name)$/;
function redact(x, me, parentKey) {
  if (Array.isArray(x)) return x.map(v => redact(v, me, parentKey));
  if (x && typeof x === 'object') {
    const o = {};
    for (const [k, v] of Object.entries(x)) {
      if (SECRET.test(k)) continue;
      // a person's name: keep yours, anonymise everyone else's (only under people-ish keys, so a card or deck name is untouched)
      if (typeof v === 'string' && PEOPLE.test(k) && (k !== 'name' || parentKey === 'user') && v !== me && others.has(v)) { o[k] = 'player'; continue; }
      o[k] = redact(v, me, k);
    }
    return o;
  }
  return x;
}
const others = new Set();
function collectPeople(x) {
  if (Array.isArray(x)) return x.forEach(collectPeople);
  if (x && typeof x === 'object') for (const [k, v] of Object.entries(x)) { if (typeof v === 'string' && /^(owner|by|who|author)$/.test(k)) others.add(v); else collectPeople(v); }
}

(async () => {
  const password = process.env.SIM_PASS || await askHidden(`Star Shard password for ${USER}: `);
  const lr = await fetch(BASE + '/api/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username: USER, password }) });
  if (!lr.ok) throw new Error('sign-in failed: ' + lr.status + ' ' + (await lr.text()).slice(0, 200));
  const cookie = (lr.headers.getSetCookie?.() || []).map(c => c.split(';')[0]).join('; ');
  const get = async p => { const r = await fetch(BASE + p, { headers: { cookie } }); if (!r.ok) throw new Error(p + ': ' + r.status); return r.json(); };

  const out = {};
  out['/api/me'] = await get('/api/me');
  const me = out['/api/me'].user && out['/api/me'].user.name;
  out['/api/brews'] = await get('/api/brews');
  out['/api/codex'] = await get('/api/codex');
  let ids = process.argv.slice(2);
  if (!ids.length) {
    // the index's shape: find the first entry of each kind wherever it sits
    const seen = {};
    (function walk(x) { if (Array.isArray(x)) return x.forEach(walk); if (x && typeof x === 'object') { if (typeof x.id === 'string') { const kind = x.id.split(':')[0]; if (['card', 'arch', 'term'].includes(kind) && !seen[kind]) seen[kind] = x.id; } Object.values(x).forEach(walk); } })(out['/api/codex']);
    ids = Object.values(seen);
  }
  for (const id of ids) out['/api/codex/' + encodeURIComponent(id)] = await get('/api/codex/' + encodeURIComponent(id));

  collectPeople(out); others.delete(me);
  const clean = redact(out, me);
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify(clean, null, 1));
  const b = clean['/api/brews'].brews || [];
  const runs = b.flatMap(x => x.runs || []);
  console.log(`wrote ${path.relative(process.cwd(), OUT)}: ${b.length} brews (${b.filter(x => (x.versions || []).length > 1).length} with 2+ versions), ${runs.length} runs (${runs.filter(r => r.status === 'done').length} done, ${runs.filter(r => r.status === 'running' || r.status === 'queued').length} running or queued), codex ${ids.join(', ')}; ${others.size} other username(s) anonymised`);
})().catch(e => { console.error(e.message); process.exit(1); });
