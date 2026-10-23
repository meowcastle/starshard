# Patch 20, P4 of the strategy-first rebuild (HANDOFF 23 Oct §4 P4; E5, E6; DISTILL-3 §5): "What stops it" on the Deck
# tab. One row per obstacle the strategy names (or the usual six): who in this week's field brings it, with their
# share; your cards that answer it; the best answers in Standard (owned first, then fit, then price), each with the
# phrase from its own rules text that makes it an answer and how the deck gets it ("Cloud fetches it"); and Try on
# every one. Try opens the editor with the card in and one card out (the deck's least-linked non-engine card),
# noted "Try +1 X · answers Y"; saving it makes a version to test, never your deck, and offers the test against the
# deck that brings the obstacle. A save of any edit no longer makes it your deck either (P0's rule).
import sys
p = sys.argv[1] if len(sys.argv) > 1 else 'public/index.html'
s = open(p).read()
if 'data-p20="obstacles"' in s: print('already applied'); sys.exit(0)

LAB = 'font-family:var(--mono);font-size:var(--fs-s);color:var(--muted)'
sec = ('<sc-if value="{{ ob.on }}" hint-placeholder-val="{{ false }}"><div data-p20="obstacles" style="display:flex;flex-direction:column;gap:6px;margin-top:8px">'
  '<div style="display:flex;justify-content:space-between;align-items:baseline;gap:12px;flex-wrap:wrap"><span style="font-size:var(--fs-l);font-weight:600">What stops it</span><span style="' + LAB + '">{{ ob.note }}</span></div>'
  '<sc-if value="{{ ob.loading }}" hint-placeholder-val="{{ false }}"><div style="font-size:var(--fs-m);color:var(--muted);padding:10px 0">{{ ob.loadingLine }}</div></sc-if>'
  '<sc-for list="{{ ob.rows }}" as="o" hint-placeholder-count="5"><div style="display:flex;flex-direction:column;gap:6px;padding:12px 0;border-top:1px solid var(--line)">'
    '<div style="display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap;align-items:baseline"><span style="font-weight:600;font-size:var(--fs-m)">{{ o.name }}</span><span style="font-size:var(--fs-s);color:var(--muted)">{{ o.who }}</span></div>'
    '<sc-if value="{{ o.yoursOn }}" hint-placeholder-val="{{ true }}"><div style="font-size:var(--fs-s);color:var(--muted)">Yours: <span style="color:var(--ink)">{{ o.yours }}</span></div></sc-if>'
    '<sc-for list="{{ o.answers }}" as="a" hint-placeholder-count="3"><div style="display:grid;grid-template-columns:minmax(0,1fr) auto;gap:4px 12px;align-items:baseline;font-size:var(--fs-m)"><span><b style="font-weight:600">{{ a.name }}</b> <span style="color:var(--muted);font-size:var(--fs-s)">{{ a.why }}</span> <span style="font-family:var(--mono);font-size:var(--fs-s);color:{{ a.tagCol }}">{{ a.tag }}</span></span><a href="#" onClick="{{ a.go }}" style="color:var(--accent);font-weight:600;white-space:nowrap">Try</a></div></sc-for>'
  '</div></sc-for>'
  '<sc-if value="{{ ob.failedOn }}" hint-placeholder-val="{{ false }}"><div style="font-size:var(--fs-s);color:var(--muted)">{{ ob.failed }}</div></sc-if>'
  '</div></sc-if>')
anchor = '\n        </div>\n      </div>\n    </div>\n    </sc-if>\n    </sc-if>\n    <div data-change18="bar"'
assert s.count(anchor) == 1, s.count(anchor)
s = s.replace(anchor, '\n        </div>\n      </div>\n' + sec + '\n    </div>\n    </sc-if>\n    </sc-if>\n    <div data-change18="bar"')

# the values: next to the strategy block's
anchor = "    // patch_p2_strategy.py: the strategy, saved or first read"
assert s.count(anchor) == 1
s = s.replace(anchor, '''    // patch_p4_obstacles.py: What stops it, for the version on screen (asked for once per version, polled until ready)
    { const OB = S.obs && S.obs.brew === d.id && S.obs.v === ver.v ? S.obs : null;
      if (tab === 'deck' && d.seats === 2 && !OB && !this._obsAsk) { this._obsAsk = true; setTimeout(() => { this._obsAsk = false; this.loadObstacles(d, ver.v); }, 0); }
      const money = (x) => x == null ? '' : '$' + (x >= 10 ? Math.round(x) : x.toFixed(2));
      const R = ver.read, roles = R && R.roles ? R.roles : [];
      // the card a Try takes out: one copy of the deck's last non-engine threat or enabler (least linked), never an answer, land or engine card
      const cutOf = (inName) => { for (const role of ['threats', 'enablers', 'card flow', 'protection']) { const r = roles.find(x => x.role === role); const c = r && r.cards.slice().reverse().find(x => x.name !== inName); if (c) return c.name; } return null; };
      v.ob = { on: tab === 'deck' && d.seats === 2 && !ED && !!OB, loading: !!OB && OB.status !== 'ready' && OB.status !== 'failed', loadingLine: 'Finding what stops it and the best answers in Standard…',
        failedOn: !!OB && OB.status === 'failed', failed: OB && OB.error ? 'Couldn\\'t read the field: ' + OB.error : '',
        note: OB && OB.status === 'ready' ? 'answers from all of Standard, yours first' : '',
        rows: OB && OB.rows ? OB.rows.map(o => ({ name: o.name[0].toUpperCase() + o.name.slice(1),
          who: o.who.length ? 'Brought by ' + o.who.map(w => w.deck + (w.share != null ? ' ' + Math.round(w.share) + '%' : '')).join(', ') : 'Not much in this week\\'s field',
          yoursOn: o.yours.length > 0, yours: o.yours.map(y => y.name.split(',')[0] + ' (' + y.why + ')').join(' · '),
          answers: o.answers.map(a => ({ name: a.name, why: a.why + (a.also && a.also.length ? ', also ' + a.also.join(', ') : '') + (a.delivered ? ' · ' + a.delivered : ''),
            tag: a.owned === 'binder' ? 'in your binder' : a.price != null ? 'need 1 · ' + money(a.price) : '', tagCol: a.owned === 'binder' ? 'var(--muted)' : AMBER,
            go: pe(() => this.tryCard(d, ver, a.name, cutOf(a.name), o.name, (o.who[0] || {}).deck || null)) })) })) : [] };
    }
''' + anchor)

# the methods: load the rows, and Try
anchor = "  async dropVersion(d, vn) {"
s = s.replace(anchor, '''  // patch_p4_obstacles.py
  async loadObstacles(d, vn, tries = 0) {
    try { const r = await this.api('/api/brews/' + d.id + '/obstacles?v=' + vn); this.setState({ obs: { brew: d.id, v: vn, ...r } });
      if (r.status === 'working' && tries < 90) setTimeout(() => this.loadObstacles(d, vn, tries + 1), 4000); }
    catch (e) { this.setState({ obs: { brew: d.id, v: vn, status: 'failed', error: e.message } }); }
  }
  tryCard(d, ver, inName, outName, obstacle, vs) {
    const rows = (ver.rows || ver.list.main.map(c => ({ ...c, section: 'main' }))).map(r => ({ qty: r.qty, name: r.name, section: r.section || 'main' }));
    const o = outName && rows.find(r => r.section === 'main' && r.name === outName); if (o) o.qty--;
    const i = rows.find(r => r.section === 'main' && r.name === inName); if (i) i.qty++; else rows.push({ qty: 1, name: inName, section: 'main' });
    this.setState({ pickV: ver.v === d.current ? null : { brew: d.id, v: ver.v }, tryVs: vs ? { brew: d.id, opp: vs, from: ver.v } : null });
    this.edStart(d, rows.filter(r => r.qty > 0), 'Try +1 ' + inName + (o ? ' −1 ' + outName : '') + ' · answers ' + obstacle);
  }
''' + anchor, 1)

# saves make a version to test; a Try's save offers the test against the deck that brings the obstacle
a = "      this.setState(s => ({ brews: s.brews.map(x => x.id === b.id ? b : x), ed: null, busy: false, cmpA: null, cmpB: null, pickV: null, msg: run ? null : { text: 'Saved as v' + b.current + '. It\\'s your deck now and hasn\\'t run yet.' } }));"
assert s.count(a) == 1
s = s.replace(a, """      const nv = Math.max(...b.versions.map(x => x.v)), TV = this.state.tryVs && this.state.tryVs.brew === d.id ? this.state.tryVs : null;
      this.setState(s => ({ brews: s.brews.map(x => x.id === b.id ? b : x), ed: null, busy: false, cmpA: null, cmpB: null, pickV: nv === b.current ? null : { brew: b.id, v: nv }, tryVs: null,
        msg: run ? null : { text: nv === b.current ? 'Saved as v' + nv + '. It\\'s your deck now and hasn\\'t run yet.' : 'Saved as v' + nv + '. v' + b.current + ' is still your deck.' + (TV ? ' Start its test against ' + TV.opp + ' below.' : '') } }));
      if (TV && run === 'test') { this.setState({ tab: 'sim' }); this.startTest(b, nv, b.current, [TV.opp]); }
      else if (TV && !run && Array.isArray(b.tests)) this.setState({ ptPick: { brew: b.id, a: nv, b: b.current, opps: [TV.opp] }, ptErr: '', tab: 'sim' });""")
a = "v.edRunLabel = S.busy ? 'Saving…' : 'Save and run'; v.edSaveRun = pe(() => saveable && this.edSave(d, words, true));"
assert s.count(a) == 1
s = s.replace(a, "const TRY = S.tryVs && S.tryVs.brew === d.id && Array.isArray(d.tests) ? S.tryVs : null; v.edRunLabel = S.busy ? 'Saving…' : TRY ? 'Save and test vs ' + TRY.opp : 'Save and run'; v.edSaveRun = pe(() => saveable && this.edSave(d, words, TRY ? 'test' : true));")
a = "      if (run) this.setState({ runOpen: true, runErr: '' });"
assert s.count(a) == 1
s = s.replace(a, "      if (run === true) this.setState({ runOpen: true, runErr: '' });")
open(p, 'w').write(s); print('applied')
