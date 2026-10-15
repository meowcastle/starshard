// The sim's own database (WORKORDER-SIM-DB-STRIPE-14OCT.md, steps 1 and 2): accounts, sessions, plans and
// a credits ledger in one SQLite file on the data volume. Brews, runs and logs stay in their JSON files for
// now (step 4 moves them). Node's built-in SQLite (node:sqlite), so the image needs no native module.
//
// Two kinds of account (Justin, 14 Oct 2026: anyone who reaches the site can sign up):
//   source 'sim'        signed up on the sim itself: a name and a password (scrypt), the free plan.
//   source 'starshard'  the founders on SIM_USERS, who sign in with their Star Shard login; keyed to the
//                       Star Shard user id (from the session token Star Shard issues at login).
// Either way the sim keeps its own session after login, so Star Shard is asked once per login rather than
// on every request. A name belongs to one account: founders' names and every existing deck owner's name
// are reserved at startup, so a sign-up can never take over someone's decks.
//
// Credits: 1 credit is about a minute of simulator time. Balance is a sum over the ledger, never a column.
// A run is reserved when queued (its estimate, negative) and settled when it finishes (the unused part
// back; never more than the quote). Every row also carries `cost`, the credits the action was priced at,
// so a plan that doesn't charge (founders) still records what each person's use would have cost.
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { DatabaseSync } = require('node:sqlite');

const KINDS = ['grant', 'purchase', 'subscription', 'run', 'ask', 'weekly', 'refund', 'adjust'];
const SESSION_DAYS = 60;

// The plans. Prices and pack sizes are Justin's to set (work order §6); none charge until a plan flag flips.
// features: brews (max, null = unlimited), fields (opponent sets allowed), runsPerDay/asksPerDay (null = no
// daily cap), weekly (the weekly rerun), sharing (the guide's share link).
const PLANS = [
  { code: 'founder', name: "Founders' plan", charges: 0, monthly_credits: 0, features: { brews: null, fields: ['meta20', 'meta10', 'team'], runsPerDay: 'config', asksPerDay: 'config', weekly: true, sharing: true } },
  // charges 0 until Stripe exists: the daily caps are the brake (Justin, 14 Oct 2026)
  { code: 'free', name: 'Free', charges: 0, monthly_credits: 0, features: { brews: 1, fields: ['meta10'], runsPerDay: 1, asksPerDay: 2, weekly: false, sharing: false } },
  { code: 'member', name: 'Member', charges: 1, monthly_credits: 600, features: { brews: null, fields: ['meta20', 'meta10', 'team'], runsPerDay: null, asksPerDay: null, weekly: true, sharing: true } },
];

const SCHEMA = `
CREATE TABLE IF NOT EXISTS meta (key TEXT PRIMARY KEY, value TEXT);
CREATE TABLE IF NOT EXISTS plans (
  code TEXT PRIMARY KEY, name TEXT NOT NULL, charges INTEGER NOT NULL DEFAULT 0,
  monthly_credits INTEGER NOT NULL DEFAULT 0, price_id TEXT, features TEXT NOT NULL DEFAULT '{}');
CREATE TABLE IF NOT EXISTS accounts (
  id INTEGER PRIMARY KEY, created INTEGER NOT NULL, name TEXT NOT NULL UNIQUE COLLATE NOCASE,
  source TEXT NOT NULL CHECK (source IN ('sim','starshard')), starshard_id INTEGER UNIQUE, pass_hash TEXT,
  email TEXT, stripe_customer_id TEXT UNIQUE, plan TEXT NOT NULL REFERENCES plans(code), status TEXT NOT NULL DEFAULT 'active',
  flags TEXT NOT NULL DEFAULT '{}');
CREATE TABLE IF NOT EXISTS sessions (
  token_hash TEXT PRIMARY KEY, account_id INTEGER NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  created INTEGER NOT NULL, last_seen INTEGER NOT NULL, expires INTEGER NOT NULL);
CREATE INDEX IF NOT EXISTS sessions_account ON sessions(account_id);
CREATE TABLE IF NOT EXISTS ledger (
  id INTEGER PRIMARY KEY, account_id INTEGER NOT NULL REFERENCES accounts(id) ON DELETE CASCADE, at INTEGER NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN ('grant','purchase','subscription','run','ask','weekly','refund','adjust')),
  credits INTEGER NOT NULL, cost INTEGER NOT NULL DEFAULT 0, ref TEXT, note TEXT);
CREATE INDEX IF NOT EXISTS ledger_account ON ledger(account_id, at);
-- one reserve and one settle per run, one grant per Stripe object: a retried call can't double-count
CREATE UNIQUE INDEX IF NOT EXISTS ledger_once ON ledger(kind, ref) WHERE ref IS NOT NULL;
-- sign-in and change-of-address codes (change 15): one live code per address and purpose, only its hash kept
CREATE TABLE IF NOT EXISTS auth_codes (
  email TEXT NOT NULL, purpose TEXT NOT NULL, code_hash TEXT NOT NULL, account_id INTEGER REFERENCES accounts(id) ON DELETE CASCADE,
  created INTEGER NOT NULL, expires INTEGER NOT NULL, tries INTEGER NOT NULL DEFAULT 0, PRIMARY KEY (email, purpose));
CREATE TABLE IF NOT EXISTS stripe_events (
  id TEXT PRIMARY KEY, type TEXT NOT NULL, received INTEGER NOT NULL, processed INTEGER, payload TEXT NOT NULL);
`;

const hash = t => crypto.createHash('sha256').update(String(t)).digest('hex');

// Passwords: scrypt with a random salt, stored as scrypt$<salt>$<key>.
const SCRYPT = { N: 16384, r: 8, p: 1, maxmem: 64 * 1024 * 1024 };
function hashPassword(pw) { const salt = crypto.randomBytes(16); return 'scrypt$' + salt.toString('base64url') + '$' + crypto.scryptSync(String(pw), salt, 64, SCRYPT).toString('base64url'); }
function checkPassword(pw, stored) {
  const [kind, salt, key] = String(stored || '').split('$'); if (kind !== 'scrypt' || !salt || !key) return false;
  const want = Buffer.from(key, 'base64url'), got = crypto.scryptSync(String(pw), Buffer.from(salt, 'base64url'), want.length, SCRYPT);
  return crypto.timingSafeEqual(want, got);
}
// A name a person can sign up with: 3-24 letters, digits, _ or -, starting with a letter or digit.
const NAME = /^[A-Za-z0-9][A-Za-z0-9_-]{2,23}$/;

// The Star Shard user id inside its session token (a JWT: header.payload.signature). Only ever read from a
// token Star Shard itself just handed us or just accepted, so the signature has already been checked there.
function starshardId(token) {
  try { const p = JSON.parse(Buffer.from(String(token).split('.')[1], 'base64url').toString('utf8')); return Number.isInteger(p.uid) ? p.uid : null; } catch { return null; }
}

function open(file, { runsPerDay = 3, asksPerDay = 10 } = {}) {
  if (file !== ':memory:') fs.mkdirSync(path.dirname(file), { recursive: true });
  const db = new DatabaseSync(file);
  db.exec('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON; PRAGMA busy_timeout = 3000;');
  db.exec(SCHEMA);
  const upsertPlan = db.prepare(`INSERT INTO plans (code, name, charges, monthly_credits, features) VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(code) DO UPDATE SET name = excluded.name, charges = excluded.charges, monthly_credits = excluded.monthly_credits, features = excluded.features`);
  for (const p of PLANS) upsertPlan.run(p.code, p.name, p.charges, p.monthly_credits, JSON.stringify(p.features));
  db.prepare("INSERT OR IGNORE INTO meta (key, value) VALUES ('schema', '1')").run();
  // change 15: the account's mail settings. mailable goes false on a bounce or a complaint (Resend's webhook);
  // mail holds { digest, runDone }, read through mailOf() so an old row gets the defaults.
  const cols = new Set(db.prepare('PRAGMA table_info(accounts)').all().map(c => c.name));
  if (!cols.has('mailable')) db.exec('ALTER TABLE accounts ADD COLUMN mailable INTEGER NOT NULL DEFAULT 1');
  if (!cols.has('mail')) db.exec("ALTER TABLE accounts ADD COLUMN mail TEXT NOT NULL DEFAULT '{}'");
  db.exec('CREATE UNIQUE INDEX IF NOT EXISTS accounts_email ON accounts(lower(email)) WHERE email IS NOT NULL');

  const q = {
    accountByStarshard: db.prepare('SELECT * FROM accounts WHERE starshard_id = ?'),
    accountByName: db.prepare('SELECT * FROM accounts WHERE name = ?'),
    accountById: db.prepare('SELECT * FROM accounts WHERE id = ?'),
    insertAccount: db.prepare('INSERT INTO accounts (created, name, source, starshard_id, pass_hash, plan, flags) VALUES (?, ?, ?, ?, ?, ?, ?)'),
    link: db.prepare('UPDATE accounts SET name = ?, starshard_id = COALESCE(starshard_id, ?) WHERE id = ?'),
    setPlan: db.prepare('UPDATE accounts SET plan = ? WHERE id = ?'),
    plan: db.prepare('SELECT * FROM plans WHERE code = ?'),
    insertSession: db.prepare('INSERT OR REPLACE INTO sessions (token_hash, account_id, created, last_seen, expires) VALUES (?, ?, ?, ?, ?)'),
    session: db.prepare('SELECT s.*, a.name, a.source, a.plan, a.status FROM sessions s JOIN accounts a ON a.id = s.account_id WHERE s.token_hash = ? AND s.expires > ?'),
    touch: db.prepare('UPDATE sessions SET last_seen = ? WHERE token_hash = ?'),
    dropSession: db.prepare('DELETE FROM sessions WHERE token_hash = ?'),
    dropExpired: db.prepare('DELETE FROM sessions WHERE expires <= ?'),
    insertLedger: db.prepare('INSERT INTO ledger (account_id, at, kind, credits, cost, ref, note) VALUES (?, ?, ?, ?, ?, ?, ?)'),
    byRef: db.prepare('SELECT * FROM ledger WHERE kind = ? AND ref = ?'),
    balance: db.prepare('SELECT COALESCE(SUM(credits), 0) AS b FROM ledger WHERE account_id = ?'),
    rows: db.prepare('SELECT * FROM ledger WHERE account_id = ? ORDER BY at, id'),
    accountByEmail: db.prepare('SELECT * FROM accounts WHERE lower(email) = lower(?)'),
    setEmail: db.prepare('UPDATE accounts SET email = ?, mailable = 1 WHERE id = ?'),
    setMail: db.prepare('UPDATE accounts SET mail = ? WHERE id = ?'),
    setMailable: db.prepare('UPDATE accounts SET mailable = ? WHERE lower(email) = lower(?)'),
    putCode: db.prepare('INSERT OR REPLACE INTO auth_codes (email, purpose, code_hash, account_id, created, expires, tries) VALUES (?, ?, ?, ?, ?, ?, 0)'),
    getCode: db.prepare('SELECT * FROM auth_codes WHERE email = ? AND purpose = ?'),
    triedCode: db.prepare('UPDATE auth_codes SET tries = tries + 1 WHERE email = ? AND purpose = ?'),
    dropCode: db.prepare('DELETE FROM auth_codes WHERE email = ? AND purpose = ?'),
    dropOldCodes: db.prepare('DELETE FROM auth_codes WHERE expires <= ?'),
    openRuns: db.prepare("SELECT r.* FROM ledger r WHERE r.kind IN ('run', 'weekly') AND r.ref IS NOT NULL AND NOT EXISTS (SELECT 1 FROM ledger s WHERE s.kind = 'adjust' AND s.ref = r.ref || ':settle')"),
  };

  const planOf = code => { const p = q.plan.get(code) || q.plan.get('founder'); const f = JSON.parse(p.features);
    if (f.runsPerDay === 'config') f.runsPerDay = runsPerDay; if (f.asksPerDay === 'config') f.asksPerDay = asksPerDay;
    return { code: p.code, name: p.name, charges: !!p.charges, monthlyCredits: p.monthly_credits, priceId: p.price_id, features: f }; };

  // Find or make the account for a Star Shard login (a founder). A name reserved at startup, without an id
  // yet, is joined to the id. A sim account holding the name is never handed to a Star Shard login.
  function accountFor({ id, name, plan = 'founder', admin = false }) {
    let a = (id != null && q.accountByStarshard.get(id)) || q.accountByName.get(name);
    if (a && a.source !== 'starshard') throw Object.assign(new Error(`the name ${name} belongs to a simulator account`), { code: 'name_taken' });
    if (!a) { const r = q.insertAccount.run(Date.now(), name, 'starshard', id ?? null, null, plan, JSON.stringify(admin ? { admin: true } : {})); return q.accountById.get(r.lastInsertRowid); }
    if (a.name !== name || (a.starshard_id == null && id != null)) { q.link.run(name, id ?? null, a.id); a = q.accountById.get(a.id); }
    return a;
  }
  // Hold a name for a founder or an existing deck owner, so nobody can sign up as them.
  function reserve0(name) { if (!q.accountByName.get(name)) q.insertAccount.run(Date.now(), name, 'starshard', null, null, 'founder', '{}'); }
  // Sign up on the sim: a new account on the free plan. Throws with a sentence to show.
  function signUp(name, password) {
    name = String(name || '').trim();
    if (!NAME.test(name)) throw new Error('pick a name of 3 to 24 letters, digits, _ or -');
    if (String(password || '').length < 8) throw new Error('pick a password of at least 8 characters');
    if (q.accountByName.get(name)) throw new Error('that name is taken');
    const r = q.insertAccount.run(Date.now(), name, 'sim', null, hashPassword(password), 'free', '{}');
    return q.accountById.get(r.lastInsertRowid);
  }
  // A sim account's sign-in: the account, or null. Star Shard accounts (no password here) return null.
  function signIn(name, password) {
    const a = q.accountByName.get(String(name || '').trim());
    if (!a || a.source !== 'sim' || a.status !== 'active') { if (!a) hashPassword('x'); return null; }   // even timing for unknown names
    return checkPassword(password, a.pass_hash) ? a : null;
  }

  // Sessions: the cookie holds a random token; only its hash is stored.
  function startSession(accountId, token = crypto.randomBytes(24).toString('base64url')) {
    const now = Date.now(); q.insertSession.run(hash(token), accountId, now, now, now + SESSION_DAYS * 864e5); return token;
  }
  function session(token) {
    if (!token) return null;
    const s = q.session.get(hash(token), Date.now()); if (!s || s.status !== 'active') return null;
    if (Date.now() - s.last_seen > 3600e3) q.touch.run(Date.now(), s.token_hash);
    return { accountId: s.account_id, name: s.name, source: s.source, plan: s.plan, lastSeen: s.last_seen };
  }
  const endSession = token => { if (token) q.dropSession.run(hash(token)); };

  // ---- email (change 15) ----
  const MAIL_DEFAULTS = { digest: true, runDone: false };
  const normEmail = e => String(e || '').trim().toLowerCase();
  const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const mailOf = a => { let m = {}; try { m = JSON.parse(a.mail || '{}'); } catch {} return { ...MAIL_DEFAULTS, ...m }; };
  function setMail(accountId, patch) {
    const a = q.accountById.get(accountId), m = mailOf(a);
    for (const k of Object.keys(MAIL_DEFAULTS)) if (typeof patch[k] === 'boolean') m[k] = patch[k];
    q.setMail.run(JSON.stringify(m), accountId); return m;
  }
  // A six-digit code for an address: 10 minutes, 5 tries, one live code per address and purpose (a new one
  // replaces the old). Returns the code; only its hash is stored.
  const CODE_MS = 10 * 60e3, CODE_TRIES = 5;
  const codeHash = (email, code) => hash(email + ':' + String(code).replace(/\D/g, ''));
  function issueCode(email, purpose, accountId = null) {
    email = normEmail(email); const code = String(crypto.randomInt(0, 1e6)).padStart(6, '0'), now = Date.now();
    q.putCode.run(email, purpose, codeHash(email, code), accountId, now, now + CODE_MS); return code;
  }
  // Check a code: { ok, accountId } or { ok: false, error } with the sentence to show.
  function checkCode(email, purpose, code) {
    email = normEmail(email); const c = q.getCode.get(email, purpose);
    if (!c) return { ok: false, error: 'No code is waiting for that address. Send a new one.' };
    if (c.expires <= Date.now()) { q.dropCode.run(email, purpose); return { ok: false, error: 'Code expired. Send a new one.' }; }
    if (c.tries >= CODE_TRIES) return { ok: false, error: 'Too many tries. Send a new code.' };
    const want = Buffer.from(c.code_hash, 'hex'), got = Buffer.from(codeHash(email, code), 'hex');
    if (!crypto.timingSafeEqual(want, got)) {
      q.triedCode.run(email, purpose); const left = CODE_TRIES - c.tries - 1;
      return { ok: false, error: left > 0 ? `Wrong code. ${left} ${left === 1 ? 'try' : 'tries'} left.` : 'Too many tries. Send a new code.' };
    }
    q.dropCode.run(email, purpose); return { ok: true, accountId: c.account_id, email };
  }
  // Give an account an address (it has proved it holds it). Throws if another account has it.
  function setEmail(accountId, email) {
    email = normEmail(email); const other = q.accountByEmail.get(email);
    if (other && other.id !== accountId) throw new Error('That address is on another account.');
    q.setEmail.run(email, accountId); return q.accountById.get(accountId);
  }
  // A new account from an email sign-in (sign-up open): its name from the address, made unique.
  function signUpByEmail(email) {
    email = normEmail(email);
    let base = email.split('@')[0].replace(/[^A-Za-z0-9_-]/g, '').slice(0, 18); if (!/^[A-Za-z0-9]/.test(base)) base = 'player' + base;
    if (base.length < 3) base = (base + 'player').slice(0, 8);
    let name = base; for (let i = 2; q.accountByName.get(name); i++) name = base.slice(0, 20) + i;
    const r = q.insertAccount.run(Date.now(), name, 'sim', null, null, 'free', '{}');
    q.setEmail.run(email, r.lastInsertRowid); return q.accountById.get(r.lastInsertRowid);
  }

  const balance = accountId => q.balance.get(accountId).b;
  // one ledger row; a repeated (kind, ref) is a no-op that returns the existing row
  function post(accountId, kind, credits, { cost = 0, ref = null, note = null } = {}) {
    if (!KINDS.includes(kind)) throw new Error('unknown ledger kind ' + kind);
    if (ref != null) { const had = q.byRef.get(kind, ref); if (had) return had; }
    q.insertLedger.run(accountId, Date.now(), kind, Math.round(credits), Math.round(cost), ref, note);
    return q.byRef.get(kind, ref) || null;
  }

  // Reserve a run (or a weekly rerun) at its quote. On a plan that doesn't charge, credits are 0 and the
  // quote goes in `cost`. Returns { ok } or { ok: false, need, have } when the balance is short.
  function reserve(accountId, { kind = 'run', ref, credits, note, free = false }) {
    const a = q.accountById.get(accountId), p = planOf(a.plan), charge = p.charges && !free;
    if (charge && balance(accountId) < credits) return { ok: false, need: credits, have: balance(accountId) };
    post(accountId, kind, charge ? -credits : 0, { cost: credits, ref, note });
    return { ok: true, charged: charge ? credits : 0 };
  }
  // Settle a reserved run at what it used: the unused part comes back, never more than the quote is charged.
  function settle(ref, usedCredits, note) {
    const r = q.byRef.get('run', ref) || q.byRef.get('weekly', ref); if (!r) return null;
    const used = Math.max(0, Math.min(r.cost, Math.round(usedCredits)));
    const back = r.credits < 0 ? Math.round(-r.credits * (r.cost - used) / Math.max(1, r.cost)) : 0;
    return post(r.account_id, 'adjust', back, { cost: used - r.cost, ref: ref + ':settle', note: note || `used ${used} of ${r.cost}` });
  }
  const openRuns = () => q.openRuns.all();

  // The ledger as the Account tab reads it: newest first, with the balance after each row.
  function statement(accountId, limit = 50) {
    let run = 0; const all = q.rows.all(accountId).map(r => ({ id: r.id, at: r.at, kind: r.kind, credits: r.credits, cost: r.cost, ref: r.ref, note: r.note, balance: (run += r.credits) }));
    return all.reverse().slice(0, limit);
  }

  // Nightly copy (VACUUM INTO), seven kept.
  function backup(dir) {
    fs.mkdirSync(dir, { recursive: true });
    const f = path.join(dir, `sim-${new Date().toISOString().slice(0, 10)}.db`);
    if (!fs.existsSync(f)) db.exec(`VACUUM INTO '${f.replace(/'/g, "''")}'`);
    const old = fs.readdirSync(dir).filter(n => /^sim-\d{4}-\d{2}-\d{2}\.db$/.test(n)).sort().slice(0, -7);
    for (const n of old) fs.unlinkSync(path.join(dir, n));
    return f;
  }

  return { db, accountFor, reserveName: reserve0, signUp, signIn, account: id => q.accountById.get(id), accountByName: n => q.accountByName.get(n), setPlan: (id, code) => q.setPlan.run(code, id), planOf,
    startSession, session, endSession, sweepSessions: () => { q.dropExpired.run(Date.now()); q.dropOldCodes.run(Date.now()); },
    accountByEmail: e => q.accountByEmail.get(normEmail(e)), validEmail: e => EMAIL.test(normEmail(e)) && normEmail(e).length <= 200, normEmail,
    mailOf, setMail, setEmail, setMailable: (email, ok) => q.setMailable.run(ok ? 1 : 0, normEmail(email)), issueCode, checkCode, signUpByEmail, balance, post, reserve, settle, openRuns, statement, backup };
}

module.exports = { open, starshardId, hash, hashPassword, checkPassword, PLANS, KINDS };
