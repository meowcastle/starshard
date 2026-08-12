require('dotenv').config();

const crypto = require('crypto');
const express = require('express');
const cookieParser = require('cookie-parser');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mysql = require('mysql2/promise');
const rateLimit = require('express-rate-limit');
const { Resend } = require('resend');

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

const pool = mysql.createPool({
  socketPath: process.env.DB_SOCKET,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 5,
});

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

function signSession(userId, tokenVersion) {
  return jwt.sign({ uid: userId, tv: tokenVersion }, JWT_SECRET, { expiresIn: '90d' });
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

function setSessionCookie(res, userId, tokenVersion) {
  res.cookie(COOKIE_NAME, signSession(userId, tokenVersion), {
    httpOnly: true,
    secure: IS_PROD,
    sameSite: 'lax',
    maxAge: 90 * 24 * 60 * 60 * 1000,
    path: '/',
  });
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const signupLimiter = rateLimit({
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

// Keep in sync with STAMPS in Star Shard v2.dc.html — the guestbook is
// public/unauthenticated, so the stamp is validated against a fixed set
// rather than trusting arbitrary client input.
const GUESTBOOK_STAMPS = new Set(['⭐', '🎀', '🌙', '💿', '✿']);

app.post('/api/auth/signup', signupLimiter, wrap(async (req, res) => {
  const { email, password } = req.body || {};
  if (typeof email !== 'string' || typeof password !== 'string') {
    return res.status(400).json({ error: 'invalid_input' });
  }
  const normalizedEmail = email.trim().toLowerCase();
  if (!EMAIL_RE.test(normalizedEmail) || password.length < 8) {
    return res.status(400).json({ error: 'invalid_input' });
  }

  const passwordHash = await bcrypt.hash(password, 12);
  try {
    const [result] = await pool.execute(
      'INSERT INTO users (email, password_hash) VALUES (?, ?)',
      [normalizedEmail, passwordHash]
    );
    setSessionCookie(res, result.insertId, 0);
    res.status(201).json({ email: normalizedEmail });
  } catch (e) {
    if (e && e.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'email_taken' });
    }
    console.error(e);
    res.status(500).json({ error: 'server_error' });
  }
}));

app.post('/api/auth/login', loginLimiter, wrap(async (req, res) => {
  const { email, password } = req.body || {};
  if (typeof email !== 'string' || typeof password !== 'string') {
    return res.status(400).json({ error: 'invalid_input' });
  }
  const normalizedEmail = email.trim().toLowerCase();

  const [rows] = await pool.execute(
    'SELECT id, password_hash, token_version FROM users WHERE email = ?',
    [normalizedEmail]
  );
  const user = rows[0];
  if (!user) return res.status(401).json({ error: 'invalid_credentials' });

  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) return res.status(401).json({ error: 'invalid_credentials' });

  setSessionCookie(res, user.id, user.token_version);
  res.json({ email: normalizedEmail });
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

  const [uRows] = await pool.execute('SELECT token_version FROM users WHERE id = ?', [reset.user_id]);
  setSessionCookie(res, reset.user_id, uRows[0].token_version);
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
  const [rows] = await pool.execute('SELECT email, token_version FROM users WHERE id = ?', [payload.uid]);
  const user = rows[0];
  if (!user || user.token_version !== payload.tv) return res.status(401).json({ error: 'not_authenticated' });
  res.json({ email: user.email });
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

app.listen(PORT, '127.0.0.1', () => {
  console.log(`starshard-api listening on 127.0.0.1:${PORT}`);
});
