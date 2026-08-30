require('dotenv').config();

const http = require('http');
const crypto = require('crypto');
const express = require('express');
const cookieParser = require('cookie-parser');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mysql = require('mysql2/promise');
const rateLimit = require('express-rate-limit');
const { Resend } = require('resend');
const { Server: SocketIOServer } = require('socket.io');
const { createManzilLobby } = require('./lib/manzil-lobby');
const { minAgeForTz } = require('./lib/age-gate');

const PORT = process.env.PORT || 4001;
const JWT_SECRET = process.env.JWT_SECRET;
const COOKIE_NAME = 'starshard_session';
const IS_PROD = process.env.NODE_ENV === 'production';
const APP_URL = process.env.APP_URL || 'https://staging.starshard.net';
const RESEND_FROM = process.env.RESEND_FROM || 'Star Shard <no-reply@starshard.net>';

if (!JWT_SECRET) {
  console.error('JWT_SECRET is not set. Refusing to start.');
  process.exit(1);
}

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
if (!resend) {
  console.warn('RESEND_API_KEY is not set. Password reset emails will not send.');
}

const ADMIN_TOKEN = process.env.ADMIN_TOKEN || null;
if (!ADMIN_TOKEN) {
  console.warn('ADMIN_TOKEN is not set. Guestbook moderation endpoints are disabled.');
}

// Production connects over the NAS's unix socket (DB_SOCKET); local dev
// against a plain TCP mysqld (Docker, Homebrew, etc.) has no such socket, so
// DB_HOST/DB_PORT is a real alternative, not a hypothetical one — used to
// stand up and test this file's new /api/me/export and DELETE /api/me
// against a real MySQL 8 container, cascade deletes included.
const pool = mysql.createPool(
  process.env.DB_HOST
    ? {
        host: process.env.DB_HOST, port: Number(process.env.DB_PORT) || 3306,
        user: process.env.DB_USER, password: process.env.DB_PASSWORD, database: process.env.DB_NAME,
        waitForConnections: true, connectionLimit: 5,
      }
    : {
        socketPath: process.env.DB_SOCKET,
        user: process.env.DB_USER, password: process.env.DB_PASSWORD, database: process.env.DB_NAME,
        waitForConnections: true, connectionLimit: 5,
      }
);

if (IS_PROD && !process.env.ALLOWED_ORIGINS) {
  console.error('ALLOWED_ORIGINS is not set in production. Refusing to start.');
  process.exit(1);
}

const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || 'https://staging.starshard.net')
  .split(',').map(o => o.trim()).filter(Boolean);

const app = express();
app.set('trust proxy', 1);
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Vary', 'Origin');
  }
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(204).end();
  }
  next();
});
app.use(express.json({ limit: '256kb' }));
app.use(cookieParser());

// Express 4 does not catch rejections from async route handlers — an unhandled
// rejection terminates the process under Node >=15. Every async handler must be
// wrapped in this, which routes failures to the error middleware at the bottom.
const wrap = fn => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

// username rides along in the JWT purely so the Manzil lobby can show a
// real display name without ever needing its own DB connection just for
// that (see manzil-lobby.js's tryUidFromCookie). It's cosmetic, not an
// auth claim — token_version is still what actually gates access.
function signSession(userId, tokenVersion, username) {
  return jwt.sign({ uid: userId, tv: tokenVersion, username }, JWT_SECRET, { expiresIn: '90d' });
}

// Verifies the JWT AND that its token version still matches the DB, so a
// logout (or password reset) actually revokes the token server-side instead
// of just deleting the cookie on one device. Wrapped like every other async
// handler — a DB hiccup here must 500, not crash the process.
const requireAuth = wrap(async (req, res, next) => {
  const token = req.cookies[COOKIE_NAME];
  if (!token) return res.status(401).json({ error: 'not_authenticated' });
  let payload;
  try {
    payload = jwt.verify(token, JWT_SECRET);
  } catch (e) {
    return res.status(401).json({ error: 'not_authenticated' });
  }
  const [rows] = await pool.execute('SELECT token_version FROM users WHERE id = ?', [payload.uid]);
  const user = rows[0];
  if (!user || user.token_version !== payload.tv) {
    return res.status(401).json({ error: 'not_authenticated' });
  }
  req.userId = payload.uid;
  next();
});

// Minimal moderation gate: a single shared token in .env, sent as a header.
// No admin UI or user roles exist yet — this exists so a spammer's posts can
// actually be removed, not to model permissions properly. See OWNERSHIP.md W11b.
function requireAdmin(req, res, next) {
  const provided = req.headers['x-admin-token'];
  if (!ADMIN_TOKEN || typeof provided !== 'string') {
    return res.status(403).json({ error: 'not_authorized' });
  }
  const a = Buffer.from(provided), b = Buffer.from(ADMIN_TOKEN);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    return res.status(403).json({ error: 'not_authorized' });
  }
  next();
}

function setSessionCookie(res, userId, tokenVersion, username) {
  res.cookie(COOKIE_NAME, signSession(userId, tokenVersion, username), {
    httpOnly: true,
    secure: IS_PROD,
    sameSite: 'lax',
    maxAge: 90 * 24 * 60 * 60 * 1000,
    path: '/',
  });
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USERNAME_RE = /^[a-z0-9_]{3,20}$/;
const TIME_RE = /^([01]\d|2[0-3]):([0-5]\d)$/;
const MIN_BIRTH_YEAR = 1900;

// Shared date-parts validator — used both by parseBirthFields (Star
// Shard's opt-in birth_data path) and computeAge (Manzil's age gate).
// Rejects anything that isn't a real calendar date in a sane year range.
function parseBirthDateParts(birthDate) {
  if (typeof birthDate !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(birthDate)) return null;
  const [y, m, d] = birthDate.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  const currentYear = new Date().getUTCFullYear();
  if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== m - 1 || dt.getUTCDate() !== d) return null;
  if (y < MIN_BIRTH_YEAR || y > currentYear) return null;
  return { y, m, d };
}

// UTC-based so the 16th-birthday boundary is deterministic regardless of
// the server's local timezone (24 Aug PM handoff §3). Returns null for an
// unparseable date, an integer age otherwise.
function computeAge(birthDate) {
  const parts = parseBirthDateParts(birthDate);
  if (!parts) return null;
  const now = new Date();
  const nowY = now.getUTCFullYear(), nowM = now.getUTCMonth() + 1, nowD = now.getUTCDate();
  let age = nowY - parts.y;
  const hadBirthdayThisYear = nowM > parts.m || (nowM === parts.m && nowD >= parts.d);
  if (!hadBirthdayThisYear) age--;
  return age;
}

// Replaced 30 Aug 2026 (Justin's call) with lib/age-gate.js's per-region
// minAgeForTz() — 13 worldwide by default, 16 (or 14/15) only in the
// GDPR member states that set a higher digital-consent age. See that
// file's header for the region-detection method and its limits.

// Star Shard's opt-in path only (PUT /api/me/birth) — Manzil signup never
// calls this anymore, see the 24 Aug PM handoff §2. Only birthDate is
// required everywhere; place/lat/lon/tz stay optional and can be upgraded
// later once a fuller onboarding (Star Shard's) supplies them.
function parseBirthFields(body) {
  const { birthDate, birthTime, birthTimeKnown, placeName, lat, lon, tz } = body || {};
  if (!parseBirthDateParts(birthDate)) return null;

  const timeKnown = birthTimeKnown !== false;
  let time = null;
  if (timeKnown && birthTime !== undefined && birthTime !== null) {
    if (typeof birthTime !== 'string' || !TIME_RE.test(birthTime)) return null;
    time = birthTime;
  }

  const nullOr = (v, ok) => v === undefined || v === null || ok(v);
  if (!nullOr(placeName, v => typeof v === 'string' && v.length <= 255)) return null;
  if (!nullOr(lat, v => typeof v === 'number' && v >= -90 && v <= 90)) return null;
  if (!nullOr(lon, v => typeof v === 'number' && v >= -180 && v <= 180)) return null;
  if (!nullOr(tz, v => typeof v === 'string' && v.length <= 64)) return null;

  return {
    birthDate, birthTime: time, birthTimeKnown: timeKnown,
    placeName: placeName ?? null, lat: lat ?? null, lon: lon ?? null, tz: tz ?? null,
  };
}

// Manzil's signup fields: five integers (the chart-owned mansions) and the
// twelve-card starting pack, both already computed client-side by
// _castFive()/_saveBirth() — the server only re-validates the shape, per
// the 24 Aug PM handoff §2's "store inputs" principle: these ARE the
// inputs Manzil needs, nothing upstream of them (no raw birth data) is
// stored for it.
function parseManzilPack(body) {
  const { five, pack } = body || {};
  const validIds = arr => Array.isArray(arr) && arr.every(n => Number.isInteger(n) && n >= 1 && n <= 28);
  if (!validIds(five) || five.length !== 5) return null;
  if (!validIds(pack) || pack.length < 5 || pack.length > 12) return null;
  return { five: [...new Set(five)], pack: [...new Set(pack)] };
}

// A short reserved-name list plus an optional, team-supplied wordlist
// (research/username-blocklist.json — absent today, this ships with just
// the reserved-name check until a real list exists). Checked at signup
// only, never at display time, per the handoff's §6.2. Stripping digits/
// underscores before comparing catches near-misses like "admin_1" or
// "_staff_" without needing a fuzzy-match library.
const RESERVED_USERNAMES = ['admin', 'administrator', 'mod', 'moderator', 'staff', 'support', 'starshard', 'manzil', 'root', 'system', 'official'];
let USERNAME_BLOCKLIST_EXTRA = [];
try { USERNAME_BLOCKLIST_EXTRA = require('../research/username-blocklist.json'); } catch (e) { /* optional */ }
function isBlockedUsername(u) {
  const norm = u.replace(/[_\d]/g, '');
  return RESERVED_USERNAMES.some(w => norm.includes(w)) || USERNAME_BLOCKLIST_EXTRA.some(w => norm.includes(w));
}

const signupLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 8,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'too_many_requests' },
});
const ageCheckLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 8,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'too_many_requests' },
});
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'too_many_requests' },
});
const forgotPasswordLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'too_many_requests' },
});
const resetPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'too_many_requests' },
});
const guestbookPostLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'too_many_requests' },
});
const deleteAccountLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'too_many_requests' },
});

// Keep in sync with STAMPS in Star Shard v2.dc.html — the guestbook is
// public/unauthenticated, so the stamp is validated against a fixed set
// rather than trusting arbitrary client input.
const GUESTBOOK_STAMPS = new Set(['⭐', '🎀', '🌙', '💿', '✿']);

// Nothing is persisted on either branch — the client calls this right
// after "cast your five" and before ever showing account fields, so a
// 15-year-old never reaches a signup screen at all. Not a real barrier
// (the client controls what it does with {ok}), which is fine per the
// handoff's own framing: this is the documented reasonable-effort
// standard, not enforcement. Signup re-checks the age itself regardless.
app.post('/api/auth/age-check', ageCheckLimiter, wrap(async (req, res) => {
  const { birthDate, tz } = req.body || {};
  const age = computeAge(birthDate);
  if (age === null) return res.status(400).json({ error: 'invalid_birth_date' });
  res.json({ ok: age >= minAgeForTz(tz) });
}));

app.post('/api/auth/signup', signupLimiter, wrap(async (req, res) => {
  const { email, password, username } = req.body || {};
  if (typeof email !== 'string' || typeof password !== 'string' || typeof username !== 'string') {
    return res.status(400).json({ error: 'invalid_input' });
  }
  const normalizedEmail = email.trim().toLowerCase();
  const normalizedUsername = username.trim().toLowerCase();
  if (!EMAIL_RE.test(normalizedEmail) || password.length < 8) {
    return res.status(400).json({ error: 'invalid_input' });
  }
  if (!USERNAME_RE.test(normalizedUsername) || isBlockedUsername(normalizedUsername)) {
    return res.status(400).json({ error: 'invalid_username' });
  }
  // Re-checked here regardless of whatever /api/auth/age-check answered
  // earlier — the client is never trusted to have actually called it, and
  // this re-check uses its OWN region read (req.body.tz) rather than
  // trusting a region the age-check call might have used — same posture
  // as the birth date itself, just extended to the one new signal.
  const age = computeAge(req.body && req.body.birthDate);
  if (age === null) return res.status(400).json({ error: 'invalid_birth_date' });
  if (age < minAgeForTz(req.body && req.body.tz)) return res.status(403).json({ error: 'too_young' });
  const birthYear = Number(String(req.body.birthDate).slice(0, 4));

  const manzilPack = parseManzilPack(req.body);
  if (!manzilPack) return res.status(400).json({ error: 'invalid_input' });

  const passwordHash = await bcrypt.hash(password, 12);
  // A signup writes to two tables (users, manzil_pack) that must both land
  // or neither should. manzil_pack, not birth_data — see the 24 Aug PM
  // handoff §2: Manzil stores five integers, never the birth date/time/
  // place itself. birth_data stays exclusively the Star Shard opt-in path
  // (PUT /api/me/birth).
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [result] = await conn.execute(
      'INSERT INTO users (email, username, password_hash) VALUES (?, ?, ?)',
      [normalizedEmail, normalizedUsername, passwordHash]
    );
    await conn.execute(
      'INSERT INTO manzil_pack (user_id, five_json, pack_json, birth_year) VALUES (?, ?, ?, ?)',
      [result.insertId, JSON.stringify(manzilPack.five), JSON.stringify(manzilPack.pack), birthYear]
    );
    await conn.commit();
    setSessionCookie(res, result.insertId, 0, normalizedUsername);
    res.status(201).json({ email: normalizedEmail, username: normalizedUsername });
  } catch (e) {
    await conn.rollback();
    if (e && e.code === 'ER_DUP_ENTRY') {
      const onUsername = typeof e.sqlMessage === 'string' && e.sqlMessage.includes('username');
      return res.status(409).json({ error: onUsername ? 'username_taken' : 'email_taken' });
    }
    console.error(e);
    res.status(500).json({ error: 'server_error' });
  } finally {
    conn.release();
  }
}));

// Accepts EITHER email or username as the identifier — Star Shard v4's
// account sheet only ever sends email; the Account Portal's signin screen
// only collects a username (Manzil players sign in by the name they play
// under, not their address). Both land here rather than splitting into
// two routes, since the only difference is which column to match.
app.post('/api/auth/login', loginLimiter, wrap(async (req, res) => {
  const { email, username, password } = req.body || {};
  const identifier = typeof username === 'string' ? username.trim().toLowerCase()
    : typeof email === 'string' ? email.trim().toLowerCase() : null;
  if (!identifier || typeof password !== 'string') {
    return res.status(400).json({ error: 'invalid_input' });
  }

  const [rows] = await pool.execute(
    'SELECT id, email, username, password_hash, token_version FROM users WHERE email = ? OR username = ?',
    [identifier, identifier]
  );
  const user = rows[0];
  if (!user) return res.status(401).json({ error: 'invalid_credentials' });

  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) return res.status(401).json({ error: 'invalid_credentials' });

  setSessionCookie(res, user.id, user.token_version, user.username);
  res.json({ email: user.email, username: user.username });
}));

app.post('/api/auth/logout', wrap(async (req, res) => {
  const token = req.cookies[COOKIE_NAME];
  if (token) {
    try {
      const payload = jwt.verify(token, JWT_SECRET);
      // Bumping token_version revokes this token server-side, not just the
      // cookie — a copy of the JWT captured elsewhere stops working too.
      await pool.execute('UPDATE users SET token_version = token_version + 1 WHERE id = ?', [payload.uid]);
    } catch (e) { /* invalid/expired token — nothing to revoke */ }
  }
  res.clearCookie(COOKIE_NAME, { path: '/' });
  res.status(204).end();
}));

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

app.post('/api/auth/forgot-password', forgotPasswordLimiter, wrap(async (req, res) => {
  const { email } = req.body || {};
  if (typeof email !== 'string') {
    return res.status(400).json({ error: 'invalid_input' });
  }
  const normalizedEmail = email.trim().toLowerCase();

  const [rows] = await pool.execute('SELECT id FROM users WHERE email = ?', [normalizedEmail]);
  const user = rows[0];

  if (user) {
    const token = crypto.randomBytes(32).toString('hex');
    const tokenHash = hashToken(token);
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000);
    await pool.execute(
      'INSERT INTO password_resets (user_id, token_hash, expires_at) VALUES (?, ?, ?)',
      [user.id, tokenHash, expiresAt]
    );

    if (resend) {
      // Fragment, not query string: fragments never reach the server, so the
      // token doesn't land in access logs or a Referer header on any outbound
      // link from the reset page.
      const resetUrl = `${APP_URL}/#resetToken=${token}`;
      try {
        await resend.emails.send({
          from: RESEND_FROM,
          to: normalizedEmail,
          subject: 'reset your star shard password',
          html: `<p>someone asked to reset the password on this star shard account.</p>` +
            `<p><a href="${resetUrl}">click here to set a new password</a> (expires in 30 minutes)</p>` +
            `<p>if this wasn't you, you can ignore this email.</p>`,
        });
      } catch (e) {
        console.error('resend send failed', e);
      }
    }
  }

  // always respond the same way, whether or not the email exists
  res.status(204).end();
}));

app.post('/api/auth/reset-password', resetPasswordLimiter, wrap(async (req, res) => {
  const { token, password } = req.body || {};
  if (typeof token !== 'string' || typeof password !== 'string' || password.length < 8) {
    return res.status(400).json({ error: 'invalid_input' });
  }

  const tokenHash = hashToken(token);
  const [rows] = await pool.execute(
    'SELECT id, user_id, expires_at, used_at FROM password_resets WHERE token_hash = ?',
    [tokenHash]
  );
  const reset = rows[0];
  if (!reset || reset.used_at || new Date(reset.expires_at) < new Date()) {
    return res.status(400).json({ error: 'invalid_or_expired_token' });
  }

  const passwordHash = await bcrypt.hash(password, 12);
  // Bump token_version too: a reset should log out every other session, not
  // just issue the resetting device a new cookie alongside old valid ones.
  await pool.execute(
    'UPDATE users SET password_hash = ?, token_version = token_version + 1 WHERE id = ?',
    [passwordHash, reset.user_id]
  );
  // Invalidate every outstanding token for this user, not just the one that
  // was redeemed — otherwise an attacker's still-live token (e.g. from
  // triggering a reset for someone else's email) survives a legitimate reset.
  await pool.execute(
    'UPDATE password_resets SET used_at = NOW() WHERE user_id = ? AND used_at IS NULL',
    [reset.user_id]
  );

  const [uRows] = await pool.execute('SELECT token_version, username FROM users WHERE id = ?', [reset.user_id]);
  setSessionCookie(res, reset.user_id, uRows[0].token_version, uRows[0].username);
  res.status(204).end();
}));

app.get('/api/me', wrap(async (req, res) => {
  const token = req.cookies[COOKIE_NAME];
  if (!token) return res.status(401).json({ error: 'not_authenticated' });
  let payload;
  try {
    payload = jwt.verify(token, JWT_SECRET);
  } catch (e) {
    return res.status(401).json({ error: 'not_authenticated' });
  }
  const [rows] = await pool.execute('SELECT email, username, token_version FROM users WHERE id = ?', [payload.uid]);
  const user = rows[0];
  if (!user || user.token_version !== payload.tv) return res.status(401).json({ error: 'not_authenticated' });
  res.json({ email: user.email, username: user.username });
}));

// Exclusively the Star Shard opt-in path since the 24 Aug PM handoff —
// Manzil signup writes manzil_pack, never this table (see parseManzilPack
// above and the signup route). GET here lets Star Shard's onboarding check
// whether an account already has birth_data on file (e.g. a second device)
// before asking again; PUT below is how it gets there in the first place,
// or how a later, more complete cast (real geocoded lat/lon/tz) upgrades
// an existing row.
app.get('/api/me/birth', requireAuth, wrap(async (req, res) => {
  const [rows] = await pool.execute(
    'SELECT birth_date, birth_time, birth_time_known, place_name, lat, lon, tz FROM birth_data WHERE user_id = ?',
    [req.userId]
  );
  const row = rows[0];
  if (!row) return res.json({ birth: null });
  res.json({
    birth: {
      birthDate: row.birth_date instanceof Date ? row.birth_date.toISOString().slice(0, 10) : row.birth_date,
      birthTime: row.birth_time,
      birthTimeKnown: !!row.birth_time_known,
      placeName: row.place_name,
      lat: row.lat === null ? null : Number(row.lat),
      lon: row.lon === null ? null : Number(row.lon),
      tz: row.tz,
    },
  });
}));

app.put('/api/me/birth', requireAuth, wrap(async (req, res) => {
  const birth = parseBirthFields(req.body);
  if (!birth) return res.status(400).json({ error: 'invalid_birth_date' });

  await pool.execute(
    'INSERT INTO birth_data (user_id, birth_date, birth_time, birth_time_known, place_name, lat, lon, tz) ' +
    'VALUES (?, ?, ?, ?, ?, ?, ?, ?) ' +
    'ON DUPLICATE KEY UPDATE birth_date = VALUES(birth_date), birth_time = VALUES(birth_time), ' +
    'birth_time_known = VALUES(birth_time_known), place_name = VALUES(place_name), ' +
    'lat = VALUES(lat), lon = VALUES(lon), tz = VALUES(tz)',
    [req.userId, birth.birthDate, birth.birthTime, birth.birthTimeKnown ? 1 : 0, birth.placeName, birth.lat, birth.lon, birth.tz]
  );
  res.status(204).end();
}));

// Read-back for manzil_pack — the login-on-a-fresh-browser path, mirroring
// GET /api/me/birth exactly. Signup already returns nothing beyond
// {email, username}; this is what a client fetches afterward (or on a
// second device) to rehydrate five/pack locally without asking again.
app.get('/api/me/manzil-pack', requireAuth, wrap(async (req, res) => {
  const [rows] = await pool.execute(
    'SELECT five_json, pack_json FROM manzil_pack WHERE user_id = ?',
    [req.userId]
  );
  const row = rows[0];
  if (!row) return res.json({ pack: null });
  const parseOr = (json, fallback) => { try { return JSON.parse(json); } catch (e) { return fallback; } };
  res.json({ pack: { five: parseOr(row.five_json, []), pack: parseOr(row.pack_json, []) } });
}));

// Everything this account owns, for the user to keep — W6's "no data
// export" gap. One query per table rather than a join: the tables don't
// share a natural join key (window_state/deck/sigil are 1:1 on user_id,
// recollection is 1:many), and this endpoint runs once in a while for one
// user, not on a hot path, so four small queries over one wide join is the
// simpler and more honest shape here.
app.get('/api/me/export', requireAuth, wrap(async (req, res) => {
  const [[user], [state], [deckRow], [sigilRow], [birthRow], [packRow], reports, blocks, recollection] = await Promise.all([
    pool.execute('SELECT email, username, created_at FROM users WHERE id = ?', [req.userId]).then(([r]) => r),
    pool.execute('SELECT state_json FROM window_state WHERE user_id = ?', [req.userId]).then(([r]) => r),
    pool.execute('SELECT deck_json FROM deck WHERE user_id = ?', [req.userId]).then(([r]) => r),
    pool.execute('SELECT sigil_json FROM sigil WHERE user_id = ?', [req.userId]).then(([r]) => r),
    pool.execute(
      'SELECT birth_date, birth_time, birth_time_known, place_name, lat, lon, tz FROM birth_data WHERE user_id = ?',
      [req.userId]
    ).then(([r]) => r),
    pool.execute(
      'SELECT five_json, pack_json, birth_year FROM manzil_pack WHERE user_id = ?',
      [req.userId]
    ).then(([r]) => r),
    // Only rows where this account is the actor (reporter/blocker), never
    // the target — exporting your own data must not leak who reported you.
    pool.execute(
      'SELECT match_id, reported_user_id, created_at FROM manzil_reports WHERE reporter_user_id = ?',
      [req.userId]
    ).then(([r]) => r),
    pool.execute(
      'SELECT blocked_user_id, created_at FROM manzil_blocks WHERE blocker_user_id = ?',
      [req.userId]
    ).then(([r]) => r),
    pool.execute(
      'SELECT station, step, cast_context_json, kindled_at FROM recollection WHERE user_id = ? ORDER BY kindled_at',
      [req.userId]
    ).then(([r]) => r),
  ]);
  const parseOr = (json, fallback) => { try { return JSON.parse(json); } catch (e) { return fallback; } };

  res.setHeader('Content-Disposition', 'attachment; filename="star-shard-data.json"');
  res.json({
    email: user.email,
    username: user.username,
    accountCreatedAt: user.created_at,
    windowState: state ? parseOr(state.state_json, null) : null,
    deck: deckRow ? parseOr(deckRow.deck_json, null) : null,
    sigil: sigilRow ? parseOr(sigilRow.sigil_json, null) : null,
    birth: birthRow ? {
      birthDate: birthRow.birth_date, birthTime: birthRow.birth_time,
      birthTimeKnown: !!birthRow.birth_time_known, placeName: birthRow.place_name,
      lat: birthRow.lat, lon: birthRow.lon, tz: birthRow.tz,
    } : null,
    manzilPack: packRow ? {
      five: parseOr(packRow.five_json, []), pack: parseOr(packRow.pack_json, []),
      birthYear: packRow.birth_year,
    } : null,
    manzilReportsFiled: reports.map(r => ({ matchId: r.match_id, reportedUserId: r.reported_user_id, createdAt: r.created_at })),
    manzilBlocks: blocks.map(b => ({ blockedUserId: b.blocked_user_id, createdAt: b.created_at })),
    recollection: recollection.map(r => ({
      station: r.station, step: r.step,
      castContext: parseOr(r.cast_context_json, {}),
      kindledAt: r.kindled_at,
    })),
  });
}));

// Deletes the account and everything FK-cascaded from it (window_state,
// deck, sigil, recollection, password_resets — schema.sql's ON DELETE
// CASCADE on every one) — W6's "no account deletion" gap. Requires the
// current password in the body, not just the session cookie: deletion is
// the one action here with no undo, and a valid session alone (forgeable
// via XSS/CSRF in a way a freshly-typed password isn't) shouldn't be
// enough to trigger it — same reasoning reset-password already applies to
// bumping token_version.
app.delete('/api/me', deleteAccountLimiter, requireAuth, wrap(async (req, res) => {
  const { password } = req.body || {};
  if (typeof password !== 'string') return res.status(400).json({ error: 'invalid_input' });

  const [rows] = await pool.execute('SELECT password_hash FROM users WHERE id = ?', [req.userId]);
  const user = rows[0];
  if (!user) return res.status(401).json({ error: 'not_authenticated' });

  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) return res.status(401).json({ error: 'invalid_credentials' });

  await pool.execute('DELETE FROM users WHERE id = ?', [req.userId]);
  res.clearCookie(COOKIE_NAME, { path: '/' });
  res.status(204).end();
}));

app.get('/api/state', requireAuth, wrap(async (req, res) => {
  const [rows] = await pool.execute(
    'SELECT state_json FROM window_state WHERE user_id = ?',
    [req.userId]
  );
  if (!rows[0]) return res.json({ state: null });
  try {
    res.json({ state: JSON.parse(rows[0].state_json) });
  } catch (e) {
    res.json({ state: null });
  }
}));

app.put('/api/state', requireAuth, wrap(async (req, res) => {
  const { state } = req.body || {};
  if (typeof state !== 'object' || state === null) {
    return res.status(400).json({ error: 'invalid_input' });
  }
  const json = JSON.stringify(state);
  if (json.length > 100000) {
    return res.status(413).json({ error: 'state_too_large' });
  }
  await pool.execute(
    'INSERT INTO window_state (user_id, state_json) VALUES (?, ?) ' +
    'ON DUPLICATE KEY UPDATE state_json = VALUES(state_json)',
    [req.userId, json]
  );
  res.status(204).end();
}));

app.get('/api/deck', requireAuth, wrap(async (req, res) => {
  const [rows] = await pool.execute(
    'SELECT deck_json FROM deck WHERE user_id = ?',
    [req.userId]
  );
  if (!rows[0]) return res.json({ deck: null });
  try {
    res.json({ deck: JSON.parse(rows[0].deck_json) });
  } catch (e) {
    res.json({ deck: null });
  }
}));

app.put('/api/deck', requireAuth, wrap(async (req, res) => {
  const { deck } = req.body || {};
  // Bounded domain (28 lunar mansions), unlike window_state's opaque blob —
  // validate the shape, not just that it's JSON-serializable.
  if (!Array.isArray(deck) || deck.length > 28 || !deck.every(n => Number.isInteger(n) && n >= 0 && n <= 27)) {
    return res.status(400).json({ error: 'invalid_input' });
  }
  const json = JSON.stringify([...new Set(deck)]);
  await pool.execute(
    'INSERT INTO deck (user_id, deck_json) VALUES (?, ?) ' +
    'ON DUPLICATE KEY UPDATE deck_json = VALUES(deck_json)',
    [req.userId, json]
  );
  res.status(204).end();
}));

// -- Sigil + Recollection (the reboot) ---------------------------------
//
// Engine modules (sigil.js/deck.js/astro.js) live at repo root, which has
// its own `"type": "module"` package.json — this file's own `"type":
// "commonjs"` doesn't apply to them. Node resolves an import specifier
// relative to the module doing the importing, so a dynamic import() of
// those files from here correctly loads them as ESM regardless of this
// file's own type. Cached after the first call.
let _enginePromise = null;
function loadEngine() {
  if (!_enginePromise) {
    _enginePromise = Promise.all([
      import('../sigil.js'),
      import('../deck.js'),
      import('../astro.js'),
    ]).then(([sigilMod, deckMod, astroMod]) => ({ sigilMod, deckMod, astroMod }));
  }
  return _enginePromise;
}

app.get('/api/sigil', requireAuth, wrap(async (req, res) => {
  const [rows] = await pool.execute('SELECT sigil_json FROM sigil WHERE user_id = ?', [req.userId]);
  if (!rows[0]) return res.json({ sigil: null });
  try {
    res.json({ sigil: JSON.parse(rows[0].sigil_json) });
  } catch (e) {
    res.json({ sigil: null });
  }
}));

app.put('/api/sigil', requireAuth, wrap(async (req, res) => {
  const { sigil } = req.body || {};
  if (!sigil || typeof sigil !== 'object') return res.status(400).json({ error: 'invalid_input' });

  const inRange = (n, lo, hi) => Number.isInteger(n) && n >= lo && n <= hi;
  const nullOr = (v, ok) => v === null || ok(v);
  const TYPES = ['seedborn', 'homebound', 'outbound', 'emberwake', 'farbank'];
  const { sunStation, sunStep, moonStation, moonStep, risingStation, natalLight, keeper, type, farlight } = sigil;

  const shapeOk =
    inRange(sunStation, 0, 27) && inRange(sunStep, 0, 3) &&
    inRange(moonStation, 0, 27) && nullOr(moonStep, v => inRange(v, 0, 3)) &&
    nullOr(risingStation, v => inRange(v, 0, 27)) &&
    inRange(natalLight, 0, 7) && inRange(keeper, 0, 6) &&
    TYPES.includes(type) && inRange(farlight, 0, 27);
  if (!shapeOk) return res.status(400).json({ error: 'invalid_input' });

  // type/farlight are pure functions of sunStation/moonStation
  // (sigil.js's deriveType/farlightOf) — don't trust a client-submitted
  // value that doesn't match what those functions independently produce,
  // rather than storing an internally-inconsistent sigil.
  const { sigilMod } = await loadEngine();
  if (type !== sigilMod.deriveType(sunStation, moonStation) || farlight !== sigilMod.farlightOf(sunStation)) {
    return res.status(400).json({ error: 'invalid_input' });
  }

  const json = JSON.stringify({ sunStation, sunStep, moonStation, moonStep, risingStation, natalLight, keeper, type, farlight });
  await pool.execute(
    'INSERT INTO sigil (user_id, sigil_json) VALUES (?, ?) ' +
    'ON DUPLICATE KEY UPDATE sigil_json = VALUES(sigil_json)',
    [req.userId, json]
  );
  res.status(204).end();
}));

app.get('/api/recollection', requireAuth, wrap(async (req, res) => {
  const [rows] = await pool.execute(
    'SELECT station, step, cast_context_json, kindled_at FROM recollection WHERE user_id = ?',
    [req.userId]
  );
  res.json({
    recollection: rows.map(r => {
      let castContext = {};
      try { castContext = JSON.parse(r.cast_context_json); } catch (e) {}
      return { station: r.station, step: r.step, castContext, kindledAt: r.kindled_at };
    }),
  });
}));

// Claimability is computed HERE, from the server's own real-time moon
// position, and never trusted from the client — a logged-in user with
// devtools could otherwise loop all 112 (station, step) combinations and
// fully light their ring in seconds, contradicting the ethics floor ("the
// sky is the drop table," COSMOLOGY §4). Reuses deck.js's already-tested
// claimStates() rather than reimplementing the claim-window/grace logic a
// second time. The client's `station` is a claim TRIGGER, not trusted data;
// `step` is never accepted from the client at all — it's derived here.
app.post('/api/recollection', requireAuth, wrap(async (req, res) => {
  const { station, castContext } = req.body || {};
  if (!Number.isInteger(station) || station < 0 || station > 27) {
    return res.status(400).json({ error: 'invalid_input' });
  }

  const { deckMod, astroMod, sigilMod } = await loadEngine();
  const jd = Date.now() / 86400000 + 2440587.5;
  const moonLon = astroMod.moonLongitude(jd);
  const todayStation = astroMod.mansionOf(moonLon);
  const states = deckMod.claimStates({ moonLon, jd, todayMansion: todayStation });
  const entry = states[station];
  if (!entry || !entry.claimable) {
    return res.status(403).json({ error: 'not_claimable' });
  }
  // Claiming today's real station records the Lantern's actual current
  // step. A grace claim (yesterday's station, visited late) records step 3
  // (Leaving) — the last step the Lantern actually stood in there before
  // moving on; there is no "current step" of a station the Moon has
  // already left.
  const step = station === todayStation ? sigilMod.stepOf(moonLon) : 3;

  const contextJson = JSON.stringify(castContext && typeof castContext === 'object' ? castContext : {});
  await pool.execute(
    'INSERT INTO recollection (user_id, station, step, cast_context_json) VALUES (?, ?, ?, ?) ' +
    'ON DUPLICATE KEY UPDATE id = id', // no-op: an already-kindled segment kindles once, ever
    [req.userId, station, step, contextJson]
  );
  const [rows] = await pool.execute(
    'SELECT station, step, cast_context_json, kindled_at FROM recollection WHERE user_id = ? AND station = ? AND step = ?',
    [req.userId, station, step]
  );
  const r = rows[0];
  let storedContext = {};
  try { storedContext = JSON.parse(r.cast_context_json); } catch (e) {}
  res.status(201).json({ station: r.station, step: r.step, castContext: storedContext, kindledAt: r.kindled_at });
}));

app.get('/api/guestbook', wrap(async (req, res) => {
  const [rows] = await pool.execute(
    'SELECT name, msg, stamp, created_at FROM guestbook_entries ORDER BY id DESC LIMIT 50'
  );
  res.json({
    entries: rows.map(r => ({
      name: r.name, msg: r.msg, stamp: r.stamp,
      date: r.created_at.toISOString().slice(0, 10).replaceAll('-', '.'),
    })),
  });
}));

app.post('/api/guestbook', guestbookPostLimiter, wrap(async (req, res) => {
  let { name, msg, stamp } = req.body || {};
  if (typeof msg !== 'string' || !msg.trim() || msg.length > 280) {
    return res.status(400).json({ error: 'invalid_input' });
  }
  name = (typeof name === 'string' ? name.trim() : '').slice(0, 60) || 'anon';
  if (typeof stamp !== 'string' || !GUESTBOOK_STAMPS.has(stamp)) {
    return res.status(400).json({ error: 'invalid_input' });
  }
  // Not stored to identify anyone, only so a spam wave from one source can be
  // deleted as a set — see requireAdmin.
  const ipHash = crypto.createHmac('sha256', JWT_SECRET).update(req.ip || '').digest('hex');

  const [result] = await pool.execute(
    'INSERT INTO guestbook_entries (name, msg, stamp, ip_hash) VALUES (?, ?, ?, ?)',
    [name, msg.trim(), stamp, ipHash]
  );
  const [rows] = await pool.execute(
    'SELECT name, msg, stamp, created_at FROM guestbook_entries WHERE id = ?',
    [result.insertId]
  );
  const r = rows[0];
  res.status(201).json({
    name: r.name, msg: r.msg, stamp: r.stamp,
    date: r.created_at.toISOString().slice(0, 10).replaceAll('-', '.'),
  });
}));

// -- guestbook moderation: requireAdmin (shared token header), not public ---

app.get('/api/guestbook/admin', requireAdmin, wrap(async (req, res) => {
  const [rows] = await pool.execute(
    'SELECT id, name, msg, stamp, ip_hash, created_at FROM guestbook_entries ORDER BY id DESC LIMIT 200'
  );
  res.json({ entries: rows });
}));

app.delete('/api/guestbook/:id', requireAdmin, wrap(async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.status(400).json({ error: 'invalid_input' });
  await pool.execute('DELETE FROM guestbook_entries WHERE id = ?', [id]);
  res.status(204).end();
}));

app.delete('/api/guestbook/by-ip/:ipHash', requireAdmin, wrap(async (req, res) => {
  const [result] = await pool.execute('DELETE FROM guestbook_entries WHERE ip_hash = ?', [req.params.ipHash]);
  res.json({ deleted: result.affectedRows });
}));

// Anything a wrapped handler throws lands here: log it, answer 500, stay up.
app.use((err, req, res, next) => {
  console.error('[starshard-api]', req.method, req.path, err);
  if (res.headersSent) return next(err);
  res.status(500).json({ error: 'server_error' });
});

// Belt and braces for anything that escapes the wrapper (timers, listeners).
process.on('unhandledRejection', err => {
  console.error('[starshard-api] unhandled rejection', err);
});

// Socket.io rides the same HTTP server/port as the REST API (one process,
// one listener) — its own CORS is configured separately from the hand-
// rolled Express middleware above, but reuses the same ALLOWED_ORIGINS.
// Plain `ws` would be lighter, but whether the production reverse proxy
// passes a WebSocket upgrade through is unverified; Socket.io's automatic
// long-polling fallback rides the plain-HTTPS path already proven to
// work, so this is the safer default for now (see the Manzil lobby plan).
const httpServer = http.createServer(app);
const io = new SocketIOServer(httpServer, {
  cors: { origin: ALLOWED_ORIGINS, credentials: true },
  path: '/socket.io',
});
createManzilLobby(io, { jwtSecret: JWT_SECRET, pool });

httpServer.listen(PORT, '127.0.0.1', () => {
  console.log(`starshard-api listening on 127.0.0.1:${PORT} (http + socket.io)`);
});
