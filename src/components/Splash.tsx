import { useEffect, useState } from 'react';
import { LogoMark } from './Logo';
import { PLATFORMS, PLATFORM_ORDER } from '../data/platforms';
import { PlatformBadge } from './PlatformBadge';

export function Splash({ onDone }: { onDone: () => void }) {
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const t1 = setTimeout(() => setLeaving(true), reduce ? 400 : 1700);
    const t2 = setTimeout(onDone, reduce ? 500 : 2150);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [onDone]);

  return (
    <div className={`splash ${leaving ? 'is-leaving' : ''}`} role="status" aria-label="Loading QuickHai">
      <div className="splash__glow" />
      <div className="splash__logo">
        <LogoMark size={88} />
      </div>
      <h1 className="splash__title">
        Quick<span>Hai</span>
      </h1>
      <p className="splash__tag">One search. Every quick-commerce price.</p>
      <div className="splash__badges">
        {PLATFORM_ORDER.map((id, i) => (
          <span key={id} style={{ animationDelay: `${700 + i * 90}ms` }}>
            <PlatformBadge platform={PLATFORMS[id]} size={30} />
          </span>
        ))}
      </div>
    </div>
  );
}
