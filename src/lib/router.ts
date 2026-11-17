import { useEffect, useState } from 'react';

// Hash routing keeps every screen on "/" so the service worker's offline shell works without server rewrites.
export type Route = { name: 'home' } | { name: 'product'; id: string };

function parse(hash: string): Route {
  const m = hash.match(/^#\/p\/([\w-]+)/);
  return m ? { name: 'product', id: m[1] } : { name: 'home' };
}

export function useRoute(): Route {
  const [route, setRoute] = useState(() => parse(location.hash));
  useEffect(() => {
    const on = () => setRoute(parse(location.hash));
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);
  return route;
}

let pushedFromHome = false;

export const go = {
  product: (id: string) => {
    pushedFromHome = true;
    location.hash = `#/p/${id}`;
  },
  home: () => {
    // Pop back when we pushed the product page ourselves; otherwise (deep link) replace with home.
    if (pushedFromHome) {
      pushedFromHome = false;
      history.back();
    } else location.hash = '#/';
  },
};

export const rupee = (n: number) => `₹${n.toLocaleString('en-IN')}`;
