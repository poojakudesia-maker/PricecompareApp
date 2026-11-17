import { CATALOG, PRODUCTS_BY_ID, type Product } from './catalog';
import { PLATFORMS, PLATFORM_ORDER, type Platform, type PlatformId } from './platforms';

export type Availability = 'in_stock' | 'out_of_stock' | 'not_listed';

export interface Offer {
  platform: Platform;
  availability: Availability;
  price: number | null;
  mrp: number;
  eta: string;
  url: string;
}

export interface Comparison {
  product: Product;
  offers: Offer[];
  best: Offer | null;
  /** Gap between the cheapest and dearest in-stock price. */
  maxSaving: number;
  fetchedAt: Date;
}

/**
 * MOCK DATA SOURCE.
 * None of these platforms publish a public pricing API, and prices vary by
 * pincode and dark store. This module generates stable, believable prices so
 * the UI can be built end to end. Replace `fetchComparison` with a call to
 * your own backend (which does the per-platform fetching) and the UI won't
 * need to change.
 */

// Small deterministic hash so a product's price on a platform is stable across reloads.
function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) / 4294967295;
}

// Rough "personality" per platform: typical discount off MRP.
const DISCOUNT_BIAS: Record<PlatformId, number> = {
  zepto: 0.07,
  blinkit: 0.06,
  amazonnow: 0.09,
  bbdaily: 0.04,
  milkbasket: 0.02,
};

function buildOffer(p: Product, id: PlatformId): Offer {
  const platform = PLATFORMS[id];
  const url = platform.searchUrl(`${p.brand === 'Fresh' ? '' : p.brand + ' '}${p.name}`.trim());
  const base = { platform, mrp: p.mrp, eta: platform.eta, url };

  if (p.notListedOn?.includes(id)) return { ...base, availability: 'not_listed', price: null };
  if (p.outOfStockOn?.includes(id)) return { ...base, availability: 'out_of_stock', price: null };

  const r = hash(`${p.id}:${id}`);
  // Low-priced dairy staples barely move; everything else swings a bit more.
  const swing = p.mrp < 40 ? 0.04 : 0.12;
  const discount = Math.max(0, DISCOUNT_BIAS[id] + (r - 0.5) * swing);
  const price = Math.max(1, Math.round(p.mrp * (1 - discount)));
  const eta = platform.scheduled ? platform.eta : `${Math.round(8 + r * 10)} mins`;
  return { ...base, availability: 'in_stock', price, eta };
}

const rank: Record<Availability, number> = { in_stock: 0, out_of_stock: 1, not_listed: 2 };

// Minutes until delivery, so equal prices are broken by whoever arrives first.
const etaMinutes = (o: Offer) => (o.platform.scheduled ? 24 * 60 : parseInt(o.eta, 10) || 60);

export async function fetchComparison(productId: string, signal?: AbortSignal): Promise<Comparison> {
  const product = PRODUCTS_BY_ID[productId];
  if (!product) throw new Error('Product not found');

  // Simulated network latency so loading states are visible.
  await new Promise<void>((resolve, reject) => {
    const t = setTimeout(resolve, 650 + Math.random() * 450);
    signal?.addEventListener('abort', () => {
      clearTimeout(t);
      reject(new DOMException('Aborted', 'AbortError'));
    });
  });

  const offers = PLATFORM_ORDER.map((id) => buildOffer(product, id)).sort(
    (a, b) =>
      rank[a.availability] - rank[b.availability] || (a.price ?? 0) - (b.price ?? 0) || etaMinutes(a) - etaMinutes(b)
  );
  const inStock = offers.filter((o) => o.availability === 'in_stock');
  const best = inStock[0] ?? null;
  const maxSaving = inStock.length > 1 ? inStock[inStock.length - 1].price! - best!.price! : 0;
  return { product, offers, best, maxSaving, fetchedAt: new Date() };
}

/** Cheapest in-stock price, synchronously, for suggestion rows. */
export function lowestPrice(productId: string): number | null {
  const p = PRODUCTS_BY_ID[productId];
  if (!p) return null;
  const prices = PLATFORM_ORDER.map((id) => buildOffer(p, id).price).filter((x): x is number => x != null);
  return prices.length ? Math.min(...prices) : null;
}

export const ALL_PRODUCTS = CATALOG;
