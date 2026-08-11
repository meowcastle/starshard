require('dotenv').config();

const express = require('express');
const cookieParser = require('cookie-parser');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mysql = require('mysql2/promise');

const PORT = process.env.PORT || 4001;
const JWT_SECRET = process.env.JWT_SECRET;
const COOKIE_NAME = 'starshard_session';
const IS_PROD = process.env.NODE_ENV === 'production';

if (!JWT_SECRET) {
  console.error('JWT_SECRET is not set. Refusing to start.');
  process.exit(1);
}

const pool = mysql.createPool({
  socketPath: process.env.DB_SOCKET,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 5,
});

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

function signSession(userId) {
  return jwt.sign({ uid: userId }, JWT_SECRET, { expiresIn: '90d' });
}

function requireAuth(req, res, next) {
  const token = req.cookies[COOKIE_NAME];
  if (!token) return res.status(401).json({ error: 'not_authenticated' });
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.userId = payload.uid;
    next();
  } catch (e) {
    return res.status(401).json({ error: 'not_authenticated' });
  }
}

function setSessionCookie(res, userId) {
  res.cookie(COOKIE_NAME, signSession(userId), {
    httpOnly: true,
    secure: IS_PROD,
    sameSite: 'lax',
    maxAge: 90 * 24 * 60 * 60 * 1000,
    path: '/',
  });
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

app.post('/api/auth/signup', async (req, res) => {
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
    setSessionCookie(res, result.insertId);
    res.status(201).json({ email: normalizedEmail });
  } catch (e) {
    if (e && e.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'email_taken' });
    }
    console.error(e);
    res.status(500).json({ error: 'server_error' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body || {};
  if (typeof email !== 'string' || typeof password !== 'string') {
    return res.status(400).json({ error: 'invalid_input' });
  }
  const normalizedEmail = email.trim().toLowerCase();

  const [rows] = await pool.execute(
    'SELECT id, password_hash FROM users WHERE email = ?',
    [normalizedEmail]
  );
  const user = rows[0];
  if (!user) return res.status(401).json({ error: 'invalid_credentials' });

  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) return res.status(401).json({ error: 'invalid_credentials' });

  setSessionCookie(res, user.id);
  res.json({ email: normalizedEmail });
});

app.post('/api/auth/logout', (req, res) => {
  res.clearCookie(COOKIE_NAME, { path: '/' });
  res.status(204).end();
});

app.get('/api/me', async (req, res) => {
  const token = req.cookies[COOKIE_NAME];
  if (!token) return res.status(401).json({ error: 'not_authenticated' });
  let payload;
  try {
    payload = jwt.verify(token, JWT_SECRET);
  } catch (e) {
    return res.status(401).json({ error: 'not_authenticated' });
  }
  const [rows] = await pool.execute('SELECT email FROM users WHERE id = ?', [payload.uid]);
  const user = rows[0];
  if (!user) return res.status(401).json({ error: 'not_authenticated' });
  res.json({ email: user.email });
});

app.get('/api/state', requireAuth, async (req, res) => {
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
});

app.put('/api/state', requireAuth, async (req, res) => {
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
});

app.listen(PORT, '127.0.0.1', () => {
  console.log(`starshard-api listening on 127.0.0.1:${PORT}`);
});
