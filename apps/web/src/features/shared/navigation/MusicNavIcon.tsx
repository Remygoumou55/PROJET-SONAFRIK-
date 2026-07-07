import type { ReactNode } from "react";
import type { MusicNavIconName } from "./musicNavTypes";

const STROKE = 1.75;

interface Props {
  name: MusicNavIconName;
  size?: number;
  className?: string;
}

function Svg({ children, size }: { children: ReactNode; size: number }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={STROKE}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

const ICONS: Record<MusicNavIconName, (size: number) => ReactNode> = {
  home: (s) => (
    <Svg size={s}>
      <path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1z" />
    </Svg>
  ),
  search: (s) => (
    <Svg size={s}>
      <circle cx="11" cy="11" r="7" />
      <path d="M16.5 16.5 21 21" />
    </Svg>
  ),
  library: (s) => (
    <Svg size={s}>
      <path d="M5 19V6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v13" />
      <path d="M5 19h4" />
      <path d="M13.5 19V9l6.5 2v8" />
      <path d="M13.5 19h6.5" />
    </Svg>
  ),
  wallet: (s) => (
    <Svg size={s}>
      <path d="M3 7.5A2.5 2.5 0 0 1 5.5 5H19a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5.5A2.5 2.5 0 0 1 3 16.5z" />
      <path d="M17 12h.01" />
    </Svg>
  ),
  profile: (s) => (
    <Svg size={s}>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
    </Svg>
  ),
  overview: (s) => (
    <Svg size={s}>
      <rect x="4" y="4" width="7" height="7" rx="1.5" />
      <rect x="13" y="4" width="7" height="7" rx="1.5" />
      <rect x="4" y="13" width="7" height="7" rx="1.5" />
      <rect x="13" y="13" width="7" height="7" rx="1.5" />
    </Svg>
  ),
  publish: (s) => (
    <Svg size={s}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8v8M8 12h8" />
    </Svg>
  ),
  publications: (s) => (
    <Svg size={s}>
      <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
    </Svg>
  ),
  analytics: (s) => (
    <Svg size={s}>
      <path d="M4 19V5M4 19h16M8 17V11M12 17V7M16 17v-4" />
    </Svg>
  ),
  settings: (s) => (
    <Svg size={s}>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2" />
    </Svg>
  ),
  help: (s) => (
    <Svg size={s}>
      <circle cx="12" cy="12" r="9" />
      <path d="M9.5 9a2.5 2.5 0 0 1 4.2 1.8c0 1.8-2.2 2-2.2 3.7M12 17h.01" />
    </Svg>
  ),
  dashboard: (s) => (
    <Svg size={s}>
      <path d="M4 4h7v9H4zM13 4h7v5h-7zM13 11h7v9h-7zM4 15h7v5H4z" />
    </Svg>
  ),
  users: (s) => (
    <Svg size={s}>
      <path d="M16 19v-1a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v1" />
      <circle cx="9" cy="7" r="3" />
      <path d="M22 19v-1a3 3 0 0 0-2-2.83M16 3.13a3 3 0 0 1 0 5.74" />
    </Svg>
  ),
  artists: (s) => (
    <Svg size={s}>
      <path d="M12 14a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" />
      <path d="M6 20v-1a6 6 0 0 1 12 0v1" />
      <path d="M19 8v6M22 11h-6" />
    </Svg>
  ),
  catalog: (s) => (
    <Svg size={s}>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="2.5" />
      <path d="M12 3v2M12 19v2M3 12h2M19 12h2" />
    </Svg>
  ),
  rights: (s) => (
    <Svg size={s}>
      <path d="M12 3v18M7 8h10M7 16h10M5 8l2-3h10l2 3" />
    </Svg>
  ),
  revenue: (s) => (
    <Svg size={s}>
      <path d="M12 2v20M17 7H9.5a3.5 3.5 0 0 0 0 7H14a3.5 3.5 0 0 1 0 7H6" />
    </Svg>
  ),
  withdrawals: (s) => (
    <Svg size={s}>
      <rect x="3" y="6" width="18" height="12" rx="2" />
      <path d="M3 10h18M7 15h.01M11 15h2" />
    </Svg>
  ),
  beatstore: (s) => (
    <Svg size={s}>
      <path d="M9 18V6l12-2v12" />
      <circle cx="7" cy="18" r="3" />
      <circle cx="19" cy="16" r="3" />
    </Svg>
  ),
  awards: (s) => (
    <Svg size={s}>
      <path d="M8 4h8l1 4H7l1-4zM12 17v3M9 21h6" />
      <path d="M7 8h10v4a5 5 0 0 1-10 0V8z" />
    </Svg>
  ),
  audit: (s) => (
    <Svg size={s}>
      <path d="M8 6h13M8 12h13M8 18h10M3 6h.01M3 12h.01M3 18h.01" />
    </Svg>
  ),
  health: (s) => (
    <Svg size={s}>
      <path d="M20.8 11.2a7 7 0 1 0-13.6 0" />
      <path d="M12 11v4M10 13h4" />
    </Svg>
  ),
  live: (s) => (
    <Svg size={s}>
      <circle cx="12" cy="12" r="2" fill="currentColor" stroke="none" />
      <path d="M8.5 8.5a5 5 0 0 0 0 7M15.5 8.5a5 5 0 0 1 0 7M5 5a9 9 0 0 0 0 14M19 5a9 9 0 0 1 0 14" />
    </Svg>
  ),
  fraud: (s) => (
    <Svg size={s}>
      <path d="M12 3 4 7v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V7l-8-4z" />
    </Svg>
  ),
  flags: (s) => (
    <Svg size={s}>
      <path d="M5 21V4M5 4h12l-2 3 2 3H5" />
    </Svg>
  ),
  account: (s) => (
    <Svg size={s}>
      <rect x="4" y="4" width="16" height="16" rx="2" />
      <circle cx="12" cy="10" r="2.5" />
      <path d="M8 17c.5-2 2.2-3 4-3s3.5 1 4 3" />
    </Svg>
  ),
  security: (s) => (
    <Svg size={s}>
      <rect x="5" y="11" width="14" height="10" rx="2" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
    </Svg>
  ),
  notifications: (s) => (
    <Svg size={s}>
      <path d="M15 17H9l-1-2H6a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4h-2l-1 2z" />
      <path d="M10 20a2 2 0 0 0 4 0" />
    </Svg>
  ),
  payment: (s) => (
    <Svg size={s}>
      <rect x="3" y="6" width="18" height="12" rx="2" />
      <path d="M3 10h18" />
    </Svg>
  ),
  preferences: (s) => (
    <Svg size={s}>
      <path d="M4 6h16M4 12h16M4 18h10" />
      <circle cx="18" cy="18" r="2" />
    </Svg>
  ),
  back: (s) => (
    <Svg size={s}>
      <path d="M19 12H5M12 5l-7 7 7 7" />
    </Svg>
  ),
};

export function MusicNavIcon({ name, size = 20, className = "music-nav__icon" }: Props) {
  return <span className={className}>{ICONS[name](size)}</span>;
}
