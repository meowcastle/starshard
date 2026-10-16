// push.js: the payload a browser decrypts (RFC 8291 / 8188), done the browser's way here
const test = require('node:test');
const assert = require('node:assert');
const crypto = require('crypto');
const { encrypt, b64u } = require('../push');

const hmac = (k, d) => crypto.createHmac('sha256', k).update(d).digest();
function decrypt(body, ua, auth) {
  const salt = body.subarray(0, 16), idlen = body[20], asPub = body.subarray(21, 21 + idlen), ct = body.subarray(21 + idlen);
  const uaPub = ua.getPublicKey(), shared = ua.computeSecret(asPub);
  const ikm = hmac(hmac(auth, shared), Buffer.concat([Buffer.from('WebPush: info\0'), uaPub, asPub, Buffer.from([1])]));
  const prk = hmac(salt, ikm);
  const cek = hmac(prk, Buffer.concat([Buffer.from('Content-Encoding: aes128gcm\0'), Buffer.from([1])])).subarray(0, 16);
  const nonce = hmac(prk, Buffer.concat([Buffer.from('Content-Encoding: nonce\0'), Buffer.from([1])])).subarray(0, 12);
  const d = crypto.createDecipheriv('aes-128-gcm', cek, nonce); d.setAuthTag(ct.subarray(ct.length - 16));
  const pt = Buffer.concat([d.update(ct.subarray(0, ct.length - 16)), d.final()]);
  assert.strictEqual(pt[pt.length - 1], 2); // the last-record delimiter
  return pt.subarray(0, pt.length - 1).toString();
}

test('a browser decrypts what push.js encrypts', () => {
  const ua = crypto.createECDH('prime256v1'); ua.generateKeys();
  const auth = crypto.randomBytes(16), msg = JSON.stringify({ title: 'Squall v3', body: '52% (47–57) vs the top 10', url: '/?deck=x&tab=results' });
  const body = encrypt(msg, b64u(ua.getPublicKey()), b64u(auth));
  assert.strictEqual(body.readUInt32BE(16), 4096);
  assert.strictEqual(decrypt(body, ua, auth), msg);
});

test('the VAPID token verifies against the public key the page is given', () => {
  const os = require('os'), fs = require('fs'), path = require('path');
  process.env.DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'push-'));
  const push = require('../push');
  const t = push.jwt('https://fcm.googleapis.com').split('.'), raw = push.unb64u(push.key());
  const pub = crypto.createPublicKey({ key: { kty: 'EC', crv: 'P-256', x: b64u(raw.subarray(1, 33)), y: b64u(raw.subarray(33)) }, format: 'jwk' });
  assert.ok(crypto.verify('sha256', Buffer.from(t[0] + '.' + t[1]), { key: pub, dsaEncoding: 'ieee-p1363' }, push.unb64u(t[2])));
  assert.strictEqual(JSON.parse(push.unb64u(t[1])).aud, 'https://fcm.googleapis.com');
});
