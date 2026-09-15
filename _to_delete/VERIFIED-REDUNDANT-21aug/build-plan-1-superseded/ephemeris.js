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
})();
