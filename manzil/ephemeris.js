// Manzil ephemeris — the moon's tropical longitude, on device.
// Truncated Meeus ch.47 (ELP main terms): accuracy ~0.005°, far inside a 12°51' mansion bin.
(function () {
  const D2R = Math.PI / 180;
  const norm = (d) => ((d % 360) + 360) % 360;
  function moonLon(date) {
    const jd = date.getTime() / 86400000 + 2440587.5;
    const T = (jd - 2451545.0) / 36525;
    const Lp = norm(218.3164477 + 481267.88123421 * T - 0.0015786 * T * T + T * T * T / 538841 - T * T * T * T / 65194000);
    const D = norm(297.8501921 + 445267.1114034 * T - 0.0018819 * T * T + T * T * T / 545868 - T * T * T * T / 113065000);
    const M = norm(357.5291092 + 35999.0502909 * T - 0.0001536 * T * T + T * T * T / 24490000);
    const Mp = norm(134.9633964 + 477198.8675055 * T + 0.0087414 * T * T + T * T * T / 69699 - T * T * T * T / 14712000);
    const F = norm(93.2720950 + 483202.0175233 * T - 0.0036539 * T * T - T * T * T / 3526000 + T * T * T * T / 863310000);
    const E = 1 - 0.002516 * T - 0.0000074 * T * T;
    // [coeff ×1e-6 deg, d, m, mp, f]
    const terms = [
      [6288774, 0, 0, 1, 0], [1274027, 2, 0, -1, 0], [658314, 2, 0, 0, 0], [213618, 0, 0, 2, 0],
      [-185116, 0, 1, 0, 0], [-114332, 0, 0, 0, 2], [58793, 2, 0, -2, 0], [57066, 2, -1, -1, 0],
      [53322, 2, 0, 1, 0], [45758, 2, -1, 0, 0], [-40923, 0, 1, -1, 0], [-34720, 1, 0, 0, 0],
      [-30383, 0, 1, 1, 0], [15327, 2, 0, 0, -2], [-12528, 0, 0, 1, 2], [10980, 0, 0, 1, -2],
      [10675, 4, 0, -1, 0], [10034, 0, 0, 3, 0], [8548, 4, 0, -2, 0], [-7888, 2, 1, -1, 0],
      [-6766, 2, 1, 0, 0], [-5163, 1, 0, -1, 0], [4987, 1, 1, 0, 0], [4036, 2, -1, 1, 0],
      [3994, 2, 0, 2, 0], [3861, 4, 0, 0, 0], [3665, 2, 0, -3, 0], [-2689, 0, 1, -2, 0],
      [-2602, 2, 0, -1, 2], [2390, 2, -1, -2, 0], [-2348, 1, 0, 1, 0], [2236, 2, -2, 0, 0],
    ];
    let sum = 0;
    for (const [c, d, m, mp, f] of terms) {
      let coeff = c;
      if (m === 1 || m === -1) coeff *= E; else if (m === 2 || m === -2) coeff *= E * E;
      sum += coeff * Math.sin((d * D + m * M + mp * Mp + f * F) * D2R);
    }
    const A1 = norm(119.75 + 131.849 * T), A2 = norm(53.09 + 479264.290 * T);
    sum += 3958 * Math.sin(A1 * D2R) + 1962 * Math.sin((Lp - F) * D2R) + 318 * Math.sin(A2 * D2R);
    const Om = norm(125.04452 - 1934.136261 * T);
    const nut = -0.00478 * Math.sin(Om * D2R); // nutation in longitude, main term
    return norm(Lp + sum / 1e6 + nut);
  }
  const W = 360 / 28; // 12°51'26" per mansion, tropical, from 0° aries
  const idOf = (lon) => Math.floor(norm(lon) / W) + 1;
  // a night's mansion holds from 6am to 6am local; read at 21:00 local of that night
  function nightAnchor(date) {
    const d = new Date(date.getTime());
    if (d.getHours() < 6) d.setDate(d.getDate() - 1);
    d.setHours(21, 0, 0, 0);
    return d;
  }
  function mansionAt(date) {
    const lon = moonLon(date);
    return { id: idOf(lon), lon, degIn: norm(lon) - (idOf(lon) - 1) * W };
  }
  function tonight(date) {
    const anchor = nightAnchor(date || new Date());
    const m = mansionAt(anchor);
    return { id: m.id, lon: m.lon, degIn: m.degIn, anchor };
  }
  function nextCrossing(date) {
    const start = date || new Date();
    const id0 = mansionAt(start).id;
    const t = new Date(start.getTime());
    for (let i = 0; i < 400; i++) { // ≤ ~2.8 days at 10-min steps
      t.setMinutes(t.getMinutes() + 10);
      if (mansionAt(t).id !== id0) return t;
    }
    return t;
  }
  window.ManzilEphem = { moonLon, mansionAt, tonight, nextCrossing, idOf, MANSION_WIDTH: W };

  // Planetary tropical longitudes — Schlyter's low-precision elements (~0.1-1°, far inside a mansion bin).
  function kepler(M, e) {
    let E = M + e * Math.sin(M) * (1 + e * Math.cos(M));
    for (let i = 0; i < 8; i++) E = E - (E - e * Math.sin(E) - M) / (1 - e * Math.cos(E));
    return E;
  }
  const EL = { // N, i, w, a, e0, edot, M0, Mdot (deg, AU; d = days since J2000-ish epoch 1999-12-31 0h)
    mercury: [48.3313, 3.24e-5, 7.0047, 5e-8, 29.1241, 1.01444e-5, 0.387098, 0.205635, 5.59e-10, 168.6562, 4.0923344368],
    venus: [76.6799, 2.46e-5, 3.3946, 2.75e-8, 54.891, 1.38374e-5, 0.72333, 0.006773, -1.302e-9, 48.0052, 1.6021302244],
    mars: [49.5574, 2.11e-5, 1.8497, -1.78e-8, 286.5016, 2.92961e-5, 1.523688, 0.093405, 2.516e-9, 18.6021, 0.5240207766],
    jupiter: [100.4542, 2.76854e-5, 1.303, -1.557e-7, 273.8777, 1.64505e-5, 5.20256, 0.048498, 4.469e-9, 19.895, 0.0830853001],
    saturn: [113.6634, 2.3898e-5, 2.4886, -1.081e-7, 339.3939, 2.97661e-5, 9.55475, 0.055546, -9.499e-9, 316.967, 0.0334442282],
  };
  function helio(name, d) {
    const [N0, Nd, i0, id_, w0, wd, a, e0, ed, M0, Md] = EL[name];
    const N = norm(N0 + Nd * d) * D2R, inc = (i0 + id_ * d) * D2R, w = norm(w0 + wd * d) * D2R;
    const e = e0 + ed * d, M = norm(M0 + Md * d) * D2R;
    const E = kepler(M, e);
    const xv = a * (Math.cos(E) - e), yv = a * Math.sqrt(1 - e * e) * Math.sin(E);
    const v = Math.atan2(yv, xv), r = Math.sqrt(xv * xv + yv * yv);
    const xh = r * (Math.cos(N) * Math.cos(v + w) - Math.sin(N) * Math.sin(v + w) * Math.cos(inc));
    const yh = r * (Math.sin(N) * Math.cos(v + w) + Math.cos(N) * Math.sin(v + w) * Math.cos(inc));
    return { x: xh, y: yh };
  }
  function sunLon(d) {
    const w = norm(282.9404 + 4.70935e-5 * d) * D2R, e = 0.016709 - 1.151e-9 * d, M = norm(356.047 + 0.9856002585 * d) * D2R;
    const E = kepler(M, e);
    const xv = Math.cos(E) - e, yv = Math.sqrt(1 - e * e) * Math.sin(E);
    return { lon: norm((Math.atan2(yv, xv) + w) / D2R), r: Math.sqrt(xv * xv + yv * yv) };
  }
  function planets(date) {
    const d = date.getTime() / 86400000 + 2440587.5 - 2451543.5;
    const s = sunLon(d);
    const xs = s.r * Math.cos(s.lon * D2R), ys = s.r * Math.sin(s.lon * D2R);
    const out = { sun: s.lon, moon: moonLon(date) };
    for (const name of Object.keys(EL)) {
      const h = helio(name, d);
      out[name] = norm(Math.atan2(h.y + ys, h.x + xs) / D2R);
    }
    return out;
  }
  // The night's ruler: the classical planet making the most exact aspect (0/60/90/120/180) to tonight's moon;
  // ties break by the daily's ladder: saturn > jupiter > mars > venus > mercury.
  const LADDER = ["saturn", "jupiter", "mars", "venus", "mercury"];
  function nightRuler(date) {
    const anchor = nightAnchor(date || new Date());
    const p = planets(anchor);
    let best = null;
    for (const name of LADDER) {
      let sep = Math.abs(norm(p[name] - p.moon));
      if (sep > 180) sep = 360 - sep;
      const orb = Math.min(...[0, 60, 90, 120, 180].map((a) => Math.abs(sep - a)));
      if (!best || orb < best.orb - 1e-9) best = { planet: name, orb, sep };
    }
    return best;
  }
  window.ManzilEphem.planets = planets;
  window.ManzilEphem.nightRuler = nightRuler;
  window.ManzilEphem.mansionOf = (name, date) => idOf(planets(nightAnchor(date || new Date()))[name]);
})();

