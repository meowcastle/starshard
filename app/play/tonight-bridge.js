// tonight-bridge.js: the game reads the shell's sky (BACKLOG SS9b, 2 Nov 2026).
//
// The September Manzil file computes tonight's station on the device with ephemeris2.js
// (window.ManzilEphem). The shell reads GET /api/tonight (astro.js on the server, SS2) and
// keeps the answer in localStorage under 'starshard-tonight' (app/src/tonight.js). The two
// engines name different stations on a few nights a year (test/tonight-agreement.test.mjs
// holds the count), and a visitor who walks from the shell into the game should not see the
// moon move between the two pages.
//
// So this script, loaded by dist/play/index.html right after ephemeris2.js and before the
// runtime boots, reads that key synchronously. When it holds tonight's answer (same night,
// same zone), ManzilEphem.mansionOf(name) with no date, the game's "where does the moon (or
// a planet) stand tonight" call, and nightRuler() with no date answer from the server's sky.
// Every dated call, and every night the key does not cover, falls through to ephemeris2.js
// exactly as shipped. Then it asks the API once, through api.js's own API_BASE, and keeps the
// answer for the next load; a game opened before the shell on a fresh device plays on the
// device's sky tonight and the server's from tomorrow.
//
// Nothing in the game file is edited: the game calls the same ManzilEphem it always did.
// ManzilEphem.source says which engine answered ('api' or 'device').
(function () {
  var KEY = 'starshard-tonight';
  var LADDER = ['saturn', 'jupiter', 'mars', 'venus', 'mercury'];
  function norm(d) { return ((d % 360) + 360) % 360; }
  function pad(n) { return String(n).padStart(2, '0'); }
  function nightKey(at) {
    var d = new Date(at.getTime());
    if (d.getHours() < 6) d.setDate(d.getDate() - 1);
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  }
  function localTz() { try { return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'; } catch (e) { return 'UTC'; } }
  var tz = localTz();
  var sky = null;
  try {
    var raw = JSON.parse(localStorage.getItem(KEY) || 'null');
    if (raw && raw.night === nightKey(new Date()) && raw.tz === tz && raw.moon && raw.planets && raw.planets.moon) sky = raw;
  } catch (e) { sky = null; }

  var E = window.ManzilEphem;
  if (E && !E.__bridged) {
    E.__bridged = true;
    var mansionOf = E.mansionOf, nightRuler = E.nightRuler;
    E.mansionOf = function (name, date) {
      if (!date && sky && sky.planets[name] && sky.planets[name].station >= 1) return sky.planets[name].station;
      return mansionOf(name, date);
    };
    E.nightRuler = function (date) {
      if (!date && sky) {
        // ephemeris2.js's own rule on the server's longitudes: the classical planet making the
        // most exact aspect to tonight's moon, ties to the ladder's order
        var best = null;
        for (var i = 0; i < LADDER.length; i++) {
          var p = sky.planets[LADDER[i]];
          if (!p) { best = null; break; }
          var sep = Math.abs(norm(p.lon - sky.planets.moon.lon));
          if (sep > 180) sep = 360 - sep;
          var orb = Math.min.apply(null, [0, 60, 90, 120, 180].map(function (a) { return Math.abs(sep - a); }));
          if (!best || orb < best.orb - 1e-9) best = { planet: LADDER[i], orb: orb, sep: sep };
        }
        if (best) return best;
      }
      return nightRuler(date);
    };
    E.source = sky ? 'api' : 'device';
    E.night = sky ? sky.night : null;
  }

  // the next load: one request, kept for this night, api.js deciding where the API is
  try {
    import('./api.js').then(function (api) {
      if (!api || !api.API_BASE) return;
      return fetch(api.API_BASE + '/api/tonight?tz=' + encodeURIComponent(tz)).then(function (r) { return r.ok ? r.json() : null; }).then(function (s) {
        if (s && s.moon && s.planets) { try { localStorage.setItem(KEY, JSON.stringify(Object.assign({}, s, { tz: tz }))); } catch (e) { /* storage is a convenience */ } }
      });
    }).catch(function () { /* the device answers */ });
  } catch (e) { /* no dynamic import: the device answers */ }
})();
