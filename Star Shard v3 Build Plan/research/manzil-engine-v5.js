// manzil-engine-v5.js — the ruleset AS SHIPPED 20 aug 2026 (flip-density pass).
// Same (ties flip) · Combo (a tie-flipped card strikes both its neighbours) · tie-count-to-you.
// Storm defensive-only immunity. Ghost / Empty District / Thread implemented from the drafted
// signature texts so the sheet's open flags can be answered. Config flags let each be ablated.
// Sky: her shipped judgment — greedy 2-ply, reply weight 8, FNV date-seed breaks her ties.

const POOL = [["The Gate",6,5],["The Bearer",6,4],["The Gathered Stars",7,6],["The Follower",7,7],["The Blaze",5,6],["The Storm",8,5],["The Return",7,6],["The Ghost",6,6],["The Glance",4,6],["The Throne",6,9],["The Mane",6,5],["The Turning",7,5],["The Hand",7,4],["The Jewel",7,7],["The Veil",8,2],["The Claws",6,6],["The Crown",6,6],["The Heart",7,7],["The Root",7,6],["The Flock",6,6],["The Empty District",2,8],["The Listener",7,4],["The Drum",4,7],["The Void",9,2],["The Hideaway",5,6],["The Chamber",7,5],["The Guide",6,5],["The Thread",5,6]];
const AB = {5:"blaze",6:"storm",8:"ghost",10:"throne",14:"jewel",17:"crown",18:"heart",21:"district",25:"hideaway",28:"thread"};
const SKYC = {101:{l:9,r:5,ab:"saturn",hm:26},102:{l:8,r:6,ab:"mars",hm:14},103:{l:4,r:7,ab:"venus",hm:22},104:{l:6,r:5,ab:"mercury",hm:8},105:{l:7,r:8,ab:"jupiter",hm:2}};
const SKY = [101,102,103,104,105];

function buildCards(levels) {
  const C = {};
  POOL.forEach((p, i) => {
    const id = i + 1, lvl = levels[id] || 1;
    let l = p[1], r = p[2];
    if (lvl >= 3) { if (l <= r) l++; else r++; }
    if (lvl >= 4) { l++; r++; }
    C[id] = { l, r, ab: AB[id], lvl, two: id === 10 && lvl >= 2 };
  });
  for (const k in SKYC) C[k] = { ...SKYC[k], lvl: 9 };
  return C;
}

// t = tonight's mansion; slot i is mansion bm(t,i)
const bm = (t, i) => ((t - 1 + i) % 28) + 1;

function makeEngine(C, cfg, T) {
  const L = 9;
  const bmSlot = (i) => bm(T || 1, i);
  const on = (s, ab) => s && C[s.id].ab === ab && C[s.id].lvl >= 2;
  const wrapOn = (sl) => cfg.thread && sl.some(s => s && s.o === "you" && on(s, "thread"));
  function nb(sl, i, d) { if (wrapOn(sl)) return (i + d + L) % L; const k = i + d; return k >= 0 && k < L ? k : -1; }
  const cp = (sl) => { const o = new Array(L); for (let i = 0; i < L; i++) { const s = sl[i]; o[i] = s ? { id: s.id, l: s.l, r: s.r, o: s.o, g: s.g, sh: s.sh } : null; } return o; };

  function heartUp(sl, s) {
    if (!s || s.o !== "you" || !on(s, "heart")) return 0;
    let y = 0, k = 0; for (const x of sl) if (x) (x.o === "you" ? y++ : k++);
    return k > y ? 1 : 0;
  }
  // fight-time softening: her cards beside your ghost, and both neighbours of your empty district
  function soften(sl, ti) {
    const t = sl[ti];
    if (!t || (cfg.jewel !== false && t.o === "you" && on(t, "jewel"))) return 0;
    let d = 0;
    for (const dir of [-1, 1]) {
      const k = nb(sl, ti, dir); if (k < 0 || !sl[k] || sl[k].o !== "you") continue;
      if (cfg.ghost && on(sl[k], "ghost") && t.o === "sky") d++;
      if (cfg.district && on(sl[k], "district") && (!cfg.districtTargeted || t.o === "sky")) d++;
    }
    return d;
  }
  function val(sl, i, right) {
    const s = sl[i];
    let v = (right ? s.r : s.l) + heartUp(sl, s) - soften(sl, i);
    return Math.max(1, v);
  }
  function tryFlip(sl, ai, ti, dir) {
    const a = sl[ai], t = sl[ti];
    if (!t || t.o === a.o) return 0;
    const av = val(sl, ai, dir === 1), tv = val(sl, ti, dir !== 1);
    const stormFace = cfg.storm !== "none" && on(t, "storm");
    let tie = cfg.ties && av === tv;
    if (tie && stormFace) {                                              // defending: equal numbers do nothing
      const face = dir === 1 ? t.l : t.r, card = C[t.id];
      const lesserOnly = cfg.storm === "weak" && face !== Math.min(card.l, card.r);
      let off = lesserOnly;
      if (cfg.storm === "home") off = !((card.hm || t.id) === bmSlot(ti));       // only on its own mansion
      if (cfg.storm === "behind") { let y=0,k=0; for (const x of sl) if (x) (x.o==="you"?y++:k++); off = !(k > y); }
      if (cfg.storm === "once") { if (!t.sh) { t.sh = 1; tie = false; } }
      else if (!off) tie = false;
    }
    if (tie && cfg.storm === "sym" && on(a, "storm")) tie = false;        // symmetric: its own attacks cannot tie either
    if (!(av > tv || tie)) return 0;
    if (C[t.id].ab === "saturn") return 0;
    t.o = a.o;
    return tie ? 2 : 1;
  }
  function resolve(slIn, id, i, rev, own) {
    const c = C[id], sl = cp(slIn);
    sl[i] = { id, l: rev ? c.r : c.l, r: rev ? c.l : c.r, o: own, g: own === "you" && c.ab === "blaze" && c.lvl >= 2 ? "you" : undefined };
    if (c.ab === "venus" && cfg.venus !== false) {                        // her venus softens permanently, on lodge
      for (const d of [-1, 1]) {
        const k = nb(sl, i, d); if (k < 0 || !sl[k]) continue;
        if (cfg.jewel !== false && sl[k].o === "you" && on(sl[k], "jewel")) continue;
        const key = d === 1 ? "l" : "r";
        if (sl[k][key] > 1) sl[k][key]--;
      }
    }
    let flips = 0, ties = 0;
    const q = [[i, nb(sl, i, -1), -1], [i, nb(sl, i, 1), 1]];
    let guard = 0;
    while (q.length && guard++ < 64) {
      const [f, to, d] = q.shift();
      if (to < 0 || !sl[f]) continue;
      const res = tryFlip(sl, f, to, d);
      if (!res) continue;
      flips++;
      if (res === 2) {
        ties++;
        if (cfg.combo) for (const dd of [-1, 1]) { const far = nb(sl, to, dd); if (far >= 0 && far !== f) q.push([to, far, dd]); }
      }
      if (C[sl[f].id].ab === "mars") { const far = nb(sl, to, d); if (far >= 0) q.push([to, far, d]); }
    }
    return { sl, flips, ties };
  }
  function counts(sl, t) {
    let y = 0, s = 0;
    for (let i = 0; i < L; i++) {
      const c = sl[i]; if (!c) continue;
      const card = C[c.id];
      if (card.ab === "hideaway" && card.lvl >= 2) continue;              // the tent is silent
      const homeM = (card.hm || c.id) === bm(t, i);
      const crown = card.ab === "crown" && card.lvl >= 2 && (i === 0 || i === L - 1) ? 1 : 0;
      const w = 1 + (card.ab === "jupiter" ? 1 : 0) + (homeM ? 1 : 0) + crown;
      if ((c.g || c.o) === "you") y += w; else s += w;
    }
    return [y, s];
  }
  function movesFor(sl, hand, side) {
    const out = [];
    for (const id of hand) {
      const c = C[id], revs = (side === "you" ? c.two : c.ab === "mercury") ? [0, 1] : [0];
      for (let i = 0; i < L; i++) { if (sl[i]) continue; for (const rev of revs) { const r = resolve(sl, id, i, rev, side); out.push({ id, i, rev, sl: r.sl, flips: r.flips, ties: r.ties }); } }
    }
    return out;
  }
  return { nb, resolve, counts, movesFor, L };
}

function fnv(s) { let h = 2166136261; for (let k = 0; k < s.length; k++) { h ^= s.charCodeAt(k); h = Math.imul(h, 16777619); } return h >>> 0; }
function mulberry(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

function playBoard(E, t, lead, depth, seed, yourFive) {
  const rng = mulberry(seed);
  let sl = new Array(E.L).fill(null), yh = yourFive.slice(), sh = SKY.slice(), turn = lead;
  let flips = 0, ties = 0;
  while (sl.some(x => !x)) {
    if (turn === "you") {
      if (!yh.length) { turn = "sky"; continue; }
      const moves = E.movesFor(sl, yh, "you");
      let top = -1e18;
      for (const m of moves) {
        const yc = E.counts(m.sl, t);
        let sc;
        if (depth === 1) sc = yc[0] - yc[1];
        else { let best = null; if (sh.length && !m.sl.every(x => x)) for (const r of E.movesFor(m.sl, sh, "sky")) { const c2 = E.counts(r.sl, t); const v = c2[1] - c2[0]; if (best === null || v > best) best = v; } sc = (yc[0] - yc[1]) * 10 - (best === null ? 0 : best) * 8; }
        m._s = sc; if (sc > top) top = sc;
      }
      const c = moves.filter(m => m._s === top), m = c[Math.floor(rng() * c.length)];
      yh = yh.filter(x => x !== m.id); sl = m.sl; flips += m.flips; ties += m.ties;
    } else {
      if (!sh.length) { turn = "you"; continue; }
      const moves = E.movesFor(sl, sh, "sky");
      let top = -1e18;
      for (const m of moves) {
        const yc = E.counts(m.sl, t);
        let base;
        if (yh.length && !m.sl.every(x => x)) { let best = null; for (const r of E.movesFor(m.sl, yh, "you")) { const c2 = E.counts(r.sl, t); const sc = c2[0] - c2[1]; if (best === null || sc > best) best = sc; } base = (yc[1] - yc[0]) * 10 - (best === null ? 0 : best) * 8; }
        else base = (yc[1] - yc[0]) * 10;
        m._s = base; if (base > top) top = base;
      }
      const cand = moves.filter(m => m._s === top);
      const lodged = sl.filter(x => x).length;
      const m = cand.length === 1 ? cand[0] : cand[fnv("2026-08-20:" + t + ":" + lodged) % cand.length];
      sh = sh.filter(x => x !== m.id); sl = m.sl; flips += m.flips; ties += m.ties;
    }
    turn = turn === "you" ? "sky" : "you";
  }
  const c = E.counts(sl, t);
  const tiedCount = c[0] === c[1];
  const yourWin = c[0] > c[1] || (tiedCount && (cfgTie => cfgTie !== "sky")(E._tie));
  return { win: yourWin ? 1 : 0, tied: tiedCount ? 1 : 0, flips, ties };
}

function run(cfg, levels, yourFive, depth, samples) {
  const C = buildCards(levels);
  let win = 0, tied = 0, flips = 0, ties = 0, n = 0;
  for (let t = 1; t <= 28; t++) { const E = makeEngine(C, cfg, t); E._tie = cfg.tieCount || "you";
  for (const lead of ["you", "sky"]) for (let s = 0; s < samples; s++) {
    const r = playBoard(E, t, lead, depth, t * 1000 + (lead === "you" ? 1 : 2) * 97 + s * 13, yourFive);
    win += r.win; tied += r.tied; flips += r.flips; ties += r.ties; n++;
  } }
  return { boards: n, winPct: +(100 * win / n).toFixed(1), tiedPct: +(100 * tied / n).toFixed(1), flipsPerBoard: +(flips / n).toFixed(2), tieFlipsPerBoard: +(ties / n).toFixed(2) };
}
