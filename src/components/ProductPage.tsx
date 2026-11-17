import { useEffect, useState } from 'react';
import { PlatformBadge } from './PlatformBadge';
import { BackIcon, BoltIcon, ClockIcon, CrownIcon, ExternalIcon, ShareIcon } from './Icons';
import { PRODUCTS_BY_ID } from '../data/catalog';
import { fetchComparison, type Comparison, type Offer } from '../data/priceService';
import { pushRecent } from '../lib/recent';
import { go, rupee } from '../lib/router';

function useCountUp(target: number | null, ms = 600) {
  const [v, setV] = useState(target ?? 0);
  useEffect(() => {
    if (target == null) return;
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return setV(target);
    const start = performance.now();
    const from = Math.round(target * 1.25);
    let raf = 0;
    const tick = (t: number) => {
      const k = Math.min(1, (t - start) / ms);
      const eased = 1 - Math.pow(1 - k, 3);
      setV(Math.round(from + (target - from) * eased));
      if (k < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, ms]);
  return v;
}

function StatusPill({ offer }: { offer: Offer }) {
  if (offer.availability === 'in_stock') return <span className="pill pill--ok">In stock</span>;
  if (offer.availability === 'out_of_stock') return <span className="pill pill--warn">Out of stock</span>;
  return <span className="pill pill--muted">Not listed</span>;
}

function OfferRow({ offer, isBest, maxPrice, index }: { offer: Offer; isBest: boolean; maxPrice: number; index: number }) {
  const available = offer.availability === 'in_stock';
  const off = available && offer.price! < offer.mrp ? Math.round(((offer.mrp - offer.price!) / offer.mrp) * 100) : 0;
  const width = available && maxPrice ? Math.max(18, (offer.price! / maxPrice) * 100) : 0;

  return (
    <li className={`offer ${isBest ? 'is-best' : ''} ${available ? '' : 'is-unavailable'}`} style={{ animationDelay: `${index * 70}ms` }}>
      <PlatformBadge platform={offer.platform} size={44} />
      <div className="offer__main">
        <div className="offer__top">
          <span className="offer__name">{offer.platform.name}</span>
          {isBest && (
            <span className="tag-best">
              <CrownIcon size={12} /> Lowest
            </span>
          )}
        </div>
        <div className="offer__sub">
          {available ? (
            <>
              {offer.platform.scheduled ? <ClockIcon size={13} /> : <BoltIcon size={13} />}
              {offer.eta}
            </>
          ) : (
            <StatusPill offer={offer} />
          )}
        </div>
        {available && (
          <div className="offer__bar" aria-hidden="true">
            <span style={{ width: `${width}%`, animationDelay: `${200 + index * 70}ms` }} />
          </div>
        )}
      </div>
      <div className="offer__price">
        {available ? (
          <>
            <strong>{rupee(offer.price!)}</strong>
            {off > 0 && (
              <span className="offer__mrp">
                <s>{rupee(offer.mrp)}</s> <em>{off}% off</em>
              </span>
            )}
            <a className="offer__go" href={offer.url} target="_blank" rel="noopener noreferrer">
              Open <ExternalIcon size={12} />
            </a>
          </>
        ) : (
          <span className="offer__na">—</span>
        )}
      </div>
    </li>
  );
}

function Skeleton() {
  return (
    <>
      <div className="best best--skeleton shimmer" />
      <ul className="offers">
        {[0, 1, 2, 3, 4].map((i) => (
          <li key={i} className="offer offer--skeleton">
            <span className="sk sk--badge shimmer" />
            <span className="offer__main">
              <span className="sk sk--line shimmer" style={{ width: '45%' }} />
              <span className="sk sk--line shimmer" style={{ width: '28%' }} />
            </span>
            <span className="sk sk--price shimmer" />
          </li>
        ))}
      </ul>
    </>
  );
}

export function ProductPage({ id }: { id: string }) {
  const product = PRODUCTS_BY_ID[id];
  const [data, setData] = useState<Comparison | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (!product) return;
    pushRecent(id);
    window.scrollTo(0, 0);
    setData(null);
    setError(null);
    const ctrl = new AbortController();
    fetchComparison(id, ctrl.signal)
      .then(setData)
      .catch((e) => e.name !== 'AbortError' && setError('Could not load prices. Check your connection and try again.'));
    return () => ctrl.abort();
  }, [id, product]);

  const bestPrice = useCountUp(data?.best?.price ?? null);

  if (!product) {
    return (
      <main className="pdp pdp--missing">
        <p>We couldn't find that product.</p>
        <button className="btn" onClick={() => (location.hash = '#/')}>
          Back to search
        </button>
      </main>
    );
  }

  const share = async () => {
    const text = data?.best
      ? `${product.name} (${product.size}) is cheapest on ${data.best.platform.name} at ${rupee(data.best.price!)}`
      : product.name;
    try {
      if (navigator.share) await navigator.share({ title: 'QuickHai', text, url: location.href });
      else {
        await navigator.clipboard.writeText(`${text} ${location.href}`);
        setToast('Link copied');
        setTimeout(() => setToast(null), 1800);
      }
    } catch {
      /* user dismissed the share sheet */
    }
  };

  const inStock = data?.offers.filter((o) => o.availability === 'in_stock') ?? [];
  const maxPrice = Math.max(0, ...inStock.map((o) => o.price!));

  return (
    <main className="pdp">
      <div className="topbar">
        <button className="iconbtn" onClick={go.home} aria-label="Back">
          <BackIcon />
        </button>
        <span className="topbar__title">Compare prices</span>
        <button className="iconbtn" onClick={share} aria-label="Share">
          <ShareIcon />
        </button>
      </div>

      <section className="phero">
        <div className="phero__img" style={{ background: product.tint }}>
          <span>{product.emoji}</span>
        </div>
        <div className="phero__info">
          <span className="phero__brand">{product.brand === 'Fresh' ? product.category : product.brand}</span>
          <h1>{product.name}</h1>
          <span className="phero__size">{product.size} · MRP {rupee(product.mrp)}</span>
        </div>
      </section>

      {error && (
        <div className="error">
          {error}
          <button className="btn" onClick={() => location.reload()}>
            Retry
          </button>
        </div>
      )}

      {!data && !error && <Skeleton />}

      {data && (
        <>
          {data.best ? (
            <section className="best">
              <div className="best__label">Best price</div>
              <div className="best__row">
                <div className="best__price">{rupee(bestPrice)}</div>
                <div className="best__where">
                  <PlatformBadge platform={data.best.platform} size={28} />
                  <span>
                    on <b>{data.best.platform.name}</b>
                    <small>{data.best.eta}</small>
                  </span>
                </div>
              </div>
              {data.maxSaving > 0 && (
                <div className="best__save">
                  You save <b>{rupee(data.maxSaving)}</b> vs the costliest app
                </div>
              )}
            </section>
          ) : (
            <section className="best best--none">
              <div className="best__label">Not available right now</div>
              <p>None of the 5 apps have this in stock. Check back in a bit.</p>
            </section>
          )}

          <div className="list-head">
            <h2>All platforms</h2>
            <span>
              {inStock.length} of {data.offers.length} available
            </span>
          </div>
          <ul className="offers">
            {data.offers.map((o, i) => (
              <OfferRow key={o.platform.id} offer={o} isBest={o === data.best} maxPrice={maxPrice} index={i} />
            ))}
          </ul>
          <p className="footnote">
            Sample prices · updated {data.fetchedAt.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })}. Live prices vary by pincode.
          </p>
        </>
      )}

      {toast && <div className="toast">{toast}</div>}
    </main>
  );
}
