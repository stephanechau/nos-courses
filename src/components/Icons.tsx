type P = { size?: number; color?: string; width?: number };

const base = (size: number, color: string, width: number) => ({
  width: size,
  height: size,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: color,
  strokeWidth: width,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true
});

export const MicIcon = ({ size = 24, color = '#fff', width = 2.2 }: P) => (
  <svg {...base(size, color, width)}>
    <rect x="9" y="3" width="6" height="11" rx="3" />
    <path d="M5 11a7 7 0 0 0 14 0" />
    <path d="M12 18v3" />
  </svg>
);
export const PlusIcon = ({ size = 20, color = '#5C6664', width = 2.2 }: P) => (
  <svg {...base(size, color, width)}>
    <path d="M12 5v14M5 12h14" />
  </svg>
);
export const CheckIcon = ({ size = 14, color = '#fff', width = 3.2 }: P) => (
  <svg {...base(size, color, width)}>
    <path d="M5 12l5 5L20 7" />
  </svg>
);
export const CloseIcon = ({ size = 18, color = '#0B5453', width = 2.6 }: P) => (
  <svg {...base(size, color, width)}>
    <path d="M6 6l12 12M18 6L6 18" />
  </svg>
);
export const BackIcon = ({ size = 20, color = '#0B5453', width = 2.6 }: P) => (
  <svg {...base(size, color, width)}>
    <path d="M15 5l-7 7 7 7" />
  </svg>
);
export const BellIcon = ({ size = 20, color = '#fff', width = 2.2 }: P) => (
  <svg {...base(size, color, width)}>
    <path d="M6 16V11a6 6 0 0 1 12 0v5l2 2H4z" />
    <path d="M10 20a2 2 0 0 0 4 0" />
  </svg>
);
export const BasketIcon = ({ size = 20, color = '#fff', width = 2 }: P) => (
  <svg {...base(size, color, width)}>
    <path d="M3 9h18l-2 11H5z" />
    <path d="M8 9l4-6 4 6" />
  </svg>
);
export const PathIcon = ({ d, size = 20, color, width = 2 }: P & { d: string; color: string }) => (
  <svg {...base(size, color, width)}>
    <path d={d} />
  </svg>
);
