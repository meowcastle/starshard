// Star Shard — real astronomy (low-precision Meeus, good to <0.5°)
const D2R = Math.PI / 180, R2D = 180 / Math.PI;
const norm = d => ((d % 360) + 360) % 360;
const sin = d => Math.sin(d * D2R), cos = d => Math.cos(d * D2R), tan = d => Math.tan(d * D2R);

export function julianDay(y, m, d, utHours) {
  if (m <= 2) { y -= 1; m += 12; }
  const A = Math.floor(y / 100), B = 2 - A + Math.floor(A / 4);
  return Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) + d + B - 1524.5 + utHours / 24;
}

export function sunLongitude(jd) {
  const T = (jd - 2451545) / 36525;
  const L0 = norm(280.46646 + 36000.76983 * T + 0.0003032 * T * T);
  const M = norm(357.52911 + 35999.05029 * T - 0.0001537 * T * T);
  const C = (1.914602 - 0.004817 * T) * sin(M) + (0.019993 - 0.000101 * T) * sin(2 * M) + 0.000289 * sin(3 * M);
  return norm(L0 + C);
}

export function moonLongitude(jd) {
  const T = (jd - 2451545) / 36525;
  const Lp = norm(218.3164477 + 481267.88123421 * T);
  const D = norm(297.8501921 + 445267.1114034 * T);
  const M = norm(357.5291092 + 35999.0502909 * T);
  const Mp = norm(134.9633964 + 477198.8675055 * T);
  const F = norm(93.2720950 + 483202.0175233 * T);
  const dL = 6.288774 * sin(Mp) + 1.274027 * sin(2 * D - Mp) + 0.658314 * sin(2 * D)
    + 0.213618 * sin(2 * Mp) - 0.185116 * sin(M) - 0.114332 * sin(2 * F)
    + 0.058793 * sin(2 * D - 2 * Mp) + 0.057066 * sin(2 * D - M - Mp) + 0.053322 * sin(2 * D + Mp)
    + 0.045758 * sin(2 * D - M) - 0.040923 * sin(M - Mp) - 0.034720 * sin(D) - 0.030383 * sin(M + Mp);
  return norm(Lp + dL);
}

export function obliquity(jd) {
  const T = (jd - 2451545) / 36525;
  return 23.4392911 - 0.0130042 * T;
}

export function gmst(jd) {
  const T = (jd - 2451545) / 36525;
  return norm(280.46061837 + 360.98564736629 * (jd - 2451545) + 0.000387933 * T * T - T * T * T / 38710000);
}

// ecliptic longitude of the ecliptic point with right ascension ra
function raToEcl(ra, eps) {
  let lam = Math.atan2(sin(ra), cos(ra) * cos(eps)) * R2D;
  return norm(lam);
}
function declOfEcl(lam, eps) { return Math.asin(sin(eps) * sin(lam)) * R2D; }

export function ascendant(ramc, eps, lat) {
  const asc = Math.atan2(cos(ramc), -(sin(eps) * tan(lat) + cos(eps) * sin(ramc))) * R2D;
  return norm(asc);
}

export function placidusCusps(ramc, eps, lat) {
  const mc = raToEcl(ramc, eps);
  const asc = ascendant(ramc, eps, lat);
  // iterate a cusp: raOffsetFn(ad) gives target RA given ascensional difference
  const solve = (raStart, raFn) => {
    let ra = raStart;
    for (let i = 0; i < 12; i++) {
      const lam = raToEcl(ra, eps);
      const dec = declOfEcl(lam, eps);
      let x = tan(lat) * tan(dec);
      x = Math.max(-0.99, Math.min(0.99, x)); // clamp for high latitudes
      const ad = Math.asin(x) * R2D;
      ra = raFn(ad);
    }
    return raToEcl(ra, eps);
  };
  const c11 = solve(ramc + 30, ad => ramc + (90 + ad) / 3);
  const c12 = solve(ramc + 60, ad => ramc + 2 * (90 + ad) / 3);
  const c2 = solve(ramc + 120, ad => ramc + 180 - 2 * (90 - ad) / 3);
  const c3 = solve(ramc + 150, ad => ramc + 180 - (90 - ad) / 3);
  const cusps = [asc, c2, c3, norm(mc + 180), norm(c11 + 180), norm(c12 + 180),
    norm(asc + 180), norm(c2 + 180), norm(c3 + 180), mc, c11, c12];
  return { cusps, asc, mc };
}

export function houseOf(lon, cusps) {
  for (let i = 0; i < 12; i++) {
    const a = cusps[i], b = cusps[(i + 1) % 12];
    const span = norm(b - a), off = norm(lon - a);
    if (off < span) return i + 1;
  }
  return 1;
}

export const SIGNS = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'];
export const SIGN_GLYPHS = ['♈', '♉', '♊', '♋', '♌', '♍', '♎', '♏', '♐', '♑', '♒', '♓'];
export const signOf = lon => Math.floor(norm(lon) / 30);
export const degInSign = lon => norm(lon) % 30;
export const mansionOf = moonLon => Math.floor(norm(moonLon) / (360 / 28));

export function computeChart({ year, month, day, hour, minute, lat, lon, tzOffset }) {
  const ut = hour + minute / 60 - tzOffset;
  const jd = julianDay(year, month, day, ut);
  const eps = obliquity(jd);
  const lst = norm(gmst(jd) + lon); // lon east-positive, degrees
  const ramc = lst;
  const sunLon = sunLongitude(jd);
  const moonLon = moonLongitude(jd);
  const { cusps, asc, mc } = placidusCusps(ramc, eps, lat);
  const weekday = Math.floor(jd + 1.5) % 7; // 0=Sunday
  return {
    jd, sunLon, moonLon, asc, mc, cusps,
    sunSign: signOf(sunLon), moonSign: signOf(moonLon), ascSign: signOf(asc),
    sunHouse: houseOf(sunLon, cusps), moonHouse: houseOf(moonLon, cusps),
    mansion: mansionOf(moonLon), weekday
  };
}
