// manzil-art.js — living card art (placeholder linework per the commissioning briefs)
// window.ManzilArt.get(id): 1–28 mansions (parchment), 101–105 planets (amber)
(function () {
  var P = "#F0D89A", CR = "#F2EAD6", DM = "rgba(240,216,154,.45)", FN = "rgba(240,216,154,.14)";
  var A = "#FFB000", W = "#FFE9B8", DA = "rgba(255,176,0,.45)", FA = "rgba(255,176,0,.14)";
  var TB = "transform-box:fill-box;transform-origin:center;";
  function S4(x, y, r) { return "M " + x + " " + (y - r) + " L " + (x + r * .32) + " " + (y - r * .32) + " L " + (x + r) + " " + y + " L " + (x + r * .32) + " " + (y + r * .32) + " L " + x + " " + (y + r) + " L " + (x - r * .32) + " " + (y + r * .32) + " L " + (x - r) + " " + y + " L " + (x - r * .32) + " " + (y - r * .32) + " Z"; }
  function CI(x, y, r) { return "M " + (x - r) + " " + y + " a " + r + " " + r + " 0 1 0 " + (r * 2) + " 0 a " + r + " " + r + " 0 1 0 " + (-r * 2) + " 0"; }
  function sh(d, o) { return { d: d, f: o.f || "none", s: o.s || "none", w: o.w || 0, da: o.da || "none", st: (o.tr ? TB : "") + (o.a ? "animation:" + o.a : "") }; }
  function rain(xs) { return xs.map(function (x) { return sh("M " + x + " 0 V 100", { s: DM, w: 1, da: "1.5 10", a: "bsRain 2.6s linear infinite" }); }); }
  var M = {
    1: [sh("M 32 22 V 78", { s: DM, w: 2 }), sh("M 68 22 V 78", { s: DM, w: 2 }), sh("M 32 26 H 68", { s: DM, w: 1.4 }), sh(S4(50, 52, 8), { f: P, tr: 1, a: "bsBreathe 5s ease-in-out infinite" })],
    2: [sh("M 30 58 Q 50 78 70 58", { s: P, w: 2.2 }), sh(S4(50, 47, 6.5), { f: P, tr: 1, a: "bsBreathe 4.4s ease-in-out infinite" })],
    3: [sh(S4(42, 38, 5), { f: P, a: "bsTwinkle 3.2s ease-in-out infinite" }), sh(S4(58, 34, 4), { f: P, a: "bsTwinkle 4s ease-in-out .7s infinite" }), sh(S4(64, 50, 5.5), { f: P, a: "bsTwinkle 3.6s ease-in-out 1.4s infinite" }), sh(S4(48, 56, 4), { f: P, a: "bsTwinkle 4.4s ease-in-out 2.1s infinite" }), sh(S4(34, 52, 3.5), { f: P, a: "bsTwinkle 3.9s ease-in-out 2.8s infinite" }), sh(S4(52, 68, 3), { f: P, a: "bsTwinkle 4.2s ease-in-out 1s infinite" })],
    4: [sh(CI(34, 40, 1.8), { f: DM }), sh(CI(42, 34, 1.5), { f: DM }), sh(CI(38, 48, 1.5), { f: DM }), sh(S4(62, 56, 9), { f: CR, tr: 1, a: "bsDrift 6s ease-in-out infinite" })],
    5: [sh(S4(50, 50, 9), { f: CR, tr: 1, a: "bsFlare 6s ease-in-out infinite" }), sh("M 50 30 V 22 M 50 70 V 78 M 30 50 H 22 M 70 50 H 78", { s: DM, w: 1.6, a: "bsFlare 6s ease-in-out .3s infinite" })],
    6: rain([26, 50, 74]).concat([sh("M 48 20 L 42 46 L 52 43 L 38 76 L 58 48 L 47 51 L 60 24 Z", { s: P, w: 1.8 }), sh(CI(66, 64, 3.5), { f: CR, a: "bsFlare 5s ease-in-out infinite" })]),
    7: [sh(S4(40, 34, 5.5), { f: P }), sh(S4(58, 32, 5.5), { f: P }), sh("M 70 52 Q 62 76 30 70", { s: DM, w: 1.6, da: "5 6", a: "bsRain 3.4s linear infinite" }), sh(CI(30, 70, 2.2), { f: CR })],
    8: [sh(CI(46, 50, 13), { s: DM, w: 1.2, tr: 1, a: "bsDrift 7s ease-in-out infinite" }), sh(CI(56, 46, 10), { s: FN, w: 4, tr: 1, a: "bsDrift 7s ease-in-out 1.6s infinite" }), sh(CI(50, 50, 2.4), { f: CR, a: "bsBreathe 5s ease-in-out infinite" })],
    9: [sh("M 26 50 Q 50 32 74 50 Q 50 68 26 50 Z", { s: P, w: 2 }), sh(CI(50, 50, 5), { f: CR, a: "bsBlink 7s ease-in-out infinite" })],
    10: [sh("M 36 60 H 64 M 40 60 V 44 H 60 V 60 M 38 60 V 70 M 62 60 V 70", { s: P, w: 2.2 }), sh("M 50 82 q 7 -1 5 -7 q -2 -5 -8 -3 q -4 2 -1 5", { s: DM, w: 1.6, tr: 1, a: "bsSway 6s ease-in-out infinite" }), sh(S4(50, 36, 4), { f: CR })],
    11: [sh("M 34 30 Q 58 34 68 26 M 32 44 Q 60 48 72 40 M 32 58 Q 60 62 72 56 M 34 72 Q 58 74 68 70", { s: P, w: 1.8, tr: 1, a: "bsSway 5.5s ease-in-out infinite" }), sh(CI(28, 50, 3), { f: CR })],
    12: [sh(S4(50, 42, 7.5), { f: P, tr: 1, a: "bsSway 5s ease-in-out infinite" }), sh("M 30 64 Q 50 80 70 64", { s: DM, w: 1.6 }), sh("M 70 64 l -6 -1 M 70 64 l -2 6", { s: DM, w: 1.6 })],
    13: [sh("M 32 66 Q 50 76 68 66", { s: DM, w: 1.8 }), sh(S4(34, 46, 3.4), { f: P, a: "bsBreathe 4s ease-in-out infinite" }), sh(S4(42, 40, 3.4), { f: P, a: "bsBreathe 4s ease-in-out .5s infinite" }), sh(S4(50, 38, 3.6), { f: P, a: "bsBreathe 4s ease-in-out 1s infinite" }), sh(S4(58, 40, 3.4), { f: P, a: "bsBreathe 4s ease-in-out 1.5s infinite" }), sh(S4(66, 46, 3.4), { f: P, a: "bsBreathe 4s ease-in-out 2s infinite" })],
    14: [sh(S4(50, 50, 13), { f: CR, a: "bsBlink 6s ease-in-out infinite" }), sh(CI(50, 50, 19), { s: DM, w: 1 })],
    15: [sh(S4(50, 50, 8), { f: P, a: "bsBreathe 6s ease-in-out infinite" }), sh("M 24 40 H 76 M 24 50 H 76 M 24 60 H 76", { s: DM, w: 1.4, da: "7 5", tr: 1, a: "bsDrift 7s ease-in-out infinite" })],
    16: [sh("M 32 72 Q 28 40 48 32", { s: P, w: 2.4, tr: 1, a: "bsSway 6s ease-in-out infinite" }), sh("M 68 72 Q 72 40 52 32", { s: P, w: 2.4, tr: 1, a: "bsSway 6s ease-in-out 3s infinite" }), sh(CI(50, 26, 2), { f: CR })],
    17: [sh(S4(34, 46, 5), { f: P, a: "bsTwinkle 3.6s ease-in-out infinite" }), sh(S4(50, 36, 6), { f: P, a: "bsTwinkle 3.6s ease-in-out 1.2s infinite" }), sh(S4(66, 46, 5), { f: P, a: "bsTwinkle 3.6s ease-in-out 2.4s infinite" }), sh("M 30 58 Q 50 66 70 58", { s: DM, w: 1.8 })],
    18: [sh("M 50 70 C 28 52 34 32 50 44 C 66 32 72 52 50 70 Z", { s: P, w: 2.2, tr: 1, a: "bsBeat 3.8s ease-in-out infinite" }), sh(CI(50, 52, 2.6), { f: CR, tr: 1, a: "bsBeat 3.8s ease-in-out .1s infinite" })],
    19: [sh("M 50 28 V 50 M 50 50 L 38 68 M 50 50 L 62 68 M 50 50 V 74", { s: P, w: 2 }), sh(CI(50, 74, 12), { f: FN, tr: 1, a: "bsBreathe 5s ease-in-out infinite" }), sh(S4(50, 24, 4), { f: CR })],
    20: [sh("M 24 76 Q 40 70 50 76 Q 62 82 76 76", { s: DM, w: 1.4 }), sh(CI(30, 36, 1.8) + CI(40, 42, 1.8) + CI(50, 48, 1.8) + CI(60, 54, 1.8), { f: P, tr: 1, a: "bsDrift 5s ease-in-out infinite" }), sh(CI(40, 28, 1.8) + CI(50, 34, 1.8) + CI(60, 40, 1.8) + CI(70, 46, 1.8), { f: P, tr: 1, a: "bsDrift 5s ease-in-out 2.5s infinite" })],
    21: [sh(CI(50, 50, 18), { s: DM, w: 1.4, da: "4 6", a: "bsShift 14s linear infinite" })],
    22: [sh("M 60 32 Q 38 38 40 54 Q 41 66 54 68", { s: P, w: 2.4, tr: 1, a: "bsSway 7s ease-in-out infinite" }), sh(S4(64, 52, 4.5), { f: CR, a: "bsTwinkle 5s ease-in-out infinite" })],
    23: [sh(CI(44, 42, 2) + CI(56, 38, 2) + CI(60, 50, 2) + CI(48, 54, 2), { f: P }), sh(CI(52, 46, 12), { s: DM, w: 1.2, tr: 1, a: "bsRing 3.2s ease-out infinite" }), sh(CI(40, 66, 1.6), { f: DM })],
    24: [sh(CI(50, 50, 16), { s: P, w: 2 }), sh(S4(50, 50, 5.5), { f: CR, a: "bsRare 9s ease-in-out infinite" })],
    25: [sh("M 30 70 L 50 36 L 70 70 Z", { s: P, w: 2.2 }), sh(CI(50, 62, 3.5), { f: CR, a: "bsBreathe 4.6s ease-in-out infinite" })],
    26: [sh("M 34 38 H 66 V 66 H 34 Z", { s: FN, w: 3, da: "3 5" }), sh(S4(34, 38, 4), { f: P, a: "bsBreathe 8s ease-in-out infinite" }), sh(S4(66, 38, 4), { f: P, a: "bsBreathe 8s ease-in-out 2s infinite" }), sh(S4(34, 66, 4), { f: P, a: "bsBreathe 8s ease-in-out 4s infinite" }), sh(S4(66, 66, 4), { f: P, a: "bsBreathe 8s ease-in-out 6s infinite" })],
    27: [sh("M 30 74 H 70", { s: DM, w: 1.4 }), sh(S4(34, 40, 3.2), { f: P, a: "bsTwinkle 4s ease-in-out infinite" }), sh(S4(44, 48, 3.2), { f: P, a: "bsTwinkle 4s ease-in-out .8s infinite" }), sh(S4(54, 56, 3.2), { f: P, a: "bsTwinkle 4s ease-in-out 1.6s infinite" }), sh(S4(64, 64, 3.6), { f: CR, a: "bsTwinkle 4s ease-in-out 2.4s infinite" })],
    28: [sh("M 50 26 a 24 24 0 1 1 -17 7", { s: P, w: 2, da: "110 30", a: "bsRain 5s linear infinite" }), sh("M 33 33 q -8 6 0 10 q 8 4 4 -6", { s: DM, w: 1.6 })],
    101: [sh(CI(50, 50, 11), { s: A, w: 2.2 }), sh("M 22 55 a 28 9 0 1 0 56 0 a 28 9 0 1 0 -56 0", { s: DA, w: 1.6, da: "7 4", a: "skTurn 6s linear infinite" })],
    102: [sh(CI(46, 56, 10), { s: A, w: 2.2, a: "skFlare 4.5s ease-in-out infinite" }), sh("M 54 48 L 68 34 M 68 34 h -9 M 68 34 v 9", { s: W, w: 2.2, a: "skFlare 4.5s ease-in-out .2s infinite" })],
    103: [sh(CI(50, 44, 10), { s: A, w: 2.2 }), sh(CI(50, 44, 17), { s: FA, w: 5, a: "skBreathe 5s ease-in-out infinite" }), sh("M 50 54 V 72 M 42 64 H 58", { s: DA, w: 2 })],
    104: [sh(CI(44, 50, 10), { s: A, w: 2.2, a: "skSwap 6s ease-in-out infinite" }), sh(CI(56, 50, 10), { s: W, w: 2.2, a: "skSwapB 6s ease-in-out infinite" })],
    105: [sh(CI(50, 50, 13), { s: A, w: 2.4, tr: 1, a: "skSwell 6s ease-in-out infinite" }), sh(CI(28, 38, 1.8) + CI(74, 60, 1.8) + CI(68, 32, 1.4), { f: DA })],
  };
  window.ManzilArt = { get: function (id) { return M[id] || []; } };
})();

