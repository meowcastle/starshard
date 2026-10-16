// collection.js: the paper shelf's paste formats (change 22), parsed before the card data is consulted
const test = require('node:test');
const assert = require('node:assert');
const { parse } = require('../collection');

test('binder lines: set, number and foil marks dropped; section headers skipped', () => {
  const r = parse('1 Mind Twist (SPG) 166\n1 Expropriate (SLD) 2396 *F*\n4x Lightning Bolt\nSideboard\n2 Teyo, Lightshield Expert (FRA) 12');
  assert.strictEqual(r.source, 'pasted list');
  assert.deepStrictEqual(r.lines, [{ qty: 1, name: 'Mind Twist' }, { qty: 1, name: 'Expropriate' }, { qty: 4, name: 'Lightning Bolt' }, { qty: 2, name: 'Teyo, Lightshield Expert' }]);
});

test('ManaBox and Moxfield CSV, quoted names with commas', () => {
  const a = parse('Name,Set code,Set name,Collector number,Foil,Rarity,Quantity,ManaBox ID\n"Jace, the Mind Sculptor",2XM,Double Masters,56,normal,mythic,2,1');
  assert.strictEqual(a.source, 'ManaBox export'); assert.deepStrictEqual(a.lines, [{ qty: 2, name: 'Jace, the Mind Sculptor' }]);
  const b = parse('Count,Tradelist Count,Name,Edition\n"3","0","Restoration Magic","fin"');
  assert.strictEqual(b.source, 'Moxfield export'); assert.deepStrictEqual(b.lines, [{ qty: 3, name: 'Restoration Magic' }]);
});

test('nothing that reads as a card', () => assert.deepStrictEqual(parse('hello\nworld').lines, []));
