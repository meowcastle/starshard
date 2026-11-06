// The pages. Home and Tonight are SS5's (the lobby and the reading page, both from the one
// sky in tonight.js); the chart is SS6's, in chart.jsx; the rest render their archetype's header (eyebrow, title, one line) in
// the game's type and the doors the map gives them, for SS6 to SS9 to fill.
import { ROUTES, SITE } from './routes.mjs';
import { Link } from './router.jsx';
import STATIONS from './station-index.json';
import { Scene } from './scene.jsx';
import { Ring } from './ring.jsx';
import { useTonight, crossingWhen, nightLabel, HOUR_NAMES, hourStep } from './tonight.js';
import { degFmt } from '../../format.js';

const byKey = Object.fromEntries(ROUTES.map(r => [r.key, r]));
const stationAt = n => STATIONS[((n - 1) % 28 + 28) % 28];
const low = s => s.toLowerCase();

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

// ─── home: the lobby ─────────────────────────────────────────────────────────────────────
// The game's street under the real hour, tonight's station as the headline, the three doors
// (walk, read, codex), then the chart and the shard as the two cards the map gives the home.
// A stranger sees the sky before being asked for anything; the one sentence under the title
// says what this is.
export function Home({ me }) {
  const sky = useTonight();
  const st = sky ? stationAt(sky.moon.station) : null;
  return (
    <>
      <section className="lobby" aria-label="tonight, at the street">
        <Scene className="lobby-scene" />
        <div className="lobby-head">
          <p className="eyebrow">{sky ? `tonight · ${nightLabel(sky.night)} · ${HOUR_NAMES[hourStep()]}` : 'tonight'}</p>
          <h1>{st ? <>the moon is in <span className="station-name">{low(st.epithet)}</span></> : SITE}</h1>
          <p className="lead" data-what="product">
            star shard reads the real sky: the moon's station tonight, one of twenty-eight, the chart of your birth minute, and a card game played against both.
          </p>
          <div className="doors">
            <Link className="button" href="/play/" external>walk tonight's road</Link>
            <Link className="button ghost" href="/tonight">read tonight</Link>
            <Link className="button ghost" href="/codex">the codex</Link>
          </div>
        </div>
      </section>

      <div className="cards" role="list">
        <Link role="listitem" className="card" href="/chart">
          <span className="eyebrow">your chart</span>
          <span className="card-title">the wheel of your birth minute</span>
          <span className="card-line">houses, aspects, the planets, and the 28 stations drawn around them.</span>
          <span className="card-door">{me ? 'open your chart' : 'cast it'} ›</span>
        </Link>
        <Link role="listitem" className="card" href="/shard">
          <span className="eyebrow">your shard</span>
          <span className="card-title">the reading, kept</span>
          <span className="card-line">one of seven hundred eighty-four, set down as a document you return to.</span>
          <span className="card-door">{me ? 'open your shard' : 'read yours'} ›</span>
        </Link>
      </div>

      {st ? (
        <p className="note">
          station {st.n} of 28, {st.position}. the moon crosses into {low(stationAt(sky.nextCrossing.station).epithet)} {crossingWhen(sky.nextCrossing.at)}. <Link href={`/station/${st.slug}`}>read about {low(st.epithet)}</Link>
        </p>
      ) : null}
    </>
  );
}

// ─── tonight: the reading page ───────────────────────────────────────────────────────────
// Archetype A: eyebrow and title, the ring of 28 with the moon's station lit, one measure of
// prose, then the supporting rows: the moon's degree, the planets, the next crossing, and the
// one line to the game.
const PLANET_GLYPH = { sun: '☉', moon: '☽', mercury: '☿', venus: '♀', mars: '♂', jupiter: '♃', saturn: '♄' };
const PLANET_ORDER = ['moon', 'sun', 'mercury', 'venus', 'mars', 'jupiter', 'saturn'];
// the four positions within a station (COSMOLOGY.md section 2: the values ship, the label does not)
const STEP_WORDS = ['entering', 'dwelling', 'turning', 'leaving'];

export function Tonight() {
  const sky = useTonight();
  if (!sky) {
    return <PageHead eyebrow="the sky now" title={byKey.tonight.title} lead="reading the sky." />;
  }
  const st = stationAt(sky.moon.station);
  const next = stationAt(sky.nextCrossing.station);
  const deg = sky.moon.degIn;
  const dmin = Math.round((deg % 1) * 60);
  const label = `the ring of 28 stations, the moon in station ${st.n}, ${low(st.epithet)}`;
  return (
    <>
      <PageHead eyebrow={`the sky now · ${nightLabel(sky.night)}`} title={low(st.epithet)} />
      <div className="tonight-top">
        <Ring
          now={st.n}
          sub="the moon is here"
          name={low(st.epithet)}
          state={`station ${st.n} of 28 · ${Math.floor(deg)}°${String(dmin).padStart(2, '0')}′ in`}
          marks={[{ role: 'moon', station: st.n, glyph: '☽' }, { role: 'sun', station: sky.planets.sun.station, glyph: '☉' }]}
          label={label}
        />
        <div className="prose tonight-prose">
          <p>
            tonight the moon stands in {low(st.epithet)}, the {ordinalWord(st.n)} of the 28 stations, at {degFmt(sky.moon.lon)}: {Math.floor(deg)}° into a station 12°51′ wide, {STEP_WORDS[Math.min(3, Math.floor(deg / (sky.moon.width / 4)))]}.
          </p>
          <p>
            <Link href={`/station/${st.slug}`}>what the books say about {low(st.epithet)}</Link>
          </p>
        </div>
      </div>

      <hr className="hair" />

      <section aria-labelledby="planets-h">
        <h2 id="planets-h" className="section-h">the sky at 21:00</h2>
        <ol className="rows planets" aria-label="the planets tonight">
          {PLANET_ORDER.map(name => {
            const p = sky.planets[name];
            if (!p) return null;
            const ps = stationAt(p.station);
            return (
              <li key={name}>
                <Link href={`/station/${ps.slug}`}>
                  <span className="n planet-glyph" aria-hidden="true">{PLANET_GLYPH[name]}</span>
                  <span className="t">{name}{p.retrograde ? <span className="rx" title="retrograde"> ℞</span> : null}</span>
                  <span className="k"><span className="deg">{degFmt(p.lon)}</span> · {low(ps.epithet)}</span>
                </Link>
              </li>
            );
          })}
        </ol>
        <p className="note">
          positions at 21:00 {sky.tz.replace(/_/g, ' ').toLowerCase()}, the hour this night is read at.
          {PLANET_ORDER.some(n => sky.planets[n] && sky.planets[n].retrograde) ? ' ℞ marks a planet moving backward against the stars.' : ''}
        </p>
      </section>

      <section aria-labelledby="crossing-h">
        <h2 id="crossing-h" className="section-h">the next crossing</h2>
        <p className="prose">
          the moon crosses into <Link href={`/station/${next.slug}`}>{low(next.epithet)}</Link> {crossingWhen(sky.nextCrossing.at)}.
        </p>
      </section>

      <div className="doors">
        <Link className="button" href="/play/" external>playable tonight ✦</Link>
        <Link className="button ghost" href={`/station/${st.slug}`}>{low(st.epithet)} in the codex</Link>
      </div>
    </>
  );
}

const ORD = ['first', 'second', 'third', 'fourth', 'fifth', 'sixth', 'seventh', 'eighth', 'ninth', 'tenth', 'eleventh', 'twelfth', 'thirteenth', 'fourteenth', 'fifteenth', 'sixteenth', 'seventeenth', 'eighteenth', 'nineteenth', 'twentieth', 'twenty-first', 'twenty-second', 'twenty-third', 'twenty-fourth', 'twenty-fifth', 'twenty-sixth', 'twenty-seventh', 'twenty-eighth'];
const ordinalWord = n => ORD[n - 1] || `${n}th`;

// your chart is chart.jsx's (SS6): the wheel, the tables, the birth form
export { Chart } from './chart.jsx';

// your shard is shard.jsx's (SS7): the document, and the first run at /shard/start
export { Shard, ShardStart } from './shard.jsx';

// the codex and the station pages are codex.jsx's (SS9): the index, the card, the sections
export { Codex, Station } from './codex.jsx';

// /play/ is the game's own page (build.mjs copies the September Manzil file into dist/play/); the
// shell links to it and never renders it (SS9b)

// the account pages are account.jsx's (SS8): sign in, sign up, reset, verify, account
export { Account, SignIn, SignUp, Reset, Verify } from './account.jsx';

export function NotFound() {
  return (
    <>
      <PageHead eyebrow="nothing here" title="this page does not exist" lead="the sky, the chart and the codex are a step away." />
      <div className="doors">
        <Link className="button" href="/">home</Link>
        <Link className="button ghost" href="/codex">the codex</Link>
      </div>
    </>
  );
}
