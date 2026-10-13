// A plan and strategy class for each meta deck, for splitting statistics by pairing class
// (tools/log-stats.js). Now from plan.js (tag counts and curve; the reason kept beside each answer);
// edit the output by hand where a deck is misread.
//
//   DATA_DIR=... node tools/deck-classes.js <calibration.json> [top=20] > classes.json
const fs = require('fs');
const { planOf } = require('../plan');

const [CAL, TOP = '20'] = process.argv.slice(2);
const lists = JSON.parse(fs.readFileSync(CAL, 'utf8')).standard.lists.slice(0, +TOP);

(async () => {
  const out = {};
  for (const l of lists) { const p = await planOf(l, l.name); out[l.name] = { class: p.strategy, plan: p.plan, why: p.why }; }
  console.log(JSON.stringify(out, null, 1));
})().catch(e => { console.error(e); process.exit(1); });
