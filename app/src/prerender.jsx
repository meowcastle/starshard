// prerender.jsx: the codex and the station pages as static markup, for the build (SS9).
//
// build.mjs bundles this for Node and calls it once per public page, so the HTML a crawler
// (or a reader with no script) gets carries the page's text, drawn by the same components the
// bundle mounts in the browser. The shell's chrome is not prerendered: the bundle renders the
// whole page over this on load. The crossing section is computed on the device, so it
// prerenders as its one waiting line.
import { renderToStaticMarkup } from 'react-dom/server';
import { StationArticle, Codex, primeCodex } from './codex.jsx';
import INDEX from './codex-index.json';
import CODEX from './codex.json';

primeCodex(CODEX);

export function renderStation(slug) {
  const i = INDEX.findIndex(x => x.slug === slug);
  if (i < 0) throw new Error(`no station ${slug}`);
  const prev = INDEX[(i + 27) % 28], next = INDEX[(i + 1) % 28];
  return `<main class="page" data-route="station" data-prerender="1">${renderToStaticMarkup(<StationArticle s={CODEX[i]} prev={prev} next={next} />)}</main>`;
}

export function renderCodex() {
  return `<main class="page" data-route="codex" data-prerender="1">${renderToStaticMarkup(<Codex />)}</main>`;
}
