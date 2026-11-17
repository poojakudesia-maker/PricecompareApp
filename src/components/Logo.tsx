export function LogoMark({ size = 40 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 512 512" aria-hidden="true">
      <defs>
        <linearGradient id="qh-g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#8B5CF6" />
          <stop offset="1" stopColor="#6D28D9" />
        </linearGradient>
      </defs>
      <rect width="512" height="512" rx="112" fill="url(#qh-g)" />
      <circle cx="232" cy="232" r="104" fill="none" stroke="#fff" strokeWidth="40" />
      <path d="M306 306 L388 388" stroke="#fff" strokeWidth="44" strokeLinecap="round" />
      <path d="M248 168 L204 244 H252 L216 300" fill="none" stroke="#FDE047" strokeWidth="26" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
