// ring.jsx: the ring of 28, as the game draws it (SS5, 1 Nov 2026).
//
// Geometry and colour are the V2 file's codex ring (_codexVals): a 300 x 300 field, radius
// 118, station 1 at the top and the rest clockwise, a 14 px stroke with a .028 rad gap, the
// four quarters in the game's four colours, the station the moon stands in breathing in amber
// with the game's drop shadow, a dashed inner circle, a faint outer one, four ticks, and the
// core with its three lines. The segments are links to the station pages (every term a tap
// from its page). Natal marks come with SS7; `marks` is already the slot for them.
import { Link } from './router.jsx';
import STATIONS from './station-index.json';

const N = 28, R = 118, GAP = 0.028, C = 150;
const QC = { byakko: '185,198,210', suzaku: '212,90,58', seiryuu: '79,168,154', genbu: '124,138,204' };
export const quarterOf = m => (m >= 14 && m <= 20 ? 'seiryuu' : m >= 7 && m <= 13 ? 'suzaku' : m >= 21 && m <= 27 ? 'genbu' : 'byakko');
const pt = (a, r = R) => `${(C + r * Math.cos(a)).toFixed(1)} ${(C + r * Math.sin(a)).toFixed(1)}`;

export function Ring({ now, sub, name, state, marks = [], size = 292, label }) {
  const segs = Array.from({ length: N }, (_, i) => {
    const m = i + 1, q = quarterOf(m), here = m === now;
    const a0 = -Math.PI / 2 + i * 2 * Math.PI / N + GAP, a1 = -Math.PI / 2 + (i + 1) * 2 * Math.PI / N - GAP;
    const s = STATIONS[i];
    return { m, here, s, d: `M ${pt(a0)} A ${R} ${R} 0 0 1 ${pt(a1)}`, stroke: `rgba(${QC[q]},${here ? 1 : 0.26})` };
  });
  return (
    <div className="ring" style={{ width: size, height: size }} role="img" aria-label={label}>
      <svg viewBox="0 0 300 300" className="ring-svg" aria-hidden="true" focusable="false">
        <circle cx={C} cy={C} r="102" fill="none" stroke="rgba(240,216,154,.1)" strokeWidth="1" strokeDasharray="2 6" />
        <circle cx={C} cy={C} r="134" fill="none" stroke="rgba(240,216,154,.07)" strokeWidth="1" />
        {segs.map(g => (
          <Link key={g.m} href={`/station/${g.s.slug}`} className="ring-seg" aria-label={`station ${g.m}, ${g.s.epithet.toLowerCase()}${g.here ? ', the moon is here' : ''}`}>
            <path d={g.d} fill="none" stroke={g.stroke} strokeWidth={g.here ? 20 : 14} className={g.here ? 'ring-now' : ''} />
          </Link>
        ))}
        <g stroke="rgba(240,216,154,.28)" strokeWidth="1"><path d="M150 8 L150 22" /><path d="M292 150 L278 150" /><path d="M150 292 L150 278" /><path d="M8 150 L22 150" /></g>
        {marks.map(mk => {
          const a = -Math.PI / 2 + (mk.station - 1 + 0.5) * 2 * Math.PI / N;
          const [x, y] = [C + 98 * Math.cos(a), C + 98 * Math.sin(a)];
          return <text key={mk.role} x={x.toFixed(1)} y={y.toFixed(1)} textAnchor="middle" dominantBaseline="central" className={`ring-mark ring-mark-${mk.role}`}>{mk.glyph}</text>;
        })}
        <circle cx={C} cy={C} r="86" fill="rgba(240,216,154,.03)" stroke="rgba(240,216,154,.14)" strokeWidth="1" />
      </svg>
      <div className="ring-core" aria-hidden="true">
        {sub ? <span className="ring-sub">{sub}</span> : null}
        <span className="ring-name">{name}</span>
        {state ? <span className="ring-state">{state}</span> : null}
      </div>
    </div>
  );
}
