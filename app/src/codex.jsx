// codex.jsx: the codex, an index of 28 stations and one page each (SS9, 2 Nov 2026).
//
// A generator, not hand prose. Every line a visitor reads here comes from app/src/codex.json,
// which app/codex-extract.mjs gathers from the corpus (stations.js, research/mansions-table.json,
// research/corpus-mansions.md through reading-copy.js, the game's card table, walker-sheet.js)
// and which names the source row of every field. The section labels are the packet's own
// words (STARSHARD-LAUNCH.md section 2.3: the four skies, born under it, when the moon
// crosses, what the books say, the card and its signature, the walkers, sources). The corpus
// text goes through the house style (house.js) on its way to the page, as the shard's does.
//
// The index is the canvas board "Codex": the ring with tonight's moon lit, then the 28 as
// rows (number, the card's art, the epithet, the keyword, the range). A station page is the
// board "Codex · the Follower": the card the game deals for it beside the portrait, then the
// sections at one measure, and the doors to its neighbours. The crossing section is computed
// on the device from astro.js (crossings.js) and framed as presence and return, never expiry.
import { useEffect, useRef, useState } from 'react';
import { Link } from './router.jsx';
import INDEX from './codex-index.json';
import ART from './station-art.json';
import { Ring, quarterOf } from './ring.jsx';
import { ROUTES } from './routes.mjs';
import { useTonight, crossingWhen } from './tonight.js';
import { house, paragraphs } from './house.js';
import { visits, whenWords, spanWords } from './crossings.js';

const byKey = Object.fromEntries(ROUTES.map(r => [r.key, r]));
const low = s => String(s || '').toLowerCase();
const QC = { byakko: '185,198,210', suzaku: '212,90,58', seiryuu: '79,168,154', genbu: '124,138,204' };
const QUARTER = { byakko: 'the white tiger', suzaku: 'the vermilion bird', seiryuu: 'the azure dragon', genbu: 'the black tortoise' };
const ORD = ['first', 'second', 'third', 'fourth', 'fifth', 'sixth', 'seventh', 'eighth', 'ninth', 'tenth', 'eleventh', 'twelfth', 'thirteenth', 'fourteenth', 'fifteenth', 'sixteenth', 'seventeenth', 'eighteenth', 'nineteenth', 'twentieth', 'twenty-first', 'twenty-second', 'twenty-third', 'twenty-fourth', 'twenty-fifth', 'twenty-sixth', 'twenty-seventh', 'twenty-eighth'];

// the full records, loaded with the first station page and kept for the session
let CODEX = null;
const loadCodex = () => CODEX ? Promise.resolve(CODEX) : import('./codex.json').then(m => (CODEX = m.default || m));
/** For the build's prerender: hand the records in rather than fetching them. */
export function primeCodex(records) { CODEX = records; }

function Prose({ text, className }) {
  return paragraphs(text).map((runs, i) => (
    <p key={i} className={className}>{runs.map((r, j) => (r.em != null ? <em key={j}>{r.em}</em> : <span key={j}>{r.text}</span>))}</p>
  ));
}

// "transform-box:fill-box;animation:bsBreathe 5s ..." as a style object (the game's art styles)
function cssText(st) {
  const out = {};
  for (const part of st.split(';')) {
    const i = part.indexOf(':');
    if (i < 0) continue;
    out[part.slice(0, i).trim().replace(/-([a-z])/g, (m, c) => c.toUpperCase())] = part.slice(i + 1).trim();
  }
  return out;
}

// ─── the station's art, the game's own shapes centred on their ink ─────────────────────
export function StationArt({ n, className = '' }) {
  const shapes = ART[String(n)] || [];
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
    } catch (e) { /* no layout yet */ }
  }, [n]);
  return (
    <svg ref={ref} viewBox={box} className={className} aria-hidden="true" focusable="false">
      {shapes.map((p, i) => <path key={i} d={p.d} fill={p.f} stroke={p.s} strokeWidth={p.w} strokeDasharray={p.da === 'none' ? undefined : p.da} strokeLinecap="round" strokeLinejoin="round" style={p.st ? cssText(p.st) : undefined} />)}
    </svg>
  );
}

// ─── the card the game deals for the station: the quarter's wash, the gold border, the art,
// the two faces at the edges they fight on, the name in Cormorant ────────────────────────
export function CodexCard({ s }) {
  const q = quarterOf(s.n);
  const wash = `linear-gradient(158deg, rgba(${QC[q]},.45) 0%, rgba(${QC[q]},.27) 46%, rgba(${QC[q]},.13) 100%), linear-gradient(160deg, #2A2009, #0B0703)`;
  return (
    <div className="codex-card" style={{ background: wash }} role="img" aria-label={`the card for ${low(s.epithet)}: left face ${s.card.left}, right face ${s.card.right}, ${s.card.text}`}>
      <span className="codex-card-inner" aria-hidden="true" />
      <span className="codex-card-halo" aria-hidden="true" />
      <StationArt n={s.n} className="codex-card-art" />
      <span className="codex-card-n" aria-hidden="true">{s.n}</span>
      <span className="codex-card-face codex-card-left" aria-hidden="true">{s.card.left}</span>
      <span className="codex-card-face codex-card-right" aria-hidden="true">{s.card.right}</span>
      <span className="codex-card-name" aria-hidden="true">{low(s.epithet)}</span>
      <span className="codex-card-sig" aria-hidden="true">{house(s.card.text)}</span>
    </div>
  );
}

// ─── the index ───────────────────────────────────────────────────────────────────────────
export function Codex() {
  const sky = useTonight();
  const now = sky ? sky.moon.station : 0;
  const here = now ? INDEX[now - 1] : null;
  return (
    <>
      <p className="eyebrow">the 28 stations</p>
      <h1>{byKey.codex.title}</h1>
      <p className="lead">{byKey.codex.description}</p>
      <div className="codex-head">
        <Ring
          now={now}
          sub={here ? 'tonight' : ''}
          name={here ? low(here.epithet) : 'the ring of 28'}
          state={here ? `station ${here.n} of 28` : ''}
          marks={sky ? [{ role: 'moon', station: now, glyph: '☽' }, { role: 'sun', station: sky.planets.sun.station, glyph: '☉' }] : []}
          size={240}
          label={here ? `the ring of 28 stations, the moon in station ${here.n}, ${low(here.epithet)}` : 'the ring of 28 stations'}
        />
        <div className="codex-head-text">
          {here ? (
            <p className="codex-tonight">
              tonight the moon is in <Link href={`/station/${here.slug}`}>{low(here.epithet)}</Link>, the {ORD[here.n - 1]} station.
              it crosses into {low(INDEX[sky.nextCrossing.station - 1].epithet)} {crossingWhen(sky.nextCrossing.at)}.
            </p>
          ) : null}
          <p className="codex-how">the moon walks the whole ring in a month, about a day in each station. four skies, arabia, india, china and japan, named the stretches of it. each page holds the four names, who is born under it, when the moon crosses it, what the old books said of it, the card the game deals for it, and the walkers of its house.</p>
        </div>
      </div>
      <ol className="codex-list" aria-label="the 28 stations">
        {INDEX.map(s => {
          const q = quarterOf(s.n);
          return (
            <li key={s.slug} className={s.n === now ? 'codex-row-now' : ''} style={{ '--q': QC[q] }}>
              <Link href={`/station/${s.slug}`} className="codex-row">
                <span className="codex-row-n">{s.n}</span>
                <span className="codex-row-art" aria-hidden="true"><StationArt n={s.n} className="codex-row-svg" /></span>
                <span className="codex-row-text">
                  <span className="codex-row-title">{low(s.epithet)}</span>
                  <span className="codex-row-key">{house(s.keyword)}{s.n === now ? ' · the moon is here tonight' : ''}</span>
                </span>
                <span className="codex-row-range">{low(s.position)}</span>
                <span className="codex-row-kanji" lang="ja">{s.kanji}</span>
              </Link>
            </li>
          );
        })}
      </ol>
    </>
  );
}

// ─── one station ─────────────────────────────────────────────────────────────────────────
function Skies({ s }) {
  const { arabia, india, china, japan } = s.skies;
  const rows = [
    { k: 'arabia', name: arabia.name, line: arabia.meaning },
    india.name
      ? { k: 'india', name: india.name, line: `deity ${india.deity}, symbol the ${india.symbol}` }
      : { k: 'india', name: 'no station here', line: india.note || '' },
    { k: 'china', name: china.name, line: `${china.gloss ? `"${china.gloss}", ` : ''}under ${low(china.quadrant).replace(/\s*\(.*\)$/, '')}, its animal the ${china.animal}` },
    { k: 'japan', name: japan.name || japan.kanji || '', line: japan.kanji && japan.name ? `${japan.kanji}, the traditional star-name` : 'the traditional star-name' },
  ];
  return (
    <dl className="codex-skies">
      {rows.map(r => (
        <div key={r.k} className="codex-sky">
          <dt><span className="fr-k">{r.k}</span> <span className="codex-sky-name">{house(r.name)}</span></dt>
          <dd>{house(low(r.line))}</dd>
        </div>
      ))}
      <div className="codex-sky">
        <dt><span className="fr-k">the stars</span></dt>
        <dd>{house(low(s.stars))}</dd>
      </div>
    </dl>
  );
}

function Crossings({ s }) {
  const [v, setV] = useState(null);
  useEffect(() => { setV(visits(s.n, new Date(), 3)); }, [s.n]);
  if (!v) return <p className="shard-plain">the moon's next visits, from this device's clock.</p>;
  const [first, ...rest] = v;
  return (
    <>
      {first.here ? (
        <p className="shard-plain">the moon is in {low(s.epithet)} now. it came in {whenWords(first.enter)} and leaves {whenWords(first.leave)}.</p>
      ) : (
        <p className="shard-plain">the moon comes into {low(s.epithet)} {whenWords(first.enter)} and stays {spanWords(first.enter, first.leave)}, leaving {whenWords(first.leave)}.</p>
      )}
      {rest.length ? <p>it returns {rest.map((x, i) => <span key={i}>{i ? ', then ' : ''}{whenWords(x.enter)}</span>)}: about every twenty-seven days, for about a day each time. the times are this device's own clock.</p> : null}
      <p className="codex-note"><Link href="/tonight">where the moon is tonight</Link></p>
    </>
  );
}

function Sources({ s }) {
  const { arabia, india, china, japan } = s.skies;
  return (
    <ul className="codex-sources">
      <li>the degrees are tropical, counted from 0° aries, each station 12°51′ wide: {low(s.position)}. the stars named are the ones the traditions set in it.</li>
      <li>arabia: {house(arabia.name)}, one of the twenty-eight manāzil al-qamar of the classical arabic star calendars.</li>
      {india.name ? <li>india: {house(india.name)}, the nakshatra paired with this station by its number; deity {house(india.deity)}, symbol the {house(india.symbol)}.</li> : <li>india: {house(low(india.note || 'no station here'))}.</li>}
      <li>china: {house(china.name)}, one of the twenty-eight xiù, under {low(china.quadrant).replace(/\s*\(.*\)$/, '')}; its animal the {china.animal}.</li>
      {japan.name ? <li>japan: {house(japan.name)}, the traditional star-name of {japan.kanji}.</li> : null}
      <li>what the books say: agrippa's three books and the picatrix, as the corpus quotes them. the old election material is presented as history, never as practice.</li>
      <li>the card: the game's card sheet, its two faces and its signature as the game prints them.</li>
      {s.alignNote ? <li>{house(low(s.alignNote))}</li> : null}
    </ul>
  );
}

function Walkers({ s }) {
  if (!s.walkers.length) return null;
  return (
    <section className="shard-sec" aria-labelledby="sec-walkers">
      <h2 id="sec-walkers" className="section-h shard-h">the walkers</h2>
      <p className="shard-plain">the house of {low(s.epithet)} in the game: {s.walkers.length} walkers on its road, each with a line on the way in.</p>
      <ol className="codex-walkers">
        {s.walkers.map(w => (
          <li key={w.name}>
            <span className="codex-walker-name">{house(w.name)}</span>
            <span className="codex-walker-line">{house(w.in)}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}

/** The station page's body, pure in its data: the build prerenders it with the record in hand. */
export function StationArticle({ s, prev, next }) {
  const q = quarterOf(s.n);
  return (
    <article className="codex-station" style={{ '--q': QC[q] }}>
      <p className="eyebrow">station {s.n} of 28 · {low(s.position)}</p>
      <h1>{low(s.epithet)}</h1>
      <p className="codex-sub"><span lang="ja">{s.kanji}</span> · {house(s.keyword)} · {QUARTER[q]}</p>
      <div className="codex-top">
        <aside className="codex-side">
          <CodexCard s={s} />
          <p className="codex-poem">{house(s.poem)}</p>
        </aside>
        <div className="codex-portrait">
          <p className="shard-plain codex-claim">{house(s.claim)}</p>
          <div className="shard-body"><Prose text={s.archetype} /></div>
        </div>
      </div>
      <div className="shard-doc">
        <section className="shard-sec" aria-labelledby="sec-skies">
          <h2 id="sec-skies" className="section-h shard-h">the four skies</h2>
          <Skies s={s} />
          <div className="shard-body codex-synthesis"><Prose text={s.synthesis} /></div>
          <p className="codex-match"><span className={`codex-flag codex-flag-${low(s.match.flag)}`}>{low(s.match.flag)}</span> {house(s.match.test)}{s.match.why ? `: ${house(low(s.match.why))}` : ''}.</p>
        </section>
        <section className="shard-sec" aria-labelledby="sec-born">
          <h2 id="sec-born" className="section-h shard-h">born under it</h2>
          <p className="codex-note">with the sun here at birth. the moon's own reading, and the rest of the chart, are in <Link href="/shard">your shard</Link>.</p>
          <div className="shard-body"><Prose text={s.born.strike} /><Prose text={s.born.facing} /></div>
        </section>
        <section className="shard-sec" aria-labelledby="sec-cross">
          <h2 id="sec-cross" className="section-h shard-h">when the moon crosses</h2>
          <Crossings s={s} />
        </section>
        <section className="shard-sec" aria-labelledby="sec-books">
          <h2 id="sec-books" className="section-h shard-h">what the books say</h2>
          <div className="shard-body"><Prose text={s.election} /></div>
        </section>
        <section className="shard-sec" aria-labelledby="sec-card">
          <h2 id="sec-card" className="section-h shard-h">the card and its signature</h2>
          <dl className="codex-cardsheet">
            <div><dt>left face</dt><dd>{s.card.left}</dd></div>
            <div><dt>right face</dt><dd>{s.card.right}</dd></div>
            <div><dt>signature</dt><dd>{house(s.card.text)}</dd></div>
            <div><dt>fires</dt><dd>{house(s.card.fires)}</dd></div>
            <div><dt>what it does</dt><dd>{house(s.card.verb)}</dd></div>
          </dl>
          <p className="codex-note">a card's left number faces the card on its left and its right number the card on its right; the bigger number takes the neighbour. the signature is the card's own rule. <Link href="/play/" external>play tonight's road</Link></p>
        </section>
        <Walkers s={s} />
        <section className="shard-sec" aria-labelledby="sec-sources">
          <h2 id="sec-sources" className="section-h shard-h">sources</h2>
          <Sources s={s} />
        </section>
      </div>
      <nav className="doors codex-doors" aria-label="the stations beside this one">
        <Link className="button ghost" href={`/station/${prev.slug}`} rel="prev">‹ {low(prev.epithet)}</Link>
        <Link className="button ghost" href="/codex">all 28</Link>
        <Link className="button ghost" href={`/station/${next.slug}`} rel="next">{low(next.epithet)} ›</Link>
      </nav>
    </article>
  );
}

export function Station({ slug }) {
  const i = INDEX.findIndex(x => x.slug === slug);
  const [records, setRecords] = useState(CODEX);
  useEffect(() => { let live = true; if (!records) loadCodex().then(r => { if (live) setRecords(r); }); return () => { live = false; }; }, []);
  if (i < 0) return <NotFoundStation />;
  const head = INDEX[i];
  const prev = INDEX[(i + 27) % 28], next = INDEX[(i + 1) % 28];
  if (!records) {
    return (
      <>
        <p className="eyebrow">station {head.n} of 28 · {low(head.position)}</p>
        <h1>{low(head.epithet)}</h1>
        <p className="codex-sub"><span lang="ja">{head.kanji}</span> · {house(head.keyword)}</p>
      </>
    );
  }
  return <StationArticle s={records[i]} prev={prev} next={next} />;
}

function NotFoundStation() {
  return (
    <>
      <p className="eyebrow">nothing here</p>
      <h1>this page does not exist</h1>
      <p className="lead">the codex has 28 stations; this is not one of them.</p>
      <div className="doors"><Link className="button" href="/codex">the codex</Link></div>
    </>
  );
}
