// API contract between server and client.
import type { PlatformId } from './platforms.ts';

export interface ProductSummary {
  id: string;
  name: string;
  brand: string;
  size: string;
  category: string;
  emoji: string;
  tint: string;
  /** Product photo when we have one; the client falls back to the emoji tile. */
  image?: string;
  mrp: number;
}

export interface SuggestionItem extends ProductSummary {
  /** [start, end) ranges in `name` that matched what the user typed. */
  highlights: [number, number][];
  fromPrice: number | null;
}

/** 'unknown' means the platform didn't answer in time; we say so rather than guess. */
export type Availability = 'in_stock' | 'out_of_stock' | 'not_listed' | 'unknown';

export interface Offer {
  platformId: PlatformId;
  availability: Availability;
  price: number | null;
  mrp: number;
  eta: string;
  /** Product (or search) page on the platform's website. */
  url: string;
}

export interface Comparison {
  product: ProductSummary;
  offers: Offer[];
  bestPlatformId: PlatformId | null;
  maxSaving: number;
  pincode: string;
  fetchedAt: string;
  /** Server decides when an ad is due (every 5th comparison per user). */
  showAd: boolean;
}

export interface Profile {
  name: string;
  email: string;
  pincode: string;
}

export interface User {
  id: string;
  phone: string;
  profile: Profile | null;
  createdAt: string;
}

export interface ApiError {
  error: string;
  /** Machine-readable code, e.g. 'invalid_phone', 'otp_expired'. */
  code: string;
}
