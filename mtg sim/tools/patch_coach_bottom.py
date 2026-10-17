# Patch 14: the coach column opens at its newest message (Justin, 17 Oct: "the chat should default at the
# bottom of the chat not at the top ... so the most recent info is what you see when you open the page or
# navigate back"). Opening the page, another deck or tab, or the phone's coach sheet scrolls to the bottom;
# a new message or the coach's streaming answer follows only when the player was already at the bottom.
import sys
p = sys.argv[1] if len(sys.argv) > 1 else 'public/index.html'
s = open(p).read()
if 'coachStick()' in s: print('already applied'); sys.exit(0)
anchor = '  async componentDidMount() {\n'
assert s.count(anchor) == 1
add = '''  // patch_coach_bottom.py: keep the coach column at its newest message
  coachStick() {
    const el = document.querySelector('[data-v5="coach-col"]'), c = this._cs;
    if (!el || !el.clientHeight) { if (c) c.hidden = true; return; }
    const key = [location.pathname + location.search + location.hash, this.state.tab, this.state.view, el.classList.contains('open')].join('|');   // the tab isn't in the address
    const bottom = () => { el.scrollTop = el.scrollHeight; };
    if (!c || c.el !== el || c.key !== key || c.hidden) {
      if (!c || c.el !== el) el.addEventListener('scroll', () => { if (this._cs && this._cs.el === el) this._cs.at = el.scrollHeight - el.scrollTop - el.clientHeight < 80; }, { passive: true });
      bottom(); this._cs = { el, key, h: el.scrollHeight, at: true, hidden: false };
      // pictures and fonts that land after the first paint push the bottom down; follow them for a moment
      clearTimeout(this._csT); this._csT = setTimeout(() => { if (this._cs && this._cs.el === el && this._cs.at) bottom(); }, 400);
      return;
    }
    if (el.scrollHeight !== c.h) { c.h = el.scrollHeight; if (c.at) bottom(); }
  }
  componentDidUpdate() { this.coachStick(); }
'''
s = s.replace(anchor, add + anchor)
open(p, 'w').write(s); print('applied')
