type P = { size?: number };
const base = (size: number) => ({ width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, 'aria-hidden': true });

export const SearchIcon = ({ size = 20 }: P) => (<svg {...base(size)}><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>);
export const CloseIcon = ({ size = 18 }: P) => (<svg {...base(size)}><path d="M18 6 6 18M6 6l12 12" /></svg>);
export const BackIcon = ({ size = 22 }: P) => (<svg {...base(size)}><path d="M15 18l-6-6 6-6" /></svg>);
export const ClockIcon = ({ size = 16 }: P) => (<svg {...base(size)}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>);
export const TrendIcon = ({ size = 16 }: P) => (<svg {...base(size)}><path d="M3 17l6-6 4 4 8-8" /><path d="M14 7h7v7" /></svg>);
export const ArrowUpLeft = ({ size = 18 }: P) => (<svg {...base(size)}><path d="M17 17 7 7M7 15V7h8" /></svg>);
export const BoltIcon = ({ size = 14 }: P) => (<svg {...base(size)}><path d="M13 2 4 14h7l-1 8 9-12h-7z" /></svg>);
export const ExternalIcon = ({ size = 14 }: P) => (<svg {...base(size)}><path d="M14 4h6v6M20 4l-9 9M19 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h5" /></svg>);
export const ShareIcon = ({ size = 20 }: P) => (<svg {...base(size)}><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><path d="m8.6 13.5 6.8 4M15.4 6.5l-6.8 4" /></svg>);
export const CrownIcon = ({ size = 14 }: P) => (<svg {...base(size)}><path d="M3 7l4 4 5-6 5 6 4-4-2 11H5z" /></svg>);
