export type PlatformId = 'zepto' | 'blinkit' | 'amazonnow' | 'bbdaily' | 'milkbasket';

export interface Platform {
  id: PlatformId;
  name: string;
  /** Short monogram shown in the badge. We don't ship third-party logos. */
  mono: string;
  /** Badge background and foreground. */
  bg: string;
  fg: string;
  /** Typical delivery promise, used when an offer doesn't override it. */
  eta: string;
  /** Subscription-style services deliver next morning rather than in minutes. */
  scheduled: boolean;
  searchUrl: (q: string) => string;
}

export const PLATFORMS: Record<PlatformId, Platform> = {
  zepto: {
    id: 'zepto',
    name: 'Zepto',
    mono: 'Z',
    bg: '#5B1E9F',
    fg: '#FFFFFF',
    eta: '10 mins',
    scheduled: false,
    searchUrl: (q) => `https://www.zeptonow.com/search?query=${encodeURIComponent(q)}`,
  },
  blinkit: {
    id: 'blinkit',
    name: 'Blinkit',
    mono: 'b',
    bg: '#F8CB46',
    fg: '#0C831F',
    eta: '12 mins',
    scheduled: false,
    searchUrl: (q) => `https://blinkit.com/s/?q=${encodeURIComponent(q)}`,
  },
  amazonnow: {
    id: 'amazonnow',
    name: 'Amazon Now',
    mono: 'a',
    bg: '#232F3E',
    fg: '#FF9900',
    eta: '15 mins',
    scheduled: false,
    searchUrl: (q) => `https://www.amazon.in/s?k=${encodeURIComponent(q)}`,
  },
  bbdaily: {
    id: 'bbdaily',
    name: 'BB Daily',
    mono: 'bb',
    bg: '#84C225',
    fg: '#FFFFFF',
    eta: 'Tomorrow, 7 AM',
    scheduled: true,
    searchUrl: (q) => `https://www.bigbasket.com/ps/?q=${encodeURIComponent(q)}`,
  },
  milkbasket: {
    id: 'milkbasket',
    name: 'Milkbasket',
    mono: 'm',
    bg: '#E11D48',
    fg: '#FFFFFF',
    eta: 'Tomorrow, 7 AM',
    scheduled: true,
    searchUrl: (q) => `https://www.milkbasket.com/search?q=${encodeURIComponent(q)}`,
  },
};

export const PLATFORM_ORDER: PlatformId[] = ['zepto', 'blinkit', 'amazonnow', 'bbdaily', 'milkbasket'];
