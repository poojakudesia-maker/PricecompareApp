import type { Platform, PlatformId } from '../../../shared/platforms.ts';
import type { Product } from '../../catalog/catalog.ts';
import type { AdapterContext, AdapterResult, PlatformAdapter } from '../types.ts';

// Deterministic sample data. Prices depend on product, platform AND pincode,
// so changing your pincode in the profile visibly changes results.

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) / 4294967295;
}

const DISCOUNT_BIAS: Record<PlatformId, number> = {
  zepto: 0.07,
  blinkit: 0.06,
  amazonnow: 0.09,
  bbdaily: 0.04,
  milkbasket: 0.02,
};

/** What we'd type into the platform's own search box. */
export function searchTerm(p: Product): string {
  const hasBrand = p.brand === 'Fresh' || p.name.toLowerCase().startsWith(p.brand.toLowerCase());
  return hasBrand ? p.name : `${p.brand} ${p.name}`;
}

export function mockOffer(p: Product, platform: Platform, pincode: string): AdapterResult {
  const id = platform.id;
  const url = platform.searchUrl(searchTerm(p));
  if (p.notListedOn?.includes(id)) return { availability: 'not_listed', price: null, eta: platform.eta, url };
  if (p.outOfStockOn?.includes(id)) return { availability: 'out_of_stock', price: null, eta: platform.eta, url };

  const r = hash(`${p.id}:${id}:${pincode}`);
  const swing = p.mrp < 40 ? 0.04 : 0.12;
  const discount = Math.max(0, DISCOUNT_BIAS[id] + (r - 0.5) * swing);
  const price = Math.max(1, Math.round(p.mrp * (1 - discount)));
  const eta = platform.scheduled ? platform.eta : `${Math.round(8 + r * 10)} mins`;
  return { availability: 'in_stock', price, eta, url };
}

export function createMockAdapter(platform: Platform): PlatformAdapter {
  return {
    platform,
    async fetchOffer(product: Product, ctx: AdapterContext) {
      // Simulate a network call so timeouts and loading states behave realistically.
      await new Promise<void>((resolve, reject) => {
        const t = setTimeout(resolve, 150 + hash(platform.id + product.id) * 500);
        ctx.signal.addEventListener('abort', () => {
          clearTimeout(t);
          reject(new Error('aborted'));
        });
      });
      return mockOffer(product, platform, ctx.pincode);
    },
  };
}
