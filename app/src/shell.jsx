// The chrome: header with the text nav at 1024px and up, the five-tab bar below it, the
// account chip, the footer. One app, three persistent sections and their doors
// (APP-FRAMEWORK.md section 3); the look is the game's (STARSHARD-LAUNCH.md section 2.2).
import { ROUTES, SITE } from './routes.mjs';
import { Link, useRouter } from './router.jsx';

// The icons are the game's own, lifted from the V2 file's pause menu (lobby, cards, the
// star shard, the codex) so the shell and the stage share one set. Tonight and the chart
// use the glyphs the brief names for them: ☾ and ☉.
export function Glyph({ name, size = 20 }) {
  const common = { width: size, height: size, viewBox: '0 0 40 40', 'aria-hidden': 'true', focusable: 'false' };
  switch (name) {
    case 'home':
      return (
        <svg {...common}><path d="M11 21 L20 12 L29 21 M14 20 v9 h12 v-9" fill="none" stroke="rgba(240,216,154,.85)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
      );
    case 'cards':
      return (
        <svg {...common}>
          <rect x="10" y="10" width="14" height="19" rx="2" fill="none" stroke="rgba(240,216,154,.5)" strokeWidth="1.3" />
          <rect x="16" y="12" width="14" height="19" rx="2" fill="rgba(10,7,3,.9)" stroke="rgba(240,216,154,.85)" strokeWidth="1.4" />
        </svg>
      );
    case 'shard':
      return (
        <svg {...common}>
          <g stroke="rgba(240,216,154,.8)" strokeWidth="1"><path d="M12 24 L20 13 L28 20 L23 28 Z" fill="none" /></g>
          <g fill="#F2EAD6"><circle cx="12" cy="24" r="1.7" /><circle cx="20" cy="13" r="2" /><circle cx="28" cy="20" r="1.7" /><circle cx="23" cy="28" r="1.5" /></g>
        </svg>
      );
    case 'codex':
      return (
        <svg {...common}>
          <g fill="none" stroke="rgba(240,216,154,.85)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 13 c-3 -2.4 -6.5 -2.6 -9.5 -1.6 v16 c3 -1 6.5 -.8 9.5 1.6 c3 -2.4 6.5 -2.6 9.5 -1.6 v-16 c-3 -1 -6.5 -.8 -9.5 1.6 z" />
            <path d="M20 13 v16" />
            <path d="M14 17.5 h3 M14 21 h3" />
          </g>
        </svg>
      );
    case 'moon':
      return <span className="glyph" aria-hidden="true">☾</span>;
    case 'sun':
      return <span className="glyph" aria-hidden="true">☉</span>;
    default:
      return null;
  }
}

function isCurrent(route, pathname) {
  if (route.path === '/') return pathname === '/';
  if (route.key === 'codex') return pathname.startsWith('/codex') || pathname.startsWith('/station/');
  return pathname === route.path || pathname.startsWith(route.path + '/');
}

// Who is signed in, and whether the API is reachable at all, live in account.js (SS8); the
// shell re-exports them so the pages and birth.js keep one import path.
export { useMe, apiReachable } from './account.js';

function AccountChip({ me }) {
  const { pathname } = useRouter();
  const current = pathname === '/account' || pathname === '/signin';
  if (me === undefined) {
    return <span className="chip" aria-busy="true"><span className="avatar" aria-hidden="true" /><span className="visually-hidden">checking your account</span></span>;
  }
  if (!me) {
    return (
      <Link href="/signin" className="chip" aria-current={current ? 'page' : undefined}>
        <span className="avatar" aria-hidden="true" />
        <span>sign in</span>
      </Link>
    );
  }
  const name = me.username || me.email || 'you';
  return (
    <Link href="/account" className="chip" aria-current={current ? 'page' : undefined} aria-label={`account, ${name}`}>
      <span className="avatar">{String(name).slice(0, 1).toLowerCase()}</span>
      <span>{name}</span>
    </Link>
  );
}

export function Header({ me }) {
  const { pathname } = useRouter();
  return (
    <header className="header">
      <Link href="/" className="brand" aria-label={`${SITE}, home`}>
        <Glyph name="shard" size={22} />
        <span>{SITE}</span>
      </Link>
      <nav className="nav" aria-label="sections">
        {ROUTES.filter(r => r.nav).map(r => (
          <Link key={r.key} href={r.path} external={!!r.external} aria-current={isCurrent(r, pathname) ? 'page' : undefined}>
            {r.glyph === 'moon' || r.glyph === 'sun' ? <Glyph name={r.glyph} /> : r.glyph === 'shard' ? <span className="glyph" aria-hidden="true">✦</span> : null}
            <span>{r.label}</span>
          </Link>
        ))}
        <span className="grow" />
      </nav>
      <span className="spacer" />
      <AccountChip me={me} />
    </header>
  );
}

export function TabBar() {
  const { pathname } = useRouter();
  return (
    <nav className="tabs" aria-label="sections">
      {ROUTES.filter(r => r.tab).map(r => (
        <Link key={r.key} href={r.path} external={!!r.external} className="tab" aria-current={isCurrent(r, pathname) ? 'page' : undefined}>
          <span className="ring"><Glyph name={r.glyph} /></span>
          <span>{r.label}</span>
        </Link>
      ))}
    </nav>
  );
}

export function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="footer">
      <span>{SITE} · {year}</span>
      <a href="/privacy/">privacy</a>
      <a href="/terms/">terms</a>
      <Link href="/account">account</Link>
    </footer>
  );
}
