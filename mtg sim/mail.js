// Mail for the sim (NOTE-TO-CODE-14OCT-EMAIL.md): one function over Resend's REST API, no SDK. The server owns
// mail; nothing is sent from a worker. Copy lives in mail/<kind>.txt with {{holes}}, so Design can edit it
// without a rebuild: the first line is the subject ("Subject: ..."), the rest the plain-text body. Every message
// ends with the Fan Content Policy notice. Open and click tracking are off for the domain in Resend.
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const config = require('./config');

const FAN = 'Forge Sim is unofficial Fan Content permitted under the Fan Content Policy. Not approved/endorsed by Wizards. Portions of the materials used are property of Wizards of the Coast. ©Wizards of the Coast LLC.';
const DIR = path.join(__dirname, 'mail');
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const on = () => !!config.RESEND_API_KEY;

// A template filled: { subject, text, html }. A hole with no value is left visible rather than silently empty.
function render(kind, vals = {}) {
  const raw = fs.readFileSync(path.join(DIR, kind + '.txt'), 'utf8');
  const fill = s => s.replace(/\{\{\s*(\w+)\s*\}\}/g, (m, k) => vals[k] != null ? String(vals[k]) : m);
  const [first, ...rest] = raw.split('\n');
  const subject = fill(first.replace(/^Subject:\s*/i, '')).trim();
  const text = fill(rest.join('\n')).trim() + '\n\n--\n' + FAN + '\n';
  // the small HTML part: the same text, paragraphs and links, nothing else
  const html = '<div style="font-family:system-ui,sans-serif;font-size:15px;line-height:1.5;color:#222;max-width:560px">' +
    text.split(/\n{2,}/).map(p => '<p>' + esc(p).replace(/\n/g, '<br>').replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1">$1</a>') + '</p>').join('') + '</div>';
  return { subject, text, html };
}

// Send one message. Returns { ok, id } or { ok: false, error }; never throws (callers decide what a failure means).
async function send({ to, kind, vals, tag }) {
  if (!on()) return { ok: false, error: 'mail is off (no RESEND_API_KEY)' };
  let m; try { m = render(kind, vals); } catch (e) { return { ok: false, error: 'template ' + kind + ': ' + e.message }; }
  const body = { from: config.MAIL_FROM, to: [to], subject: m.subject, text: m.text, html: m.html, tags: [{ name: 'kind', value: tag || kind }] };
  if (config.MAIL_REPLY_TO) body.reply_to = config.MAIL_REPLY_TO;
  try {
    const r = await fetch('https://api.resend.com/emails', { method: 'POST', headers: { Authorization: 'Bearer ' + config.RESEND_API_KEY, 'Content-Type': 'application/json' }, body: JSON.stringify(body), signal: AbortSignal.timeout(15e3) });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) { console.warn(`mail ${kind}: Resend ${r.status} ${j.message || ''}`); return { ok: false, error: j.message || 'HTTP ' + r.status }; }
    return { ok: true, id: j.id };
  } catch (e) { console.warn(`mail ${kind}: ${e.message}`); return { ok: false, error: e.message }; }
}

// Resend's webhooks are signed the Svix way: base64 HMAC-SHA256 over "<id>.<timestamp>.<raw body>", keyed with the
// base64 part of the whsec_ secret; the header carries one or more "v1,<sig>". Five minutes of clock skew allowed.
function verifyWebhook(headers, raw, secret = config.RESEND_WEBHOOK_SECRET) {
  if (!secret) return false;
  const id = headers['svix-id'], ts = headers['svix-timestamp'], sig = headers['svix-signature'];
  if (!id || !ts || !sig || Math.abs(Date.now() / 1000 - Number(ts)) > 300) return false;
  const key = Buffer.from(String(secret).replace(/^whsec_/, ''), 'base64');
  const want = crypto.createHmac('sha256', key).update(`${id}.${ts}.${raw}`).digest();
  return String(sig).split(' ').some(p => { const [v, s] = p.split(','); if (v !== 'v1' || !s) return false; const got = Buffer.from(s, 'base64'); return got.length === want.length && crypto.timingSafeEqual(got, want); });
}

module.exports = { send, render, verifyWebhook, on, FAN };
