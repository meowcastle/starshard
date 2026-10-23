# Patch 17, P1 of the strategy-first rebuild (HANDOFF 23 Oct §4 P1; DISTILL-3 §4 "Test: the latest verdict"): the
# Sim tab leads with the latest paired test (E1, paired.js). "v9 beats v8 against Mono-Green Landfall · +9 per 100
# (±6) · 200 games", with Make v9 your deck and Test v9 on the whole field; while it plays, how far it has got and
# Cancel. A test starts from the versions menu ("Test v8 against v9"): pick up to three opponents from the last field
# run, worst first, and Start. Every number shows only after a test produced it.
import re, sys
p = sys.argv[1] if len(sys.argv) > 1 else 'public/index.html'
s = open(p).read()
if 'data-p17="test"' in s: print('already applied'); sys.exit(0)

BTN = 'background:var(--accent);color:var(--bg);border-radius:6px;padding:9px 16px;font-weight:600;font-size:var(--fs-m);white-space:nowrap'
GHOST = 'border:1px solid var(--line-strong);border-radius:6px;padding:8px 14px;font-weight:600;font-size:var(--fs-m);color:var(--ink);white-space:nowrap'
LAB = 'font-family:var(--mono);font-size:var(--fs-s);color:var(--muted)'
card = ('<sc-if value="{{ pt.on }}" hint-placeholder-val="{{ false }}"><div data-p17="test" style="display:flex;flex-direction:column;gap:14px;margin-top:20px">'
  # the picker
  '<sc-if value="{{ pt.picking }}" hint-placeholder-val="{{ false }}"><div style="display:flex;flex-direction:column;gap:12px;padding:18px 20px;border:1px solid var(--line);border-radius:8px;background:var(--surface)">'
  '<div style="display:flex;justify-content:space-between;align-items:baseline;gap:12px;flex-wrap:wrap"><span style="font-size:var(--fs-l);font-weight:600">Test v{{ pt.pa }} against v{{ pt.pb }}</span><span style="' + LAB + '">same shuffles · game 1 and boarded games · stops when the answer is clear</span></div>'
  '<div style="font-size:var(--fs-m);color:var(--muted)">Pick up to three opponents. Your worst matchups come first.</div>'
  '<div style="display:flex;gap:8px;flex-wrap:wrap"><sc-for list="{{ pt.choices }}" as="o" hint-placeholder-count="5"><a href="#" onClick="{{ o.pick }}" style="border:1px solid {{ o.ring }};background:{{ o.fill }};color:{{ o.ink }};border-radius:999px;padding:7px 14px;font-size:var(--fs-m);font-weight:600">{{ o.name }}</a></sc-for></div>'
  '<sc-if value="{{ pt.noChoices }}" hint-placeholder-val="{{ false }}"><div style="font-size:var(--fs-m);color:var(--muted)">Run a version against the field once first; the test picks its opponents from that run.</div></sc-if>'
  '<div style="display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;border-top:1px solid var(--line);padding-top:12px"><span style="font-size:var(--fs-s);color:{{ pt.noteCol }}">{{ pt.note }}</span><span style="display:flex;gap:10px"><a href="#" onClick="{{ pt.close }}" style="' + GHOST + '">Cancel</a><a href="#" onClick="{{ pt.start }}" style="' + BTN + ';opacity:{{ pt.startOp }}">Start the test</a></span></div>'
  '</div></sc-if>'
  # the latest test
  '<sc-if value="{{ pt.has }}" hint-placeholder-val="{{ false }}"><div style="display:flex;flex-direction:column;gap:10px;padding:18px 20px;border:1px solid {{ pt.ring }};border-radius:8px;background:var(--surface)">'
  '<div style="' + LAB + '">{{ pt.lab }}</div>'
  '<sc-if value="{{ pt.bigOn }}" hint-placeholder-val="{{ false }}"><div style="display:flex;align-items:baseline;gap:14px;flex-wrap:wrap"><span style="font-family:var(--mono);font-size:34px;color:{{ pt.bigCol }}">{{ pt.big }}</span><span style="font-size:var(--fs-m)">per 100 matches <span style="color:var(--muted)">{{ pt.bigNote }}</span></span></div></sc-if>'
  '<sc-if value="{{ pt.headOn }}" hint-placeholder-val="{{ false }}"><div style="font-size:var(--fs-l);font-weight:600">{{ pt.head }}</div></sc-if>'
  '<sc-for list="{{ pt.others }}" as="r" hint-placeholder-count="0"><div style="font-size:var(--fs-m);color:var(--muted)">{{ r.text }}</div></sc-for>'
  '<div style="display:flex;gap:10px;flex-wrap:wrap;align-items:center"><sc-if value="{{ pt.makeOn }}" hint-placeholder-val="{{ false }}"><a href="#" onClick="{{ pt.make }}" style="' + BTN + '">Make v{{ pt.a }} your deck</a></sc-if>'
  '<sc-if value="{{ pt.fieldOn }}" hint-placeholder-val="{{ false }}"><a href="#" onClick="{{ pt.field }}" style="' + GHOST + '">Test v{{ pt.a }} on the whole field</a></sc-if>'
  '<sc-if value="{{ pt.cancelOn }}" hint-placeholder-val="{{ false }}"><a href="#" onClick="{{ pt.cancel }}" style="color:{{ pt.cancelCol }};font-weight:600">{{ pt.cancelLabel }}</a></sc-if></div>'
  '</div></sc-if>'
  '</div></sc-if>')
a = '    </nav>\n\n\n    <sc-if value="{{ simStopped }}"'
assert s.count(a) == 1
s = s.replace(a, '    </nav>\n' + card + '\n\n    <sc-if value="{{ simStopped }}"')

# the values
anchor = "      { const os = (d.oppSets || []).find(o => o.id === S.oppSet && o.available)"
assert s.count(anchor) == 1
s = s.replace(anchor, '''      // patch_p1_test.py: the latest paired test, and the picker that starts one
      { const T = (d.tests || [])[0] || null, onSim = tab === 'sim', PK = S.ptPick && S.ptPick.brew === d.id ? S.ptPick : null;
        const base = d.runs.find(r => r.status === 'done' && r.opponents && r.opponents.length && r.scores) || d.runs.find(r => r.status === 'done' && r.opponents && r.opponents.length) || null;
        const worst = base ? base.opponents.map((o, i) => ({ name: o.name, p: base.scores && base.scores[i] ? base.scores[i].p : null })).sort((x, y) => (x.p == null) - (y.p == null) || (x.p ?? 1) - (y.p ?? 1)).slice(0, 8) : [];
        const chosen = PK ? PK.opps : [];
        const live = T && ['preparing', 'queued', 'running'].includes(T.status), rows = T ? T.rows || [] : [];
        const sign = (x) => (x >= 0 ? '+' : '−') + Math.abs(Math.round(x));
        const pm = (r) => r && r.match ? Math.round((r.match.hi - r.match.lo) / 2) : 0;
        const clear = rows.filter(r => r.match && (r.verdict === 'better' || r.verdict === 'worse')).sort((x, y) => Math.abs(y.match.per100) - Math.abs(x.match.per100));
        const lead = clear[0] || rows.find(r => r.match) || null;
        const vsLine = (r) => r.verdict === 'better' ? 'v' + T.a + ' is better against ' + r.opp : r.verdict === 'worse' ? 'v' + T.a + ' is worse against ' + r.opp : r.verdict === 'mixed' ? 'better in one phase, worse in the other' : 'inside the noise';
        const games = T ? rows.reduce((n, r) => n + (r.match ? r.match.games : 0), 0) : 0;
        v.pt = { on: onSim && (!!T || !!PK), picking: !!PK, pa: PK ? PK.a : '', pb: PK ? PK.b : '',
          choices: worst.map(o => { const on = chosen.includes(o.name); return { name: o.name + (o.p != null ? ' · ' + Math.round(o.p * 100) + '%' : ''), ring: on ? ACC : 'var(--line-strong)', fill: on ? 'rgba(197,236,122,.14)' : 'transparent', ink: on ? ACC : 'var(--ink)',
            pick: pe(() => this.setState({ ptPick: { ...PK, opps: on ? chosen.filter(x => x !== o.name) : chosen.length >= 3 ? chosen : [...chosen, o.name] } })) }; }),
          noChoices: !!PK && !worst.length, note: S.ptErr || (chosen.length ? chosen.length + ' picked · about ' + (chosen.length * 8) + '–' + (chosen.length * 25) + ' min' : 'Nothing picked yet'), noteCol: S.ptErr ? LOSS : MUTED,
          startOp: chosen.length ? 1 : 0.4, start: pe(() => chosen.length && this.startTest(d, PK.a, PK.b, chosen)), close: pe(() => this.setState({ ptPick: null, ptErr: '' })),
          has: !!T && !PK, a: T ? T.a : '', ring: T && T.status === 'done' && lead && lead.verdict === 'better' ? 'rgba(124,196,240,.45)' : 'var(--line)',
          lab: !T ? '' : live ? 'Testing v' + T.a + ' against v' + T.b + ' · ' + (T.opps || []).join(', ') + (T.played != null ? ' · ' + T.played + ' games played' : '') + ' · same shuffles'
            : T.status === 'done' ? 'Latest test · v' + T.a + ' vs v' + T.b + (lead ? ' · against ' + lead.opp + ' · ' + lead.match.games + ' games, same shuffles' : '')
            : 'Latest test · v' + T.a + ' vs v' + T.b + ' · ' + (T.status === 'cancelled' ? 'cancelled' : 'didn\\'t finish' + (T.error ? ': ' + T.error : '')),
          bigOn: !!(T && T.status === 'done' && lead && lead.match), big: lead && lead.match ? sign(lead.match.per100) : '', bigCol: lead && lead.verdict === 'worse' ? LOSS : lead && lead.verdict === 'better' ? '#7CC4F0' : 'var(--ink)',
          bigNote: lead && lead.match ? '(±' + pm(lead) + ') · ' + vsLine(lead) : '',
          headOn: !!(T && live), head: live ? (rows.some(r => r.pre && r.pre.n) ? 'So far: ' + rows.map(r => r.opp + ' ' + (r.pre && r.pre.n ? r.pre.n + ' pairs' : 'starting')).join(' · ') : 'Getting the decks ready') : '',
          others: T && T.status === 'done' ? rows.filter(r => r !== lead).map(r => ({ text: 'Against ' + r.opp + ': ' + (r.match ? sign(r.match.per100) + ' (±' + pm(r) + '), ' + vsLine(r) : 'no games') + '.' })) : [],
          makeOn: !!(T && T.status === 'done' && lead && lead.verdict === 'better' && T.a !== cur30.v && d.versions.some(x => x.v === T.a)), make: pe(() => T && this.makeYours(d, T.a)),
          fieldOn: !!(T && T.status === 'done' && d.versions.some(x => x.v === T.a)), field: pe(() => T && this.queue(d.id, (base && base.oppSet) || S.oppSet || 'meta10', T.a)),
          cancelOn: !!live, cancelLabel: S.ptCancel ? 'Cancel this test? Yes' : 'Cancel test', cancelCol: S.ptCancel ? LOSS : MUTED,
          cancel: pe(() => S.ptCancel ? (this.setState({ ptCancel: false }), this.cancelTest(d, T.id)) : this.setState({ ptCancel: true })) };
        // the versions menu starts one: viewing a version that isn't your deck tests it against your deck
        if (!isCur && d.seats === 2 && Array.isArray(d.tests)) v.verActs.splice(1, 0, { label: 'Test v' + ver.v + ' against v' + cur30.v, color: ACC, go: pe(() => this.setState({ ptPick: { brew: d.id, a: ver.v, b: cur30.v, opps: [] }, ptErr: '', verOpen: false, tab: 'sim' })) });
      }
''' + anchor)

# the methods
anchor = "  async dropVersion(d, vn) {"
s = s.replace(anchor, '''  // patch_p1_test.py: start and cancel a paired test (POST /api/brews/:id/tests)
  async startTest(d, a, b, opps) {
    if (this.state.busy) return; this.setState({ busy: true, ptErr: '' });
    try { const nb = await this.api('/api/brews/' + d.id + '/tests', { method: 'POST', body: { a, b, opps, phases: 'both' } }); this.setState(s => ({ brews: s.brews.map(x => x.id === nb.id ? nb : x), ptPick: null })); }
    catch (e) { this.setState({ ptErr: e.message }); }
    this.setState({ busy: false });
  }
  async cancelTest(d, id) {
    try { const nb = await this.api('/api/brews/' + d.id + '/tests/' + id + '/cancel', { method: 'POST', body: {} }); this.setState(s => ({ brews: s.brews.map(x => x.id === nb.id ? nb : x) })); }
    catch (e) { this.setState({ msg: { text: 'Not cancelled: ' + e.message, bad: true } }); }
  }
''' + anchor, 1)
open(p, 'w').write(s); print('applied')
