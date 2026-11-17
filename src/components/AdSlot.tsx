import { useEffect, useRef } from 'react';

const CLIENT = import.meta.env.VITE_ADSENSE_CLIENT;
const SLOT = import.meta.env.VITE_ADSENSE_SLOT;

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

let scriptAdded = false;
function loadAdSense() {
  if (scriptAdded || !CLIENT) return;
  scriptAdded = true;
  const s = document.createElement('script');
  s.async = true;
  s.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${CLIENT}`;
  s.crossOrigin = 'anonymous';
  document.head.appendChild(s);
}

/**
 * In-content AdSense display unit. Shown inline in the results (not as a pop-up),
 * which keeps it within AdSense placement policy. Without VITE_ADSENSE_CLIENT /
 * VITE_ADSENSE_SLOT it renders a placeholder so the layout can be checked.
 */
export function AdSlot() {
  const ref = useRef<HTMLModElement>(null);

  useEffect(() => {
    if (!CLIENT || !SLOT) return;
    loadAdSense();
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {
      /* ad blockers throw here; the slot just stays empty */
    }
  }, []);

  return (
    <aside className="ad" aria-label="Advertisement">
      <span className="ad__label">Sponsored</span>
      {CLIENT && SLOT ? (
        <ins
          ref={ref}
          className="adsbygoogle"
          style={{ display: 'block' }}
          data-ad-client={CLIENT}
          data-ad-slot={SLOT}
          data-ad-format="auto"
          data-full-width-responsive="true"
        />
      ) : (
        <div className="ad__placeholder">
          Google AdSense unit
          <small>Set VITE_ADSENSE_CLIENT and VITE_ADSENSE_SLOT to show real ads</small>
        </div>
      )}
    </aside>
  );
}
