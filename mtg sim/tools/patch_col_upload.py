#!/usr/bin/env python3
"""Upload the ManaBox export as a file, or paste it (Justin, 16 Oct). The paste box gets "Upload a file" (.csv or .txt);
the file's text fills the box with a line saying what was read, and Save works as it does for a paste. Idempotent
(marker data-upload); needs patch_highlights.py. Usage: patch_col_upload.py public/index.html [out]"""
import sys
src = sys.argv[1]; out = sys.argv[2] if len(sys.argv) > 2 else src
s = open(src, encoding='utf-8').read()
if 'data-upload' in s: print('already applied'); sys.exit(0)
assert 'data-hl' in s, 'apply patch_highlights.py first'
def sub1(a, b, what):
    global s
    assert s.count(a) == 1, f'anchor for {what} found {s.count(a)} times'
    s = s.replace(a, b)
sub1('Paste a ManaBox or Moxfield collection export, or any list of "4 Card Name (SET) 123" lines. ManaBox: Collection → ⋯ → Export.</div>',
     'Upload or paste a ManaBox or Moxfield collection export, or any list of "4 Card Name (SET) 123" lines. ManaBox: Collection → ⋯ → Export.</div>'
     '<label data-upload="1" style="display:inline-flex;align-items:center;gap:10px;align-self:flex-start;border:1px solid var(--line-strong);border-radius:6px;padding:8px 14px;font-weight:600;font-size:var(--fs-s);color:var(--ink);cursor:pointer">Upload a file<input type="file" accept=".csv,.txt,text/csv,text/plain" onChange="{{ acColFile }}" style="display:none"></label>'
     '<sc-if value="{{ acColFileOn }}" hint-placeholder-val="{{ false }}"><div style="font-size:var(--fs-s);color:var(--ink-2)">{{ acColFileLine }}</div></sc-if>', 'upload control')
sub1("v.acColSave = pe(async () => {",
     "v.acColFileOn = !!S.acColFile; v.acColFileLine = S.acColFile || '';\n"
     "          v.acColFile = (e) => { const f = e.target.files && e.target.files[0]; if (!f) return; if (f.size > 9e6) { this.setState({ acColNote: f.name + ' is over 9 MB; export only the cards you play, or paste a list.' }); return; }\n"
     "            f.text().then(t => { const n = t.split(/\\r?\\n/).filter(x => x.trim()).length; this.setState({ acColText: t, acColNote: '', acColFile: 'Read ' + f.name + ': ' + n.toLocaleString() + ' lines. Press Save to use it.' }); }).catch(err => this.setState({ acColNote: 'Couldn\\'t read ' + f.name + ': ' + err.message })); e.target.value = ''; };\n"
     "          v.acColSave = pe(async () => {", 'file reader')
sub1("acColSave: pe(() => {}),", "acColSave: pe(() => {}), acColFileOn: false, acColFileLine: '', acColFile: () => {},", 'defaults')
sub1("v.acColStart = pe(() => this.setState({ acColStep: 'paste', acColText: '', acColNote: '' }));", "v.acColStart = pe(() => this.setState({ acColStep: 'paste', acColText: '', acColNote: '', acColFile: '' }));", 'reset on open')
open(out, 'w', encoding='utf-8').write(s); print('patched', out)
