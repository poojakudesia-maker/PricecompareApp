import { useEffect, useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { LogoMark } from './Logo';
import { PlatformBadge } from './PlatformBadge';
import { ArrowUpLeft, ClockIcon, CloseIcon, SearchIcon, TrendIcon } from './Icons';
import { PRODUCTS_BY_ID, TRENDING_IDS } from '../data/catalog';
import { PLATFORMS, PLATFORM_ORDER } from '../data/platforms';
import { lowestPrice } from '../data/priceService';
import { suggest, type Suggestion } from '../lib/search';
import { clearRecent, getRecent } from '../lib/recent';
import { go, rupee } from '../lib/router';

function useDebounced<T>(value: T, ms: number) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}

function Highlighted({ text, ranges }: { text: string; ranges: [number, number][] }) {
  // Google-style: the part you typed stays regular, the completion is bold.
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

export function Home() {
  const [query, setQuery] = useState('');
  const [focused, setFocused] = useState(false);
  const [active, setActive] = useState(-1);
  const [recent, setRecent] = useState(getRecent);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounced = useDebounced(query, 90);

  const suggestions: Suggestion[] = useMemo(() => suggest(debounced), [debounced]);
  const open = focused && query.trim().length > 0;

  useEffect(() => setActive(-1), [debounced]);

  const choose = (id: string) => {
    inputRef.current?.blur();
    go.product(id);
  };

  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (!open) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, suggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, -1));
    } else if (e.key === 'Enter') {
      const pick = suggestions[active] ?? suggestions[0];
      if (pick) choose(pick.product.id);
    } else if (e.key === 'Escape') {
      inputRef.current?.blur();
    }
  };

  return (
    <main className={`home ${open ? 'is-searching' : ''}`}>
      <header className="home__hero">
        <div className="home__brand">
          <LogoMark size={34} />
          <span>
            Quick<em>Hai</em>
          </span>
        </div>
        <h1 className="home__headline">
          Find the cheapest cart
          <br />
          in under 10 seconds.
        </h1>
        <div className="home__platforms" aria-label="Platforms compared">
          {PLATFORM_ORDER.map((id) => (
            <PlatformBadge key={id} platform={PLATFORMS[id]} size={26} />
          ))}
          <span>5 apps compared</span>
        </div>
      </header>

      <div className="search">
        <div className={`search__box ${focused ? 'is-focused' : ''}`}>
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
          {query && (
            <button
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
        </div>

        {open && (
          <ul className="suggest" id="qh-suggest" role="listbox" key={debounced}>
            {suggestions.length === 0 && debounced === query && (
              <li className="suggest__empty">
                No match for “{query}”. Try a brand or a simpler word, like <b>milk</b> or <b>atta</b>.
              </li>
            )}
            {suggestions.map((s, i) => {
              const from = lowestPrice(s.product.id);
              return (
                <li
                  key={s.product.id}
                  id={`qh-s-${i}`}
                  role="option"
                  aria-selected={i === active}
                  className={`suggest__row ${i === active ? 'is-active' : ''}`}
                  style={{ animationDelay: `${i * 28}ms` }}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => choose(s.product.id)}
                  onMouseEnter={() => setActive(i)}
                >
                  <span className="suggest__thumb" style={{ background: s.product.tint }}>
                    {s.product.emoji}
                  </span>
                  <span className="suggest__text">
                    <span className="suggest__name">
                      <Highlighted text={s.product.name} ranges={s.highlights} />
                    </span>
                    <span className="suggest__meta">
                      {s.product.size}
                      {from != null && <> · from <strong>{rupee(from)}</strong></>}
                    </span>
                  </span>
                  <button
                    className="suggest__fill"
                    aria-label={`Fill search with ${s.product.name}`}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={(e) => {
                      e.stopPropagation();
                      setQuery(s.product.name);
                    }}
                  >
                    <ArrowUpLeft />
                  </button>
                </li>
              );
            })}
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
              {recent
                .map((id) => PRODUCTS_BY_ID[id])
                .filter(Boolean)
                .map((p) => (
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
            {TRENDING_IDS.map((id, i) => {
              const p = PRODUCTS_BY_ID[id];
              const from = lowestPrice(id);
              return (
                <button key={id} className="tile" style={{ animationDelay: `${i * 50}ms` }} onClick={() => choose(id)}>
                  <span className="tile__img" style={{ background: p.tint }}>
                    {p.emoji}
                  </span>
                  <span className="tile__name">{p.name}</span>
                  <span className="tile__meta">
                    {p.size}
                    {from != null && <strong>{rupee(from)}</strong>}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        <p className="footnote">Prices shown are sample data for this prototype.</p>
      </div>
    </main>
  );
}
