import { useEffect, useState } from 'react';
import { PlatformBadge } from './PlatformBadge';
import { ProductImage } from './ProductImage';
import { AdSlot } from './AdSlot';
import { BackIcon, BoltIcon, ChevronRight, ClockIcon, CrownIcon, PinIcon, ShareIcon } from './Icons';
import { PLATFORMS } from '../../shared/platforms.ts';
import type { Comparison, Offer } from '../../shared/types.ts';
import { api, ApiError } from '../api';
import { appLink } from '../lib/openApp';
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
      setV(Math.round(from + (target - from) * (1 - Math.pow(1 - k, 3))));
      if (k < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, ms]);
  return v;
}

const STATUS: Record<Offer['availability'], [string, string]> = {
  in_stock: ['In stock', 'pill--ok'],
  out_of_stock: ['Out of stock', 'pill--warn'],
  not_listed: ['Not listed', 'pill--muted'],
  unknown: ["Couldn't check", 'pill--muted'],
};

function OfferRow({ offer, isBest, maxPrice, index }: { offer: Offer; isBest: boolean; maxPrice: number; index: number }) {
  const platform = PLATFORMS[offer.platformId];
  const available = offer.availability === 'in_stock';
  const off = available && offer.price! < offer.mrp ? Math.round(((offer.mrp - offer.price!) / offer.mrp) * 100) : 0;
  const width = available && maxPrice ? Math.max(18, (offer.price! / maxPrice) * 100) : 0;
  const { href, newTab } = appLink(platform, offer.url);

  return (
    <li style={{ animationDelay: `${index * 70}ms` }} className="offer-wrap">
      <a
        className={`offer ${isBest ? 'is-best' : ''} ${available ? '' : 'is-unavailable'}`}
        href={href}
        target={newTab ? '_blank' : undefined}
        rel="noopener noreferrer"
        aria-label={`Open ${platform.name}${available ? `, ${rupee(offer.price!)}` : ''}`}
      >
        <PlatformBadge platform={platform} size={44} />
        <div className="offer__main">
          <div className="offer__top">
            <span className="offer__name">{platform.name}</span>
            {isBest && (
              <span className="tag-best">
                <CrownIcon size={12} /> Lowest
              </span>
            )}
          </div>
          <div className="offer__sub">
            {available ? (
              <>
                {platform.scheduled ? <ClockIcon size={13} /> : <BoltIcon size={13} />}
                {offer.eta}
              </>
            ) : (
              <span className={`pill ${STATUS[offer.availability][1]}`}>{STATUS[offer.availability][0]}</span>
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
            </>
          ) : null}
          <span className="offer__go">
            Open app <ChevronRight size={12} />
          </span>
        </div>
      </a>
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
  const [data, setData] = useState<Comparison | null>(null);
  const [error, setError] = useState<{ message: string; notFound: boolean } | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    window.scrollTo(0, 0);
    setData(null);
    setError(null);
    const ctrl = new AbortController();
    api
      .compare(id, ctrl.signal)
      .then((d) => {
        setData(d);
        pushRecent({ id: d.product.id, name: d.product.name, emoji: d.product.emoji });
      })
      .catch((e: ApiError) => e.name !== 'AbortError' && setError({ message: e.message, notFound: e.status === 404 }));
    return () => ctrl.abort();
  }, [id, attempt]);

  const best = data?.offers.find((o) => o.platformId === data.bestPlatformId) ?? null;
  const bestPrice = useCountUp(best?.price ?? null);

  if (error?.notFound) {
    return (
      <main className="pdp pdp--missing">
        <p>{error.message}</p>
        <button className="btn" onClick={() => (location.hash = '#/')}>
          Back to search
        </button>
      </main>
    );
  }

  const product = data?.product;

  const share = async () => {
    if (!product) return;
    const text = best
      ? `${product.name} (${product.size}) is cheapest on ${PLATFORMS[best.platformId].name} at ${rupee(best.price!)}`
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
        <button className="iconbtn" onClick={share} aria-label="Share" disabled={!product}>
          <ShareIcon />
        </button>
      </div>

      {product ? (
        <section className="phero">
          <ProductImage product={product} className="phero__img" />
          <div className="phero__info">
            <span className="phero__brand">{product.brand === 'Fresh' ? product.category : product.brand}</span>
            <h1>{product.name}</h1>
            <span className="phero__size">
              {product.size} · MRP {rupee(product.mrp)}
            </span>
          </div>
        </section>
      ) : (
        !error && (
          <section className="phero">
            <span className="phero__img shimmer sk" />
            <div className="phero__info" style={{ flex: 1 }}>
              <span className="sk sk--line shimmer" style={{ width: '30%' }} />
              <span className="sk sk--line shimmer" style={{ width: '80%', height: 18 }} />
              <span className="sk sk--line shimmer" style={{ width: '40%' }} />
            </div>
          </section>
        )
      )}

      {error && (
        <div className="error">
          {error.message}
          <button className="btn" onClick={() => setAttempt((a) => a + 1)}>
            Retry
          </button>
        </div>
      )}

      {!data && !error && <Skeleton />}

      {data && (
        <>
          {best ? (
            <section className="best">
              <div className="best__label">Best price</div>
              <div className="best__row">
                <div className="best__price">{rupee(bestPrice)}</div>
                <div className="best__where">
                  <PlatformBadge platform={PLATFORMS[best.platformId]} size={28} />
                  <span>
                    on <b>{PLATFORMS[best.platformId].name}</b>
                    <small>{best.eta}</small>
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
              <p>None of the 5 apps have this in stock at your pincode. Check back in a bit.</p>
            </section>
          )}

          <div className="list-head">
            <h2>All platforms</h2>
            <button className="list-head__pin" onClick={go.profile}>
              <PinIcon size={12} /> {data.pincode}
            </button>
          </div>
          <p className="list-sub">
            {inStock.length} of {data.offers.length} available · tap any app to open it
          </p>
          <ul className="offers">
            {data.offers.map((o, i) => (
              <OfferRow key={o.platformId} offer={o} isBest={o.platformId === data.bestPlatformId} maxPrice={maxPrice} index={i} />
            ))}
          </ul>

          {data.showAd && <AdSlot />}

          <p className="footnote">
            Sample prices · checked {new Date(data.fetchedAt).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })}. We don't
            sell anything; you buy in the app you choose.
          </p>
        </>
      )}

      {toast && <div className="toast">{toast}</div>}
    </main>
  );
}
