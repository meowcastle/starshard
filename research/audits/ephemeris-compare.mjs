import { moonLongitude, mansionOf } from '../../astro.js';
import vm from 'node:vm';
import fs from 'node:fs';
const ctx = { window: {}, Math, Date };
vm.createContext(ctx);
vm.runInContext(fs.readFileSync('../../ephemeris2.js','utf8'), ctx);
const E = ctx.window.ManzilEphem;
let diff=0, maxd=0, n=0;
for (let i=0;i<730;i++){
  const d = new Date(Date.UTC(2026,9,1,2,0,0)+i*86400000); // 21:00 NY ≈ 01:00/02:00 UTC
  const jd = d.getTime()/86400000+2440587.5;
  const a = moonLongitude(jd), b = E.moonLon(d);
  const dd = Math.abs(((a-b+540)%360)-180); maxd=Math.max(maxd,dd); n++;
  if (mansionOf(a)+1 !== E.idOf(b)) diff++;
}
console.log(`nights ${n}, mansion disagreements ${diff}, max longitude delta ${maxd.toFixed(3)} deg`);
