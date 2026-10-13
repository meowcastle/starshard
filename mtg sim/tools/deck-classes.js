// A class for each meta deck (control, combo, aggro, midrange), for splitting statistics by pairing
// class. The rule, in order, with the reason kept beside each answer so it can be argued with:
// the deck's name says so; the style classifier (meta.js styleOf: counterspells, mostly instants)
// says control or combo; else the curve (the functional check's average mana value of the spells):
// 2.2 or less is aggro, more is midrange. Edit the output by hand where a deck is misread.
//
//   DATA_DIR=... node tools/deck-classes.js <calibration.json> [top=20] > classes.json
const fs = require('fs');
const meta = require('../meta');
const functional = require('../functional');

const [CAL, TOP = '20'] = process.argv.slice(2);
const lists = JSON.parse(fs.readFileSync(CAL, 'utf8')).standard.lists.slice(0, +TOP);

(async () => {
  const out = {};
  for (const l of lists) {
    const named = (l.name.match(/\b(control|combo|aggro|midrange)\b/i) || [])[1];
    if (named) { out[l.name] = { class: named.toLowerCase(), why: 'its name' }; continue; }
    const style = (await meta.faceOf(l, l.name)).style;
    if (style) { out[l.name] = { class: style.kind, why: style.why }; continue; }
    const f = await functional.check(l);
    const mv = f ? f.avgMV : null;
    out[l.name] = { class: mv != null && mv <= 2.2 ? 'aggro' : 'midrange', why: mv != null ? `average mana value ${mv.toFixed(1)}` : 'no card data' };
  }
  console.log(JSON.stringify(out, null, 1));
})().catch(e => { console.error(e); process.exit(1); });
