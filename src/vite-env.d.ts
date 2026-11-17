/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** AdSense publisher id, e.g. ca-pub-1234567890123456 */
  readonly VITE_ADSENSE_CLIENT?: string;
  /** AdSense display ad unit slot id */
  readonly VITE_ADSENSE_SLOT?: string;
}
