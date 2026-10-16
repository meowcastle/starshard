// Web Push for the phone app (Design's change 18, NOTE-TO-CODE-16OCT-PHONE.md §4), with no dependency: VAPID
// (RFC 8292, an ES256 JWT) and the aes128gcm payload encryption (RFC 8291, RFC 8188) from Node's own crypto.
//
//   key()                          the VAPID public key for the page (base64url, uncompressed P-256 point)
//   subscribe(owner, sub)          store a PushSubscription ({ endpoint, keys: { p256dh, auth } }) for an account
//   send(owner, { title, body, url })  to each of the owner's subscriptions; a gone one (404/410) is dropped
//   remove(owner)                  with the account
//   encrypt(payload, p256dh, auth) the request body (exported for the test)
//
// The VAPID key pair is made once and kept in DATA_DIR/vapid.json (a secret: never printed, never served but its
// public half). Subscriptions are kept in DATA_DIR/push.json, at most five per account (the newest).
const crypto = require('crypto');
const path = require('path');
const config = require('./config');
const { writeJson, readJson } = require('./store');

const b64u = buf => Buffer.from(buf).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const unb64u = s => Buffer.from(String(s).replace(/-/g, '+').replace(/_/g, '/'), 'base64');
const VAPID = () => path.join(config.DATA_DIR, 'vapid.json');
const SUBS = () => path.join(config.DATA_DIR, 'push.json');

let vapid = null;
function keys() {
  if (vapid) return vapid;
  let v = readJson(VAPID(), null, { keep: 0 });
  if (!v || !v.publicKey || !v.privateJwk) {
    const ecdh = crypto.createECDH('prime256v1'); ecdh.generateKeys();
    const pub = ecdh.getPublicKey();
    v = { publicKey: b64u(pub), privateJwk: { kty: 'EC', crv: 'P-256', x: b64u(pub.subarray(1, 33)), y: b64u(pub.subarray(33, 65)), d: b64u(ecdh.getPrivateKey()) } };
    writeJson(VAPID(), v, { keep: 0 });
  }
  vapid = { publicKey: v.publicKey, privateKey: crypto.createPrivateKey({ key: v.privateJwk, format: 'jwk' }) };
  return vapid;
}
const key = () => keys().publicKey;

function jwt(aud) {
  const head = b64u(JSON.stringify({ typ: 'JWT', alg: 'ES256' }));
  const claims = b64u(JSON.stringify({ aud, exp: Math.floor(Date.now() / 1000) + 12 * 3600, sub: 'mailto:' + (config.MAIL_REPLY_TO || 'noreply@sim.starshard.net').replace(/^.*<|>.*$/g, '') }));
  const sig = crypto.sign('sha256', Buffer.from(head + '.' + claims), { key: keys().privateKey, dsaEncoding: 'ieee-p1363' });
  return head + '.' + claims + '.' + b64u(sig);
}

const hmac = (k, d) => crypto.createHmac('sha256', k).update(d).digest();
// RFC 8291 §3.4 and RFC 8188: one record, the whole payload, delimiter 0x02, no padding
function encrypt(payload, p256dh, auth, { salt = crypto.randomBytes(16), ecdh = null } = {}) {
  const ua = unb64u(p256dh), secret = unb64u(auth);
  const as = ecdh || crypto.createECDH('prime256v1'); if (!ecdh) as.generateKeys();
  const asPub = as.getPublicKey(), shared = as.computeSecret(ua);
  const ikm = hmac(hmac(secret, shared), Buffer.concat([Buffer.from('WebPush: info\0'), ua, asPub, Buffer.from([1])]));
  const prk = hmac(salt, ikm);
  const cek = hmac(prk, Buffer.concat([Buffer.from('Content-Encoding: aes128gcm\0'), Buffer.from([1])])).subarray(0, 16);
  const nonce = hmac(prk, Buffer.concat([Buffer.from('Content-Encoding: nonce\0'), Buffer.from([1])])).subarray(0, 12);
  const c = crypto.createCipheriv('aes-128-gcm', cek, nonce);
  const body = Buffer.concat([c.update(Buffer.concat([Buffer.from(payload), Buffer.from([2])])), c.final(), c.getAuthTag()]);
  const rs = Buffer.alloc(4); rs.writeUInt32BE(4096);
  return Buffer.concat([salt, rs, Buffer.from([asPub.length]), asPub, body]);
}

let subs = null;
const load = () => (subs = subs || readJson(SUBS(), {}));
const own = o => String(o || '').toLowerCase();
function subscribe(owner, sub) {
  const ok = sub && /^https:\/\//.test(sub.endpoint || '') && sub.keys && unb64u(sub.keys.p256dh || '').length === 65 && unb64u(sub.keys.auth || '').length >= 16;
  if (!ok) { const e = new Error("That isn't a push subscription."); e.status = 400; throw e; }
  const list = (load()[own(owner)] || []).filter(x => x.endpoint !== sub.endpoint);
  list.push({ endpoint: String(sub.endpoint).slice(0, 1000), keys: { p256dh: sub.keys.p256dh, auth: sub.keys.auth }, at: Date.now() });
  subs[own(owner)] = list.slice(-5); writeJson(SUBS(), subs);
  return { ok: true, devices: subs[own(owner)].length };
}
const has = owner => !!(load()[own(owner)] || []).length;
function remove(owner) { if (load()[own(owner)]) { delete subs[own(owner)]; writeJson(SUBS(), subs); } }

async function send(owner, msg) {
  const list = load()[own(owner)] || []; if (!list.length) return { sent: 0 };
  const payload = JSON.stringify({ title: String(msg.title || 'Forge Sim').slice(0, 80), body: String(msg.body || '').slice(0, 240), url: String(msg.url || '/').slice(0, 300) });
  let sent = 0; const gone = new Set();
  for (const s of list) {
    try {
      const aud = new URL(s.endpoint).origin;
      const r = await fetch(s.endpoint, { method: 'POST', body: encrypt(payload, s.keys.p256dh, s.keys.auth),
        headers: { 'Content-Encoding': 'aes128gcm', 'Content-Type': 'application/octet-stream', TTL: '86400', Urgency: 'normal', Authorization: `vapid t=${jwt(aud)}, k=${key()}` } });
      if (r.status === 404 || r.status === 410) gone.add(s.endpoint); else if (r.ok) sent++; else console.warn(`push: ${aud} answered ${r.status}`);
    } catch (e) { console.warn('push: ' + e.message); }
  }
  if (gone.size) { subs[own(owner)] = list.filter(x => !gone.has(x.endpoint)); writeJson(SUBS(), subs); }
  return { sent };
}

module.exports = { key, subscribe, send, remove, has, encrypt, jwt, b64u, unb64u };
