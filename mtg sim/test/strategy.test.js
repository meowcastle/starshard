// E0's read (strategy.js) on the handoff's acceptance decks. Needs card data: runs only with a DATA_DIR whose
// scryfall.json cache holds them (DATA_DIR=<a copy of the server's data> npm test), so it never hits the network.
const test = require('node:test'), assert = require('node:assert'), fs = require('fs'), path = require('path');
const config = require('../config');
const cached = fs.existsSync(path.join(config.DATA_DIR, 'scryfall.json'));
const parse = t => t.split('·').map(x => x.trim()).filter(Boolean).map(x => { const m = x.match(/^(\d+) (.+)$/); return { qty: +m[1], name: m[2] }; });
const SQUALL = parse("3 Squall, SeeD Mercenary · 4 Aerith Gainsborough · 2 Cloud, Midgar Mercenary · 3 Zack Fair · 2 Liliana the Faultless · 1 Haliya, Guided by Light · 1 Enlightened Confidant · 2 Ajani Resolute · 4 Erode · 3 White Auracite · 4 Restoration Magic · 1 Sheltered by Ghosts · 2 Celestial Armor · 1 Medic's Kitesail · 1 Basilisk Collar · 1 Buster Sword · 1 My Precious · 1 Orcrist, Goblin-cleaver · 1 The Aetherspark · 7 Plains · 4 Swamp · 4 Bleachbone Verge · 3 Godless Shrine · 4 Scoured Barrens");
test('Squall read cold: voltron toolbox, with Squall, Aerith and Cloud in the engine', { skip: !cached && 'no card cache in DATA_DIR' }, async () => {
  const r = await require('../strategy').read({ main: SQUALL });
  assert.equal(r.coherent, true); assert.equal(r.shape, 'voltron toolbox');
  const e = r.engine.map(x => x.name); for (const n of ['Squall, SeeD Mercenary', 'Aerith Gainsborough', 'Cloud, Midgar Mercenary']) assert.ok(e.includes(n), n + ' in ' + e);
});

// E5's acceptance: on the thread's 60 before its picks went in, each pick ranks in the top 3 of an obstacle's row
test("the thread's six picks rank in the top 3 of their obstacle rows", { skip: !cached && 'no card cache in DATA_DIR' }, async () => {
  const ob = require('../obstacles'), before = SQUALL.filter(c => !["Basilisk Collar", "Orcrist, Goblin-cleaver", "My Precious", "Medic's Kitesail", "Buster Sword", "Enlightened Confidant"].includes(c.name)).concat([{ qty: 2, name: 'Thalia, the Survivor' }, { qty: 2, name: 'Koth of the Homestead' }]);
  const read = await require('../strategy').read({ main: before }), kinds = ['removal', 'blockers', 'racing', 'fliers', 'sweepers', 'cards'], top = new Set();
  for (const k of kinds) for (const a of (await ob.answersFor(k, { list: { main: before }, colors: ['W', 'B'], read, owned: {} }, { also: kinds })).best) top.add(a.name);
  for (const n of ['Basilisk Collar', 'Orcrist, Goblin-cleaver', 'My Precious', "Medic's Kitesail", 'Buster Sword', 'Enlightened Confidant']) assert.ok(top.has(n), n + ' not in any top 3');
});
