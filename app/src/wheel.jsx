// wheel.jsx: the chart wheel, drawn to scale in SVG from the engine's longitudes (SS6,
// 1 Nov 2026).
//
// Geometry, outside in: the 28 stations as the outer ring (the game's codex ring, the same
// four quarter colours and gap, the natal moon's station lit in amber the way the game lights
// the moon's station tonight), the twelve signs with their glyphs, a degree scale, the twelve
// houses with their cusps and numbers, the ascendant and midheaven as the two heavy lines,
// the ten bodies at their longitudes with their degrees (glyphs pushed apart where they
// crowd, a tick keeping the true place), and the aspects as lines across the centre.
// The ascendant sits at the left and the zodiac runs counter-clockwise, as every printed
// chart draws it; a chart with no birth time turns 0° aries to the left instead.
//
// Colour is tokens.css's and the game's: gold hairlines at the game's alphas, parchment for
// the bodies, amber for what is lit, the quarter colours for the stations, the game's teal
// for the easy aspects and its red for the hard ones.
import { Link } from './router.jsx';
import STATIONS from './station-index.json';
import { quarterOf } from './ring.jsx';
import { BODIES, GLYPH, SIGN_GLYPH, STATION_WIDTH, dm } from './chart-engine.js';

const C = 300;
const R = { stOut: 298, st: 286, stIn: 274, zodOut: 270, zodIn: 238, tick: 238, houseOut: 238, aspect: 150, body: 204, bodyDeg: 182, houseNum: 164 };
const QC = { byakko: '185,198,210', suzaku: '212,90,58', seiryuu: '79,168,154', genbu: '124,138,204' };
const EASY = 'rgba(79,168,154,.75)', HARD = 'rgba(212,90,58,.75)';
const D2R = Math.PI / 180;
const norm = d => ((d % 360) + 360) % 360;

/** Longitude to the wheel's angle (degrees, counter-clockwise from the right), the ascendant at the left. */
const angleOf = (lon, rot) => 180 + (lon - rot);
const xy = (a, r) => [C + r * Math.cos(a * D2R), C - r * Math.sin(a * D2R)];
const P = (a, r) => { const [x, y] = xy(a, r); return `${x.toFixed(2)} ${y.toFixed(2)}`; };
/** An arc from lon0 to lon1 counter-clockwise on the page (sweep 0 in SVG's flipped y). */
const arc = (lon0, lon1, r, rot) => {
  const a0 = angleOf(lon0, rot), a1 = angleOf(lon1, rot);
  const large = norm(lon1 - lon0) > 180 ? 1 : 0;
  return `M ${P(a0, r)} A ${r} ${r} 0 ${large} 0 ${P(a1, r)}`;
};

/** Push crowded glyphs apart around the circle; returns the drawn longitude per body. */
function spread(lons, minGap = 7.5) {
  const items = Object.entries(lons).map(([name, lon]) => ({ name, lon: norm(lon), at: norm(lon) })).sort((a, b) => a.lon - b.lon);
  if (items.length < 2) return Object.fromEntries(items.map(i => [i.name, i.at]));
  for (let pass = 0; pass < 40; pass++) {
    let moved = false;
    for (let i = 0; i < items.length; i++) {
      const a = items[i], b = items[(i + 1) % items.length];
      let gap = norm(b.at - a.at);
      if (items.length === 2 && gap > 180) gap = 360 - gap;
      if (gap < minGap - 1e-6) {
        const push = (minGap - gap) / 2;
        a.at = norm(a.at - push);
        b.at = norm(b.at + push);
        moved = true;
      }
    }
    if (!moved) break;
  }
  return Object.fromEntries(items.map(i => [i.name, i.at]));
}

export function Wheel({ chart, label }) {
  if (!chart) return null;
  const rot = chart.housed ? chart.angles.ascendant.lon : 0;
  const lit = chart.moonStation;

  // the 28 stations
  const stations = STATIONS.map((s, i) => {
    const lon0 = i * STATION_WIDTH, lon1 = (i + 1) * STATION_WIDTH;
    const gap = 0.9; // degrees, the game's .028 rad at r 118 scaled to this ring
    const q = quarterOf(s.n), here = s.n === lit;
    const mid = angleOf(lon0 + STATION_WIDTH / 2, rot);
    const [nx, ny] = xy(mid, R.st);
    return { s, here, d: arc(lon0 + gap, lon1 - gap, R.st, rot), stroke: `rgba(${QC[q]},${here ? 1 : 0.28})`, nx, ny };
  });

  // the degree scale as one path
  let ticks = '';
  for (let d = 0; d < 360; d++) {
    const a = angleOf(d, rot);
    const len = d % 30 === 0 ? 10 : d % 10 === 0 ? 7 : d % 5 === 0 ? 5 : 3;
    ticks += `M ${P(a, R.tick)} L ${P(a, R.tick - len)} `;
  }

  // the bodies, spread
  const trueLon = Object.fromEntries(BODIES.map(b => [b, chart.bodies[b].lon]));
  const drawn = spread(trueLon);

  // the aspects, lines across the centre; conjunctions are a mark beside the pair, not a line
  const lonOf = name => (chart.bodies[name] ? chart.bodies[name].lon : chart.angles ? chart.angles[name].lon : null);
  const lines = chart.aspects
    .filter(a => a.aspect !== 'conjunction')
    .map(a => ({ ...a, la: lonOf(a.a), lb: lonOf(a.b) }))
    .filter(a => a.la != null && a.lb != null);

  return (
    <svg viewBox="0 0 600 600" className="wheel" role="img" aria-label={label} focusable="false">
      {/* ground */}
      <circle cx={C} cy={C} r={R.stOut} fill="rgba(240,216,154,.02)" stroke="rgba(240,216,154,.07)" strokeWidth="1" />
      <circle cx={C} cy={C} r={R.stIn} fill="none" stroke="rgba(240,216,154,.1)" strokeWidth="1" strokeDasharray="2 6" />

      {/* the 28 stations */}
      <g className="wheel-stations">
        {stations.map(g => (
          <Link key={g.s.n} href={`/station/${g.s.slug}`} className="ring-seg wheel-station" aria-label={`station ${g.s.n}, ${g.s.epithet.toLowerCase()}${g.here ? ', your moon is here' : ''}`}>
            <path d={g.d} fill="none" stroke={g.stroke} strokeWidth={g.here ? 16 : 12} className={g.here ? 'ring-now' : ''} />
            <text x={g.nx.toFixed(1)} y={g.ny.toFixed(1)} textAnchor="middle" dominantBaseline="central" className={`wheel-station-n${g.here ? ' lit' : ''}`}>{g.s.n}</text>
          </Link>
        ))}
      </g>

      {/* the twelve signs */}
      <g className="wheel-zodiac">
        <circle cx={C} cy={C} r={R.zodOut} fill="none" stroke="rgba(240,216,154,.3)" strokeWidth="1" />
        <circle cx={C} cy={C} r={R.zodIn} fill="none" stroke="rgba(240,216,154,.3)" strokeWidth="1" />
        {SIGN_GLYPH.map((g, i) => {
          const a = angleOf(i * 30, rot);
          const [gx, gy] = xy(angleOf(i * 30 + 15, rot), (R.zodOut + R.zodIn) / 2);
          return (
            <g key={g}>
              <path d={`M ${P(a, R.zodIn)} L ${P(a, R.zodOut)}`} stroke="rgba(240,216,154,.3)" strokeWidth="1" />
              <text x={gx.toFixed(1)} y={gy.toFixed(1)} textAnchor="middle" dominantBaseline="central" className="wheel-sign">{g}</text>
            </g>
          );
        })}
        <path d={ticks} stroke="rgba(240,216,154,.35)" strokeWidth="1" fill="none" />
      </g>

      {/* the houses */}
      {chart.housed ? (
        <g className="wheel-houses">
          {chart.houses.map((h, i) => {
            const a = angleOf(h.cusp, rot);
            const next = chart.houses[(i + 1) % 12].cusp;
            const span = norm(next - h.cusp);
            const [nx, ny] = xy(angleOf(h.cusp + span / 2, rot), R.houseNum);
            const angle = i === 0 || i === 9 ? 'main' : i === 6 || i === 3 ? 'opp' : null;
            const stroke = angle === 'main' ? 'rgba(240,216,154,.85)' : angle === 'opp' ? 'rgba(240,216,154,.45)' : 'rgba(240,216,154,.22)';
            return (
              <g key={h.n}>
                <path d={`M ${P(a, R.aspect)} L ${P(a, angle ? R.zodOut : R.houseOut)}`} stroke={stroke} strokeWidth={angle === 'main' ? 1.6 : 1} />
                <text x={nx.toFixed(1)} y={ny.toFixed(1)} textAnchor="middle" dominantBaseline="central" className="wheel-house-n">{h.n}</text>
              </g>
            );
          })}
          {[['ascendant', 'AC'], ['midheaven', 'MC'], ['descendant', 'DC'], ['ic', 'IC']].map(([k, t]) => {
            const a = angleOf(chart.angles[k].lon, rot);
            const [tx, ty] = xy(a, R.aspect - 13);
            return <text key={k} x={tx.toFixed(1)} y={ty.toFixed(1)} textAnchor="middle" dominantBaseline="central" className={`wheel-angle${k === 'ascendant' || k === 'midheaven' ? ' main' : ''}`}>{t}</text>;
          })}
        </g>
      ) : null}

      {/* the aspects */}
      <g className="wheel-aspects">
        <circle cx={C} cy={C} r={R.aspect} fill="rgba(240,216,154,.03)" stroke="rgba(240,216,154,.14)" strokeWidth="1" />
        {lines.map((a, i) => {
          const hard = a.aspect === 'square' || a.aspect === 'opposition';
          return <path key={i} d={`M ${P(angleOf(a.la, rot), R.aspect)} L ${P(angleOf(a.lb, rot), R.aspect)}`} stroke={hard ? HARD : EASY} strokeWidth={a.orb < 2 ? 1.4 : 0.9} strokeOpacity={a.orb < 2 ? 1 : 0.7} className={`wheel-aspect ${a.aspect}`} />;
        })}
      </g>

      {/* the moon's uncertainty on a noon chart: the stretch it may stand in */}
      {!chart.timeKnown ? (
        <path d={arc(chart.bodies.moon.lon - chart.moonUncertainty, chart.bodies.moon.lon + chart.moonUncertainty, R.body, rot)} fill="none" stroke="rgba(242,234,214,.3)" strokeWidth="10" strokeLinecap="round" className="wheel-moon-range" />
      ) : null}

      {/* the bodies */}
      <g className="wheel-bodies">
        {BODIES.map(name => {
          const b = chart.bodies[name];
          const at = angleOf(drawn[name], rot), tru = angleOf(b.lon, rot);
          const [gx, gy] = xy(at, R.body);
          const [dx, dy] = xy(at, R.bodyDeg);
          const moved = Math.abs(norm(drawn[name] - b.lon + 180) - 180) > 0.6;
          return (
            <g key={name} className={`wheel-body ${name}${b.retrograde ? ' rx' : ''}`}>
              <path d={`M ${P(tru, R.tick)} L ${P(tru, R.tick - 7)}`} stroke="rgba(242,234,214,.9)" strokeWidth="1.5" />
              {moved ? <path d={`M ${P(tru, R.tick - 7)} L ${P(at, R.body + 11)}`} stroke="rgba(242,234,214,.35)" strokeWidth="1" /> : null}
              <text x={gx.toFixed(1)} y={gy.toFixed(1)} textAnchor="middle" dominantBaseline="central" className={`wheel-glyph ${name === 'sun' || name === 'moon' ? 'light' : ''}`}>{GLYPH[name]}</text>
              <text x={dx.toFixed(1)} y={dy.toFixed(1)} textAnchor="middle" dominantBaseline="central" className="wheel-deg">{dm(b.degInSign)}{b.retrograde ? ' ℞' : ''}</text>
            </g>
          );
        })}
      </g>
    </svg>
  );
}
