// A small history router. No dependency: the shell has fourteen routes and needs
// pushState, popstate, a Link that keeps the page, and nothing else.
import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { matchRoute } from './routes.mjs';

const RouterContext = createContext({ pathname: '/', navigate: () => {} });

export function RouterProvider({ children }) {
  const [pathname, setPathname] = useState(() => window.location.pathname);

  useEffect(() => {
    const onPop = () => setPathname(window.location.pathname);
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  // `to` may carry a hash (the reset and verify links put their token after a #; it never
  // reaches a server); the route is matched on the path alone.
  const navigate = useCallback((to, { replace = false } = {}) => {
    const path = to.split('#')[0];
    if (to === window.location.pathname + window.location.hash) return;
    if (replace) window.history.replaceState(null, '', to);
    else window.history.pushState(null, '', to);
    setPathname(path);
    window.scrollTo(0, 0);
  }, []);

  return <RouterContext.Provider value={{ pathname, navigate }}>{children}</RouterContext.Provider>;
}

export function useRouter() {
  return useContext(RouterContext);
}

// The matched route for the current URL: { route, params } or null for a 404.
export function useRoute() {
  const { pathname } = useRouter();
  return matchRoute(pathname);
}

// An anchor that stays inside the app for same-origin paths and behaves like a plain
// link otherwise (modifier clicks, external hrefs, downloads, the static legal pages).
export function Link({ href, external = false, children, onClick, ...rest }) {
  const { navigate } = useRouter();
  const handle = (e) => {
    if (onClick) onClick(e);
    if (e.defaultPrevented) return;
    if (external || rest.target === '_blank' || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
    if (!href.startsWith('/')) return;
    e.preventDefault();
    navigate(href);
  };
  return <a href={href} onClick={handle} {...rest}>{children}</a>;
}
