// shard.jsx: your shard, the document, and the first run (SS7, 1 Nov 2026).
//
// Two surfaces, one corpus. A visitor with no birth record meets the first run from
// UX-FLOW.md section 2 as one stepped route: the burst, the arrival, how this works, the ask,
// the compute, the shard revealed, then "read your shard". A visitor with a record meets the
// document: the reading set as long-form text at one measure, eight sections under headers
// made only of words the reader arrived knowing (section 3 of the same file), each opening
// with its plain fact, then the corpus, then "where this comes from" folded away. The account
// prompt comes after the reveal, with its reason. The look is the shipped game's shard reveal
// (its eyebrow, the name in Cormorant, the two station cards with the game's own art and
// lines), lifted by app/game-extract.mjs. reading.js, findings.js and format.js are reused
// unchanged through shard-engine.js; the house style pass (house.js) runs on every corpus
// string on its way to the page.
import { useEffect, useRef, useState, useCallback } from 'react';
import { Link, useRouter } from './router.jsx';
import STATIONS from './station-index.json';
import ART from './station-art.json';
import POEMS from './station-poems.json';
import { Ring, quarterOf } from './ring.jsx';
import { BirthForm } from './chart.jsx';
import { useBirth, saveBirth, birthWords } from './birth.js';
import { castShard, firstRunCopy, loadModules } from './shard-engine.js';
import { house, paragraphs } from './house.js';
import { useTonight } from './tonight.js';
import { LeaveEmail } from './leave-email.jsx';

const stationAt = n => STATIONS[((n - 1) % 28 + 28) % 28];
const low = s => String(s).toLowerCase();
const QC = { byakko: '185,198,210', suzaku: '212,90,58', seiryuu: '79,168,154', genbu: '124,138,204' };
const BURST_KEY = 'starshard-burst-seen';
const reducedMotion = () => typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function seenBurst() { try { return localStorage.getItem(BURST_KEY) === '1'; } catch (e) { return false; } }
function markBurst() { try { localStorage.setItem(BURST_KEY, '1'); } catch (e) { /* private mode */ } }

// ─── corpus text on the page ─────────────────────────────────────────────────────────────
function Prose({ text, className = '' }) {
  return paragraphs(text).map((runs, i) => (
    <p key={i} className={className || undefined}>{runs.map((r, j) => (r.em != null ? <em key={j}>{r.em}</em> : <span key={j}>{r.text}</span>))}</p>
  ));
}

// ─── the station card, as the game's shard reveal draws it ───────────────────────────────
// 118 by 160, the quarter's wash over the warm face, the gold border, the art centred on its
// own ink (measured once with getBBox, the game's _measureArt), the name in Cormorant.
function StationCard({ station, role, read, delay = 0 }) {
  const s = stationAt(station);
  const q = quarterOf(station);
  const shapes = ART[String(station)] || [];
  const ref = useRef(null);
  const [box, setBox] = useState('0 0 100 100');
  useEffect(() => {
    const svg = ref.current;
    if (!svg) return;
    try {
      const b = svg.getBBox();
      if (b && b.width > 0 && b.height > 0) {
        const size = Math.max(b.width, b.height) * 1.22;
        setBox(`${(b.x + b.width / 2 - size / 2).toFixed(1)} ${(b.y + b.height / 2 - size / 2).toFixed(1)} ${size.toFixed(1)} ${size.toFixed(1)}`);
      }
    } catch (e) { /* no layout yet: the default box */ }
  }, [station]);
  const wash = `linear-gradient(158deg, rgba(${QC[q]},.45) 0%, rgba(${QC[q]},.27) 46%, rgba(${QC[q]},.13) 100%), linear-gradient(160deg, #2A2009, #0B0703)`;
  return (
    <div className={`shard-card-wrap shard-card-${role}`} style={{ animationDelay: `${delay}s` }}>
      <div className="shard-card-label"><span className="g" aria-hidden="true">{role === 'sun' ? '☉' : '☽'}</span> your {role}</div>
      <Link href={`/station/${s.slug}`} className={`shard-card tilt-${role}`} style={{ background: wash }} aria-label={`your ${role}'s station, ${low(s.epithet)}, station ${s.n} of 28`}>
        <span className="shard-card-inner" aria-hidden="true" />
        <span className="shard-card-halo" aria-hidden="true" />
        <svg ref={ref} viewBox={box} className="shard-card-art" aria-hidden="true" focusable="false">
          {shapes.map((p, i) => <path key={i} d={p.d} fill={p.f} stroke={p.s} strokeWidth={p.w} strokeDasharray={p.da === 'none' ? undefined : p.da} strokeLinecap="round" strokeLinejoin="round" style={p.st ? cssText(p.st) : undefined} />)}
        </svg>
        <span className="shard-card-n" aria-hidden="true">{s.n}</span>
        <span className="shard-card-k" aria-hidden="true">{role === 'sun' ? '☉' : '☽'}</span>
        <span className="shard-card-name">{low(s.epithet)}</span>
      </Link>
      <p className="shard-card-read">{read}</p>
    </div>
  );
}

// "transform-box:fill-box;transform-origin:center;animation:bsBreathe 5s ..." as a style object
function cssText(st) {
  const out = {};
  for (const part of st.split(';')) {
    const i = part.indexOf(':');
    if (i < 0) continue;
    const k = part.slice(0, i).trim().replace(/-([a-z])/g, (m, c) => c.toUpperCase());
    out[k] = part.slice(i + 1).trim();
  }
  return out;
}

// ─── the starfield and the burst ─────────────────────────────────────────────────────────
// One point of light, breathing; then the star breaks into shards that scatter, slow and
// settle into a night sky; the last shard drifts toward the viewer and holds. Deterministic
// positions (a seeded hash, so the sky is the same sky every visit) and CSS motion only, so
// prefers-reduced-motion draws the settled sky at once.
const STAR_COUNT = 140;
function stars() {
  let h = 0x9E3779B9;
  const next = () => { h ^= h << 13; h ^= h >>> 17; h ^= h << 5; return ((h >>> 0) % 10000) / 10000; };
  return Array.from({ length: STAR_COUNT }, (_, i) => {
    const a = next() * Math.PI * 2, r = 40 + next() * 270, size = 0.35 + next() * 0.75;
    return { i, x: 300 + Math.cos(a) * r, y: 300 + Math.sin(a) * r, size, delay: next() * 0.9, dur: 1.4 + next() * 1.2, twinkle: 3 + next() * 4, bright: next() > 0.82 };
  });
}
const STARS = stars();

function Starfield({ burst, settled }) {
  // burst: play the breaking; settled: the sky as it ends, at once
  return (
    <svg className={`shard-sky ${burst ? 'is-burst' : ''} ${settled ? 'is-settled' : ''}`} viewBox="0 0 600 600" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">
      <radialGradient id="shard-sky-glow" cx="50%" cy="50%" r="50%"><stop offset="0" stopColor="rgba(255,176,0,.22)" /><stop offset="1" stopColor="rgba(255,176,0,0)" /></radialGradient>
      <circle className="shard-sky-core" cx="300" cy="300" r="2.6" fill="#FFE9B8" />
      <circle className="shard-sky-halo" cx="300" cy="300" r="60" fill="url(#shard-sky-glow)" />
      {STARS.map(s => (
        <circle key={s.i} className={`shard-star ${s.bright ? 'is-bright' : ''}`} cx="300" cy="300" r={s.size} fill={s.bright ? '#FFE9B8' : '#F0D89A'}
          style={{ '--dx': `${(s.x - 300).toFixed(1)}px`, '--dy': `${(s.y - 300).toFixed(1)}px`, '--delay': `${s.delay.toFixed(2)}s`, '--dur': `${s.dur.toFixed(2)}s`, '--twinkle': `${s.twinkle.toFixed(1)}s` }} />
      ))}
      <path className="shard-sky-last" d="M 300 122 L 304.8 135.2 L 318 140 L 304.8 144.8 L 300 158 L 295.2 144.8 L 282 140 L 295.2 135.2 Z" fill="#FFE9B8" />
    </svg>
  );
}

// ─── the first run ───────────────────────────────────────────────────────────────────────
const STEPS = ['burst', 'arrival', 'how', 'ask', 'compute', 'reveal'];

function useStep(initial) {
  const [step, setStepState] = useState(initial);
  useEffect(() => {
    const onPop = e => { const s = e.state && e.state.shardStep; if (s && STEPS.includes(s)) setStepState(s); };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);
  const setStep = useCallback(s => {
    try { window.history.pushState({ shardStep: s }, '', window.location.pathname); } catch (e) { /* file: urls */ }
    setStepState(s);
    window.scrollTo(0, 0);
  }, []);
  return [step, setStep];
}

export function FirstRun({ me, birth, setBirth, onDone }) {
  const [copy, setCopy] = useState(null);
  const [step, setStep] = useStep('burst');
  const [shard, setShard] = useState(null);
  const [failed, setFailed] = useState(false);
  const { navigate } = useRouter();
  const returning = seenBurst();

  useEffect(() => { loadModules().then(m => setCopy(firstRunCopy(m.copy))); }, []);

  // the shard is cast as soon as there is a record, so the readout and the reveal wait for nothing
  useEffect(() => {
    let live = true;
    setShard(null);
    setFailed(false);
    if (!birth) return undefined;
    castShard(birth, { name: me && me.username }).then(s => { if (!live) return; if (s) setShard(s); else setFailed(true); }).catch(() => { if (live) setFailed(true); });
    return () => { live = false; };
  }, [birth, me]);

  const to = s => () => setStep(s);
  const skipTo = () => { markBurst(); setStep(birth ? 'compute' : 'how'); };

  return (
    <section className={`firstrun step-${step}`} aria-label="the first run">
      {step === 'burst' ? <Burst copy={copy} returning={returning} onSkip={skipTo} onNext={() => { markBurst(); setStep('arrival'); }} /> : null}
      {step === 'arrival' ? <Arrival copy={copy} onSkip={skipTo} onNext={to('how')} /> : null}
      {step === 'how' ? <How copy={copy} onNext={to('ask')} /> : null}
      {step === 'ask' ? (
        <Ask copy={copy} birth={birth} failed={failed} onCast={b => { saveBirth(b, me); setBirth(b); setStep('compute'); }} />
      ) : null}
      {step === 'compute' ? <Compute shard={shard} failed={failed} onBack={to('ask')} onDone={to('reveal')} /> : null}
      {step === 'reveal' ? <Reveal shard={shard} copy={copy} me={me} onRead={() => { onDone(); navigate('/shard'); }} /> : null}
    </section>
  );
}

function Burst({ copy, returning, onSkip, onNext }) {
  const quick = returning || reducedMotion();
  const [ready, setReady] = useState(quick);
  useEffect(() => {
    if (quick) return undefined;
    const t = setTimeout(() => setReady(true), 8000);
    return () => clearTimeout(t);
  }, [quick]);
  const lines = copy ? copy.burst : ['', '', ''];
  return (
    <div className={`fr-stage fr-burst ${quick ? 'is-quick' : ''}`}>
      <Starfield burst={!quick} settled={quick} />
      <div className="fr-lines" aria-live="polite">
        {lines.map((l, i) => (i === 0
          ? <h1 key={i} className="fr-line" style={{ animationDelay: quick ? '0.2s' : '1.2s' }}>{house(l)}</h1>
          : <p key={i} className="fr-line" style={{ animationDelay: quick ? `${0.2 + i * 0.25}s` : `${1.2 + i * 2.4}s` }}>{house(l)}</p>))}
      </div>
      <div className="fr-foot">
        <button type="button" className={`button ${ready ? '' : 'is-waiting'}`} onClick={onNext} aria-hidden={!ready} tabIndex={ready ? 0 : -1}>{returning ? (copy ? house(copy.back) : 'welcome back') : 'continue →'}</button>
        <button type="button" className="fr-skip" onClick={onSkip}>{copy ? house(copy.skip) : 'skip →'}</button>
      </div>
    </div>
  );
}

function Arrival({ copy, onSkip, onNext }) {
  const quick = reducedMotion();
  const lines = copy ? copy.arrival : ['', '', ''];
  return (
    <div className="fr-stage fr-arrival">
      <Starfield settled />
      <div className="fr-story">
        {lines.map((l, i) => <p key={i} className={`fr-beat ${i === 1 ? 'is-strong' : ''}`} style={{ animationDelay: quick ? '0s' : `${0.4 + i * 2.2}s` }}>{house(l)}</p>)}
      </div>
      <div className="fr-foot">
        <button type="button" className="button" onClick={onNext} style={{ animationDelay: quick ? '0s' : '5.4s' }}>continue →</button>
        <button type="button" className="fr-skip" onClick={onSkip}>{copy ? house(copy.skip) : 'skip →'}</button>
      </div>
    </div>
  );
}

// the credibility screen, before anything is asked: four sky-maps with real names
function How({ copy, onNext }) {
  const sky = useTonight();
  const st = sky ? stationAt(sky.moon.station) : null;
  const rows = copy ? copy.how : [];
  return (
    <div className="fr-stage fr-how">
      <p className="eyebrow">how this works</p>
      <h1 className="fr-h">star shard reads four sky-maps at once.</h1>
      <div className="fr-how-body">
        <ol className="fr-maps" aria-label="the four sky-maps">
          {rows.map((r, i) => {
            const m = /^`([^`]+)`\s*(.*)$/.exec(r) || [null, '', r];
            return <li key={i}><code className="fr-k">{low(m[1])}</code><span>{house(m[2].replace(/^[,—–-]\s*/, ''))}</span></li>;
          })}
        </ol>
        <div className="fr-how-ring">
          <Ring size={220} now={st ? st.n : 0} sub={st ? 'the moon tonight' : ''} name={st ? low(st.epithet) : 'the 28'} marks={st ? [{ role: 'moon', station: st.n, glyph: '☽' }] : []} label={st ? `the ring of 28 stations, the moon in ${low(st.epithet)} tonight` : 'the ring of 28 stations'} />
        </div>
      </div>
      <p className="fr-privacy"><code>computed on this device</code></p>
      <div className="fr-foot">
        <button type="button" className="button" onClick={onNext}>{copy ? house(copy.ask.head) : 'where and when did you land?'} →</button>
      </div>
    </div>
  );
}

function Ask({ copy, birth, failed, onCast }) {
  return (
    <div className="fr-stage fr-ask">
      <p className="eyebrow">the sky at your minute</p>
      <h1 className="fr-h">{copy ? house(copy.ask.head) : 'where and when did you land?'}</h1>
      <p className="lead">{copy ? `${house(copy.ask.date)} ${house(copy.ask.time)}` : ''}</p>
      {failed ? <p className="form-err" role="alert">the sky can't read that birth record. give it again.</p> : null}
      <BirthForm initial={birth} onCast={onCast} cta={copy ? house(copy.ask.cta) : 'read the sky →'} />
    </div>
  );
}

// the machine, working: a readout of the real values, typed line by line
function Compute({ shard, failed, onBack, onDone }) {
  const quick = reducedMotion();
  const lines = shard ? shard.readout : null;
  const [shown, setShown] = useState(quick ? 99 : 0);
  useEffect(() => {
    if (!lines) return undefined;
    if (quick) { const t = setTimeout(onDone, 400); return () => clearTimeout(t); }
    let i = shown;
    const tick = () => {
      i += 1;
      setShown(i);
      if (i < lines.length) t = setTimeout(tick, i === 1 ? 520 : 420);
      else t = setTimeout(onDone, 900);
    };
    let t = setTimeout(tick, 300);
    return () => clearTimeout(t);
  }, [lines]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <div className="fr-stage fr-compute">
      <Starfield settled />
      <h1 className="visually-hidden">reading the sky</h1>
      <pre className="fr-readout" aria-live="polite" aria-label="the sky, resolving">
        {lines ? lines.slice(0, shown).map((l, i) => <span key={i} className={`fr-ro ${i === lines.length - 1 ? 'is-found' : ''}`}>{l}{'\n'}</span>) : failed ? '> the sky could not read that record\n' : '> resolving sky ...\n'}
      </pre>
      {failed ? <div className="fr-foot"><button type="button" className="button ghost" onClick={onBack}>give the birth data again</button></div> : null}
    </div>
  );
}

// the reveal, as the game draws it: the eyebrow, the ring with the natal marks lit, the name,
// the two cards, one strange line, one button; then the account prompt with its reason
export function Reveal({ shard, copy, me, onRead }) {
  if (!shard) return <div className="fr-stage fr-reveal"><Starfield settled /><p className="lead">the ring is drawing.</p></div>;
  const sun = stationAt(shard.stations.sun), moon = stationAt(shard.stations.moon);
  const sunRead = `your sun stood in ${low(sun.epithet)}. ${POEMS[sun.n - 1]} the sun is the part of you that moves in daylight: it moves from here.`;
  const moonRead = `your moon rests in ${low(moon.epithet)}. ${POEMS[moon.n - 1]} the moon is the part of you that rests and returns: it returns here.`;
  return (
    <div className="fr-stage fr-reveal">
      <Starfield settled />
      <p className="fr-eyebrow"><span className="rule" aria-hidden="true" />your star shard · one of seven hundred eighty-four<span className="rule" aria-hidden="true" /></p>
      <div className="fr-reveal-ring">
        <Ring size={240} now={shard.stations.moon} name="your sky" marks={shard.marks} label={`your ring: the sun in station ${shard.stations.sun}, the moon in station ${shard.stations.moon}${shard.stations.rising ? `, rising in station ${shard.stations.rising}` : ''}`} />
      </div>
      <h1 className="fr-name">{shard.name}</h1>
      <p className="fr-sub">{shard.sub}</p>
      <div className="shard-cards">
        <StationCard station={sun.n} role="sun" read={sunRead} delay={0.35} />
        <StationCard station={moon.n} role="moon" read={moonRead} delay={0.55} />
      </div>
      <p className="fr-strange">{house(shard.strangeLine)}</p>
      <div className="fr-foot">
        <button type="button" className="button" onClick={onRead}>{copy ? house(copy.cta) : 'read your shard →'}</button>
      </div>
      {!me ? (
        <p className="note fr-keep">an account keeps this shard, and tomorrow's reading with it; without one it lives on this device only. <Link href="/signup">keep this ›</Link></p>
      ) : null}
    </div>
  );
}

// ─── the document ────────────────────────────────────────────────────────────────────────
function Depth({ d }) {
  if (!d) return null;
  return (
    <details className="shard-depth">
      <summary>where this comes from</summary>
      <div className="shard-depth-body">
        <p className="shard-depth-intro">four traditions named this stretch of sky, {house(d.position)}.</p>
        <dl className="shard-skies">
          {d.skies.map(s => (
            <div key={s.sky} className="shard-sky-row">
              <dt><code className="fr-k">{s.sky}</code> {house(s.name)}</dt>
              <dd>{house(s.meaning)}</dd>
            </div>
          ))}
          {d.stars ? <div className="shard-sky-row"><dt><code className="fr-k">the stars</code></dt><dd>{house(d.stars)}</dd></div> : null}
          {d.animal ? <div className="shard-sky-row"><dt><code className="fr-k">the animal</code></dt><dd>{house(d.animal)}{d.guardian ? `, under the ${house(low(d.guardian)).replace(/\s*\(.*\)$/, '')}` : ''}</dd></div> : null}
        </dl>
        {d.disagree ? <p className="shard-depth-note">they disagree here. four cultures, the same stars, different deserts.</p> : null}
        <p className="shard-depth-note"><Link href={`/station/${d.slug}`}>{d.epithet} in the codex</Link></p>
      </div>
    </details>
  );
}

function Document({ shard, birth, me, sky, onRestart }) {
  const tonight = sky ? stationAt(sky.moon.station) : null;
  return (
    <>
      <p className="eyebrow">the document · {birthWords(birth)}</p>
      <h1 className="shard-title">{shard.name}</h1>
      <p className="lead shard-lead">{shard.sub}.</p>

      <div className="shard-top">
        <div className="shard-ring">
          <Ring size={260} now={shard.stations.moon} sub="one of 784" name="your sky" state={`☉ ${low(stationAt(shard.stations.sun).epithet)} · ☽ ${low(stationAt(shard.stations.moon).epithet)}`} marks={shard.marks} label={`your ring: the sun in station ${shard.stations.sun}, the moon in station ${shard.stations.moon}${shard.stations.rising ? `, rising in station ${shard.stations.rising}` : ''}`} />
        </div>
        <div className="prose shard-open">
          <Prose text={shard.opening} />
          {shard.finding ? <p className="shard-rare"><span className="shard-rare-n">{shard.finding.oneIn}</span> {house(shard.finding.line)}</p> : null}
        </div>
      </div>

      <article className="shard-doc">
        {shard.sections.map(sec => (
          <section key={sec.id} className={`shard-sec shard-sec-${sec.id}`} aria-labelledby={`sec-${sec.id}`}>
            <h2 id={`sec-${sec.id}`} className="section-h shard-h">{house(sec.label)}</h2>
            {sec.lead ? <p className="shard-plain">{house(sec.lead)}</p> : null}
            <div className="prose shard-body">
              {sec.blocks.map(b => <Prose key={b.slot} text={b.text} />)}
            </div>
            <Depth d={sec.depth} />
          </section>
        ))}

        <section className="shard-sec shard-close" aria-label="the close">
          <div className="prose"><Prose text={shard.close} /></div>
        </section>

        <section className="shard-recognition" aria-label="the recognition">
          {shard.recognition.map((l, i) => <p key={i}>{house(l)}</p>)}
        </section>

        <section className="shard-invite" aria-label="tonight">
          <p className="prose">{house(shard.invite.ring)} {tonight ? house(shard.invite.road.replace('{tonightEpithet}', low(tonight.epithet))) : 'the moon crosses one station a night, in order, whether anyone watches or not.'}</p>
          <div className="doors">
            <Link className="button" href="/tonight">{house(shard.invite.cta)}</Link>
            <Link className="button ghost" href="/chart">your chart</Link>
            {me ? null : <Link className="button ghost" href="/signup">keep this</Link>}
          </div>
          {me ? null : <p className="note">an account keeps this shard, and tomorrow's reading with it; without one it lives on this device only.</p>}
          <LeaveEmail me={me} birth={birth} source="shard" />
          <p className="note"><button type="button" className="link-b" onClick={onRestart}>change the birth data</button> · <Link href="/shard/start">see the arrival again</Link></p>
        </section>
      </article>
    </>
  );
}

export function Shard({ me, start = false }) {
  const [birth, setBirth] = useBirth(me);
  const [shard, setShard] = useState(null);
  const [failed, setFailed] = useState(false);
  const [editing, setEditing] = useState(false);
  // the first run stays on screen from the burst to the reveal, even once the record exists
  const [arriving, setArriving] = useState(() => start || !birth);
  const sky = useTonight();
  const { navigate } = useRouter();

  useEffect(() => {
    let live = true;
    setShard(null);
    setFailed(false);
    if (!birth) return undefined;
    castShard(birth, { name: me && me.username }).then(s => { if (!live) return; if (s) setShard(s); else setFailed(true); }).catch(() => { if (live) setFailed(true); });
    return () => { live = false; };
  }, [birth, me]);

  if (!birth || arriving) {
    return <FirstRun me={me} birth={birth} setBirth={setBirth} onDone={() => { setArriving(false); if (start) navigate('/shard', { replace: true }); }} />;
  }

  if (editing || failed) {
    return (
      <>
        <p className="eyebrow">the document</p>
        <h1>your shard</h1>
        <p className="lead">change the birth data; the shard is read again.</p>
        {failed ? <p className="form-err" role="alert">the sky can't read that birth record. give it again.</p> : null}
        <BirthForm initial={birth} onCast={b => { saveBirth(b, me); setBirth(b); setEditing(false); }} onCancel={!failed ? () => setEditing(false) : null} cta="read the sky" />
      </>
    );
  }

  if (!shard) {
    return (<><p className="eyebrow">the document · {birthWords(birth)}</p><h1>your shard</h1><p className="lead">reading.</p></>);
  }

  return <Document shard={shard} birth={birth} me={me} sky={sky} onRestart={() => setEditing(true)} />;
}

/** /shard/start: the first run again, for anyone, record or not. */
export function ShardStart(props) {
  return <Shard {...props} start />;
}
