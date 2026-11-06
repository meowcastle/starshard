// chart.jsx: your chart, the document (SS6, 1 Nov 2026). Archetype B from APP-FRAMEWORK.md:
// a page header, the wheel as the one object, then sections of rows (the bodies, the houses,
// the aspects, the stations) and an empty state (the birth form) for the visitor who has not
// cast one. Every term is a Term: its definition a hover or a tap away, from lexicon.js.
import { useEffect, useRef, useState } from 'react';
import { Link } from './router.jsx';
import STATIONS from './station-index.json';
import * as api from '../../api.js';
import { castChart, BODIES, GLYPH, dm } from './chart-engine.js';
import { useBirth, saveBirth, birthWords } from './birth.js';
import { Term } from './term.jsx';
import { Wheel } from './wheel.jsx';

const stationAt = n => STATIONS[((n - 1) % 28 + 28) % 28];
const low = s => String(s).toLowerCase();
const ORD = ['first', 'second', 'third', 'fourth', 'fifth', 'sixth', 'seventh', 'eighth', 'ninth', 'tenth', 'eleventh', 'twelfth'];
const today = () => new Date().toISOString().slice(0, 10);

function PageHead({ eyebrow, title, lead, children }) {
  return (
    <>
      {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
      <h1>{title}</h1>
      {lead ? <p className="lead">{lead}</p> : null}
      {children}
    </>
  );
}

// ─── the birth form: the empty state ─────────────────────────────────────────────────────
// Date, time (or "not known"), place: the place is looked up as it is typed (api.js's
// geocode, the same lookup the game's own cast uses) and a chosen result carries its
// coordinates and time zone. A place typed and never matched still casts: without houses.
export function BirthForm({ initial, onCast, onCancel, cta = 'cast the chart' }) {
  const [date, setDate] = useState(initial?.birthDate || '');
  const [time, setTime] = useState(initial?.birthTime || '');
  const [timeUnknown, setTimeUnknown] = useState(initial ? initial.birthTimeKnown === false : false);
  const [place, setPlace] = useState(initial?.placeName || '');
  const [picked, setPicked] = useState(initial && Number.isFinite(initial.lat) ? { name: initial.placeName, region: '', lat: initial.lat, lon: initial.lon, tz: initial.tz } : null);
  const [results, setResults] = useState([]);
  const [looking, setLooking] = useState(false);
  const [err, setErr] = useState('');
  const timer = useRef(null);
  const seq = useRef(0);

  // the lookup, debounced; typing again unpicks the place
  const onPlace = v => {
    setPlace(v);
    setPicked(null);
    setErr('');
    clearTimeout(timer.current);
    const q = v.trim();
    if (q.length < 2) { setResults([]); setLooking(false); return; }
    setLooking(true);
    timer.current = setTimeout(async () => {
      const n = ++seq.current;
      try {
        const r = await api.geocode(q);
        if (n === seq.current) { setResults(r.slice(0, 6)); setLooking(false); }
      } catch (e) {
        if (n === seq.current) { setResults([]); setLooking(false); }
      }
    }, 280);
  };
  useEffect(() => () => clearTimeout(timer.current), []);

  const pick = r => {
    setPicked(r);
    setPlace([r.name, r.region].filter(Boolean).join(', '));
    setResults([]);
  };

  const submit = e => {
    e.preventDefault();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || date > today() || date < '1900-01-01') { setErr("the sky can't read that date"); return; }
    if (!timeUnknown && !/^\d{2}:\d{2}$/.test(time)) { setErr('give the time, or say it is not known'); return; }
    if (!place.trim()) { setErr('the place is what sets the houses: a city is enough'); return; }
    onCast({
      birthDate: date,
      birthTime: timeUnknown ? null : time,
      birthTimeKnown: !timeUnknown,
      placeName: place.trim(),
      lat: picked ? picked.lat : null,
      lon: picked ? picked.lon : null,
      tz: picked ? picked.tz : null,
    });
  };

  return (
    <form className="birth-form" onSubmit={submit} noValidate aria-describedby="birth-why">
      <p id="birth-why" className="prose">the minute and the place set the houses and the rising sign; the date alone sets the rest.</p>
      <div className="field">
        <label htmlFor="b-date">the date</label>
        <input id="b-date" type="date" value={date} min="1900-01-01" max={today()} required onChange={e => { setDate(e.target.value); setErr(''); }} />
      </div>
      <div className="field">
        <label htmlFor="b-time">the time, as the clock read where you were born</label>
        <input id="b-time" type="time" value={time} disabled={timeUnknown} onChange={e => { setTime(e.target.value); setErr(''); }} />
        <label className="check">
          <input type="checkbox" checked={timeUnknown} onChange={e => setTimeUnknown(e.target.checked)} />
          <span>the time is not known (a noon chart, without houses)</span>
        </label>
      </div>
      <div className="field place">
        <label htmlFor="b-place">the place</label>
        <input id="b-place" type="search" value={place} autoComplete="off" spellCheck={false} placeholder="a city" aria-autocomplete="list" aria-controls="b-place-list" aria-expanded={results.length > 0} onChange={e => onPlace(e.target.value)} />
        {results.length ? (
          <ul id="b-place-list" className="place-list" role="listbox" aria-label="places found">
            {results.map((r, i) => (
              <li key={`${r.lat},${r.lon},${i}`} role="option" aria-selected={false}>
                <button type="button" className="place-opt" onClick={() => pick(r)}>
                  <span className="t">{r.name}</span>
                  <span className="k">{r.region}{r.tz ? ` · ${r.tz.replace(/_/g, ' ').toLowerCase()}` : ''}</span>
                </button>
              </li>
            ))}
          </ul>
        ) : null}
        <p className="field-note" aria-live="polite">
          {picked ? `${picked.lat.toFixed(2)}°, ${picked.lon.toFixed(2)}°${picked.tz ? `, ${picked.tz.replace(/_/g, ' ').toLowerCase()}` : ''}` : looking ? 'looking' : place.trim() ? 'pick the place from the list for the houses; typed alone, the chart has none' : ''}
        </p>
      </div>
      {err ? <p className="form-err" role="alert">{err}</p> : null}
      <div className="doors">
        <button type="submit" className="button">{cta}</button>
        {onCancel ? <button type="button" className="button ghost" onClick={onCancel}>keep the old one</button> : null}
      </div>
    </form>
  );
}

// ─── the document ────────────────────────────────────────────────────────────────────────
export function Chart({ me }) {
  const [birth, setBirth] = useBirth(me);
  const [chart, setChart] = useState(null);
  const [editing, setEditing] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let live = true;
    setChart(null);
    setFailed(false);
    if (!birth) return undefined;
    castChart(birth).then(c => { if (!live) return; if (c) setChart(c); else setFailed(true); }).catch(() => { if (live) setFailed(true); });
    return () => { live = false; };
  }, [birth]);

  if (!birth || editing || failed) {
    return (
      <>
        <PageHead eyebrow="the document" title="your chart" lead={birth && !failed ? 'change the birth data; the chart is cast again.' : 'the wheel of your birth minute: houses, aspects, the planets, and the 28 stations drawn around them.'} />
        {failed ? <p className="form-err" role="alert">the sky can't read that birth record. give it again.</p> : null}
        <BirthForm initial={birth} onCast={b => { saveBirth(b, me); setBirth(b); setEditing(false); }} onCancel={birth && !failed ? () => setEditing(false) : null} />
      </>
    );
  }

  if (!chart) {
    return <PageHead eyebrow={`the document · ${birthWords(birth)}`} title="your chart" lead="casting." />;
  }

  const b = chart.bodies;
  const moonSt = stationAt(chart.moonStation);
  const lead = chart.housed
    ? <>sun in <Term t={b.sun.signName} />, moon in <Term t={b.moon.signName} />, <Term t={chart.angles.ascendant.signName} /> <Term t="ascendant">rising</Term>; the moon in <Link href={`/station/${moonSt.slug}`}>{low(moonSt.epithet)}</Link>, <Term t="station" /> {moonSt.n} of 28.</>
    : <>sun in <Term t={b.sun.signName} />, moon in <Term t={b.moon.signName} />, a <Term t="noon chart" /> without houses; the moon in <Link href={`/station/${moonSt.slug}`}>{low(moonSt.epithet)}</Link>, <Term t="station" /> {moonSt.n} of 28.</>;

  const wheelLabel = `your chart: ${BODIES.map(n => `${n} at ${dm(b[n].degInSign)} ${b[n].signName}${b[n].retrograde ? ' retrograde' : ''}`).join(', ')}${chart.housed ? `, ascendant ${dm(chart.angles.ascendant.degInSign)} ${chart.angles.ascendant.signName}, midheaven ${dm(chart.angles.midheaven.degInSign)} ${chart.angles.midheaven.signName}` : ''}, ${chart.aspects.length} aspects, the moon in station ${moonSt.n}`;

  return (
    <>
      <PageHead eyebrow={`the document · ${birthWords(birth)}`} title="your chart">
        <p className="lead chart-lead">{lead}</p>
      </PageHead>

      <div className="chart-top">
        <div className="wheel-box"><Wheel chart={chart} label={wheelLabel} /></div>

        <section className="chart-bodies" aria-labelledby="bodies-h">
          <h2 id="bodies-h" className="section-h">the planets</h2>
          <ol className="rows table" aria-label="the ten bodies">
            {BODIES.map(name => {
              const p = b[name];
              const st = stationAt(p.station);
              return (
                <li key={name} className="row">
                  <span className="n planet-glyph" aria-hidden="true">{GLYPH[name]}</span>
                  <span className="t"><Term t={name} />{p.retrograde ? <> <Term t="retrograde" className="rx">℞</Term></> : null}</span>
                  <span className="k">
                    <span className="deg">{dm(p.degInSign)}</span> <Term t={p.signName} />
                    {chart.housed ? <> · <Term t={`house ${p.house}`}>house {p.house}</Term></> : null}
                    {' · '}<Link href={`/station/${st.slug}`}>{low(st.epithet)}</Link>
                  </span>
                </li>
              );
            })}
            {chart.housed ? ['ascendant', 'midheaven'].map(k => {
              const p = chart.angles[k];
              return (
                <li key={k} className="row">
                  <span className="n planet-glyph" aria-hidden="true">{GLYPH[k]}</span>
                  <span className="t"><Term t={k} /></span>
                  <span className="k"><span className="deg">{dm(p.degInSign)}</span> <Term t={p.signName} /></span>
                </li>
              );
            }) : null}
          </ol>
          <p className="note">
            {chart.housed
              ? <>houses by <Term t={chart.houseSystem} />{chart.polar ? '. your birthplace is far enough north or south that the usual house math breaks down; these are calculated a different way' : ''}. <Term t="tropical" /> zodiac.</>
              : <>a <Term t="noon chart" />: without a birth time the houses and the <Term t="ascendant" /> are left out, and the moon may stand up to {Math.round(chart.moonUncertainty)}° either side of where it is drawn. <Term t="tropical" /> zodiac.</>}
            {!chart.hasPlace && chart.timeKnown ? ' the place was not matched to a point on the map, so there are no houses; cast again and pick it from the list.' : ''}
          </p>
        </section>
      </div>

      {chart.housed ? (
        <section aria-labelledby="houses-h">
          <h2 id="houses-h" className="section-h">the houses</h2>
          <ol className="rows table" aria-label="the twelve houses">
            {chart.houses.map(h => (
              <li key={h.n} className="row">
                <span className="n">{h.n}</span>
                <span className="t"><Term t={`house ${h.n}`}>{ORD[h.n - 1]} house</Term></span>
                <span className="k">
                  <Term t="cusp" /> <span className="deg">{dm(h.degInSign)}</span> <Term t={h.signName} />
                  {h.bodies.length ? <> · {h.bodies.map((bn, i) => <span key={bn}>{i ? ', ' : ''}<Term t={bn} /></span>)}</> : ''}
                </span>
              </li>
            ))}
          </ol>
        </section>
      ) : null}

      <section aria-labelledby="aspects-h">
        <h2 id="aspects-h" className="section-h">the aspects</h2>
        {chart.aspects.length ? (
          <ol className="rows table" aria-label="the aspects">
            {chart.aspects.map((a, i) => (
              <li key={i} className={`row aspect ${a.aspect}`}>
                <span className="n" aria-hidden="true">{ASPECT_GLYPH[a.aspect]}</span>
                <span className="t"><Term t={a.a} /> <Term t={a.aspect} /> <Term t={a.b} /></span>
                <span className="k"><span className="deg">{a.orb.toFixed(1)}°</span> from exact · {a.plain}</span>
              </li>
            ))}
          </ol>
        ) : <p className="prose">no two points of this chart stand within <Term t="orb" /> of each other: a rare chart.</p>}
        <p className="note">the five classical aspects, within the orbs the old books allow: 8° for a <Term t="conjunction" /> or an <Term t="opposition" />, 6° for a <Term t="trine" /> or a <Term t="square" />, 4° for a <Term t="sextile" />. tightest first.</p>
      </section>

      <section aria-labelledby="stations-h">
        <h2 id="stations-h" className="section-h">the stations</h2>
        <p className="prose">
          the outer ring is the moon's road: 28 <Term t="station">stations</Term> of 12°51′, the thing no other chart draws. your moon stands in <Link href={`/station/${moonSt.slug}`}>{low(moonSt.epithet)}</Link>, station {moonSt.n}, lit; the sun in <Link href={`/station/${stationAt(b.sun.station).slug}`}>{low(stationAt(b.sun.station).epithet)}</Link>. each segment opens its page in the codex.
        </p>
      </section>

      <div className="doors">
        <button type="button" className="button ghost" onClick={() => setEditing(true)}>change the birth data</button>
        {me ? null : <Link className="button" href="/signup">keep this chart</Link>}
        <Link className="button ghost" href="/shard">your shard</Link>
      </div>
    </>
  );
}

const ASPECT_GLYPH = { conjunction: '☌', opposition: '☍', trine: '△', square: '□', sextile: '⚹' };
