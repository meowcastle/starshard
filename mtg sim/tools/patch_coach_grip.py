#!/usr/bin/env python3
"""The coach column resizes: a grip on the line between the main column and the coach. Drag it to trade width
between them (the coach 300px to 900px, the main column never under 560px), double-click to reset; the width is kept
per browser (localStorage). Desktop only: on a phone the coach is a sheet. Idempotent (marker data-grip); needs
patch_state_bugs.py. Usage: patch_coach_grip.py public/index.html [out]"""
import sys
src = sys.argv[1]; out = sys.argv[2] if len(sys.argv) > 2 else src
s = open(src, encoding='utf-8').read()
if 'data-grip' in s: print('already applied'); sys.exit(0)
assert 'data-state1' in s, 'apply patch_state_bugs.py first'
def sub1(a, b, what):
    global s
    assert s.count(a) == 1, f'anchor for {what} found {s.count(a)} times'
    s = s.replace(a, b)
sub1(".fs-shell{grid-template-columns:minmax(0,1fr) clamp(360px,28vw,600px)!important;min-width:0!important}",
     ".fs-shell{grid-template-columns:minmax(0,1fr) var(--coachW,clamp(360px,28vw,600px))!important;min-width:0!important}\n"
     ".fs-grip{position:absolute;left:-5px;top:0;bottom:0;width:10px;cursor:col-resize;z-index:6}\n"
     ".fs-grip::after{content:'';position:absolute;left:4px;top:0;bottom:0;width:2px;background:transparent;transition:background var(--t1,.12s)}\n"
     ".fs-grip:hover::after,.fs-gripping .fs-grip::after{background:var(--accent)}\n"
     ".fs-gripping,.fs-gripping *{user-select:none!important;cursor:col-resize!important}", 'grid')
sub1("@media (max-width:900px){\n", "@media (max-width:900px){\n.fs-grip{display:none}\n", 'phone')
sub1('  <aside class="{{ coachCls }}" data-v5="coach-col">',
     '  <aside class="{{ coachCls }}" data-v5="coach-col"><div class="fs-grip" data-grip="1" title="Drag to resize · double-click to reset" onMouseDown="{{ gripDown }}" onDoubleClick="{{ gripReset }}"></div>', 'grip')
sub1("  async componentDidMount() {\n",
     "  async componentDidMount() {\n"
     "    // the coach column's width, as the player last dragged it (patch_coach_grip.py)\n"
     "    try { const w = +localStorage.getItem('fs-coachW'); if (w >= 300) document.documentElement.style.setProperty('--coachW', w + 'px'); } catch (e) {}\n", 'restore width')
sub1("coachOpen: pe(() => this.setState({ coachOpen: true })),",
     "coachOpen: pe(() => this.setState({ coachOpen: true })), gripDown: (e) => this.grip(e), gripReset: () => { document.documentElement.style.removeProperty('--coachW'); try { localStorage.removeItem('fs-coachW'); } catch (x) {} },", 'handlers')
sub1("  async componentDidMount() {\n",
     "  // drag the coach column's edge: width follows the pointer, clamped so the main column keeps 560px\n"
     "  grip(e) {\n"
     "    e.preventDefault(); const col = e.currentTarget.parentElement, x0 = e.clientX, w0 = col.getBoundingClientRect().width, root = document.documentElement;\n"
     "    const max = () => Math.min(900, window.innerWidth - 560); let w = w0;\n"
     "    const move = (ev) => { w = Math.round(Math.max(300, Math.min(max(), w0 + (x0 - ev.clientX)))); root.style.setProperty('--coachW', w + 'px'); };\n"
     "    const up = () => { document.removeEventListener('mousemove', move); document.removeEventListener('mouseup', up); document.body.classList.remove('fs-gripping'); try { localStorage.setItem('fs-coachW', String(w)); } catch (x) {} };\n"
     "    document.body.classList.add('fs-gripping'); document.addEventListener('mousemove', move); document.addEventListener('mouseup', up);\n"
     "  }\n"
     "  async componentDidMount() {\n", 'grip method')
sub1("coachOpen: pe(() => {}), coachClose: pe(() => {}),", "coachOpen: pe(() => {}), coachClose: pe(() => {}), gripDown: () => {}, gripReset: () => {},", 'defaults')
# Optimize says which step it is on, in the check card, until Design's stepper lands (16 Oct: "I literally have no
# idea what it's doing"). The steps are the server's own optimize.steps.
sub1("v.ckBtnLabel = optimizing ? 'Optimizing…' :",
     "if (optimizing) { const STEP = { preparing: 1, structure: 1, running: 2, matchups: 3, writing: 4 }, last = OP.steps && OP.steps.length ? OP.steps[OP.steps.length - 1].text : ''; v.ckSub = 'Optimize · step ' + (STEP[OP.status] || 1) + ' of 4: ' + last + (OP.status === 'running' ? ' About 30 minutes; you can leave this page.' : ''); }\n        v.ckBtnLabel = optimizing ? 'Optimizing…' :", 'optimize step line')
# Optimize's progress belongs to the deck, whichever version it works on (on v3's card while it runs v4), and the
# deck picker names the current version, not the newest
sub1("const OP = ver.optimize || null, optimizing = !!OP &&", "const OP = d.optimize || ver.optimize || null, optimizing = !!OP &&", 'optimize is the deck\'s')
sub1("if (optimizing) { const STEP = { preparing: 1, structure: 1, running: 2, matchups: 3, writing: 4 }, last = OP.steps && OP.steps.length ? OP.steps[OP.steps.length - 1].text : ''; v.ckSub = 'Optimize · step '",
     "if (optimizing) { const STEP = { preparing: 1, structure: 1, running: 2, matchups: 3, writing: 4 }, last = OP.steps && OP.steps.length ? OP.steps[OP.steps.length - 1].text : ''; v.ckSub = (OP.from !== ver.v ? 'On v' + OP.from + ', not this version · ' : '') + 'Optimize · step '", 'which version')
sub1("v.pickerLabel = (d.name || 'Decks') + ' · v' + ((d.versions || []).slice(-1)[0] || {}).v;", "v.pickerLabel = (d.name || 'Decks') + ' · v' + ver.v;", 'picker label')
open(out, 'w', encoding='utf-8').write(s); print('patched', out)
