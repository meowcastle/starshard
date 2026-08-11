// Star Shard — the window manager: geometry, z-order, drag and resize.
//
// SHARED SEAM. The LAYOUT block is Claude Design's (initial positions, sizes,
// chrome colours, breakpoints). Everything below MECHANICS is Claude Code's.
// Keep the split — a mobile pass should only need to touch LAYOUT.

// ---------------------------------------------------------------- LAYOUT --

export const WIN_TITLES = {
  welcome: ['🎀', 'welcome.exe'], reader: ['💿', 'shard reader'], sky: ['💎', 'your_sky.shards'],
  card: ['🖼', 'shard_card.bmp'], luna: ['📜', 'luna.txt'], today: ['🌙', 'today.exe'],
  wheel: ['🔮', 'chart_wheel.exe'], duet: ['💞', 'duet.exe'], guest: ['📖', 'guestbook.htm'],
  gloss: ['📚', 'grimoire.hlp'], player: ['🎧', 'player.exe'], doc: ['📄', 'reading.doc'],
  account: ['🔑', 'account.exe'],
};

export const FOCUS_TB = 'linear-gradient(90deg,#ff8fc0,#9d84e8)';
export const BLUR_TB = '#cfaec8';

/** Desktop icon order and labels, left rail + Start menu. */
export const APPS = [
  ['reader', 'shard reader.exe'], ['duet', 'duet.exe'], ['wheel', 'chart_wheel'],
  ['today', 'today.exe'], ['guest', 'guestbook'], ['gloss', 'grimoire.hlp'],
  ['player', 'player.exe'], ['luna', 'luna.txt'], ['account', 'account.exe'],
  ['welcome', 'home.lnk'],
];

const ICON_RAIL = 116;   // px reserved on the left for desktop icons
const LEFT_STOP = 104;   // windows never start left of this
const MIN_W = 320, MIN_H = 160;

/**
 * Initial geometry per window. Transcribed verbatim from the original inline
 * implementation — the arithmetic is load-bearing at narrow viewports, so
 * change it deliberately, not incidentally.
 */
export function initWindows(viewportWidth) {
  const W = viewportWidth ?? (typeof window !== 'undefined' ? window.innerWidth : 1200);
  const cx = w => Math.max(LEFT_STOP, Math.round((W - w) / 2) + 40);
  const fit = w => Math.min(w, Math.round(W * 0.9), Math.max(300, W - ICON_RAIL));
  return {
    welcome: { open: true, min: false, x: cx(860), y: 24, z: 10, w: fit(860), h: null },
    today: { open: true, min: false, x: Math.max(LEFT_STOP, W - 384), y: 40, z: 15, w: fit(330), h: null },
    reader: { open: false, min: false, x: cx(560) + 40, y: 56, z: 11, w: fit(560), h: null },
    sky: { open: false, min: false, x: cx(860) + 20, y: 44, z: 12, w: fit(860), h: null },
    card: { open: false, min: false, x: cx(500) + 70, y: 60, z: 13, w: fit(500), h: null },
    luna: { open: false, min: false, x: cx(400) + 120, y: 110, z: 14, w: fit(400), h: null },
    wheel: { open: false, min: false, x: cx(430) - 60, y: 70, z: 16, w: fit(430), h: null },
    duet: { open: false, min: false, x: cx(520) + 90, y: 80, z: 17, w: fit(520), h: null },
    guest: { open: false, min: false, x: cx(400) + 140, y: 90, z: 18, w: fit(400), h: 480 },
    gloss: { open: false, min: false, x: cx(470) - 40, y: 100, z: 19, w: fit(470), h: 520 },
    player: { open: false, min: false, x: Math.max(LEFT_STOP, W - 420), y: 300, z: 20, w: fit(300), h: null },
    doc: { open: false, min: false, x: cx(580), y: 50, z: 21, w: fit(580), h: 620 },
    account: { open: false, min: false, x: cx(360), y: 90, z: 22, w: fit(360), h: null },
  };
}

// -------------------------------------------------------------- MECHANICS --

/**
 * Window operations bound to a component.
 * `host` must expose: state.windows, state.zTop, setState().
 */
export function createWindowOps(host) {
  const setWin = (key, patch) => host.setState(st => ({
    windows: { ...st.windows, [key]: { ...st.windows[key], ...patch } },
  }));

  const focusWin = key => host.setState(st => ({
    zTop: st.zTop + 1,
    windows: { ...st.windows, [key]: { ...st.windows[key], z: st.zTop + 1 } },
  }));

  const openWin = key => host.setState(st => ({
    zTop: st.zTop + 1,
    startOpen: false,
    windows: { ...st.windows, [key]: { ...st.windows[key], open: true, min: false, z: st.zTop + 1 } },
  }));

  // Shared pointer-drag plumbing for both move and resize.
  const pointerDrag = (key, onStart, onMove) => e => {
    if (e.button !== undefined && e.button !== 0) return;
    e.preventDefault();
    const ctx = onStart(e);
    focusWin(key);
    const move = ev => setWin(key, onMove(ev, ctx));
    const up = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  };

  const dragWin = key => pointerDrag(key,
    e => {
      const win = host.state.windows[key];
      return { sx: e.clientX - win.x, sy: e.clientY - win.y };
    },
    (ev, c) => ({
      x: Math.max(-120, Math.min(window.innerWidth - 100, ev.clientX - c.sx)),
      y: Math.max(0, ev.clientY - c.sy),
    }));

  const resizeWin = key => pointerDrag(key,
    e => {
      e.stopPropagation();
      const r = e.currentTarget.parentElement.getBoundingClientRect();
      return { sx: e.clientX, sy: e.clientY, w0: r.width, h0: r.height };
    },
    (ev, c) => ({
      w: Math.max(MIN_W, Math.min(window.innerWidth - 20, c.w0 + ev.clientX - c.sx)),
      h: Math.max(MIN_H, c.h0 + ev.clientY - c.sy),
    }));

  /** The binding bundle the template reads for one window. */
  const winVals = key => {
    const w = host.state.windows[key];
    const focused = Object.values(host.state.windows).every(o => !o.open || o.min || o.z <= w.z);
    return {
      show: w.open && !w.min,
      x: w.x, y: w.y, z: w.z, w: w.w, h: w.h ? w.h + 'px' : 'auto',
      tbBg: focused ? FOCUS_TB : BLUR_TB,
      resize: resizeWin(key),
      focus: () => { if (host.state.windows[key].z !== host.state.zTop) focusWin(key); },
      drag: dragWin(key),
      minimize: e => { e.stopPropagation(); setWin(key, { min: true }); },
      close: e => { e.stopPropagation(); setWin(key, { open: false }); },
    };
  };

  /** Taskbar buttons for every open window. */
  const taskItems = () => Object.keys(host.state.windows)
    .filter(k => host.state.windows[k].open)
    .map(k => {
      const w = host.state.windows[k];
      const active = !w.min && w.z === host.state.zTop;
      return {
        icon: WIN_TITLES[k][0], label: WIN_TITLES[k][1],
        bg: active ? '#ffe9f4' : '#fdeef8',
        bc: active ? '#c586ad #fff #fff #c586ad' : '#fff #c586ad #c586ad #fff',
        onClick: () => { if (w.min || w.z !== host.state.zTop) openWin(k); else setWin(k, { min: true }); },
      };
    });

  return { setWin, focusWin, openWin, dragWin, resizeWin, winVals, taskItems };
}

/** Merge a saved layout over the defaults, keeping unknown keys out. */
export function mergeSavedLayout(current, saved) {
  if (!saved || typeof saved !== 'object') return current;
  const merged = { ...current };
  for (const k of Object.keys(merged)) {
    if (saved[k]) merged[k] = { ...merged[k], ...saved[k] };
  }
  return merged;
}
