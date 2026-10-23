// The night shift's report (tools/nightly-engine.sh): scores tonight's baseline on its own and pooled with every
// earlier night played at the same engine against the same meta lists, scores each experiment beside it, and
// writes <night>/summary.json (also copied to the NAS as data/engine-nightly.json), a line in
// <nightly dir>/scoreboard.jsonl, and the text this prints (<nightly dir>/latest.txt).
//
//   node tools/nightly-report.js <nightly dir> <night dir>
const fs = require('fs'), path = require('path'), crypto = require('crypto'), { execFileSync } = require('child_process');
const [N, NIGHT] = process.argv.slice(2);
const BAR = { mae: 4, spread: 4 };   // the ship bar (15 Oct): mean deck error and sim spread, in points
const read = f => { try { return fs.readFileSync(f, 'utf8'); } catch { return null; } };
const cal = path.join(NIGHT, 'cal.json'), engine = (read(path.join(NIGHT, 'engine')) || '').trim();
// the lists the batch plays: the top 12 of the calibration file, names and main decks
const listsOf = f => { const c = JSON.parse(read(f)).standard; return crypto.createHash('sha1').update(JSON.stringify(c.lists.slice(0, 12).map(l => [l.name, l.main]))).digest('hex').slice(0, 10); };
const lists = listsOf(cal);
fs.writeFileSync(path.join(NIGHT, 'lists'), lists);
const played = d => fs.existsSync(path.join(d, 'batch.json')) && Object.keys(JSON.parse(read(path.join(d, 'batch.json')))).length > 0;
const score = dirs => {
  const out = path.join(NIGHT, `.score-${crypto.randomBytes(4).toString('hex')}.json`);
  try { execFileSync('node', [path.join(__dirname, 'scoreboard.js'), cal, ...dirs, '--json', out], { stdio: 'ignore' }); } catch { return null; }
  const s = JSON.parse(read(out) || 'null'); fs.rmSync(out, { force: true }); if (!s) return null;
  const top = s.decks.filter(d => d.pairs >= 3);
  return { mae: 100 * s.mae, spread: 100 * s.simSd, realSpread: 100 * s.realObs, realFlat: s.realFlat, rho: s.rho, inside: s.inside, of: s.of, pairs: s.pairs,
    games: s.simGamesPerPair, decks: top.map(d => ({ deck: d.deck, real: +(100 * d.real).toFixed(1), sim: +(100 * d.sim).toFixed(1), err: +(100 * d.err).toFixed(1), matches: d.matches })) };
};
// earlier nights at this engine and these lists
const nights = fs.readdirSync(N).filter(x => /^20\d\d-/.test(x)).sort().map(x => path.join(N, x))
  .filter(d => (read(path.join(d, 'engine')) || '').trim() === engine && (d === NIGHT || (read(path.join(d, 'lists')) || '') === lists) && played(path.join(d, 'base')));
const tonight = played(path.join(NIGHT, 'base')) ? score([path.join(NIGHT, 'base')]) : null;
const pooled = nights.length ? score(nights.map(d => path.join(d, 'base'))) : null;
const experiments = fs.readdirSync(NIGHT).filter(x => x.startsWith('x-') && played(path.join(NIGHT, x)))
  .map(x => ({ name: x.slice(2), settings: JSON.parse(read(path.join(NIGHT, x, 'settings.json')) || '{}'), ...score([path.join(NIGHT, x)]) }));
const commit = (() => { try { return execFileSync('git', ['-C', path.join(__dirname, '..'), 'rev-parse', '--short', 'HEAD']).toString().trim(); } catch { return null; } })();
const summary = { at: new Date().toISOString(), night: path.basename(NIGHT), engine, lists, commit, bar: BAR, nightsPooled: nights.length, tonight, pooled, experiments };
fs.writeFileSync(path.join(NIGHT, 'summary.json'), JSON.stringify(summary, null, 1));
fs.appendFileSync(path.join(N, 'scoreboard.jsonl'), JSON.stringify({ night: summary.night, engine, lists, tonight: tonight && { mae: tonight.mae, spread: tonight.spread }, pooled: pooled && { mae: pooled.mae, spread: pooled.spread, nights: nights.length }, experiments: experiments.map(e => ({ name: e.name, mae: e.mae, spread: e.spread })) }) + '\n');

const f1 = x => x == null ? '-' : x.toFixed(1);
const line = (label, s) => s ? `${label}: mean deck error ${f1(s.mae)} (bar ${BAR.mae}) · sim spread ${f1(s.spread)} (bar ${BAR.spread}; real ${f1(s.realSpread)}${s.realFlat ? ', no wider than noise' : ''}) · ${s.inside} of ${s.of} decks inside the real range · ${s.pairs} pairings, ${s.games} games each` : `${label}: no games played`;
console.log(`Engine night ${summary.night} · engine ${engine} (commit ${commit}) · meta lists ${lists}`);
console.log(line('tonight', tonight));
console.log(line(`pooled over ${nights.length} night${nights.length === 1 ? '' : 's'}`, pooled));
if (pooled) { console.log('\n  deck                     real    sim    error   real matches'); for (const d of [...pooled.decks].sort((a, b) => Math.abs(b.err) - Math.abs(a.err))) console.log('  ' + d.deck.padEnd(24) + String(d.real).padStart(5) + String(d.sim).padStart(7) + ((d.err >= 0 ? '+' : '') + d.err).padStart(8) + String(d.matches).padStart(14)); }
for (const e of experiments) console.log('\n' + line(`experiment ${e.name}`, e));
// how tonight's baseline games were played (no injected error in the baseline, so these read the AI itself)
const logs = path.join(NIGHT, 'base', 'logs');
if (fs.existsSync(logs)) for (const [tool, label] of [['log-curve.js', 'early mana use, turns 2-4 (hand could / spent)'], ['log-race.js', 'against fliers']]) {
  try { console.log(`\n${label}:\n` + execFileSync('node', [path.join(__dirname, tool), logs], { maxBuffer: 1 << 24 }).toString()); } catch (e) { console.log(`\n${label}: ${e.message.split('\n')[0]}`); }
}
