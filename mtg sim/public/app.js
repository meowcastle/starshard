// Forge Sim front end. Vanilla JS; Scryfall is called straight from the browser.
const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const COLORS = ['p0', 'p1', 'p2', 'p3'];
const COLOR_VARS = ['--accent', '--accent2', '--good', '#c48aff'];

const state = { mode: 'matchup', decks: [], metaSrc: 'goldfish', metaFmt: 'standard', metaCache: {}, me: null, job: null, poll: null };

async function api(path, opts = {}) {
  const r = await fetch(path, { credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, ...opts, body: opts.body && JSON.stringify(opts.body) });
  if (r.status === 401 && path !== '/api/login') { showLogin(); throw new Error('login required'); }
  const ct = r.headers.get('content-type') || '';
  const data = ct.includes('json') ? await r.json() : await r.text();
  if (!r.ok) throw new Error(data.error || data || r.statusText);
  return data;
}
function toast(msg, ms = 3000) { const t = $('#toast'); t.textContent = msg; t.classList.remove('hidden'); clearTimeout(t._t); t._t = setTimeout(() => t.classList.add('hidden'), ms); }

// ---------- login ----------
function showLogin() { $('#login').classList.remove('hidden'); $('#user').focus(); }
$('#loginForm').onsubmit = async e => {
  e.preventDefault();
  try { await api('/api/login', { method: 'POST', body: { username: $('#user').value, password: $('#pw').value } }); $('#pw').value = ''; $('#login').classList.add('hidden'); boot(); }
  catch (err) { $('#loginErr').textContent = err.message; }
};
$('#logout').onclick = async () => { await api('/api/logout'); showLogin(); };

// ---------- deck model ----------
const listText = d => [
  ...(d.commander?.length ? ['Commander', ...d.commander.map(c => `${c.qty} ${c.name}`), ''] : []),
  ...d.main.map(c => `${c.qty} ${c.name}`),
  ...(d.side?.length ? ['', 'Sideboard', ...d.side.map(c => `${c.qty} ${c.name}`)] : []),
].join('\n');

function parseText(text) {
  const main = [], side = [], commander = []; let cur = main;
  for (const raw of text.split(/\r?\n/)) {
    const l = raw.trim();
    if (!l) { if (main.length && cur === main) cur = side; continue; }
    if (/^(\/\/\s*)?side\s*board:?$/i.test(l)) { cur = side; continue; }
    if (/^(\/\/\s*)?commander:?$/i.test(l)) { cur = commander; continue; }
    if (/^(\/\/\s*)?(main\s*deck|deck):?$/i.test(l)) { cur = main; continue; }
    const m = l.replace(/^SB:\s*/i, '').match(/^(\d+)x?\s+(.+?)(\s+\([A-Z0-9]{2,6}\)\s*[\w-]*)?(\s+\*F\*)?$/);
    if (m) (/^SB:/i.test(l) ? side : cur).push({ qty: +m[1], name: m[2].trim() });
  }
  if (cur === commander && !main.length) { /* commander-only paste */ }
  return { main, side, commander };
}

function addDeck(name = `Deck ${state.decks.length + 1}`, list = { main: [], side: [], commander: [] }, focus) {
  const d = { id: Math.random().toString(36).slice(2), name, ...list, info: null };
  state.decks.push(d); renderDecks(); validate(d);
  if (focus) document.querySelector(`[data-deck="${d.id}"] textarea`)?.focus();
  return d;
}
function setDeck(i, name, list) {
  while (state.decks.length <= i) addDeck();
  Object.assign(state.decks[i], { name, ...list, info: null });
  renderDecks(); validate(state.decks[i]);
}
function firstEmptySlot() { const i = state.decks.findIndex(d => !d.main.length && !d.commander?.length); return i < 0 ? state.decks.length : i; }

function renderDecks() {
  const wrap = $('#deckList'); wrap.innerHTML = '';
  state.decks.forEach((d, i) => {
    const el = document.createElement('div'); el.className = 'deck'; el.dataset.deck = d.id;
    const total = d.main.reduce((s, c) => s + c.qty, 0) + (d.commander || []).reduce((s, c) => s + c.qty, 0);
    const side = (d.side || []).reduce((s, c) => s + c.qty, 0);
    const label = state.mode === 'gauntlet' ? (i === 0 ? 'YOU' : `G${i}`) : String.fromCharCode(65 + i);
    el.innerHTML = `
      <div class="deck-head"><span class="slot">${label}</span><input value="${esc(d.name)}" aria-label="Deck name"><button class="x" title="Remove">×</button></div>
      <div class="deck-meta"><span>${total} cards${side ? ` · ${side} side` : ''}</span><span class="pips"></span><span class="curve"></span></div>
      <textarea spellcheck="false" placeholder="4 Lightning Bolt&#10;20 Mountain&#10;&#10;Sideboard&#10;2 Pyroblast">${esc(listText(d))}</textarea>
      <div class="status"></div>`;
    el.querySelector('input').oninput = e => d.name = e.target.value;
    el.querySelector('.x').onclick = () => { state.decks.splice(i, 1); renderDecks(); };
    let t; el.querySelector('textarea').oninput = e => { clearTimeout(t); t = setTimeout(() => { Object.assign(d, parseText(e.target.value)); d.info = null; validate(d, true); }, 700); };
    wrap.appendChild(el);
    paintInfo(d);
  });
}

// ---------- Scryfall: validate names, convert to Forge spellings, curve + colors ----------
const scry = new Map(); // lowercased name -> card
const FRONT_ONLY = new Set(['transform', 'modal_dfc', 'flip', 'adventure', 'meld', 'reversible_card', 'prepare']);
const forgeName = c => (FRONT_ONLY.has(c.layout) && c.card_faces ? c.card_faces[0].name : c.name);
async function scryfallLookup(names) {
  const need = [...new Set(names.map(n => n.toLowerCase()))].filter(n => !scry.has(n));
  for (let i = 0; i < need.length; i += 75) {
    const ids = need.slice(i, i + 75).map(n => ({ name: n.split(' // ')[0] }));
    const r = await fetch('https://api.scryfall.com/cards/collection', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ identifiers: ids }) });
    const j = await r.json();
    for (const c of j.data || []) {
      const keys = [c.name, c.card_faces?.[0]?.name, forgeName(c)].filter(Boolean).map(s => s.toLowerCase());
      keys.forEach(k => scry.set(k, c));
    }
    for (const nf of j.not_found || []) scry.set(nf.name.toLowerCase(), null);
    await new Promise(r => setTimeout(r, 100)); // Scryfall asks for ~10 req/s max
  }
  return n => scry.get(n.toLowerCase()) ?? scry.get(n.split(' // ')[0].toLowerCase());
}
async function validate(d, keepText) {
  const all = [...d.main, ...(d.side || []), ...(d.commander || [])];
  if (!all.length) return paintInfo(d);
  try {
    const find = await scryfallLookup(all.map(c => c.name));
    const missing = [], curve = Array(8).fill(0), colors = new Set();
    let fixed = 0;
    for (const c of all) {
      const card = find(c.name);
      if (!card) { missing.push(c.name); continue; }
      const fn = forgeName(card); if (fn !== c.name) { c.name = fn; fixed++; }
      (card.color_identity || []).forEach(x => colors.add(x));
    }
    for (const c of d.main) { const card = find(c.name); if (card && !(card.type_line || '').includes('Land')) curve[Math.min(7, Math.floor(card.cmc || 0))] += c.qty; }
    d.info = { missing, curve, colors: ['W', 'U', 'B', 'R', 'G'].filter(x => colors.has(x)), fixed };
    if (fixed && !keepText) renderDecks(); else paintInfo(d);
  } catch (e) { d.info = { error: 'Scryfall lookup failed: ' + e.message }; paintInfo(d); }
}
function paintInfo(d) {
  const el = document.querySelector(`[data-deck="${d.id}"]`); if (!el) return;
  const st = el.querySelector('.status'), info = d.info;
  if (!info) { st.textContent = ''; return; }
  el.querySelector('.pips').innerHTML = (info.colors || []).map(c => `<span class="pip" style="background:var(--${c})" title="${c}"></span>`).join('');
  const mx = Math.max(1, ...(info.curve || [1]));
  el.querySelector('.curve').innerHTML = (info.curve || []).map((n, i) => `<i style="height:${Math.round(n / mx * 22)}px" title="${i === 7 ? '7+' : i} mana: ${n}"></i>`).join('');
  if (info.error) { st.className = 'status warn'; st.textContent = info.error; }
  else if (info.missing.length) { st.className = 'status bad'; st.innerHTML = `Scryfall doesn't know: ${info.missing.map(esc).join(', ')}`; }
  else { st.className = 'status ok'; st.textContent = `✓ All cards found on Scryfall${info.fixed ? ` · ${info.fixed} names converted to Forge spelling` : ''}`; }
}

// ---------- card hover previews ----------
const prev = $('#cardPreview');
document.addEventListener('mousemove', e => {
  const n = e.target.closest?.('[data-card]');
  if (!n) return prev.classList.add('hidden');
  const img = prev.querySelector('img'), src = `https://api.scryfall.com/cards/named?format=image&version=normal&exact=${encodeURIComponent(n.dataset.card)}`;
  if (img.src !== src) img.src = src;
  prev.classList.remove('hidden');
  prev.style.left = Math.min(innerWidth - 260, e.clientX + 16) + 'px'; prev.style.top = Math.max(8, Math.min(innerHeight - 350, e.clientY - 160)) + 'px';
});

// ---------- meta browser ----------
function metaFormats() {
  if (state.metaSrc === 'edhrec') return ['commander'];
  return state.metaSrc === 'goldfish' ? state.me.goldfish : state.me.top8;
}
function renderMetaFormats() {
  const f = metaFormats(); if (!f.includes(state.metaFmt)) state.metaFmt = f[0];
  $('#metaFormat').innerHTML = f.map(x => `<option ${x === state.metaFmt ? 'selected' : ''}>${x}</option>`).join('');
}
async function loadMeta() {
  const key = state.metaSrc + ':' + state.metaFmt; const ul = $('#metaList');
  ul.innerHTML = '<li class="muted">Loading…</li>';
  try {
    state.metaCache[key] ||= (await api(`/api/meta?source=${state.metaSrc}&format=${state.metaFmt}`)).decks;
    renderMeta();
  } catch (e) { ul.innerHTML = `<li class="muted">Couldn't read ${state.metaSrc}: ${esc(e.message)}</li>`; }
}
function renderMeta() {
  const list = state.metaCache[state.metaSrc + ':' + state.metaFmt] || [];
  const q = $('#metaFilter').value.toLowerCase();
  const max = Math.max(1, ...list.map(d => d.pct || 0));
  const rows = list.filter(d => d.name.toLowerCase().includes(q));
  $('#metaList').innerHTML = rows.length ? rows.map(d => `
    <li data-id="${esc(d.id)}">
      <span class="nm" title="${esc(d.name)}">${esc(d.name)}</span>
      ${d.pct != null ? `<span class="bar"><i style="width:${d.pct / max * 100}%"></i></span><span class="pct">${d.pct}%</span>` : `<span class="pct">${d.count ? d.count.toLocaleString() : ''}</span>`}
      <button class="btn small load">Load</button>
    </li>`).join('') : '<li class="muted">Nothing here.</li>';
}
async function loadMetaDeck(item, slot) {
  const deck = await api(`/api/meta/deck?source=${state.metaSrc}&id=${encodeURIComponent(item.id)}`);
  setDeck(slot ?? firstEmptySlot(), item.name, deck);
}
$('#metaList').onclick = async e => {
  const li = e.target.closest('li[data-id]'); if (!li) return;
  const item = (state.metaCache[state.metaSrc + ':' + state.metaFmt] || []).find(d => d.id === li.dataset.id);
  const b = li.querySelector('.load'); b.textContent = '…';
  try { await loadMetaDeck(item); toast(`Loaded ${item.name}`); } catch (err) { toast(err.message, 5000); }
  b.textContent = 'Load';
};
$('#metaSource').onclick = e => {
  const b = e.target.closest('button'); if (!b) return;
  $$('#metaSource button').forEach(x => x.classList.toggle('on', x === b));
  state.metaSrc = b.dataset.src;
  if (state.metaSrc === 'edhrec') { $('#format').value = 'Commander'; }
  renderMetaFormats(); loadMeta();
};
$('#metaFormat').onchange = e => { state.metaFmt = e.target.value; loadMeta(); };
$('#metaFilter').oninput = renderMeta;
$('#pickTop').onclick = async () => {
  const list = (state.metaCache[state.metaSrc + ':' + state.metaFmt] || []).slice(0, 8);
  if (!state.decks.length) addDeck('My deck');
  const b = $('#pickTop'); b.disabled = true;
  for (const [i, item] of list.entries()) { b.textContent = `Loading ${i + 1}/${list.length}…`; try { const e = state.decks.findIndex((d, j) => j > 0 && !d.main.length && !d.commander?.length); await loadMetaDeck(item, e > 0 ? e : Math.max(1, state.decks.length)); } catch (e) { toast(`${item.name}: ${e.message}`); } }
  b.disabled = false; b.textContent = 'Add top 8 to gauntlet';
};
$('#importBtn').onclick = async () => {
  const url = $('#importUrl').value.trim(); if (!url) return;
  try { const d = await api('/api/import?url=' + encodeURIComponent(url)); setDeck(firstEmptySlot(), d.name || 'Imported deck', d); $('#importUrl').value = ''; toast('Imported'); }
  catch (e) { toast(e.message + ' — you can paste the list straight into a deck instead.', 6000); }
};

// ---------- mode / run ----------
$('#mode').onclick = e => {
  const b = e.target.closest('button'); if (!b) return;
  state.mode = b.dataset.mode;
  $$('#mode button').forEach(x => x.classList.toggle('on', x === b));
  document.body.classList.toggle('gauntlet', state.mode === 'gauntlet');
  $('#modeHint').textContent = state.mode === 'gauntlet' ? 'Your deck (first slot) plays a match against every other deck, one at a time.' : 'Pit 2–4 decks against each other. 3–4 decks plays a free-for-all.';
  renderDecks();
};
$('#addDeck').onclick = () => addDeck(undefined, undefined, true);
$('#run').onclick = async () => {
  const decks = state.decks.filter(d => d.main.length || d.commander?.length);
  if (decks.length < 2) return toast('Load at least two decks.');
  if (state.mode === 'matchup' && decks.length > 4) return toast('Matchup takes up to 4 decks — use Gauntlet for more.');
  const bad = decks.find(d => d.info?.missing?.length);
  if (bad && !confirm(`${bad.name} has cards Scryfall couldn't find. Forge will skip them. Run anyway?`)) return;
  $('#run').disabled = true;
  try {
    const { id } = await api('/api/sim', { method: 'POST', body: { mode: state.mode, format: $('#format').value, games: +$('#games').value, clock: +$('#clock').value, decks: decks.map(({ name, main, side, commander }) => ({ name, main, side, commander })) } });
    watch(id);
  } catch (e) { toast(e.message); }
  $('#run').disabled = false;
};
$('#cancel').onclick = async () => { if (state.job) await api('/api/jobs/' + state.job, { method: 'DELETE' }); };

// ---------- results ----------
function wilson(k, n) { if (!n) return [0, 0]; const z = 1.96, p = k / n, d = 1 + z * z / n, c = p + z * z / (2 * n), m = z * Math.sqrt(p * (1 - p) / n + z * z / (4 * n * n)); return [(c - m) / d, (c + m) / d]; }
const pct = x => (x * 100).toFixed(0) + '%';
function watch(id) {
  state.job = id; clearInterval(state.poll);
  const tick = async () => {
    try {
      const j = await api('/api/jobs/' + id);
      renderJob(j);
      if (['done', 'failed', 'cancelled'].includes(j.status) || j.fromHistory) { clearInterval(state.poll); $('#cancel').classList.add('hidden'); loadHistory(); }
      else $('#cancel').classList.remove('hidden');
    } catch (e) { clearInterval(state.poll); }
  };
  tick(); state.poll = setInterval(tick, 2000);
}
function renderJob(j) {
  const R = $('#results'); R.classList.remove('empty');
  const status = j.status === 'queued' ? `Queued${j.queuePos > 0 ? ` (#${j.queuePos + 1})` : ''} — Forge starts in a moment` :
    j.status === 'running' ? 'Running — Forge needs ~30s to load its card database first' : j.status;
  let html = `<p class="muted">${esc(status)} · ${esc(j.format)} · ${j.games} games${j.pairings?.length > 1 ? ' per pairing' : ''}</p>`;
  const prs = j.pairings || [];
  if (j.mode === 'gauntlet' && prs.length) {
    let W = 0, N = 0;
    html += `<div class="gsum"><span class="h">Opponent</span><span class="h">Your win %</span><span class="h">Games</span>`;
    for (const p of prs) { const n = (p.games?.length ?? p.played) || 0; const w = p.wins[0]; W += w; N += n; html += `<span>${esc(p.names[1])}</span><span style="color:${n && w / n >= .5 ? 'var(--good)' : 'var(--bad)'}">${n ? pct(w / n) : '—'}</span><span class="muted">${n}/${j.games}</span>`; }
    html += `<b>Overall</b><b>${N ? pct(W / N) : '—'}</b><span class="muted">${N}</span></div>`;
  }
  for (const p of prs) html += matchupCard(p, j.games);
  R.innerHTML = html;
  if (j.logTail) { const L = $('#log'); L.textContent = j.logTail.join('\n'); }
}
function matchupCard(p, total) {
  const games = p.games || [];
  const n = games.length || p.played || 0;
  const draws = p.draws || games.filter(g => g.winner === -1).length;
  const segs = p.wins.map((w, i) => n ? `<div class="${COLORS[i]}" style="width:${w / n * 100}%">${w / n >= .12 ? pct(w / n) : ''}</div>` : '').join('') + (draws ? `<div class="d" style="width:${draws / n * 100}%"></div>` : '');
  const legend = p.names.map((nm, i) => { const [lo, hi] = wilson(p.wins[i], n); return `<div><span class="sw" style="background:${COLOR_VARS[i].startsWith('--') ? `var(${COLOR_VARS[i]})` : COLOR_VARS[i]}"></span>${esc(nm)} — ${p.wins[i]} wins<span class="ci">${n ? `${pct(p.wins[i] / n)} (95% ${pct(lo)}–${pct(hi)})` : ''}</span></div>`; }).join('') + (draws ? `<div><span class="sw" style="background:var(--draw)"></span>Draws / timeouts — ${draws}</div>` : '');
  const dots = games.sort((a, b) => a.n - b.n).map(g => `<span title="Game ${g.n}: ${g.winner >= 0 ? esc(p.names[g.winner]) : 'draw'} · ${(g.ms / 1000).toFixed(1)}s${g.turn ? ` · turn ${g.turn}` : ''}" style="background:${g.winner < 0 ? 'var(--draw)' : (COLOR_VARS[g.winner].startsWith('--') ? `var(${COLOR_VARS[g.winner]})` : COLOR_VARS[g.winner])}"></span>`).join('');
  const avg = n && games.length ? (games.reduce((s, g) => s + g.ms, 0) / games.length / 1000).toFixed(1) + 's/game' : (p.avgMs ? (p.avgMs / 1000).toFixed(1) + 's/game' : '');
  return `<div class="matchup"><h3><span>${p.names.map(esc).join(' vs ')}</span><small>${n}/${total} ${avg ? '· ' + avg : ''}</small></h3>
    <div class="wr">${segs || '<div></div>'}</div><div class="legend">${legend}</div><div class="games">${dots}</div>
    ${p.status === 'running' ? `<div class="progress"><i style="width:${n / total * 100}%"></i></div>` : ''}
    ${p.status === 'failed' ? `<p class="status bad">Forge exited without finishing (code ${p.exit}). Open the log below.</p>` : ''}
    ${p.warnings?.length ? `<div class="warns">${p.warnings.map(esc).join('<br>')}</div>` : ''}</div>`;
}

// ---------- history ----------
async function loadHistory() {
  const { history, running, queued } = await api('/api/jobs');
  const rows = [...(running ? [running] : []), ...queued, ...history];
  $('#historyList').innerHTML = rows.length ? rows.map(h => `<div class="hrow" data-id="${h.id}">
    <span class="muted">${new Date(h.created).toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</span>
    <span>${esc(h.owner ? '@' + h.owner : '')} · ${esc(h.mode)}</span>
    <span>${esc((h.pairings || []).map(p => p.names.join(' vs ')).slice(0, 3).join(' · ') || (h.decks || []).map(d => d.name).join(' vs '))}</span>
    <span class="muted">${esc(h.status)}</span></div>`).join('') : '<p class="muted">No runs yet.</p>';
  if (!state.job && running) watch(running.id);
}
$('#historyList').onclick = async e => {
  const r = e.target.closest('.hrow'); if (!r) return;
  switchView('build'); watch(r.dataset.id);
  const j = await api('/api/jobs/' + r.dataset.id);
  if (j.decks) { state.decks = []; j.decks.forEach(d => addDeck(d.name, d)); }
};
function switchView(v) { $$('#mainTabs button').forEach(b => b.classList.toggle('on', b.dataset.view === v)); $('#view-build').classList.toggle('hidden', v !== 'build'); $('#view-history').classList.toggle('hidden', v !== 'history'); if (v === 'history') loadHistory(); }
$('#mainTabs').onclick = e => { const b = e.target.closest('button'); if (b) switchView(b.dataset.view); };

// ---------- boot ----------
async function boot() {
  try { state.me = await api('/api/me'); } catch { return; }
  $('#forgeVer').textContent = 'Forge ' + state.me.forge;
  $('#whoami').textContent = '@' + state.me.user.name;
  $('#games').max = state.me.maxGames;
  if (!state.decks.length) { addDeck('Deck A'); addDeck('Deck B'); }
  renderMetaFormats(); loadMeta(); loadHistory();
}
boot();
