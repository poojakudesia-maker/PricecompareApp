import { PLATFORMS, PLATFORM_ORDER, type PlatformId } from '../../shared/platforms.ts';
import type { Comparison, Offer } from '../../shared/types.ts';
import { toSummary, type Product } from '../catalog/catalog.ts';
import { createMockAdapter, mockOffer, searchTerm } from './adapters/mock.ts';
import type { PlatformAdapter } from './types.ts';

// Register adapters here. To go live with a platform, write e.g. adapters/blinkit.ts
// implementing PlatformAdapter and swap it in for the mock below.
const ADAPTERS: Record<PlatformId, PlatformAdapter> = {
  zepto: createMockAdapter(PLATFORMS.zepto),
  blinkit: createMockAdapter(PLATFORMS.blinkit),
  amazonnow: createMockAdapter(PLATFORMS.amazonnow),
  bbdaily: createMockAdapter(PLATFORMS.bbdaily),
  milkbasket: createMockAdapter(PLATFORMS.milkbasket),
};

const ADAPTER_TIMEOUT_MS = 2500;
const CACHE_TTL_MS = 5 * 60 * 1000;

type Cached = { at: number; value: Omit<Comparison, 'showAd'> };
const cache = new Map<string, Cached>();

const RANK = { in_stock: 0, out_of_stock: 1, not_listed: 2, unknown: 3 } as const;
const etaMinutes = (o: Offer) => (PLATFORMS[o.platformId].scheduled ? 24 * 60 : parseInt(o.eta, 10) || 60);

async function fetchOne(product: Product, id: PlatformId, pincode: string): Promise<Offer> {
  const platform = PLATFORMS[id];
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), ADAPTER_TIMEOUT_MS);
  try {
    const r = await ADAPTERS[id].fetchOffer(product, { pincode, signal: ctrl.signal });
    return { platformId: id, mrp: product.mrp, ...r };
  } catch (err) {
    // One slow or broken platform must never sink the whole comparison.
    console.warn(`[pricing] ${id} failed for ${product.id}:`, (err as Error).message);
    return {
      platformId: id,
      availability: 'unknown',
      price: null,
      mrp: product.mrp,
      eta: platform.eta,
      url: platform.searchUrl(searchTerm(product)),
    };
  } finally {
    clearTimeout(timer);
  }
}

export async function compare(product: Product, pincode: string): Promise<Omit<Comparison, 'showAd'>> {
  const key = `${product.id}:${pincode}`;
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < CACHE_TTL_MS) return hit.value;

  const offers = await Promise.all(PLATFORM_ORDER.map((id) => fetchOne(product, id, pincode)));
  offers.sort(
    (a, b) =>
      RANK[a.availability] - RANK[b.availability] || (a.price ?? 0) - (b.price ?? 0) || etaMinutes(a) - etaMinutes(b)
  );
  const inStock = offers.filter((o) => o.availability === 'in_stock');
  const value = {
    product: toSummary(product),
    offers,
    bestPlatformId: inStock[0]?.platformId ?? null,
    maxSaving: inStock.length > 1 ? inStock[inStock.length - 1].price! - inStock[0].price! : 0,
    pincode,
    fetchedAt: new Date().toISOString(),
  };
  cache.set(key, { at: Date.now(), value });
  if (cache.size > 5000) cache.delete(cache.keys().next().value!);
  return value;
}

/**
 * Cheap "from ₹X" for suggestion rows, without hitting every platform.
 * Uses the cached comparison when there is one; with live adapters this should
 * read from a price index that a background job keeps warm.
 */
export function fromPrice(product: Product, pincode: string): number | null {
  const hit = cache.get(`${product.id}:${pincode}`);
  if (hit && Date.now() - hit.at < CACHE_TTL_MS) {
    const best = hit.value.offers.find((o) => o.platformId === hit.value.bestPlatformId);
    return best?.price ?? null;
  }
  const prices = PLATFORM_ORDER.map((id) => mockOffer(product, PLATFORMS[id], pincode).price).filter(
    (x): x is number => x != null
  );
  return prices.length ? Math.min(...prices) : null;
}
