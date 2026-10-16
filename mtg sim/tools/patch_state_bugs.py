#!/usr/bin/env python3
"""The page half of the state bugs (NOTE-TO-CODE-16OCT-STATE.md "Fix first"), after change 29:
  - "Optimizing…" only while Optimize is actually working; a failed Optimize frees the button and says why.
  - A stopped run gives the player a cause they can act on ("The sim restarted before this run finished"),
    never a stack trace; crash text stays in the admin footer.
  - A run that stopped with 0 games shows its status card and "Run v3 again" (that run's own version), not ten "Not played yet" rows.
  - Wide windows: the coach column grows with the window (360 to 600px) and the main column centres and
    widens to 1320px, instead of a fixed 360px coach with dead space between them.
Idempotent (marker data-state1); needs change 29. Usage: patch_state_bugs.py public/index.html [out]"""
import sys
src = sys.argv[1]; out = sys.argv[2] if len(sys.argv) > 2 else src
s = open(src, encoding='utf-8').read()
if 'data-state1' in s: print('already applied'); sys.exit(0)
assert 'data-change29' in s, 'apply patch_v4_askbar.py (change 29) first'
def sub1(a, b, what):
    global s
    assert s.count(a) == 1, f'anchor for {what} found {s.count(a)} times'
    s = s.replace(a, b)

# Optimize: working only in its working states; failed frees the button and says so
sub1("const optimizing = !!(ver.optimize && ver.optimize.status && ver.optimize.status !== 'done');",
     "const OP = ver.optimize || null, optimizing = !!OP && ['preparing', 'structure', 'running', 'matchups', 'writing'].includes(OP.status);", 'optimizing')
# (ckFoot is set above the optimizing line, so it reads ver.optimize itself: a const declared below would be in its TDZ;
#  that shipped once, 16 Oct, and blanked every deck with a check)
sub1("v.ckFoot = 'Structure first, then games:", "v.ckFoot = (() => { const o = ver.optimize; if (!o || o.status !== 'failed') return ''; const last = o.steps && o.steps.length ? o.steps[o.steps.length - 1].text : ''; return 'Optimize stopped: ' + (last || 'its run was lost') + ' Press Optimize to try again. '; })() + 'Structure first, then games:", 'optimize failed line')

# a stopped run says why
sub1("v.brief = { status: 'Stopped', statusNote: 'Stopped at game ' + (run.played || 0) + ' of ' + (run.total || 0) + '.', weakness: '', weaknessNote: '' };",
     "const atGame = 'at game ' + (run.played || 0) + ' of ' + (run.total || 0);\n"
     "      v.brief = { status: 'Stopped', statusNote: run.status === 'lost' ? 'The sim restarted before this run finished. Run it again.' : run.status === 'cancelled' ? 'Cancelled ' + atGame + '.' : !run.played && run.error ? 'It couldn\\'t start: ' + String(run.error).replace(/\\s+at .*/s, '').slice(0, 140) : 'The engine stopped ' + atGame + '. Run it again.', weakness: '', weaknessNote: '' };", 'stopped cause')

# a run with no games: the status card and Run again, nothing else
sub1("    v.simEmpty = v.isSim && !run; v.isSim = v.isSim && !!run;",
     "    v.simEmpty = v.isSim && !run; v.simStopped = v.isSim && !!run && !this.active(run) && !run.played; v.stopLabel = run ? 'v' + run.v : ''; v.stopRerunLabel = run ? 'Run v' + run.v + ' again' : ''; v.stopRerun = pe(() => run && this.queue(d.id, run.oppSet || 'meta10', run.v)); v.isSim = v.isSim && !!run && !v.simStopped;", 'sim stopped gate')
sub1("isCollection: false, isSim: false, simEmpty: false,", "isCollection: false, isSim: false, simEmpty: false, simStopped: false, stopLabel: '', stopRerunLabel: '', stopRerun: pe(() => {}),", 'default')
i = s.index('    <sc-if value="{{ simEmpty }}"')
s = s[:i] + ('    <sc-if value="{{ simStopped }}" hint-placeholder-val="{{ false }}"><div data-state1="sim-stopped" style="display:flex;justify-content:space-between;align-items:center;gap:16px;flex-wrap:wrap;padding:24px 0">'
             '<div style="display:flex;flex-direction:column;gap:6px"><div style="font-size:var(--fs-l);font-weight:600">{{ stopLabel }} · {{ brief.status }}</div><div style="font-size:var(--fs-m);color:var(--muted)">{{ brief.statusNote }}</div></div>'
             '<a href="#" onClick="{{ stopRerun }}" style="background:var(--accent);color:var(--bg);border-radius:6px;padding:10px 16px;font-weight:600;font-size:var(--fs-m)">{{ stopRerunLabel }}</a></div></sc-if>\n') + s[i:]

# wide windows: the coach grows, the main column centres
sub1(".fs-shell{grid-template-columns:minmax(0,1fr) 360px!important;min-width:0!important}",
     ".fs-shell{grid-template-columns:minmax(0,1fr) clamp(360px,28vw,600px)!important;min-width:0!important}\n.fs-main{max-width:1320px!important;margin:0 auto;width:100%}", 'widths')

open(out, 'w', encoding='utf-8').write(s); print('patched', out)
