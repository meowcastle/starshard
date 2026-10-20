# Patch 15: a run in progress can be cancelled from the deck's header line (Justin, 20 Oct: "i started running an
# update but realized i needed to switch out more cards so i updated the deck but the old one is still running can we
# setup a cancel the run option?"). Saving v7 put the header on v7 ("not run yet") with no sign that v6 was still
# running; the only cancel was a small link inside the Sim tab's run details. Now every run that is preparing, queued
# or running shows on the header line, "v6 running · 140 of 1600 · Cancel run" (the viewed version's own run shows
# just the Cancel, beside its pill), and a click asks once more before it stops the run.
import sys
p = sys.argv[1] if len(sys.argv) > 1 else 'public/index.html'
s = open(p).read()
if 'data-p15="cancel"' in s: print('already applied'); sys.exit(0)

# the markup: after the header's action link, one entry per run in progress
anchor = '''<sc-if value="{{ hd.actOn }}" hint-placeholder-val="{{ false }}"><span>·</span><a href="#" onClick="{{ hd.act }}" style="color:var(--accent);font-weight:600;white-space:nowrap">{{ hd.actLabel }}</a></sc-if></div>'''
assert s.count(anchor) == 1
s = s.replace(anchor, anchor[:-len('</div>')] + '''<sc-for list="{{ hd.runs }}" as="x" hint-placeholder-count="0"><span data-p15="cancel" style="display:inline-flex;gap:6px 8px;flex-wrap:wrap;align-items:center"><span>·</span><sc-if value="{{ x.labelOn }}" hint-placeholder-val="{{ true }}"><span style="color:var(--ink-2);white-space:nowrap">{{ x.label }}</span><span>·</span></sc-if><a href="#" onClick="{{ x.go }}" style="color:{{ x.col }};font-weight:600;white-space:nowrap">{{ x.cancel }}</a></span></sc-for></div>''')

# the values: built where the header's are, from the runs this page already has
anchor = '''      v.verOpen = !!S.verOpen; v.verToggle ='''
assert s.count(anchor) == 1
s = s.replace(anchor, '''      // patch_run_cancel.py: every run in progress, with a two-click cancel
      v.hd.runs = d.runs.filter(r => this.active(r)).map(r => { const asking = S.cancelAsk === r.id, mine = r.v === ver.v;
        return { labelOn: !mine, label: 'v' + r.v + ' ' + (r.status === 'running' ? 'running · ' + (r.played || 0) + ' of ' + (r.total || 0) : r.status === 'queued' ? 'queued' : 'getting ready'),
          cancel: asking ? 'Cancel v' + r.v + "'s run? Yes" : 'Cancel run', col: asking ? LOSS : MUTED,
          go: pe(() => asking ? (this.setState({ cancelAsk: null }), this.cancelRun(d.id, r.id)) : this.setState({ cancelAsk: r.id })) }; });
''' + anchor)
# a cancel the coach made (its cancel_run tool) can't be undone: a stopped run doesn't resume, so no Undo link on it
anchor = "undoOn: m.kind === 'action' && !!m.action && !m.action.undone,"
assert s.count(anchor) == 1
s = s.replace(anchor, "undoOn: m.kind === 'action' && !!m.action && !m.action.undone && m.action.type !== 'cancel',")
open(p, 'w').write(s); print('applied')
