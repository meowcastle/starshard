// term.jsx: a term with its definition a hover or a tap away (SS6, 1 Nov 2026).
//
// The term is a real button set inline in its sentence (WCAG's inline exception: it is text,
// not a control block), described by a tooltip that CSS shows on hover and on focus and that
// a tap toggles. The tooltip is laid out centred over the term and shifted back inside the
// viewport when it would spill. A term the lexicon does not define renders as plain text
// marked data-term-missing, so the smoke can refuse the page (the gate: no term without a
// definition).
import { useId, useRef, useState } from 'react';
import { define } from './lexicon.js';

export function Term({ t, children, className = '' }) {
  const def = define(t);
  const id = useId();
  const tip = useRef(null);
  const [open, setOpen] = useState(false);

  if (!def) return <span data-term-missing={t} className={className}>{children ?? t}</span>;

  // keep the tooltip on screen: measure where a centred box lands, then shift it
  const place = () => {
    const el = tip.current;
    if (!el) return;
    el.style.transform = '';
    el.classList.remove('below');
    const r = el.getBoundingClientRect();
    const pad = 8;
    let dx = 0;
    if (r.left < pad) dx = pad - r.left;
    else if (r.right > window.innerWidth - pad) dx = window.innerWidth - pad - r.right;
    if (dx) el.style.transform = `translateX(calc(-50% + ${Math.round(dx)}px))`;
    if (r.top < pad) el.classList.add('below');
  };

  return (
    <span className={`term${open ? ' open' : ''} ${className}`.trim()}>
      <button
        type="button"
        className="term-b"
        data-term={t}
        aria-describedby={id}
        aria-expanded={open}
        onClick={() => { place(); setOpen(o => !o); }}
        onPointerEnter={place}
        onFocus={place}
        onBlur={() => setOpen(false)}
        onKeyDown={e => { if (e.key === 'Escape') setOpen(false); }}
      >
        {children ?? t}
      </button>
      <span role="tooltip" id={id} className="term-tip" ref={tip}>{def}</span>
    </span>
  );
}
