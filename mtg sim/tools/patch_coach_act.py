# The coach acts on the player's say-so (16 Oct 2026): its action lines in the thread carry Undo,
# and a version it saved reads "from the coach". Idempotent: marker data-coachact.
import sys
p = sys.argv[1] if len(sys.argv) > 1 else 'public/index.html'
s = open(p).read()
if 'data-coachact' in s: print('already applied'); sys.exit(0)
def sub(old, new):
    global s
    assert s.count(old) == 1, old[:80]
    s = s.replace(old, new)
# markup: Undo under an action line, and the action line reads as a record (ink, not the prose grey)
sub('''<div class="{{ m.textCls }}" style="font-size:var(--fs-m);line-height:1.6;color:var(--ink-2);text-wrap:pretty;white-space:pre-wrap">{{ m.text }}</div><div style="font-family:var(--mono);font-size:var(--fs-xs);color:var(--muted)">{{ m.at }}</div>''',
    '''<div class="{{ m.textCls }}" style="font-size:var(--fs-m);line-height:1.6;color:{{ m.ink }};text-wrap:pretty;white-space:pre-wrap">{{ m.text }}</div><div data-coachact="1" style="font-family:var(--mono);font-size:var(--fs-xs);color:var(--muted)">{{ m.at }}<sc-if value="{{ m.undoOn }}" hint-placeholder-val="{{ false }}"> · <a href="#" onClick="{{ m.undo }}" style="color:var(--accent);font-weight:600">Undo</a></sc-if></div>''')
# renderVals: the thread rows
sub('''v.thread = (d.thread || []).filter(m => !(m.kind === 'writeup' && run && m.run === run.id)).map(m => ({ isUser: m.role === 'user', isCoach: m.role !== 'user', text: m.text, at: at(m.at) + (m.kind && !['writeup', 'error'].includes(m.kind) ? ' · ' + { sideboard: 'sideboard plan', pilot: 'how to play it', mulligan: 'mulligans', mana: 'mana', review: 'version review' }[m.kind] || m.kind : '') }));''',
    '''v.thread = (d.thread || []).filter(m => !(m.kind === 'writeup' && run && m.run === run.id)).map(m => ({ isUser: m.role === 'user', isCoach: m.role !== 'user', text: m.kind === 'action' ? '✓ ' + m.text : String(m.text || '').replace(/\\*\\*/g, ''),   /* the thread is plain text: markdown bold would print its asterisks */ ink: ['action', 'undo'].includes(m.kind) ? 'var(--ink)' : 'var(--ink-2)',
      at: at(m.at) + (m.kind && !['writeup', 'error', 'undo'].includes(m.kind) ? ' · ' + ({ sideboard: 'sideboard plan', pilot: 'how to play it', mulligan: 'mulligans', mana: 'mana', review: 'version review', action: m.action && m.action.undone ? 'undone' : 'done' }[m.kind] || m.kind) : ''),
      undoOn: m.kind === 'action' && !!m.action && !m.action.undone, undo: pe(() => this.coachUndo(d.id, m.action.at)) }));''')
sub('''if (d.thinking) v.thread.push({ isUser: false, isCoach: true, text: d.draft || 'Thinking…', at: d.draft ? 'writing…' : '', dia: 'fs-breath', textCls: d.draft ? '' : 'fs-sheen', thinking: true });''',
    '''if (d.thinking) v.thread.push({ isUser: false, isCoach: true, text: d.draft || 'Thinking…', at: d.draft ? 'writing…' : '', dia: 'fs-breath', textCls: d.draft ? '' : 'fs-sheen', thinking: true, ink: 'var(--ink-2)', undoOn: false, undo: pe(() => {}) });''')
# the version header says where a coach-made version came from
sub("coach: 'coach swap ', owned: 'owned version ' }", "coach: 'coach swap ', asked: 'from the coach ', owned: 'owned version ' }")
# the handler
sub('''  async test(brewId, runId, i) {''',
    '''  async coachUndo(brewId, at) {
    if (this.state.busy) return; this.setState({ busy: true });
    try { const b = await this.api('/api/brews/' + brewId + '/undo', { method: 'POST', body: { at } }); this.setState(s => ({ brews: s.brews.map(x => x.id === b.id ? b : x), msg: null })); }
    catch (e) { this.setState({ msg: { text: 'Not undone: ' + e.message, bad: true } }); }
    this.setState({ busy: false });
  }
  async test(brewId, runId, i) {''')
open(p, 'w').write(s); print('applied')
