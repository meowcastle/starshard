// Cards Forge's AI never casts. Some new cards ship with scripts Forge's AI can't use (an
// extra cost it can't pay, an effect with no AI logic) and carry no AI:RemoveDeck hint, so
// aihints.js can't see them: the deck just plays with dead cards. This plays each deck a few
// matches through the bridge against a fixed opponent and lists every spell with 3+ copies
// that was never cast; by then it's been drawn in nearly every case.
//
//   FORGE_DIR=... DATA_DIR=... node tools/dead-cards.js <calibration.json> <out.json> [matches=4] [at once=4]
const fs = require('fs');
const path = require('path');
const { runMatches } = require('../pilot');
const meta = require('../meta');

const [CAL, OUT, M = '4', PAR = '4'] = process.argv.slice(2);
const c = JSON.parse(fs.readFileSync(CAL, 'utf8')).standard;
const lists = c.lists, OPP = lists.find(l => l.name === 'Mono-Green Landfall') || lists[0];
const out = {};
(async () => {
  const find = await meta.cards([...new Set(lists.flatMap(l => l.main.map(x => x.name)))]);
  let i = 0;
  const slot = async () => {
    for (;;) {
      const l = lists[i++]; if (!l) return;
      const opp = l.name === OPP.name ? lists.find(x => x !== OPP) : OPP;
      const r = await runMatches({ decks: [l, opp], matches: +M, seed: 77, keepLogs: true, workDir: path.join(path.dirname(OUT), 'dead', l.name.replace(/\W+/g, '_')) });
      const cast = {};
      for (const g of r.games) for (const line of g.log || []) { const m = line.match(/^STACK_ADD: P1 cast (.+?)(?: targeting .*)?$/); if (m) cast[m[1]] = (cast[m[1]] || 0) + 1; }
      const nk = n => String(n).split(' // ')[0].normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
      const castName = n => Object.keys(cast).some(k => nk(k) === nk(n));
      const dead = l.main.filter(x => x.qty >= 3 && !meta.isLand(find(x.name)) && !castName(x.name)).map(x => x.qty + ' ' + x.name);
      out[l.name] = { games: r.games.length, dead };
      console.log(l.name.padEnd(24), r.games.length + ' games', dead.length ? 'NEVER CAST: ' + dead.join(', ') : '');
    }
  };
  await Promise.all(Array.from({ length: +PAR }, slot));
  fs.writeFileSync(OUT, JSON.stringify(out, null, 1));
})().catch(e => { console.error(e); process.exit(1); });
