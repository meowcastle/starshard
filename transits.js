// Star Shard — transits.js: today's planet positions against a natal chart.
//
// OWNER: Claude Code. Do not edit from Claude Design.
//
// Two things live here: aspect geometry (an angle -> {aspect, orb} against
// the five classical aspects, PRODUCT.md §3's table) and the live-transit
// picker (PRODUCT.md §7: the single most significant planet-to-natal
// contact right now, the fact the daily reading is actually built from).
// classifyAspect() is a shared primitive, not private to this module on
// purpose — the Deep Chart's PATTERN tab (natal-to-natal: sun-moon,
// sun-rising, etc.) needs the identical orb table and should reuse this
// rather than duplicate it when that tab gets wired up.
//
// Planet positions come from the vendored astronomy-engine.js (MIT,
// tools/vendor-astronomy.mjs) — the only source in this codebase with a
// beyond-Sun/Moon ephemeris. Same division of labour CLAUDE.md's "What
// sky.js is worth" note already establishes: astro.js's Meeus formulas stay
// canonical for Sun/Moon, astronomy-engine only for what astro.js can't do.
// Dynamically imported inside planetPositions(), the same lazy-load
// convention sky.js's planetaryHours() already uses for the same library.
//
// Verification posture: the position math itself is astronomy-engine's
// (a maintained third-party library, not reimplemented here — same as
// planetaryHours()'s sunrise/sunset calls). What's this module's own is the
// orb table and the priority sort, both pure arithmetic over longitudes
// already in degrees. Cross-checked against PRODUCT.md §0's independently
// published sample (Mercury/Venus/Mars/Jupiter/Saturn signs+degrees+
// retrograde flags for "today's sky") — every value matched to within the
// hours-later drift expected from computing at a different moment the same
// day. See test/transits.test.mjs for the aspect-geometry test suite.

const norm = d => ((d % 360) + 360) % 360;
const angleBetween = (a, b) => { const d = Math.abs(norm(a) - norm(b)) % 360; return d > 180 ? 360 - d : d; };

// PRODUCT.md §3's exact table: angle, max orb, plain-language name.
const ASPECTS = [
  { name: 'conjunction', angle: 0, orb: 8, plain: 'stacked' },
  { name: 'sextile', angle: 60, orb: 4, plain: 'available' },
  { name: 'square', angle: 90, orb: 6, plain: 'grinding' },
  { name: 'trine', angle: 120, orb: 6, plain: 'easy' },
  { name: 'opposition', angle: 180, orb: 8, plain: 'facing' },
];

/**
 * The angular separation between two ecliptic longitudes, classified
 * against the five classical aspects. Returns null if nothing is in orb —
 * the common case; most pairs of points aren't in any aspect at all. If a
 * separation somehow qualified for two aspects at once (impossible with
 * this table's orbs, which never overlap, but checked defensively) the
 * tightest orb wins.
 */
export function classifyAspect(lonA, lonB) {
  const sep = angleBetween(lonA, lonB);
  let best = null;
  for (const a of ASPECTS) {
    const orbUsed = Math.abs(sep - a.angle);
    if (orbUsed <= a.orb && (!best || orbUsed < best.orbUsed)) {
      best = { aspect: a.name, plain: a.plain, orbUsed, maxOrb: a.orb };
    }
  }
  return best;
}

// Priority tiebreak #2 (PRODUCT.md §7): Saturn > Jupiter > Mars > Venus >
// Mercury. The Moon and Sun are astro.js's job everywhere else in this
// codebase and aren't transiting bodies here; the outer planets past
// Saturn move too slowly to produce a *nightly* signal.
const PLANET_WEIGHT = { Saturn: 5, Jupiter: 4, Mars: 3, Venus: 2, Mercury: 1 };
const TRANSIT_PLANETS = Object.keys(PLANET_WEIGHT);

/**
 * Today's (or `date`'s) tropical ecliptic longitude and a two-day
 * finite-difference retrograde flag for each of the five transit-worthy
 * planets. `rate` is signed degrees/day; negative is retrograde motion.
 * async + dynamically imported: see the module header.
 */
export async function planetPositions(date = new Date()) {
  const AE = await import('./astronomy-engine.js');
  const earlier = new Date(date.getTime() - 2 * 86400000);
  const out = {};
  for (const name of TRANSIT_PLANETS) {
    const lon = AE.Ecliptic(AE.GeoVector(AE.Body[name], date, true)).elon;
    const lonEarlier = AE.Ecliptic(AE.GeoVector(AE.Body[name], earlier, true)).elon;
    // Signed shortest difference, wraparound-safe (e.g. 359deg -> 1deg is
    // +2deg/2days, not -358): shift into (-180,180] before dividing.
    const rate = (norm(lon - lonEarlier + 180) - 180) / 2;
    out[name] = { lon: norm(lon), retrograde: rate < 0 };
  }
  return out;
}

/**
 * Every current transiting-planet-to-natal-point contact within orb, over
 * the four trusted natal points (PRODUCT.md §3: sun, moon, rising,
 * midheaven). Rising and MC are only real contacts if the birth time is
 * known — the same honesty rule sigil.js's movingLight() applies to the
 * Moon and rising; without a time, `chart.asc`/`chart.mc` don't mean
 * anything precise enough to aspect against.
 */
export function natalContacts(positions, chart, { timeKnown }) {
  const points = [
    { point: 'sun', lon: chart.sunLon },
    { point: 'moon', lon: chart.moonLon },
  ];
  if (timeKnown) {
    points.push({ point: 'rising', lon: chart.asc });
    points.push({ point: 'mc', lon: chart.mc });
  }

  const contacts = [];
  for (const [planet, pos] of Object.entries(positions)) {
    for (const p of points) {
      const hit = classifyAspect(pos.lon, p.lon);
      if (hit) contacts.push({ planet, retrograde: pos.retrograde, point: p.point, ...hit });
    }
  }
  return contacts;
}

/**
 * The single most significant contact right now — PRODUCT.md §7's stated
 * priority, in order: closest to exact orb, then planet weight (Saturn >
 * ... > Mercury), then whether it touches sun/moon/rising over MC. Returns
 * null if nothing is in orb, a real and common outcome — most nights have
 * no live transit at all, and the daily's fallback path (PRODUCT.md §10)
 * has to be the honest default, not the exception.
 */
export function pickLiveTransit(contacts) {
  if (!contacts.length) return null;
  const big3 = c => c.point === 'sun' || c.point === 'moon' || c.point === 'rising';
  return [...contacts].sort((a, b) =>
    a.orbUsed - b.orbUsed ||
    PLANET_WEIGHT[b.planet] - PLANET_WEIGHT[a.planet] ||
    Number(big3(b)) - Number(big3(a))
  )[0];
}
