# Change 30, built from design/DESIGN-STATE-30-17OCT.html (17 Oct 2026), on top of the page as it stands.
#   1. The header line is the truth: "v3 ▾ · current · saved Oct 16 · [not run yet]", with a pill per state and
#      the one action that state needs (Run again, Make v4 current).
#   2. Versions are a chooser on that line: every version with origin, date and result; pick one and the page reads
#      it; Make current / Compare / Delete / New version live in the chooser. The Deck tab's Versions table goes.
#   3. The Deck tab's highlights: Top 8 · Worst · Best · Over-performed · Under · Trust, then the plan's one line.
#   4. Suggestions are tagged (mana / owned / buy / coach) and Apply opens the Save sheet with that diff.
#   5. The Save sheet: "Save as v4? from v3 · 54 of 60 shared", a note, Save and run · Save as v4 · Cancel.
#   6. Coach messages that belong to a run carry its version; the Run sheet says what it will do; one collection head.
# Idempotent: marker data-s30.
import sys
p = sys.argv[1] if len(sys.argv) > 1 else 'public/index.html'
s = open(p).read()
if 'data-s30' in s: print('already applied'); sys.exit(0)
def sub(old, new, n=1):
    global s
    assert s.count(old) == n, (s.count(old), old[:100])
    s = s.replace(old, new)

PILL = 'padding:2px 8px;border-radius:6px;font-weight:600;white-space:nowrap'

# ---------- 1 + 2: header line and chooser (markup) ----------
sub('''<div style="display:flex;align-items:baseline;gap:12px"><span style="font-size:var(--fs-xxl);font-weight:600;letter-spacing:-.01em;line-height:1.1">{{ deck.name }}</span><span style="font-family:var(--mono);font-size:var(--fs-s);color:var(--muted);white-space:nowrap">v{{ deck.version }} · {{ deck.versionLabel }}</span><span style="display:flex;gap:2px;font-size:var(--fs-m)"><sc-for list="{{ deckPips }}" as="p" hint-placeholder-count="2"><i class="ms ms-cost {{ p.cls }}" title="{{ p.title }}" style="color:{{ p.color }}"></i></sc-for></span></div></div></div>''',
    '''<div style="display:flex;align-items:baseline;gap:12px"><span style="font-size:var(--fs-xxl);font-weight:600;letter-spacing:-.01em;line-height:1.1">{{ deck.name }}</span><span style="display:flex;gap:2px;font-size:var(--fs-m)"><sc-for list="{{ deckPips }}" as="p" hint-placeholder-count="2"><i class="ms ms-cost {{ p.cls }}" title="{{ p.title }}" style="color:{{ p.color }}"></i></sc-for></span></div>
        <div data-s30="state" style="display:flex;align-items:center;gap:6px 8px;flex-wrap:wrap;font-family:var(--mono);font-size:var(--fs-s);color:var(--muted);margin-top:6px"><a href="#" onClick="{{ verToggle }}" title="Versions" style="color:var(--ink);font-weight:600;white-space:nowrap">v{{ deck.version }} ▾</a><span>·</span><span>{{ hd.lead }}</span><span>·</span><span style="''' + PILL + ''';background:{{ hd.pillBg }};color:{{ hd.pillInk }}">{{ hd.pill }}</span><sc-if value="{{ hd.tailOn }}" hint-placeholder-val="{{ true }}"><span>· {{ hd.tail }}</span></sc-if><sc-if value="{{ hd.actOn }}" hint-placeholder-val="{{ false }}"><span>·</span><a href="#" onClick="{{ hd.act }}" style="color:var(--accent);font-weight:600;white-space:nowrap">{{ hd.actLabel }}</a></sc-if></div></div></div>''')

sub('''    <sc-if value="{{ runOpen }}" hint-placeholder-val="{{ false }}"><div style="display:flex;flex-direction:column;gap:16px;padding:20px 24px;border:1px solid var(--line);border-radius:8px;background:var(--surface)">''',
    '''    <sc-if value="{{ verOpen }}" hint-placeholder-val="{{ false }}"><div data-s30="chooser" style="display:flex;flex-direction:column;border:1px solid var(--line);border-radius:8px;background:var(--surface);max-width:560px">
      <div style="display:flex;justify-content:space-between;align-items:baseline;padding:14px 18px;font-family:var(--mono);font-size:var(--fs-s);color:var(--muted)"><span>{{ deck.name }} · versions</span><a href="#" onClick="{{ verToggle }}" style="color:var(--muted)">close</a></div>
      <sc-for list="{{ verRows }}" as="x" hint-placeholder-count="4"><a href="#" onClick="{{ x.pick }}" style="display:grid;grid-template-columns:14px 36px minmax(0,1fr) auto;gap:12px;align-items:center;padding:10px 18px;border-top:1px solid var(--line);background:{{ x.bg }};color:inherit"><span style="width:7px;height:7px;border-radius:50%;background:{{ x.dot }}"></span><span style="font-family:var(--mono);font-size:var(--fs-m);color:var(--ink)">v{{ x.v }}</span><span style="min-width:0"><span style="display:block;font-size:var(--fs-s);color:var(--ink-2)">{{ x.line }}</span><span style="display:block;font-size:var(--fs-xs);color:var(--muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">{{ x.sub }}</span></span><span style="font-family:var(--mono);font-size:var(--fs-xs);''' + PILL + ''';background:{{ x.pillBg }};color:{{ x.pillInk }}">{{ x.pill }}</span></a></sc-for>
      <div style="display:flex;gap:8px 20px;flex-wrap:wrap;padding:12px 18px;border-top:1px solid var(--line);font-size:var(--fs-s)"><sc-for list="{{ verActs }}" as="a" hint-placeholder-count="3"><a href="#" onClick="{{ a.go }}" style="color:{{ a.color }};font-weight:600">{{ a.label }}</a></sc-for></div>
    </div></sc-if>
    <sc-if value="{{ runOpen }}" hint-placeholder-val="{{ false }}"><div style="display:flex;flex-direction:column;gap:16px;padding:20px 24px;border:1px solid var(--line);border-radius:8px;background:var(--surface)"><div style="display:flex;justify-content:space-between;align-items:baseline;gap:12px;flex-wrap:wrap"><span style="font-size:var(--fs-xl);font-weight:600">Run v{{ deck.version }}</span><span style="font-family:var(--mono);font-size:var(--fs-s);color:var(--muted)">{{ runTitleNote }}</span></div>''')
# the Run sheet gets a Cancel beside Run
sub('''<span style="font-size:var(--fs-s);color:{{ runLineColor }}">{{ runLine }}</span><a href="#" onClick="{{ queueRun }}" style="background:var(--accent);color:var(--bg);border-radius:6px;padding:9px 16px;font-weight:600;font-size:var(--fs-m)">Run</a></div></div></sc-if>''',
    '''<span style="font-size:var(--fs-s);color:{{ runLineColor }}">{{ runLine }}</span><span style="display:flex;gap:10px;align-items:center"><a href="#" onClick="{{ toggleRun }}" style="border:1px solid var(--line-strong);border-radius:6px;padding:8px 14px;font-weight:600;font-size:var(--fs-m);color:var(--ink)">Cancel</a><a href="#" onClick="{{ queueRun }}" style="background:var(--accent);color:var(--bg);border-radius:6px;padding:9px 16px;font-weight:600;font-size:var(--fs-m)">Run</a></span></div></div></sc-if>''')

# the Deck tab's Versions table: the chooser replaced it
a = s.index('''      <div style="display:flex;flex-direction:column">
        <div style="display:flex;justify-content:space-between;align-items:baseline;gap:24px;padding-bottom:8px"><div style="font-size:var(--fs-l);font-weight:600">Versions</div></div>''')
b = s.index('</div>\n      </div>\n', s.index('{{ goNewVersion }}', a)) + len('</div>\n      </div>\n')
s = s[:a] + s[b:]

# ---------- 3: highlights ----------
sub('''<sc-if value="{{ hlHas }}" hint-placeholder-val="{{ true }}"><div class="fs-stack" style="display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:20px"><sc-for list="{{ hlCols }}" as="h" hint-placeholder-count="4"><div style="display:flex;flex-direction:column;gap:6px"><div style="font-size:var(--fs-xs);color:var(--muted)">{{ h.label }}</div><sc-for list="{{ h.rows }}" as="r" hint-placeholder-count="2"><div style="display:flex;justify-content:space-between;gap:8px;font-size:var(--fs-s)"><span style="min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">{{ r.name }}</span><span style="font-family:var(--mono);color:{{ r.color }}">{{ r.val }}</span></div></sc-for></div></sc-for></div></sc-if>''',
    '''<sc-if value="{{ hlHas }}" hint-placeholder-val="{{ true }}"><div data-s30="hl" class="fs-hl6" style="display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:16px;padding-top:14px;border-top:1px solid var(--line)"><sc-for list="{{ hlStats }}" as="h" hint-placeholder-count="6"><div style="display:flex;flex-direction:column;gap:2px;min-width:0"><div style="font-size:var(--fs-xs);color:var(--muted)">{{ h.label }}</div><div style="font-family:var(--mono);font-size:var(--fs-l);font-weight:500;color:{{ h.color }};white-space:nowrap;overflow:hidden;text-overflow:ellipsis">{{ h.value }}</div><div style="font-size:var(--fs-xs);color:var(--muted);line-height:1.4">{{ h.sub }}</div></div></sc-for></div></sc-if>
          <sc-if value="{{ hlPlanOn }}" hint-placeholder-val="{{ false }}"><div style="font-size:var(--fs-s);line-height:1.55;padding-top:12px;border-top:1px solid var(--line)"><b style="font-weight:600">The plan:</b> {{ hlPlan }} <sc-if value="{{ hasGuideLink }}" hint-placeholder-val="{{ true }}"><a href="{{ guideHref }}" target="_blank" rel="noopener" style="color:var(--accent);font-weight:600;white-space:nowrap">Open the plan ↗</a></sc-if></div></sc-if>''')
sub('''@media (max-width:900px){''', '''@media (max-width:900px){ .fs-hl6 { grid-template-columns: repeat(3, minmax(0, 1fr)) !important; }''')

# ---------- 4: suggestions ----------
sub('''<span style="font-size:var(--fs-xs);font-weight:600;color:{{ g.kindColor }};padding-top:2px">{{ g.kindLabel }}</span>''',
    '''<span style="justify-self:start;font-family:var(--mono);font-size:var(--fs-xs);''' + PILL + ''';background:{{ g.kindBg }};color:{{ g.kindColor }}">{{ g.kindLabel }}</span>''')
sub('''<sc-if value="{{ g.canApply }}" hint-placeholder-val="{{ true }}"><a href="#" onClick="{{ g.apply }}" style="border:1px solid var(--line-strong);border-radius:6px;padding:7px 12px;font-size:var(--fs-s);font-weight:600;color:var(--ink);white-space:nowrap">Apply…</a></sc-if>''',
    '''<sc-if value="{{ g.canApply }}" hint-placeholder-val="{{ true }}"><a href="#" onClick="{{ g.apply }}" style="font-size:var(--fs-s);font-weight:600;color:var(--accent);white-space:nowrap">Apply</a></sc-if>''')
sub('''<sc-if value="{{ g.isBuy }}" hint-placeholder-val="{{ false }}"><a href="{{ g.buy }}" target="_blank" rel="noopener sponsored" style="font-size:var(--fs-s);color:var(--accent);font-weight:600;white-space:nowrap">Buy ↗</a></sc-if>''',
    '''<sc-if value="{{ g.isBuy }}" hint-placeholder-val="{{ false }}"><a href="{{ g.buy }}" target="_blank" rel="noopener sponsored" style="display:block;margin-top:6px;font-size:var(--fs-s);color:var(--ink-2);white-space:nowrap">{{ g.price }}TCGplayer ↗</a></sc-if>''')
sub('''<sc-if value="{{ sgSavedOn }}" hint-placeholder-val="{{ false }}"><div style="font-size:var(--fs-s);color:var(--win)">{{ sgSaved }}</div></sc-if>''',
    '''<sc-if value="{{ sgSavedOn }}" hint-placeholder-val="{{ false }}"><div style="font-size:var(--fs-s);color:var(--win)">{{ sgSaved }}</div></sc-if>
        <div style="font-family:var(--mono);font-size:var(--fs-xs);color:var(--muted);padding-top:8px;border-top:1px solid var(--line)">Nothing changes until you Apply one. Apply opens the Save sheet with that change; "Save and run" tests it.</div>''')

# ---------- 5: the Save sheet (the edit bar) ----------
sub('''<div data-change7="diff-bar" style="position:sticky;bottom:0;margin-top:12px;padding:16px 0 8px;background:linear-gradient(to bottom,rgba(12,12,11,0),var(--bg) 16px)"><div style="background:var(--surface);border:1px solid var(--line-strong);border-radius:8px;padding:14px 18px;display:flex;flex-direction:column;gap:10px">''',
    '''<div data-change7="diff-bar" style="position:sticky;bottom:0;margin-top:12px;padding:16px 0 8px;background:linear-gradient(to bottom,rgba(12,12,11,0),var(--bg) 16px)"><div style="background:var(--surface);border:1px solid var(--line-strong);border-radius:8px;padding:16px 20px;display:flex;flex-direction:column;gap:12px">
            <div data-s30="save" style="display:flex;justify-content:space-between;align-items:baseline;gap:12px;flex-wrap:wrap"><span style="font-size:var(--fs-xl);font-weight:600">{{ edTitle }}</span><span style="font-family:var(--mono);font-size:var(--fs-s);color:var(--muted)">{{ edShared }}</span></div>''')
sub('''<div style="display:flex;align-items:center;gap:16px;flex-wrap:wrap"><a href="#" onClick="{{ edToggleQueue }}" style="display:flex;align-items:center;gap:8px;font-size:var(--fs-s);color:var(--muted)"><span style="display:inline-flex;align-items:center;justify-content:center;width:16px;height:16px;border:1px solid var(--line-strong);border-radius:4px;background:{{ edQueueFill }};color:var(--bg);font-size:11px">✓</span>{{ edQueueLabel }}</a><span style="flex:1"></span><a href="#" onClick="{{ edDiscard }}" style="font-size:var(--fs-s);color:var(--muted)">Discard</a><a href="#" onClick="{{ edSave }}" style="background:{{ edSaveBg }};color:{{ edSaveInk }};border-radius:6px;padding:9px 16px;font-weight:600;font-size:var(--fs-s)">{{ edSaveLabel }}</a></div>''',
    '''<input value="{{ edNote }}" onChange="{{ edNoteSet }}" placeholder="Note (optional) · what you're trying" style="background:var(--bg);border:1px solid var(--line-strong);border-radius:6px;padding:9px 12px;color:var(--ink);font-size:var(--fs-s);outline:none;width:100%">
            <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap"><a href="#" onClick="{{ edSaveRun }}" style="background:{{ edSaveBg }};color:{{ edSaveInk }};border-radius:6px;padding:9px 16px;font-weight:600;font-size:var(--fs-s)">{{ edRunLabel }}</a><a href="#" onClick="{{ edSave }}" style="border:1px solid var(--line-strong);border-radius:6px;padding:8px 14px;font-weight:600;font-size:var(--fs-s);color:{{ edSaveOutline }}">{{ edSaveLabel }}</a><a href="#" onClick="{{ edDiscard }}" style="border:1px solid var(--line-strong);border-radius:6px;padding:8px 14px;font-weight:600;font-size:var(--fs-s);color:var(--ink)">Cancel</a><span style="flex:1"></span><span style="font-size:var(--fs-s);color:var(--muted)">{{ edStays }}</span></div>''')

# ---------- renderVals defaults ----------
sub("hlKicker: '', hlHas: false,", "hlKicker: '', hd: { lead: '', pill: '', pillBg: 'var(--track)', pillInk: MUTED, tailOn: false, tail: '', actOn: false, actLabel: '', act: pe(() => {}) }, verOpen: false, verToggle: pe(() => {}), verRows: [], verActs: [], runTitleNote: '', hlStats: [], hlPlanOn: false, hlPlan: '', edTitle: '', edShared: '', edNote: '', edNoteSet: () => {}, edSaveRun: pe(() => {}), edRunLabel: '', edSaveOutline: MUTED, edStays: '', hlHas: false,")

# ---------- the viewed version: the chooser's pick, else the deck ----------
sub('''    const ver = (d.versions.find(x => x.v === d.current) || d.versions[d.versions.length - 1]);
    const coverOf''', '''    const cur30 = (d.versions.find(x => x.v === d.current) || d.versions[d.versions.length - 1]);
    const ver = (S.pickV && S.pickV.brew === d.id && d.versions.find(x => x.v === S.pickV.v)) || cur30;   // change 30: the chooser's pick reads the whole page
    const coverOf''')
sub('''  edRowsFrom(d, pasted) {
    const ver = (d.versions.find(x => x.v === d.current) || d.versions[d.versions.length - 1]), cur = ver.rows || [];''',
    '''  edRowsFrom(d, pasted) {
    const pk = this.state.pickV, ver = (pk && pk.brew === d.id && d.versions.find(x => x.v === pk.v)) || d.versions.find(x => x.v === d.current) || d.versions[d.versions.length - 1], cur = ver.rows || [];''')
sub('''  edStart(d, pasted) { this.setState({ ed: { id: d.id, rows: this.edRowsFrom(d, pasted), swap: null, q: '', hits: [], hitsNote: '', chk: null, queue: true, err: '' }, tab: 'deck', view: 'run', stage: 'app' }); if (pasted) this.edCheck(); }''',
    '''  edStart(d, pasted, note) { const pk = this.state.pickV, base = (pk && pk.brew === d.id && d.versions.some(x => x.v === pk.v)) ? pk.v : d.current;
    this.setState({ ed: { id: d.id, base, rows: this.edRowsFrom(d, pasted), swap: null, q: '', hits: [], hitsNote: '', chk: null, queue: false, note: note || '', err: '' }, tab: 'deck', view: 'run', stage: 'app', verOpen: false }); if (pasted) this.edCheck(); }''')
sub('''  async edSave(d, words) {
    const S = this.state, ed = S.ed; if (!ed || S.busy) return;
    this.setState({ busy: true });
    try {
      const b = await this.api('/api/brews/' + d.id + '/versions', { method: 'POST', body: { list: this.edList(ed.rows), note: words } });
      const last = d.runs.find(r => r.status === 'done' || r.status === 'running') || d.runs[0];
      this.setState(s => ({ brews: s.brews.map(x => x.id === b.id ? b : x), ed: null, busy: false, cmpA: null, cmpB: null }));
      if (ed.queue) await this.queue(b.id, last ? last.oppSet : S.oppSet, b.current);   // the version just saved, by its number''',
    '''  async edSave(d, words, run) {
    const S = this.state, ed = S.ed; if (!ed || S.busy) return;
    this.setState({ busy: true });
    try {
      const b = await this.api('/api/brews/' + d.id + '/versions', { method: 'POST', body: { list: this.edList(ed.rows), from: ed.base, note: (ed.note || '').trim() || words, origin: 'edited' } });
      this.setState(s => ({ brews: s.brews.map(x => x.id === b.id ? b : x), ed: null, busy: false, cmpA: null, cmpB: null, pickV: null, msg: run ? null : { text: 'Saved as v' + b.current + '. It\\'s your deck now and hasn\\'t run yet.' } }));
      if (run) this.setState({ runOpen: true, runErr: '' });   // "Save and run" opens the Run sheet set to the new version''')

# the header line, the chooser and the Run sheet's title (renderVals, beside the highlights)
sub('''    { const done = r => r.status === 'done' && r.score && !r.weekly, mine = d.runs.find(r => r.v === ver.v && done(r)), any = d.runs.find(done), pc = x => Math.round(x * 100) + '%';''',
    '''    { const ORIGIN = { pasted: 'pasted', edited: 'saved', optimize: 'from Optimize', coach: 'coach swap', asked: 'from the coach', owned: 'owned version' }, isCur = ver.v === cur30.v;
      const CAUSE = { lost: 'the sim restarted', cancelled: 'cancelled', failed: 'it couldn\\'t start' };
      const pillOf = (x) => { const st = x.state || { kind: 'none' }, r = st.run && d.runs.find(y => y.id === st.run);
        return st.kind === 'done' ? { t: Math.round(st.p * 100) + '% vs the field', bg: 'rgba(110,168,254,.16)', ink: '#8fbcff', short: Math.round(st.p * 100) + '%' }
          : st.kind === 'running' ? { t: 'running · ' + (r ? r.played + ' of ' + r.total : st.pct + '%'), bg: 'rgba(197,236,122,.16)', ink: ACC, short: 'running' }
          : st.kind === 'queued' ? { t: st.line, bg: 'rgba(197,236,122,.10)', ink: ACC, short: 'queued' }
          : st.kind === 'stopped' ? { t: 'stopped', bg: 'rgba(232,180,80,.16)', ink: 'var(--amber)', short: 'stopped', cause: CAUSE[st.cause] || '' }
          : { t: 'not run yet', bg: 'var(--track)', ink: MUTED, short: 'not run yet' }; };
      const pl = pillOf(ver), vr = ver.state && ver.state.run && d.runs.find(y => y.id === ver.state.run);
      const tail = ver.state && ver.state.kind === 'done' && vr ? [vr.field && vr.field.date ? day(new Date(vr.field.date).getTime()) + ' field' : '', vr.score && vr.score.n ? vr.score.n + ' games' : ''].filter(Boolean).join(' · ') : pl.cause || '';
      v.hd = { lead: isCur ? 'current · ' + (ORIGIN[ver.origin] || 'saved') + ' ' + day(ver.created) : (ORIGIN[ver.origin] || 'saved') + ' · ' + day(ver.created), pill: pl.t, pillBg: pl.bg, pillInk: pl.ink,
        tailOn: !!(isCur ? tail : true), tail: isCur ? tail : 'v' + cur30.v + ' stays current',
        actOn: !isCur || (ver.state && ver.state.kind === 'stopped'), actLabel: !isCur ? 'Make v' + ver.v + ' current' : 'Run again',
        act: pe(() => !isCur ? this.makeCurrent(d, ver.v) : this.queue(d.id, (vr && vr.oppSet) || S.oppSet, ver.v)) };
      v.verOpen = !!S.verOpen; v.verToggle = pe(() => this.setState({ verOpen: !S.verOpen, verDel: null, runOpen: false }));
      v.verRows = d.versions.slice().reverse().map(x => { const q = pillOf(x), c = x.v === cur30.v;
        return { v: x.v, dot: c ? ACC : 'transparent', line: (ORIGIN[x.origin] || 'saved') + ' · ' + day(x.created) + (c ? ' · current' : ''), sub: x.note ? '"' + String(x.note).replace(/^(Coach|Suggestion): /, '') + '"' : x.diff ? x.diff.map(c => (c.qty > 0 ? '+' : '−') + Math.abs(c.qty) + ' ' + c.name + (c.section === 'side' ? ' (side)' : '')).join(', ') : 'first paste',
          pill: q.short, pillBg: q.bg, pillInk: q.ink, bg: x.v === ver.v ? 'var(--bg)' : 'transparent', pick: pe(() => this.setState({ pickV: x.v === cur30.v ? null : { brew: d.id, v: x.v }, verOpen: false, verDel: null, ed: null })) }; });
      v.verActs = [...(!isCur ? [{ label: 'Make v' + ver.v + ' current', color: ACC, go: pe(() => this.makeCurrent(d, ver.v)) }] : []),
        ...(d.versions.length >= 2 && d.seats === 2 ? [{ label: isCur ? 'Compare versions' : 'Compare v' + ver.v + ' to v' + cur30.v, color: 'var(--ink)', go: pe(() => this.setState({ tab: 'results', view: 'compare', cmpA: isCur ? null : cur30.v, cmpB: ver.v, verOpen: false })) }] : []),
        ...(!isCur ? [{ label: S.verDel === ver.v ? 'Delete v' + ver.v + '? Yes' : 'Delete v' + ver.v, color: S.verDel === ver.v ? LOSS : MUTED, go: pe(() => S.verDel === ver.v ? this.dropVersion(d, ver.v) : this.setState({ verDel: ver.v })) }] : []),
        { label: 'New version', color: 'var(--ink-2)', go: pe(() => this.setState({ stage: 'firstrun', fsStep: 1, fsErr: '', versionOf: d.id, pasteText: '', check: null, noteText: '', verOpen: false })) }];
      { const os = (d.oppSets || []).find(o => o.id === S.oppSet && o.available) || (d.oppSets || []).find(o => o.available); v.runTitleNote = os ? [os.n ? os.n * 20 * (d.seats === 2 && v.bo3Avail !== false ? 2 : 1) + ' games' : '', os.time ? os.time.replace(/^~/, 'about ') : ''].filter(Boolean).join(' · ') : ''; }
    }
    { const done = r => r.status === 'done' && r.score && !r.weekly, mine = d.runs.find(r => r.v === ver.v && done(r)), any = d.runs.find(done), pc = x => Math.round(x * 100) + '%';''')
sub('''      v.hlKicker = 'v' + ver.v + (mine ? ' · your deck · ' + fieldDay(mine) + ' field' : ' · your deck');''',
    '''      v.hlKicker = 'v' + ver.v + (ver.v === cur30.v ? ' · your deck' : ' · not your deck') + (mine ? ' · ' + fieldDay(mine) + ' field' : '');''')
sub('''      v.hlIssueOn = !!(mine && mine.coach && mine.coach.weakness);''',
    '''      { const E = mine && mine.event, fid = mine && mine.calibration && mine.calibration.fidelity, fl = !fid ? 'unknown' : fid.hi < 0.5 ? 'low' : fid.lo >= 0.7 ? 'good' : 'some';
        const W = worst[0], Bs = best[0], U = up[0], Dn = down[0];
        v.hlStats = mine ? [{ label: 'Top 8', value: E && E.top8 ? pc(E.top8.p) : '—', sub: E && E.rounds ? E.rounds + ' rounds' : '', color: 'var(--ink)' },
          { label: 'Worst', value: W ? pc(W.s.p) : '—', sub: W ? W.name : '', color: W ? LOSS : MUTED }, { label: 'Best', value: Bs ? pc(Bs.s.p) : '—', sub: Bs ? Bs.name : '', color: Bs ? WIN : MUTED },
          { label: 'Over-performed', value: U && U.lift > 0 ? U.name : '—', sub: U && U.lift > 0 ? sg(U.lift) + ' when cast' : '', color: 'var(--ink)' }, { label: 'Under', value: Dn && Dn.lift < 0 ? Dn.name : '—', sub: Dn && Dn.lift < 0 ? sg(Dn.lift) + ' when cast' : '', color: 'var(--ink)' },
          { label: 'Trust', value: { unknown: 'fair', low: 'fair', some: 'fair', good: 'good' }[fl], sub: { unknown: 'versions yes · matchups weak', low: 'versions yes · matchups weak', some: 'versions yes · matchups partly', good: 'versions and matchups' }[fl], color: 'var(--ink)' }] : [];
        const rd = ver.reading; v.hlPlanOn = !!(mine && rd && (rd.strategy || rd.plan)); v.hlPlan = v.hlPlanOn ? (() => { const G = (d.guide && d.guide.rows) || [], by = r => G.filter(g => g.role === r).map(g => g.opponent), bt = by('beatdown'), ct = by('control');
          return cap([rd.strategy, rd.plan].filter(Boolean).join(' ')) + (rd.why ? ' (' + rd.why + ')' : '') + (rd.nearest ? ', closest to ' + rd.nearest : '') + '.' + (bt.length || ct.length ? ' ' + [ct.length ? 'Control against ' + ct.slice(0, 3).join(', ') : '', bt.length ? 'the beatdown against ' + (bt.length > 3 ? 'everyone else' : bt.join(', ')) : ''].filter(Boolean).join('; ') + '.' : ''); })() : ''; }
      v.hlIssueOn = !!(mine && mine.coach && mine.coach.weakness);''')

# suggestions: tags and Apply -> the Save sheet
sub('''      const KIND = { structure: ['Structure', 'var(--amber)'], owned: ['Owned swap', WIN], buy: ['Buy', ACC], coach: ['Coach', 'var(--ink-2)'] };''',
    '''      const KIND = { structure: ['mana', '#8fbcff', 'rgba(110,168,254,.16)'], owned: ['owned', '#8fbcff', 'rgba(110,168,254,.16)'], buy: ['buy', ACC, 'rgba(197,236,122,.14)'], coach: ['coach', 'var(--ink-2)', 'var(--track)'] };''')
sub('''      v.sgItems = SG ? SG.items.map(x => ({ kindLabel: (KIND[x.kind] || [x.kind])[0], kindColor: (KIND[x.kind] || [0, MUTED])[1], title: x.title,''',
    '''      v.sgItems = SG ? SG.items.map(x => ({ kindLabel: (KIND[x.kind] || [x.kind])[0], kindColor: (KIND[x.kind] || [0, MUTED])[1], kindBg: (KIND[x.kind] || [0, 0, 'var(--track)'])[2], title: x.title, price: (String(x.why || '').match(/About \\$[\\d.]+/) || [''])[0].replace('About ', '').replace(/\\.\\d+$/, '') + ((/About \\$/.test(x.why || '')) ? ' · ' : ''),''')
sub('''        apply: pe(() => this.setState({ sgConfirm: x.id })), cancel:''',
    '''        apply: pe(() => this.sgApply(d, ver, x)), cancel:''')
sub("        canApply: !!x.swaps && S.sgConfirm !== x.id,", "        canApply: !!x.swaps,")

# the Save sheet's words
sub('''      v.edSaveLabel = S.busy ? 'Saving…' : !changes.length ? 'No changes yet' : anyway ? 'Save anyway' : 'Save as v' + next; v.edSaveBg = saveable ? ACC : 'var(--track)'; v.edSaveInk = saveable ? 'var(--bg)' : MUTED;
      v.edSave = pe(() => saveable && this.edSave(d, words));''',
    '''      v.edSaveLabel = S.busy ? 'Saving…' : !changes.length ? 'No changes yet' : anyway ? 'Save anyway' : 'Save as v' + next; v.edSaveBg = saveable ? ACC : 'var(--track)'; v.edSaveInk = saveable ? 'var(--bg)' : MUTED;
      v.edSave = pe(() => saveable && this.edSave(d, words));
      { const baseV = ED.base || d.current, bv = d.versions.find(x => x.v === baseV), shared = bv ? rows.filter(r => r.section === 'main').reduce((t, r) => t + Math.min(r.qty, r.orig || 0), 0) : 0;
        v.edTitle = changes.length ? 'Save as v' + next + '?' : 'Editing v' + baseV; v.edShared = 'from v' + baseV + (changes.length ? ' · ' + shared + ' of ' + nM + ' shared' : '');
        v.edRunLabel = S.busy ? 'Saving…' : 'Save and run'; v.edSaveRun = pe(() => saveable && this.edSave(d, words, true)); v.edSaveOutline = saveable ? 'var(--ink)' : MUTED;
        v.edStays = 'v' + baseV + ' stays as it is'; v.edNote = ED.note || ''; v.edNoteSet = (e) => this.edUpdate(x => ({ ...x, note: e.target.value })); }''')

# coach messages that belong to a run carry its version
sub('''      undoOn: m.kind === 'action' && !!m.action && !m.action.undone,''',
    '''      ...(m.run && d.runs.some(r => r.id === m.run) ? { at: 'v' + d.runs.find(r => r.id === m.run).v + ' · ' + at(m.at) } : {}),
      undoOn: m.kind === 'action' && !!m.action && !m.action.undone,''')

# one collection head: "No collection yet" shows once, in the block with its button
sub('''v.colHeadLine = P5 ? (P5.size + ' cards · ' + (P5.source || 'pasted') + ' · updated ' + new Date(P5.at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })) : 'No collection yet'; }''',
    '''v.colHeadLine = P5 ? (P5.size + ' cards · ' + (P5.source || 'pasted') + ' · updated ' + new Date(P5.at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })) : ''; }''')

# the plan link follows the version on screen
sub('''v.guideHref = d && d.id ? '/g/' + d.id + '/v' + ((d.versions.find(x => x.v === d.current) || d.versions[d.versions.length - 1]) || {}).v : '#\'''',
    '''v.guideHref = d && d.id ? '/g/' + d.id + '/v' + (ver || {}).v : '#\'''')

# handlers
sub('''  async coachUndo(brewId, at) {''', '''  // change 30: the chooser's actions, and a suggestion applied into the Save sheet
  async makeCurrent(d, vn) {
    if (this.state.busy) return; this.setState({ busy: true });
    try { const b = await this.api('/api/brews/' + d.id + '/current', { method: 'POST', body: { v: vn } }); this.setState(s => ({ brews: s.brews.map(x => x.id === b.id ? b : x), pickV: null, verOpen: false, msg: { text: 'v' + vn + ' is your deck now.' } })); }
    catch (e) { this.setState({ msg: { text: 'Not changed: ' + e.message, bad: true } }); }
    this.setState({ busy: false });
  }
  async dropVersion(d, vn) {
    if (this.state.busy) return; this.setState({ busy: true });
    try { const b = await this.api('/api/brews/' + d.id + '/versions/' + vn, { method: 'DELETE' }); this.setState(s => ({ brews: s.brews.map(x => x.id === b.id ? b : x), pickV: null, verDel: null, msg: { text: 'v' + vn + ' deleted.' } })); }
    catch (e) { this.setState({ msg: { text: 'Not deleted: ' + e.message, bad: true } }); }
    this.setState({ busy: false });
  }
  sgApply(d, ver, x) {
    const rows = (ver.rows || []).map(r => ({ qty: r.qty, name: r.name, section: r.section }));
    for (const sw of x.swaps || []) { const o = rows.find(r => r.section === 'main' && r.name === sw.out); if (o) o.qty--; const i = rows.find(r => r.section === 'main' && r.name === sw.in); if (i) i.qty++; else rows.push({ qty: 1, name: sw.in, section: 'main' }); }
    this.setState({ pickV: ver.v === d.current ? null : { brew: d.id, v: ver.v } });
    this.edStart(d, rows.filter(r => r.qty > 0), 'Suggestion: ' + x.title);
  }
  async coachUndo(brewId, at) {''')

# follow-ups after the first browser pass (17 Oct): the coach column's run header names the run's own version, and
# the highlights set card names in the text face (numbers stay mono)
sub('<div style="font-family:var(--mono);font-size:var(--fs-s);color:var(--muted)">v{{ deck.version }} · {{ change }}</div>',
    '<div style="font-family:var(--mono);font-size:var(--fs-s);color:var(--muted)">{{ briefVer }} · {{ change }}</div>')
sub("v.change = runVer.diff ? diffS(runVer.diff) : 'first paste'", "v.briefVer = 'v' + runVer.v; v.change = runVer.diff ? diffS(runVer.diff) : 'first paste'")
sub("hlStats: [], hlPlanOn: false,", "hlStats: [], briefVer: '', hlPlanOn: false,")
sub('<div style="font-family:var(--mono);font-size:var(--fs-l);font-weight:500;color:{{ h.color }};white-space:nowrap;overflow:hidden;text-overflow:ellipsis">{{ h.value }}</div>',
    '<div title="{{ h.value }}" style="font-family:{{ h.font }};font-size:var(--fs-l);font-weight:500;color:{{ h.color }};white-space:nowrap;overflow:hidden;text-overflow:ellipsis">{{ h.value }}</div>')
sub("{ label: 'Over-performed', value: U && U.lift > 0 ? U.name : '—',", "{ label: 'Over-performed', font: 'inherit', value: U && U.lift > 0 ? U.name : '—',")
sub("{ label: 'Under', value: Dn && Dn.lift < 0 ? Dn.name : '—',", "{ label: 'Under', font: 'inherit', value: Dn && Dn.lift < 0 ? Dn.name : '—',")
sub("v.hlStats = mine ? [", "v.hlStats = (mine ? [")
sub("color: 'var(--ink)' }] : [];\n        const rd = ver.reading;", "color: 'var(--ink)' }] : []).map(h => ({ font: 'var(--mono)', ...h }));\n        const rd = ver.reading;")

open(p, 'w').write(s); print('applied')
