// Shared by the server (pricing adapters) and the client (badges, opening apps).
// Keep this file free of imports so Node can load it without a build step.

export type PlatformId = 'zepto' | 'blinkit' | 'amazonnow' | 'bbdaily' | 'milkbasket';

export interface Platform {
  id: PlatformId;
  name: string;
  /** Short monogram shown in the badge. We don't ship third-party logos. */
  mono: string;
  bg: string;
  fg: string;
  /** Typical delivery promise. */
  eta: string;
  /** Subscription-style services deliver next morning rather than in minutes. */
  scheduled: boolean;
  /** Android application id, used to open the installed app. */
  androidPackage: string;
  /**
   * How to open the app on Android:
   *  'url'    – hand the product's https URL to the app (it handles App Links for its domain).
   *  'launch' – the app has no public web product links, so open it on its home screen.
   */
  androidOpen: 'url' | 'launch';
  /** Web search page, used as the product link until an adapter returns a real product URL. */
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
    androidPackage: 'com.zeptoconsumerapp',
    androidOpen: 'url',
    searchUrl: (q) => `https://www.zepto.com/search?query=${encodeURIComponent(q)}`,
  },
  blinkit: {
    id: 'blinkit',
    name: 'Blinkit',
    mono: 'b',
    bg: '#F8CB46',
    fg: '#0C831F',
    eta: '12 mins',
    scheduled: false,
    androidPackage: 'com.grofers.customerapp',
    androidOpen: 'url',
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
    // Amazon Now lives inside the main Amazon Shopping app.
    androidPackage: 'in.amazon.mShop.android.shopping',
    androidOpen: 'url',
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
    androidPackage: 'com.raincan.android.hybrid',
    androidOpen: 'launch',
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
    androidPackage: 'com.milkbasket.app',
    androidOpen: 'launch',
    searchUrl: () => 'https://www.milkbasket.com/',
  },
};

export const PLATFORM_ORDER: PlatformId[] = ['zepto', 'blinkit', 'amazonnow', 'bbdaily', 'milkbasket'];
