import { useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { LogoMark } from './Logo';
import { PlatformBadge } from './PlatformBadge';
import { ProductImage } from './ProductImage';
import { ArrowUpLeft, ClockIcon, CloseIcon, PinIcon, SearchIcon, TrendIcon } from './Icons';
import { PLATFORMS, PLATFORM_ORDER } from '../../shared/platforms.ts';
import type { ProductSummary, SuggestionItem } from '../../shared/types.ts';
import { api } from '../api';
import { clearRecent, getRecent } from '../lib/recent';
import { useSession } from '../lib/session';
import { go, rupee } from '../lib/router';

const MIN_CHARS = 3;

function Highlighted({ text, ranges }: { text: string; ranges: [number, number][] }) {
  // Google-style: what you typed stays regular, the completion is bold.
  const parts: ReactNode[] = [];
  let i = 0;
  ranges.forEach(([s, e], k) => {
    if (s < i) return;
    if (s > i) parts.push(<b key={`b${k}`}>{text.slice(i, s)}</b>);
    parts.push(<span key={`m${k}`}>{text.slice(s, e)}</span>);
    i = e;
  });
  if (i < text.length) parts.push(<b key="tail">{text.slice(i)}</b>);
  return <>{parts}</>;
}

/** Fetches suggestions once the query has 3+ characters; cancels stale requests. */
function useSuggestions(query: string) {
  const [state, setState] = useState<{ q: string; items: SuggestionItem[]; exactId: string | null; loading: boolean }>({
    q: '',
    items: [],
    exactId: null,
    loading: false,
  });

  useEffect(() => {
    const q = query.trim();
    if (q.length < MIN_CHARS) {
      setState({ q, items: [], exactId: null, loading: false });
      return;
    }
    setState((s) => ({ ...s, loading: true }));
    const ctrl = new AbortController();
    const t = setTimeout(() => {
      api
        .suggest(q, ctrl.signal)
        .then((r) => setState({ q, items: r.items, exactId: r.exactId, loading: false }))
        .catch((e) => e.name !== 'AbortError' && setState({ q, items: [], exactId: null, loading: false }));
    }, 140);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [query]);

  return state;
}

export function Home() {
  const { user } = useSession();
  const [query, setQuery] = useState('');
  const [focused, setFocused] = useState(false);
  const [active, setActive] = useState(-1);
  const [recent, setRecent] = useState(getRecent);
  const [trending, setTrending] = useState<(ProductSummary & { fromPrice: number | null })[] | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { q: answeredFor, items, exactId, loading } = useSuggestions(query);

  const typed = query.trim().length;
  const open = focused && typed > 0;

  useEffect(() => {
    api.trending().then((r) => setTrending(r.items), () => setTrending([]));
  }, []);
  useEffect(() => setActive(-1), [answeredFor]);

  const choose = (id: string) => {
    inputRef.current?.blur();
    go.product(id);
  };

  const submit = () => {
    // Full product name typed → open it. Otherwise open the highlighted (or top) suggestion.
    if (typed < MIN_CHARS) return;
    if (active >= 0 && items[active]) return choose(items[active].id);
    if (exactId) return choose(exactId);
    if (items[0] && answeredFor === query.trim()) return choose(items[0].id);
  };

  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, items.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, -1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      submit();
    } else if (e.key === 'Escape') {
      inputRef.current?.blur();
    }
  };

  const firstName = user?.profile?.name.split(' ')[0];

  return (
    <main className={`home ${open ? 'is-searching' : ''}`}>
      <header className="home__hero">
        <div className="home__bar">
          <div className="home__brand">
            <LogoMark size={34} />
            <span>
              Quick<em>Hai</em>
            </span>
          </div>
          <button className="avatar" onClick={go.profile} aria-label="Your profile">
            {(firstName ?? '?').charAt(0).toUpperCase()}
          </button>
        </div>
        <button className="home__pin" onClick={go.profile}>
          <PinIcon /> Prices for <b>{user?.profile?.pincode}</b>
        </button>
        <h1 className="home__headline">
          {firstName ? `Hi ${firstName}, ` : ''}what are you
          <br />
          buying today?
        </h1>
        <div className="home__platforms" aria-label="Platforms compared">
          {PLATFORM_ORDER.map((id) => (
            <PlatformBadge key={id} platform={PLATFORMS[id]} size={26} />
          ))}
          <span>We compare, you pick the app</span>
        </div>
      </header>

      <div className="search">
        <form
          className={`search__box ${focused ? 'is-focused' : ''}`}
          role="search"
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
        >
          <SearchIcon />
          <input
            ref={inputRef}
            type="search"
            inputMode="search"
            enterKeyHint="search"
            autoComplete="off"
            spellCheck={false}
            placeholder="Search milk, atta, Maggi…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setTimeout(() => setFocused(false), 120)}
            onKeyDown={onKey}
            role="combobox"
            aria-expanded={open}
            aria-controls="qh-suggest"
            aria-activedescendant={active >= 0 ? `qh-s-${active}` : undefined}
            aria-label="Search products"
          />
          {loading && <span className="spinner spinner--accent" aria-hidden="true" />}
          {query && (
            <button
              type="button"
              className="search__clear"
              aria-label="Clear search"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                setQuery('');
                inputRef.current?.focus();
              }}
            >
              <CloseIcon />
            </button>
          )}
        </form>

        {open && (
          <ul className="suggest" id="qh-suggest" role="listbox">
            {typed < MIN_CHARS && (
              <li className="suggest__hint">
                Keep typing… {MIN_CHARS - typed} more letter{MIN_CHARS - typed === 1 ? '' : 's'} to see suggestions
              </li>
            )}
            {typed >= MIN_CHARS && !loading && answeredFor === query.trim() && items.length === 0 && (
              <li className="suggest__empty">
                No match for “{query.trim()}”. Try a brand or a simpler word, like <b>milk</b> or <b>atta</b>.
              </li>
            )}
            {typed >= MIN_CHARS &&
              items.map((s, i) => (
                <li
                  key={s.id}
                  id={`qh-s-${i}`}
                  role="option"
                  aria-selected={i === active}
                  className={`suggest__row ${i === active ? 'is-active' : ''}`}
                  style={{ animationDelay: `${i * 28}ms` }}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => choose(s.id)}
                  onMouseEnter={() => setActive(i)}
                >
                  <ProductImage product={s} className="suggest__thumb" />
                  <span className="suggest__text">
                    <span className="suggest__name">
                      <Highlighted text={s.name} ranges={s.highlights} />
                    </span>
                    <span className="suggest__meta">
                      {s.size}
                      {s.fromPrice != null && (
                        <>
                          {' '}
                          · from <strong>{rupee(s.fromPrice)}</strong>
                        </>
                      )}
                    </span>
                  </span>
                  <button
                    className="suggest__fill"
                    aria-label={`Fill search with ${s.name}`}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={(e) => {
                      e.stopPropagation();
                      setQuery(s.name);
                    }}
                  >
                    <ArrowUpLeft />
                  </button>
                </li>
              ))}
          </ul>
        )}
      </div>

      <div className="home__below">
        {recent.length > 0 && (
          <section className="block">
            <div className="block__head">
              <h2>
                <ClockIcon /> Recently compared
              </h2>
              <button
                className="link"
                onClick={() => {
                  clearRecent();
                  setRecent([]);
                }}
              >
                Clear
              </button>
            </div>
            <div className="chips">
              {recent.map((p) => (
                <button key={p.id} className="chip" onClick={() => choose(p.id)}>
                  <span>{p.emoji}</span>
                  {p.name.length > 22 ? p.name.slice(0, 21) + '…' : p.name}
                </button>
              ))}
            </div>
          </section>
        )}

        <section className="block">
          <div className="block__head">
            <h2>
              <TrendIcon /> Trending near you
            </h2>
          </div>
          <div className="grid">
            {trending === null
              ? Array.from({ length: 6 }, (_, i) => <span key={i} className="tile tile--skeleton shimmer" />)
              : trending.map((p, i) => (
                  <button key={p.id} className="tile" style={{ animationDelay: `${i * 50}ms` }} onClick={() => choose(p.id)}>
                    <ProductImage product={p} className="tile__img" />
                    <span className="tile__name">{p.name}</span>
                    <span className="tile__meta">
                      {p.size}
                      {p.fromPrice != null && <strong>{rupee(p.fromPrice)}</strong>}
                    </span>
                  </button>
                ))}
          </div>
        </section>

        <p className="footnote">QuickHai doesn't sell anything. Prices are sample data in this build.</p>
      </div>
    </main>
  );
}
