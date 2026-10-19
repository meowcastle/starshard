// Manzil app bridge — the only native-side code the page sees. OWNER: Claude Code.
//
// Loaded by the app build (tools/build-app.mjs) as the FIRST script in the
// page, before support.js, and only in the iOS/Android bundle; the website
// never loads it. It does five things and touches no markup:
//
//   1. names the API (window.STARSHARD_APP), which api.js reads at import
//   2. hands the PvP socket the session token (the webview's cookies are
//      third-party to the API, so the app authenticates with a bearer token)
//   3. dresses the shell: status bar off, landscape on phones (the game's own
//      rotate prompt never has to show), splash held until the first frame
//   4. answers the game's own events with haptics, and Android's back button
//      with the game's own Escape (which opens the lobby menu)
//   5. the nightly reminder: "the moon is in the heart tonight", computed on
//      the device from the same ephemeris the game uses, opt-in, adults only
//      by default (the ethics floor: notifications off by default for minors)
//
// Everything here is guarded: on a plain browser (Capacitor absent) only 1 and
// 2 run, which is what lets the same bundle be smoke-tested in Playwright.
(function () {
  var CFG = window.STARSHARD_APP_CONFIG || {};
  var TOKEN_KEY = 'starshard-app-session';
  var cap = window.Capacitor;
  var native = !!(cap && cap.isNativePlatform && cap.isNativePlatform());
  var P = (cap && cap.Plugins) || {};

  window.STARSHARD_APP = {
    apiBase: CFG.apiBase,
    platform: native ? cap.getPlatform() : 'web',
    version: CFG.version || '',
    openAccountData: function () { location.href = './account-data/index.html'; },
    remindMe: function (on) { return setReminders(!!on, true); },
  };

  // --- 2. the socket handshake --------------------------------------------
  // The page loads socket-io-client.js with a plain <script>, which assigns
  // window.io. Wrap whatever gets assigned so every connection carries
  // auth.token. Reading the token at connect time (not now) is the point:
  // the player signs in after this runs.
  var realIo;
  function wrapIo(f) {
    if (typeof f !== 'function' || f.__app) return f;
    var w = function (url, opts) {
      var o = Object.assign({}, opts || {});
      var t = null;
      try { t = localStorage.getItem(TOKEN_KEY); } catch (e) {}
      if (t) o.auth = Object.assign({}, o.auth || {}, { token: t });
      return f.call(this, url, o);
    };
    Object.keys(f).forEach(function (k) { w[k] = f[k]; });
    w.__app = true;
    return w;
  }
  try {
    Object.defineProperty(window, 'io', {
      configurable: true,
      get: function () { return realIo; },
      set: function (v) { realIo = wrapIo(v); },
    });
  } catch (e) { /* a non-configurable io already exists; nothing to wrap */ }

  if (!native) return;

  // --- 3. the shell ------------------------------------------------------
  function call(plugin, method, arg) {
    try {
      var p = P[plugin];
      return p && p[method] ? Promise.resolve(p[method](arg)).catch(function () {}) : Promise.resolve();
    } catch (e) { return Promise.resolve(); }
  }
  document.documentElement.classList.add('mz-app', 'mz-' + cap.getPlatform());
  call('StatusBar', 'hide');
  // Phones play landscape; a tablet is wide enough either way and keeps both.
  if (Math.min(screen.width, screen.height) < 700) call('ScreenOrientation', 'lock', { orientation: 'landscape' });

  var splashDown = false;
  function dropSplash() {
    if (splashDown) return; splashDown = true;
    call('SplashScreen', 'hide', { fadeOutDuration: 300 });
  }
  window.addEventListener('manzil:moment', dropSplash, { once: true });
  // The first rendered frame is the real signal; the moment event is the
  // reliable one. Belt and braces: never hold the splash past 9s.
  setTimeout(dropSplash, 9000);
  document.addEventListener('DOMContentLoaded', function () {
    var mo = new MutationObserver(function () {
      if (document.querySelector('x-dc *[style]')) { mo.disconnect(); setTimeout(dropSplash, 250); }
    });
    mo.observe(document.body, { childList: true, subtree: true });
  });

  // --- 4. the game's own events -------------------------------------------
  var H = function (m, a) { return call('Haptics', m, a); };
  window.addEventListener('manzil:settle', function () { H('impact', { style: 'LIGHT' }); });
  window.addEventListener('manzil:verdict', function (e) {
    var v = e.detail || {};
    if (v.climb && v.climb.cleared) return H('notification', { type: 'SUCCESS' });
    if (v.board && v.board.winner === 'you') return H('impact', { style: 'MEDIUM' });
    if (v.board && v.board.winner === 'sky') return H('notification', { type: 'WARNING' });
  });

  var lastBack = 0;
  if (P.App && P.App.addListener) {
    P.App.addListener('backButton', function () {
      var now = Date.now();
      if (now - lastBack < 1500) return call('App', 'minimizeApp');
      lastBack = now;
      // Escape is the game's own "open the lobby menu / step back".
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', code: 'Escape', bubbles: true }));
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', code: 'Escape', bubbles: true }));
    });
    // A new night while the app sat in the background: the page computes
    // tonight at render, so reload when the moon has changed house and no
    // board is in play.
    var launchedOn = moonNow();
    var moment = null;
    window.addEventListener('manzil:moment', function (e) { moment = e.detail && e.detail.moment; });
    P.App.addListener('resume', function () {
      var m = moonNow();
      if (m && launchedOn && m !== launchedOn && (moment === 'road' || moment == null)) location.reload();
      setReminders(null, false);
    });
  }

  // --- 5. the nightly reminder ---------------------------------------------
  var NAMES = ['the gate', 'the bearer', 'the gathered stars', 'the follower', 'the blaze', 'the storm',
    'the return', 'the ghost', 'the glance', 'the throne', 'the mane', 'the turning', 'the hand',
    'the jewel', 'the veil', 'the claws', 'the crown', 'the heart', 'the root', 'the flock',
    'the empty district', 'the listener', 'the drum', 'the void', 'the hideaway', 'the chamber',
    'the guide', 'the thread'];
  var PREF = 'manzil-app-remind'; // "on" | "off" | absent (never asked)

  function moonNow(d) {
    try { return window.ManzilEphem ? window.ManzilEphem.mansionOf('moon', d) : 0; } catch (e) { return 0; }
  }
  function adult() {
    try {
      var b = JSON.parse(localStorage.getItem('manzil-v2-birth') || 'null');
      if (!b || !b.date) return false; // unknown reads as not an adult: off by default
      var d = new Date(b.date + 'T12:00:00');
      var t = new Date();
      var age = t.getFullYear() - d.getFullYear() - (t < new Date(t.getFullYear(), d.getMonth(), d.getDate()) ? 1 : 0);
      return age >= 18;
    } catch (e) { return false; }
  }
  function claims() {
    try { return JSON.parse(localStorage.getItem('manzil-v2-claims') || '{}') || {}; } catch (e) { return {}; }
  }

  // Fourteen nights ahead, one notification each, rebuilt on every launch and
  // resume so they always match the real sky and the player's own walked houses.
  function schedule() {
    var at = String(CFG.remindAt || '19:30').split(':');
    var walked = claims();
    var list = [];
    for (var i = 0; i < 14; i++) {
      var d = new Date();
      d.setDate(d.getDate() + i);
      d.setHours(+at[0] || 19, +at[1] || 30, 0, 0);
      if (d <= new Date()) continue;
      var m = moonNow(new Date(d.getTime()));
      if (!m) continue;
      var name = NAMES[m - 1];
      var body = walked[m]
        ? 'the moon is back in ' + name + '. your house again tonight.'
        : 'the moon stands in ' + name + ' tonight. the door is open until dawn.';
      list.push({ id: 7000 + i, title: 'Manzil', body: body, schedule: { at: d, allowWhileIdle: true } });
    }
    return call('LocalNotifications', 'cancel', { notifications: Array.from({ length: 14 }, function (_, i) { return { id: 7000 + i }; }) })
      .then(function () { return list.length ? call('LocalNotifications', 'schedule', { notifications: list }) : null; });
  }

  // on: true/false from a settings control, null to just refresh. ask: allowed
  // to show the OS permission prompt now.
  function setReminders(on, ask) {
    var pref = null;
    try { pref = localStorage.getItem(PREF); } catch (e) {}
    if (on === true) { try { localStorage.setItem(PREF, 'on'); } catch (e) {} pref = 'on'; }
    if (on === false) {
      try { localStorage.setItem(PREF, 'off'); } catch (e) {}
      return call('LocalNotifications', 'cancel', { notifications: Array.from({ length: 14 }, function (_, i) { return { id: 7000 + i }; }) });
    }
    if (pref !== 'on') return Promise.resolve();
    var perm = ask ? call('LocalNotifications', 'requestPermissions') : call('LocalNotifications', 'checkPermissions');
    return perm.then(function (r) { if (r && r.display === 'granted') return schedule(); });
  }

  // First ask: after the player's first won board, never at launch, and only
  // for a known adult. Everyone else can still turn it on via remindMe(true).
  window.addEventListener('manzil:verdict', function (e) {
    var v = e.detail || {};
    if (!(v.board && v.board.winner === 'you')) return;
    var pref = null;
    try { pref = localStorage.getItem(PREF); } catch (x) {}
    if (pref || !adult()) return;
    setTimeout(function () { setReminders(true, true); }, 2500);
  });

  document.addEventListener('DOMContentLoaded', function () { setTimeout(function () { setReminders(null, false); }, 3000); });
})();
