import type { Platform } from '../../shared/platforms.ts';
import type { Product } from '../catalog/catalog.ts';
import type { Availability } from '../../shared/types.ts';

export interface AdapterContext {
  pincode: string;
  signal: AbortSignal;
}

export interface AdapterResult {
  availability: Exclude<Availability, 'unknown'>;
  price: number | null;
  eta: string;
  /** Product page if the adapter knows it, otherwise the platform's search page. */
  url: string;
}

/**
 * One adapter per platform. Each one owns how it gets data for that platform:
 * a partner/affiliate feed, a catalogue file the platform shares, or a fetcher
 * you run yourself. The aggregator only cares about this interface.
 */
export interface PlatformAdapter {
  platform: Platform;
  fetchOffer(product: Product, ctx: AdapterContext): Promise<AdapterResult>;
}
