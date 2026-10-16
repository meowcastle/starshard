// shell.js: card roles for the brew check's mix (change 24)
const test = require('node:test');
const assert = require('node:assert');
const { roleOf } = require('../shell');
const card = (type_line, oracle_text) => ({ type_line, oracle_text });

test('removal, interaction and draw read from rules text', () => {
  assert.ok(roleOf(card('Instant', 'Destroy target creature. You gain 2 life.')).removal);
  assert.ok(roleOf(card('Instant', 'Target creature gets -2/-2 until end of turn.')).removal);
  assert.ok(roleOf(card('Instant', 'Counter target spell unless its controller pays {3}.')).interaction);
  assert.ok(roleOf(card('Sorcery', 'Target opponent reveals their hand. You choose a nonland card from it. That player discards that card.')).interaction);
  assert.ok(roleOf(card('Instant', 'Draw two cards.')).draw);
  assert.ok(roleOf(card('Creature — Human', 'Flying')).creature);
  const prot = roleOf(card('Instant', 'Target permanent gains hexproof and indestructible until end of turn.'));
  assert.ok(!prot.removal && !prot.interaction && !prot.draw);
});
