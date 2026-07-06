"use client";

import Link from "next/link";
import { memo } from "react";
import { usePerformanceFlags } from "@/lib/performance/performance-context";
import { useSmartPrefetch } from "@/lib/performance/smart-prefetch";
import { useAfterLCP } from "../hooks/useAfterLCP";

const WALLET_HREF = "/wallet";

export const LISTENER_NAV_ITEMS = [
  { href: "/listen", label: "Accueil", icon: "home" as const },
  { href: "/search", label: "Explorer", icon: "search" as const },
  { href: "/library", label: "Bibliothèque", icon: "library" as const },
  { href: "/wallet", label: "Wallet", icon: "wallet" as const },
  { href: "/profile", label: "Profil", icon: "profile" as const },
] as const;

export type ListenerNavIcon = (typeof LISTENER_NAV_ITEMS)[number]["icon"];

const NavIcon = memo(function NavIcon({
  icon,
  size = 18,
}: {
  icon: ListenerNavIcon;
  size?: number;
}) {
  if (icon === "home") {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M3 12L12 4l9 8" />
        <path d="M5 10v9a1 1 0 001 1h4v-5h4v5h4a1 1 0 001-1v-9" />
      </svg>
    );
  }
  if (icon === "search") {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
        <circle cx="11" cy="11" r="7" />
        <path d="M16.5 16.5L21 21" />
      </svg>
    );
  }
  if (icon === "library") {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
        <path d="M4 19V6a1 1 0 011-1h3a1 1 0 011 1v13" />
        <path d="M4 19h6" />
        <path d="M12.5 19V9.5l8 2.5V19" />
        <path d="M12.5 19h8" />
        <circle cx="7" cy="3.5" r="1" fill="currentColor" stroke="none" />
      </svg>
    );
  }
  if (icon === "wallet") {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M19 7V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
        <path d="M3 7h18" />
        <path d="M16 12h2a2 2 0 0 1 0 4h-2" />
      </svg>
    );
  }
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
    </svg>
  );
});

interface SidebarNavItemProps {
  href: string;
  icon: ListenerNavIcon;
  label: string;
  isActive: boolean;
}

export const SidebarNavItem = memo(function SidebarNavItem({
  href,
  icon,
  label,
  isActive,
}: SidebarNavItemProps) {
  const { routePrefetchEnabled } = usePerformanceFlags();
  const lcpReady = useAfterLCP();
  const deferWalletPrefetch = href === WALLET_HREF && !lcpReady;
  const prefetchEnabled = routePrefetchEnabled && !deferWalletPrefetch;
  const { prefetchOnHover } = useSmartPrefetch([href], { enabled: prefetchEnabled, idle: false });

  return (
    <Link
      href={href}
      prefetch={prefetchEnabled}
      className={`ls-nav-item${isActive ? " ls-nav-item--active" : ""}`}
      aria-current={isActive ? "page" : undefined}
      onMouseEnter={() => prefetchOnHover(href)}
      onFocus={() => prefetchOnHover(href)}
    >
      <span className="ls-nav-icon">
        <NavIcon icon={icon} />
      </span>
      <span className="ls-nav-label">{label}</span>
    </Link>
  );
});
