import type { Platform } from '../../shared/platforms.ts';

const isAndroid = () => /Android/i.test(navigator.userAgent);

/**
 * Link that opens the platform's app if it's installed, otherwise its website.
 *
 * Android: an intent:// URL naming the app's package. Chrome opens the app when it's
 * installed and goes to browser_fallback_url when it isn't.
 * iOS / desktop: the plain https link. On iOS, apps that register Universal Links for
 * that domain open directly; otherwise Safari shows the web page.
 */
export function appLink(platform: Platform, webUrl: string): { href: string; newTab: boolean } {
  if (!isAndroid()) return { href: webUrl, newTab: true };

  const pkg = platform.androidPackage;
  if (platform.androidOpen === 'url') {
    const u = new URL(webUrl);
    const fallback = encodeURIComponent(webUrl);
    return {
      href: `intent://${u.host}${u.pathname}${u.search}#Intent;scheme=https;package=${pkg};S.browser_fallback_url=${fallback};end`,
      newTab: false,
    };
  }
  // No public product links for this app: open it on its home screen, or its Play Store page.
  const store = encodeURIComponent(`https://play.google.com/store/apps/details?id=${pkg}`);
  return {
    href: `intent:#Intent;action=android.intent.action.MAIN;category=android.intent.category.LAUNCHER;package=${pkg};S.browser_fallback_url=${store};end`,
    newTab: false,
  };
}
