// meta.legalFor / legalityError: research's three acceptance cases (COACH-PARAMETERS-13OCT.md part 2).
const test = require('node:test');
const assert = require('node:assert');
const meta = require('../meta');

const card = (name, legal) => ({ name, legalities: Object.fromEntries(['standard', 'pioneer', 'modern', 'legacy', 'vintage', 'commander'].map(f => [f, legal.includes(f) ? 'legal' : 'not_legal'])) });
const POOL = {
  'Get Lost': card('Get Lost', ['standard', 'pioneer', 'modern', 'legacy', 'vintage', 'commander']),
  'Plains': card('Plains', ['standard', 'pioneer', 'modern', 'legacy', 'vintage', 'commander']),
  'Fatal Push': card('Fatal Push', ['pioneer', 'modern', 'legacy', 'vintage', 'commander']),
  'Thoughtseize': card('Thoughtseize', ['modern', 'legacy', 'vintage', 'commander']),
};
const find = n => POOL[n] || null;
const list = (...names) => ({ main: names.map(name => ({ qty: 4, name })), side: [] });

test('a Standard list with a Modern card is refused, the card and its format named', () => {
  const r = meta.legalFor(list('Get Lost', 'Plains', 'Thoughtseize'), 'standard', find);
  assert.strictEqual(r.ok, false);
  assert.deepStrictEqual(r.illegal.map(x => [x.name, x.legalIn]), [['Thoughtseize', 'modern']]);
  const e = meta.legalityError(r);
  assert.match(e, /Not Standard-legal: Thoughtseize \(Modern\)/);
  assert.match(e, /create the brew as Modern/);
});

test('the same list with Modern chosen is fine', () => {
  assert.strictEqual(meta.legalFor(list('Get Lost', 'Plains', 'Thoughtseize'), 'modern', find).ok, true);
});

test('the error offers the widest format the illegal cards need, and an unknown card fails too', () => {
  const r = meta.legalFor(list('Get Lost', 'Fatal Push', 'Thoughtseize', 'Lightening Bolt'), 'standard', find);
  assert.deepStrictEqual(r.unknown, ['Lightening Bolt']);
  const e = meta.legalityError(r);
  assert.match(e, /Fatal Push \(Pioneer\), Thoughtseize \(Modern\)/);
  assert.match(e, /Not recognised/);
  assert.doesNotMatch(e, /create the brew as/); // an unknown name can't be shown legal anywhere
});

test('rotation: a stored Standard list that stops being legal is caught on the next check', () => {
  const l = list('Get Lost', 'Plains');
  assert.strictEqual(meta.legalFor(l, 'standard', find).ok, true);
  const rotated = n => n === 'Get Lost' ? card('Get Lost', ['pioneer', 'modern', 'legacy', 'vintage', 'commander']) : find(n);
  const r = meta.legalFor(l, 'standard', rotated);
  assert.strictEqual(r.ok, false);
  assert.deepStrictEqual(r.illegal.map(x => x.name), ['Get Lost']);
});

test('banned reads as banned', () => {
  const banned = n => n === 'Get Lost' ? { name: 'Get Lost', legalities: { standard: 'banned', pioneer: 'legal' } } : find(n);
  assert.match(meta.legalityError(meta.legalFor(list('Get Lost'), 'standard', banned)), /Get Lost \(banned\)/);
});
