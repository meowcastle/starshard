# Patch 18, P2 of the strategy-first rebuild (HANDOFF 23 Oct §4 P2; STRATEGY-FIRST-REBUILD §4 E0; DISTILL-3 §5): the
# Deck tab leads with the strategy. A deck with no saved strategy shows the first read ("Here's what your deck is
# doing": the coach's draft from the cards and the link graph, its engine, its questions; Save this strategy, Edit
# in my words, another reading), or "This deck doesn't have one plan yet" with its half-plans. A saved strategy
# shows as the Strategy block (Edit · History). The list is grouped by role (engine, enablers, threats, answers,
# protection, card flow, mana) once the read is in, by type before that and while editing.
# "How it actually wins" says "not measured yet": the telemetry (E0 layer 3) comes with P3.
import sys
p = sys.argv[1] if len(sys.argv) > 1 else 'public/index.html'
s = open(p).read()
if 'data-p18="read"' in s: print('already applied'); sys.exit(0)

LAB = 'font-family:var(--mono);font-size:var(--fs-s);color:var(--muted)'
BTN = 'background:var(--accent);color:var(--bg);border-radius:6px;padding:9px 16px;font-weight:600;font-size:var(--fs-m);white-space:nowrap'
GHOST = 'border:1px solid var(--line-strong);border-radius:6px;padding:8px 14px;font-weight:600;font-size:var(--fs-m);color:var(--ink);white-space:nowrap'
BOX = 'border:1px solid var(--line);border-radius:8px;background:var(--surface);padding:16px 18px;display:flex;flex-direction:column;gap:10px'
TA = 'background:var(--bg);border:1px solid var(--line-strong);border-radius:6px;padding:9px 12px;color:var(--ink);font-size:var(--fs-m);outline:none;resize:vertical;width:100%;box-sizing:border-box;font-family:inherit'

read = ('<sc-if value="{{ sg.readOn }}" hint-placeholder-val="{{ false }}"><div data-p18="read" style="display:flex;flex-direction:column;gap:16px">'
  '<div style="' + LAB + '">First read · v{{ sg.v }}</div>'
  '<sc-if value="{{ sg.drafting }}" hint-placeholder-val="{{ false }}"><div style="font-size:var(--fs-l);font-weight:600">Reading your deck…</div><div style="font-size:var(--fs-m);color:var(--muted)">The coach is drafting what it\'s trying to do. About half a minute.</div></sc-if>'
  '<sc-if value="{{ sg.ready }}" hint-placeholder-val="{{ false }}">'
    '<div style="font-size:24px;font-weight:600;line-height:1.25">{{ sg.title }}</div>'
    '<div style="font-size:var(--fs-m);color:var(--muted)">A draft from the cards. You decide what it is.</div>'
    '<div style="font-size:var(--fs-s)"><span style="' + LAB + '">Roles</span> {{ sg.roles }}</div>'
    '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:16px">'
      '<div style="' + BOX + ';border-color:rgba(197,236,122,.35)"><div style="display:flex;justify-content:space-between;gap:8px"><span style="' + LAB + '">Strategy · draft</span><span style="' + LAB + '">confidence: {{ sg.conf }}</span></div>'
        '<div style="font-size:var(--fs-l);line-height:1.5">{{ sg.summary }}</div><div style="font-size:var(--fs-m)"><span style="color:var(--muted)">Wins when:</span> {{ sg.wins }}</div>'
        '<sc-for list="{{ sg.rules }}" as="r" hint-placeholder-count="3"><div style="font-size:var(--fs-m);color:var(--ink-2)">· {{ r.text }}</div></sc-for>'
        '<div style="font-size:var(--fs-s);color:var(--muted)">Shape: {{ sg.shape }}{{ sg.cousin }}</div></div>'
      '<div style="display:flex;flex-direction:column;gap:8px"><span style="' + LAB + '">The engine</span><sc-for list="{{ sg.engine }}" as="g" hint-placeholder-count="3"><div style="display:flex;flex-direction:column;padding-bottom:6px;border-bottom:1px solid var(--line)"><b style="font-size:var(--fs-m)">{{ g.name }}</b><span style="font-size:var(--fs-s);color:var(--muted)">{{ g.why }}</span></div></sc-for></div>'
    '</div>'
    '<div style="display:flex;flex-direction:column;gap:4px"><span style="' + LAB + '">How it actually wins</span><span style="font-size:var(--fs-m);color:var(--muted)">Not measured yet. This fills in once the sim has played the list; until then the draft rests on the cards\' text.</span></div>'
    '<sc-if value="{{ sg.hasQs }}" hint-placeholder-val="{{ false }}"><div style="display:flex;flex-direction:column;gap:10px"><span style="' + LAB + '">{{ sg.qsLabel }}</span>'
      '<sc-for list="{{ sg.qs }}" as="q" hint-placeholder-count="2"><div style="display:flex;flex-wrap:wrap;gap:8px;align-items:center"><span style="font-size:var(--fs-m);min-width:220px;flex:1 1 220px">{{ q.q }}</span><sc-for list="{{ q.opts }}" as="o" hint-placeholder-count="2"><a href="#" onClick="{{ o.go }}" style="border:1px solid {{ o.ring }};background:{{ o.fill }};color:{{ o.ink }};border-radius:999px;padding:6px 12px;font-size:var(--fs-s);font-weight:600">{{ o.o }}</a></sc-for></div></sc-for>'
      '<sc-if value="{{ sg.answered }}" hint-placeholder-val="{{ false }}"><a href="#" onClick="{{ sg.redraft }}" style="' + GHOST + ';align-self:flex-start">Redraft with my answers</a></sc-if></div></sc-if>'
    '<sc-if value="{{ sg.notEditing }}" hint-placeholder-val="{{ true }}"><div style="display:flex;gap:10px;flex-wrap:wrap;align-items:center"><a href="#" onClick="{{ sg.save }}" style="' + BTN + '">Save this strategy</a><a href="#" onClick="{{ sg.edit }}" style="' + GHOST + '">Edit in my words</a><span style="font-size:var(--fs-s);color:var(--muted)">Not it? <a href="#" onClick="{{ sg.again }}" style="color:var(--accent);font-weight:600">Another reading</a></span></div></sc-if>'
  '</sc-if>'
  '<sc-if value="{{ sg.noplan }}" hint-placeholder-val="{{ false }}">'
    '<div style="font-size:24px;font-weight:600;line-height:1.25">This deck doesn\'t have one plan yet</div>'
    '<div style="font-size:var(--fs-m);color:var(--muted)">No clear engine. These half-plans pull against each other. Pick one and the coach builds the strategy around it.</div>'
    '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:12px"><sc-for list="{{ sg.half }}" as="h" hint-placeholder-count="3"><div style="' + BOX + '"><b>{{ h.t }}</b><a href="#" onClick="{{ h.go }}" style="color:var(--accent);font-weight:600;font-size:var(--fs-s)">Build around this</a></div></sc-for></div>'
    '<sc-if value="{{ sg.notEditing }}" hint-placeholder-val="{{ true }}"><a href="#" onClick="{{ sg.steerOpen }}" style="' + GHOST + ';align-self:flex-start">Tell me what you want it to do</a></sc-if>'
  '</sc-if>'
  '<sc-if value="{{ sg.failed }}" hint-placeholder-val="{{ false }}"><div style="font-size:var(--fs-m);color:var(--muted)">The first read didn\'t finish: {{ sg.error }}. <a href="#" onClick="{{ sg.again }}" style="color:var(--accent);font-weight:600">Try again</a></div></sc-if>'
  '<sc-if value="{{ sg.waiting }}" hint-placeholder-val="{{ false }}"><div style="font-size:var(--fs-m);color:var(--muted)">Reading the cards…</div></sc-if>'
  '</div></sc-if>')

saved = ('<sc-if value="{{ sg.savedOn }}" hint-placeholder-val="{{ false }}"><div data-p18="strategy" style="display:flex;flex-direction:column;gap:8px;padding-bottom:16px;border-bottom:1px solid var(--line)">'
  '<div style="display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap;align-items:baseline"><span style="' + LAB + '">Strategy</span><span style="font-size:var(--fs-s)"><a href="#" onClick="{{ sg.edit }}" style="color:var(--accent);font-weight:600">Edit</a> · <a href="#" onClick="{{ sg.hist }}" style="color:var(--accent);font-weight:600">History</a></span></div>'
  '<sc-if value="{{ sg.hasTitle }}" hint-placeholder-val="{{ true }}"><div style="font-size:var(--fs-l);font-weight:600">{{ sg.title }}</div></sc-if>'
  '<div style="font-size:18px;line-height:1.5">{{ sg.summary }}</div>'
  '<div style="display:flex;flex-wrap:wrap;gap:4px 24px;font-size:var(--fs-s);color:var(--muted)"><sc-if value="{{ sg.hasEngine }}" hint-placeholder-val="{{ true }}"><span>Engine: <span style="color:var(--ink)">{{ sg.engineLine }}</span></span></sc-if><sc-if value="{{ sg.hasWins }}" hint-placeholder-val="{{ true }}"><span>Wins when: <span style="color:var(--ink)">{{ sg.wins }}</span></span></sc-if><sc-if value="{{ sg.hasRules }}" hint-placeholder-val="{{ true }}"><span>Rules: <span style="color:var(--ink)">{{ sg.rulesLine }}</span></span></sc-if></div>'
  '<sc-if value="{{ sg.histOpen }}" hint-placeholder-val="{{ false }}"><div style="display:flex;flex-direction:column;gap:6px;margin-top:6px"><sc-for list="{{ sg.history }}" as="h" hint-placeholder-count="2"><div style="font-size:var(--fs-s);color:var(--muted)"><span style="font-family:var(--mono)">{{ h.when }}</span> · {{ h.text }}</div></sc-for><sc-if value="{{ sg.noHistory }}" hint-placeholder-val="{{ false }}"><div style="font-size:var(--fs-s);color:var(--muted)">No earlier strategy yet.</div></sc-if></div></sc-if>'
  '</div></sc-if>')

# the editor: one place, used by "Edit in my words", "Edit" and "Tell me what you want it to do"
editor = ('<sc-if value="{{ sg.editing }}" hint-placeholder-val="{{ false }}"><div data-p18="edit" style="' + BOX + '">'
  '<span style="' + LAB + '">{{ sg.editLabel }}</span>'
  '<sc-if value="{{ sg.editTitleOn }}" hint-placeholder-val="{{ true }}"><input type="text" value="{{ sg.editTitle }}" onChange="{{ sg.setTitle }}" placeholder="What it is, in a line" style="' + TA + '"></sc-if>'
  '<textarea rows="4" value="{{ sg.editText }}" onChange="{{ sg.setText }}" placeholder="{{ sg.editPh }}" style="' + TA + '"></textarea>'
  '<div style="display:flex;gap:10px;flex-wrap:wrap;align-items:center"><a href="#" onClick="{{ sg.editSave }}" style="' + BTN + '">{{ sg.editSaveLabel }}</a><a href="#" onClick="{{ sg.editCancel }}" style="' + GHOST + '">Cancel</a><span style="font-size:var(--fs-s);color:{{ sg.errCol }}">{{ sg.err }}</span></div>'
  '</div></sc-if>')

a = '<div data-screen-label="Deck" class="fs-in" style="display:flex;flex-direction:column;gap:36px">'
assert s.count(a) == 1
s = s.replace(a, a + read + saved + editor)

# the values
anchor = "    v.mainRows = grouped([...cmd, ...curve(main)].map(rowOf)); v.sideRows = grouped(curve(side).map(rowOf));"
assert s.count(anchor) == 1
s = s.replace(anchor, '''    // patch_p2_strategy.py: the list by role once the read is in (not while editing: edits move cards between roles)
    const RD = !ED && ver.read && ver.read.roles ? ver.read : null, ROLE_HEAD = { engine: 'Engine', enablers: 'Enablers', threats: 'Threats', answers: 'Answers', protection: 'Protection', 'card flow': 'Card flow', mana: 'Mana' };
    const roleOf = (() => { const m = new Map(); if (RD) for (const r of RD.roles) for (const c of r.cards) m.set(c.name, r.role); return (c) => m.get(c.name) || (c.land ? 'mana' : 'other'); })();
    const byRole = (xs) => { const order = [...RD.roles.map(r => r.role), 'other'], ys = xs.slice().sort((a, b) => (order.indexOf(roleOf(a)) - order.indexOf(roleOf(b))) || ((a.cmc || 0) - (b.cmc || 0)) || (b.qty - a.qty) || a.name.localeCompare(b.name));
      return ys.map((c, i) => { const r = roleOf(c), first = i === 0 || roleOf(ys[i - 1]) !== r, n = ys.filter(x => roleOf(x) === r).reduce((a, x) => a + x.qty, 0);
        return { ...c, cmcS: c.land ? '' : c.cmc == null ? '' : String(c.cmc), head: first ? (ROLE_HEAD[r] || 'Other') + ' · ' + n : '', hasHead: first, divider: first ? 'transparent' : 'var(--line)' }; }); };
    v.mainRows = (RD && !cmd.length ? byRole : grouped)([...cmd, ...curve(main)].map(rowOf)); v.sideRows = grouped(curve(side).map(rowOf));''')

anchor2 = "    // patch_p2_strategy.py: the list by role"
s = s.replace(anchor2, '''    // patch_p2_strategy.py: the strategy, saved or first read
    { const SG = d.strategy || null, DR = d.draft && d.draft.v === cur30.v ? d.draft : null, X = DR && DR.draft ? DR.draft : null, R = cur30.read || null, E = S.sgEdit && S.sgEdit.brew === d.id ? S.sgEdit : null;
      const ans = (S.sgAns && S.sgAns.brew === d.id && S.sgAns.v === cur30.v) ? S.sgAns.a : {};
      const ruleText = (r) => typeof r === 'string' ? r : r.text;
      const when = (t) => new Date(t).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      const draftBody = (x) => ({ title: x.title, summary: x.summary, engine: x.engine, winCondition: x.winCondition, piloting: x.piloting, obstacles: x.obstacles, weakTo: x.weakTo });
      const qs = X && X.questions ? X.questions.slice(0, 2) : [];
      v.sg = { v: cur30.v, readOn: !SG && d.seats === 2 && !!(DR || R), savedOn: !!SG,
        drafting: !!DR && DR.status === 'drafting', ready: !!X && DR.status !== 'drafting', noplan: !!DR && DR.status === 'noplan', failed: !!DR && DR.status === 'failed', error: DR && DR.error ? DR.error : '',
        waiting: !DR && !!R && !SG,
        title: SG ? SG.title || '' : X ? X.title : '', hasTitle: !!(SG && SG.title), summary: SG ? SG.summary : X ? X.summary : '', wins: SG ? SG.winCondition || '' : X ? X.winCondition : '', hasWins: !!(SG && SG.winCondition),
        conf: X ? X.confidence : '', rules: X ? (X.piloting || []).map(r => ({ text: ruleText(r) })) : [],
        engine: X ? (X.engine || []).map(e => ({ name: e.name, why: e.why || '' })) : [],
        shape: R && R.shape ? R.shape : '—', cousin: cur30.check && cur30.check.archetype ? ' · closest meta deck: ' + cur30.check.archetype : '',
        roles: R ? R.roles.map(r => r.role + ' ' + r.count).join(' · ') : '',
        hasQs: qs.length > 0, qsLabel: qs.length === 1 ? 'One question' : 'Two questions',
        qs: qs.map(q => ({ q: q.q, opts: (q.options || []).map(o => { const on = ans[q.q] === o; return { o, ring: on ? ACC : 'var(--line-strong)', fill: on ? 'rgba(197,236,122,.14)' : 'transparent', ink: on ? ACC : 'var(--ink)',
          go: pe(() => this.setState({ sgAns: { brew: d.id, v: cur30.v, a: { ...ans, [q.q]: on ? undefined : o } } })) }; }) })),
        answered: Object.values(ans).some(Boolean), redraft: pe(() => this.sgDraft(d, { answers: Object.entries(ans).filter(([, a]) => a).map(([q, a]) => ({ q, a })) })),
        save: pe(() => X && this.sgSave(d, draftBody(X))), again: pe(() => this.sgDraft(d, {})),
        half: R && !R.coherent ? (R.halfPlans || []).map(t => ({ t, go: pe(() => this.sgDraft(d, { steer: 'Build the deck around ' + t.replace(/ \\(\\d+ cards\\)$/, '') + '.' })) })) : [],
        engineLine: SG && SG.engine ? SG.engine.map(e => e.name || e).join(' · ') : '', hasEngine: !!(SG && SG.engine && SG.engine.length),
        rulesLine: SG && SG.piloting ? SG.piloting.map(ruleText).join(' · ') : '', hasRules: !!(SG && SG.piloting && SG.piloting.length),
        hist: pe(() => this.setState({ sgHist: !S.sgHist })), histOpen: !!S.sgHist && !!SG, history: SG ? (SG.history || []).slice().reverse().map(h => ({ when: when(h.at), text: (h.title ? h.title + ': ' : '') + h.summary })) : [], noHistory: !!SG && !(SG.history || []).length,
        notEditing: !E, editing: !!E, editLabel: E ? (E.mode === 'steer' ? 'What should this deck do? In your words' : 'The strategy, in your words') : '',
        editTitleOn: !!E && E.mode !== 'steer', editTitle: E ? E.title : '', editText: E ? E.text : '', editPh: E && E.mode === 'steer' ? 'Win with one big flier, and keep removal for their blockers' : 'What the deck does to win, in a sentence or two',
        setTitle: (e) => this.setState({ sgEdit: { ...E, title: e.target.value } }), setText: (e) => this.setState({ sgEdit: { ...E, text: e.target.value } }),
        editSaveLabel: E && E.mode === 'steer' ? 'Draft it' : 'Save this strategy', err: S.sgErr || '', errCol: LOSS,
        editCancel: pe(() => this.setState({ sgEdit: null, sgErr: '' })),
        editSave: pe(() => !E ? null : E.mode === 'steer' ? (this.setState({ sgEdit: null }), this.sgDraft(d, { steer: E.text })) : this.sgSave(d, { ...(SG ? {} : X ? draftBody(X) : {}), title: E.title, summary: E.text })),
        edit: pe(() => this.setState({ sgEdit: { brew: d.id, mode: 'edit', title: SG ? SG.title || '' : X ? X.title : '', text: SG ? SG.summary : X ? X.summary : '' }, sgErr: '' })),
        steerOpen: pe(() => this.setState({ sgEdit: { brew: d.id, mode: 'steer', title: '', text: '' }, sgErr: '' })) };
    }
''' + anchor2, 1)

# the methods
anchor = "  async dropVersion(d, vn) {"
s = s.replace(anchor, '''  // patch_p2_strategy.py: save the strategy, or ask the coach for another draft
  async sgSave(d, body) {
    if (this.state.busy) return; this.setState({ busy: true, sgErr: '' });
    try { const nb = await this.api('/api/brews/' + d.id + '/strategy', { method: 'PUT', body }); this.setState(s => ({ brews: s.brews.map(x => x.id === nb.id ? nb : x), sgEdit: null, msg: { text: 'Strategy saved.' } })); }
    catch (e) { this.setState({ sgErr: e.message }); }
    this.setState({ busy: false });
  }
  async sgDraft(d, body) {
    if (this.state.busy) return; this.setState({ busy: true, sgErr: '' });
    try { const nb = await this.api('/api/brews/' + d.id + '/strategy/draft', { method: 'POST', body }); this.setState(s => ({ brews: s.brews.map(x => x.id === nb.id ? nb : x), sgAns: null }));
      // the draft takes about half a minute: look again until it lands
      const poll = async (n) => { if (n <= 0) return; await new Promise(r => setTimeout(r, 5000)); try { await this.load(); const b = (this.state.brews || []).find(x => x.id === d.id); if (b && b.draft && b.draft.status === 'drafting') poll(n - 1); } catch (e) {} };
      poll(24); }
    catch (e) { this.setState({ sgErr: e.message, msg: { text: 'No draft: ' + e.message, bad: true } }); }
    this.setState({ busy: false });
  }
''' + anchor, 1)
a = "v.listOrderNote = v.mainRows.some(c => c.hasHead) ? 'by type, then curve' : 'in curve order, lands last';"
assert s.count(a) == 1
s = s.replace(a, "v.listOrderNote = v.mainRows.some(c => c.hasHead) ? (RD && !cmd.length ? 'by role, then curve' : 'by type, then curve') : 'in curve order, lands last';")
open(p, 'w').write(s); print('applied')
