// Entry: mounts the shell. React 18, bundled by esbuild (build.mjs); no in-browser
// Babel, no dc-runtime, no `new Function` (STARSHARD-LAUNCH.md section 2.5).
import { StrictMode, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import './tokens.css';
import './shell.css';
import './pages.css';
import './chart.css';
import './shard.css';
import './account.css';
import './codex.css';
import { SITE } from './routes.mjs';
import { RouterProvider, useRoute, useRouter } from './router.jsx';
import { Header, TabBar, Footer, useMe } from './shell.jsx';
import { refreshMe } from './account.js';
import * as Pages from './pages.jsx';
import STATIONS from './station-index.json';

const PAGE = {
  home: Pages.Home,
  tonight: Pages.Tonight,
  chart: Pages.Chart,
  shard: Pages.Shard,
  firstrun: Pages.ShardStart,
  codex: Pages.Codex,
  station: Pages.Station,
  account: Pages.Account,
  signin: Pages.SignIn,
  signup: Pages.SignUp,
  reset: Pages.Reset,
  verify: Pages.Verify,
};

// The mail the server sends links to the site root with the token after a # (it never
// reaches a server that way): /#resetToken=... opens the reset page, /#verifyEmail=... the
// verify landing, whatever path the link was opened on.
function useMailLinks() {
  const { navigate } = useRouter();
  useEffect(() => {
    const h = window.location.hash || '';
    const to = h.startsWith('#resetToken=') ? '/reset' : h.startsWith('#verifyEmail=') ? '/verify' : null;
    if (to && window.location.pathname !== to) navigate(to + h, { replace: true });
  }, []);
}

function App() {
  useMailLinks();
  const match = useRoute();
  const me = useMe();
  useEffect(() => { refreshMe(); }, []);
  const key = match ? match.route.key : 'notfound';
  const Page = match ? PAGE[match.route.key] : Pages.NotFound;

  useEffect(() => {
    let t = match ? match.route.title : 'not found';
    if (match && match.route.key === 'station') t = STATIONS.find(s => s.slug === match.params.slug)?.epithet.toLowerCase() || 'not found';
    document.title = t === SITE ? SITE : `${t} · ${SITE}`;
  }, [match]);

  return (
    <>
      <a className="skip" href="#main">skip to the page</a>
      <div className="ground" aria-hidden="true" />
      <div className="shell">
        <Header me={me} />
        <main id="main" className="page" data-route={key} tabIndex={-1}>
          <Page {...(match ? match.params : {})} me={me} />
        </main>
        <Footer />
      </div>
      <TabBar />
    </>
  );
}

createRoot(document.getElementById('app')).render(
  <StrictMode>
    <RouterProvider>
      <App />
    </RouterProvider>
  </StrictMode>
);
