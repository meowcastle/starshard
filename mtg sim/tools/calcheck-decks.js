// usage: node tools/calcheck-decks.js data/calibration.json
const c = require(process.argv[2]).standard;
// per deck: Forge's win rate over all its Forge pairings vs its real win rate over the field
const F = {}; for (const [k, f] of Object.entries(c.inputs.forge)) { const [a, b] = k.split('\u0000'); (F[a] = F[a] || [0, 0]); (F[b] = F[b] || [0, 0]); F[a][0] += f[0]; F[a][1] += f[1]; F[b][0] += f[1]; F[b][1] += f[0]; }
const rows = Object.keys(F).filter(n => c.realField[n] && c.realField[n].w + c.realField[n].l >= 30).map(n => { const f = F[n], r = c.realField[n]; return { deck: n, forge: Math.round(f[0] / (f[0] + f[1]) * 100), forgeN: f[0] + f[1], real: Math.round(r.w / (r.w + r.l) * 100), realN: r.w + r.l }; }).sort((a, b) => b.forge - a.forge);
console.table(rows);
const xs = rows.map(r => r.forge), ys = rows.map(r => r.real), m = a => a.reduce((s, x) => s + x, 0) / a.length;
const mx = m(xs), my = m(ys), cov = xs.reduce((s, x, i) => s + (x - mx) * (ys[i] - my), 0), r = cov / Math.sqrt(xs.reduce((s, x) => s + (x - mx) ** 2, 0) * ys.reduce((s, y) => s + (y - my) ** 2, 0));
console.log('decks', rows.length, 'correlation forge vs real overall', r.toFixed(2), ' slope', (cov / xs.reduce((s, x) => s + (x - mx) ** 2, 0)).toFixed(2));
