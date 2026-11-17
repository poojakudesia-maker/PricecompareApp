import type { Platform } from '../data/platforms';

export function PlatformBadge({ platform, size = 40 }: { platform: Platform; size?: number }) {
  return (
    <span
      className="pbadge"
      title={platform.name}
      style={{
        width: size,
        height: size,
        background: platform.bg,
        color: platform.fg,
        fontSize: size * (platform.mono.length > 1 ? 0.36 : 0.48),
      }}
    >
      {platform.mono}
    </span>
  );
}
