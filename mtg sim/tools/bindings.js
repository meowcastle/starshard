// public/bindings.md: every hole and handler the page binds, grouped by screen, with its type
// and the state it reads (WORKORDER-DESIGN-CODE-13OCT.md, item 2). Generated, never edited:
//
//   node tools/bindings.js           write public/bindings.md
//   node tools/bindings.js --check   exit 1 if the markup binds a name renderVals() doesn't define,
//                                    or bindings.md is out of date
//
// Read from the page itself: the markup (everything before the x-dc script) for the holes, the
// Component's renderVals() for where each name is defined and which `S.*` (this.state) fields
// and props it reads.
const fs = require('fs');
const path = require('path');

const PAGE = path.join(__dirname, '..', 'public', 'index.html');
const OUT = path.join(__dirname, '..', 'public', 'bindings.md');
const html = fs.readFileSync(PAGE, 'utf8');
const cut = html.indexOf('<script type="text/x-dc"');
const markup = html.slice(0, cut), script = html.slice(cut);

// Screens: the sc-if flags that switch whole views, innermost wins.
const SCREENS = { isSignin: 'Sign-in', isFirstrun: 'First run (new brew)', hasApp: 'App shell', isCodex: 'Codex', runOpen: 'Run in progress', isCoach: 'Coach', isResults: 'Results', isDeck: 'Deck', hoverOn: 'Card hover' };

// ---- the markup: walk tags and holes in order, tracking sc-for aliases and enclosing screens
const names = new Map(); // top-level name -> { type, fields:Set, screens:Set, uses }
const use = (n, screen) => { let x = names.get(n); if (!x) names.set(n, x = { type: null, fields: new Set(), screens: [], uses: 0 }); if (!x.screens.includes(screen)) x.screens.push(screen); x.uses++; return x; };
const setType = (x, t) => { const rank = ['string', 'url', 'colour', 'flag', 'object', 'list', 'handler']; if (!x.type || rank.indexOf(t) > rank.indexOf(x.type)) x.type = t; };

const stack = []; // { kind: 'if'|'for', name, alias, root }
const screenNow = () => { for (let i = stack.length - 1; i >= 0; i--) if (stack[i].kind === 'if' && SCREENS[stack[i].name]) return SCREENS[stack[i].name]; return 'Page'; };
const aliasOf = a => { for (let i = stack.length - 1; i >= 0; i--) if (stack[i].kind === 'for' && stack[i].alias === a) return stack[i]; return null; };
// a dotted path to the top-level name it belongs to: alias.f.g inside a loop over `list` is a field of `list`
function resolve(p) {
  const [head, ...rest] = p.split('.');
  const f = aliasOf(head);
  if (f) return { root: f.root, field: [...f.path, ...rest].join('.') };
  return { root: head, field: rest.join('.') };
}
const LITERAL = /^(true|false|null|-?\d+(\.\d+)?)$/;

const tagRe = /<(\/?)(sc-if|sc-for)\b([^>]*)>|<\/?[a-zA-Z][^>]*>/g;
const holes = [];
let m;
while ((m = tagRe.exec(markup))) {
  const [whole, close, sc, attrs] = m;
  if (sc && close) { stack.pop(); continue; }
  const body = sc ? attrs : whole;
  // each attribute holding a hole: name="... {{ x }} ..."
  for (const a of body.matchAll(/([a-zA-Z-]+)="([^"]*\{\{[^"]*)"/g)) {
    const [, attr, val] = a;
    for (const h of val.matchAll(/\{\{\s*([^}]*?)\s*\}\}/g)) holes.push({ expr: h[1], attr, val, pos: m.index, tag: sc || 'el' });
  }
  if (sc === 'sc-if') {
    const v = (attrs.match(/value="\{\{\s*([^}]*?)\s*\}\}"/) || [])[1];
    flush(); stack.push({ kind: 'if', name: v });
  } else if (sc === 'sc-for') {
    const list = (attrs.match(/list="\{\{\s*([^}]*?)\s*\}\}"/) || [])[1], alias = (attrs.match(/as="([^"]+)"/) || [])[1];
    flush();
    const r = resolve(list);
    stack.push({ kind: 'for', alias, root: r.root, path: r.field ? r.field.split('.') : [], list });
  } else flush();
  // text holes between this tag and the next
  const next = markup.indexOf('<', tagRe.lastIndex);
  const text = markup.slice(tagRe.lastIndex, next < 0 ? undefined : next);
  for (const h of text.matchAll(/\{\{\s*([^}]*?)\s*\}\}/g)) holes.push({ expr: h[1], attr: null, val: '', pos: tagRe.lastIndex, tag: 'text' });
  flush();
}
function flush() {
  while (holes.length) {
    const h = holes.shift();
    if (LITERAL.test(h.expr) || h.attr === 'hint-placeholder-val' || h.attr === 'hint-placeholder-count') continue;
    if (h.attr === 'list' && h.tag === 'sc-for') { const r = resolve(h.expr); const x = use(r.root, screenNow()); if (r.field) { x.fields.add(r.field + '[]'); setType(x, 'object'); } else setType(x, 'list'); continue; }
    const r = resolve(h.expr), x = use(r.root, screenNow());
    let t = 'string';
    if (/^on[A-Z]/.test(h.attr || '')) t = 'handler';
    else if (h.attr === 'value' && h.tag === 'sc-if') t = 'flag';
    else if (h.attr === 'style' && /(color|background|border)[^;]*\{\{\s*$/.test(h.val.slice(0, h.val.indexOf('{{ ' + h.expr) + 3).replace(/\{\{[^}]*\}\}/g, '').concat('{{ '))) t = 'colour';
    else if (h.attr === 'src' || h.attr === 'href') t = 'url';
    if (r.field) { x.fields.add(r.field + (t === 'string' ? '' : ' (' + t + ')')); if (!aliasOf(h.expr.split('.')[0])) setType(x, 'object'); }
    else setType(x, t);
  }
}

// ---- the script: where each name is defined in renderVals(), and what it reads
const rv = script.slice(script.indexOf('renderVals('));
// skip strings, templates and comments so brackets inside them don't count
function scan(src, from, stopAt) {
  let depth = 0;
  for (let i = from; i < src.length; i++) {
    const c = src[i];
    if (c === '"' || c === "'" || c === '`') { const q = c; i++; while (i < src.length && src[i] !== q) { if (src[i] === '\\') i++; i++; } continue; }
    if (c === '/' && src[i + 1] === '/') { i = src.indexOf('\n', i); if (i < 0) return src.length; continue; }
    if ('([{'.includes(c)) depth++;
    else if (')]}'.includes(c)) { if (depth === 0) return i; depth--; }
    else if (depth === 0 && stopAt.includes(c)) return i;
  }
  return src.length;
}
function definition(n) {
  const esc = n.replace(/[$]/g, '\\$');
  let at = rv.search(new RegExp('\\bv\\.' + esc + '\\s*=(?!=)'));
  if (at >= 0) { const s = rv.indexOf('=', at) + 1; return rv.slice(s, scan(rv, s, ';\n')); }
  const re = new RegExp('(?:[{,]\\s*)' + esc + '\\s*:(?!:)', 'g');
  const k = re.exec(rv);
  if (k) { const s = k.index + k[0].length; return rv.slice(s, scan(rv, s, ',')); }
  // shorthand { name } or { name, ... }
  if (new RegExp('[{,]\\s*' + esc + '\\s*[,}]').test(rv)) return n;
  return null;
}
// a local `const x = ...` in renderVals(), so a name built from locals can be traced to state
function local(n) {
  const k = new RegExp('\\b(?:const|let)\\s+(?:[^=;]*?[,\\s{])?' + n + '\\s*(?:[,}][^=;]*)?=(?!=)').exec(rv);
  if (!k) return '';
  const s = k.index + k[0].length; return rv.slice(s, scan(rv, s, ';\n'));
}
const reads = (src, depth = 0) => { // follows locals one level
  const s = new Set();
  if (depth < 1) for (const m of new Set(src.replace(/'(?:\\.|[^'\\])*'|"(?:\\.|[^"\\])*"/g, "''").match(/\b[a-zA-Z_$][\w$]*\b/g) || [])) { if (/^(S|v|d|run|E|this|e|const|let|return|true|false|null)$/.test(m)) continue; const l = local(m); if (l && l !== src) for (const x of reads(l, depth + 1)) if (!x.startsWith('sets ')) s.add(x); }
  for (const m of src.matchAll(/\bS\.(\w+)/g)) s.add('state.' + m[1]);
  // the server's payload: d is the open brew (GET /api/brews/<id>), run its selected run, E that run's event
  for (const m of src.matchAll(/(?<![\w.])run\.(\w+)/g)) s.add('run.' + m[1]);
  for (const m of src.matchAll(/(?<![\w.])d\.(\w+)/g)) s.add('brew.' + m[1]);
  for (const m of src.matchAll(/(?<![\w.])E\.(\w+)/g)) s.add('run.event.' + m[1]);
  for (const m of src.matchAll(/this\.props\.(\w+)/g)) s.add('props.' + m[1]);
  for (const m of src.matchAll(/this\.(\w+)\(/g)) if (m[1] !== 'setState') s.add('this.' + m[1] + '()');
  for (const m of src.matchAll(/setState\(\{\s*([\w\s:,]*?)[:}]/g)) s.add('sets ' + m[1].trim().split(/[\s:,]/)[0]);
  return [...s];
};

const rows = [...names.entries()].map(([n, x]) => {
  const def = definition(n);
  return { n, ...x, def, reads: def ? reads(def) : [] };
});
const missing = rows.filter(r => r.def == null).map(r => r.n);

// names renderVals() defines on `v` that the markup never binds (an audit, listed separately)
const vStart = rv.indexOf('const v = {');
const defined = new Set();
if (vStart >= 0) {
  const s = vStart + 'const v = {'.length, e = scan(rv, s, '');
  let depth = 0;
  for (let i = s; i < e; i++) {
    const c = rv[i];
    if (c === '"' || c === "'" || c === '`') { const q = c; i++; while (i < e && rv[i] !== q) { if (rv[i] === '\\') i++; i++; } continue; }
    if ('([{'.includes(c)) depth++; else if (')]}'.includes(c)) depth--;
    else if (depth === 0) { const k = rv.slice(i).match(/^[\s,]*([A-Za-z_$][\w$]*)\s*:(?!:)/); if (k && (c === ',' || i === s)) defined.add(k[1]); }
  }
}
for (const m of rv.matchAll(/\bv\.([A-Za-z_$][\w$]*)\s*=(?!=)/g)) defined.add(m[1]);
const unbound = [...defined].filter(n => !names.has(n)).sort();

// ---- write
const order = ['Page', ...Object.values(SCREENS)];
const byScreen = new Map(order.map(s => [s, []]));
for (const r of rows) byScreen.get(r.screens[0]).push(r);
const typeOf = r => r.type === 'list' || (r.type === 'object' && [...r.fields].some(f => f.endsWith('[]')))
  ? `list of {${[...r.fields].join(', ') || '…'}}` : r.type === 'object' ? `object {${[...r.fields].join(', ')}}` : r.type;
let md = `# Bindings: public/index.html

Generated by \`node tools/bindings.js\` from the page itself; do not edit by hand. Every \`{{ name }}\` the markup binds, grouped by the screen it first appears on, with its type and what \`renderVals()\` reads to produce it (\`state.*\` is the Component's state, \`brew.*\` the open brew and \`run.*\` its selected run as the server sends them (GET /api/brews/<id>), \`this.x()\` a method it calls, \`sets x\` a state field a handler writes).

Types: **string** text, **colour** a CSS colour inside a style, **url** an image or link, **flag** an \`<sc-if>\` condition, **handler** an event, **list of {fields}** an \`<sc-for>\` list and the fields each item binds, **object {fields}** a value whose fields are bound.

${rows.length} names bound.${missing.length ? ` **Not defined in renderVals(): ${missing.join(', ')}.**` : ''}
`;
for (const [s, rs] of byScreen) {
  if (!rs.length) continue;
  md += `\n## ${s}\n\n`;
  for (const r of rs.sort((a, b) => a.n.localeCompare(b.n))) {
    const also = r.screens.length > 1 ? ` · also on ${r.screens.slice(1).join(', ')}` : '';
    const rd = r.reads.filter(x => !x.startsWith('sets ')), st = r.reads.filter(x => x.startsWith('sets ')).map(x => x.slice(5));
    md += `- \`${r.n}\` · ${typeOf(r)} · ${r.def == null ? '**not defined**' : [rd.length ? 'reads ' + rd.join(', ') : st.length ? '' : 'constant or derived', st.length ? 'sets ' + st.join(', ') : ''].filter(Boolean).join(' · ')}${also}\n`;
  }
}
if (unbound.length) md += `\n## Computed but not bound\n\nDefined in \`renderVals()\` and bound nowhere in the markup: free for a design to use, or dead.\n\n${unbound.map(n => `\`${n}\``).join(', ')}\n`;

if (process.argv.includes('--check')) {
  const stale = !fs.existsSync(OUT) || fs.readFileSync(OUT, 'utf8') !== md;
  if (missing.length) console.error('bound but not defined in renderVals():', missing.join(', '));
  if (stale) console.error('public/bindings.md is out of date: run node tools/bindings.js');
  process.exit(missing.length || stale ? 1 : 0);
}
fs.writeFileSync(OUT, md);
console.log(`${rows.length} names, ${unbound.length} computed but unbound${missing.length ? ', NOT DEFINED: ' + missing.join(', ') : ''} -> public/bindings.md`);
