"use client";

import { memo } from "react";
import { usePerformanceFlags } from "@/lib/performance/performance-context";
import { useSmartPrefetch } from "@/lib/performance/smart-prefetch";
import { useAfterLCP } from "../hooks/useAfterLCP";
import {
  MusicNavLink,
  isListenerNavActive,
  type MusicNavIconName,
} from "@/features/shared/navigation";

const WALLET_HREF = "/wallet";

export const LISTENER_NAV_ITEMS = [
  { href: "/listen", label: "Accueil", icon: "home" as const },
  { href: "/search", label: "Explorer", icon: "search" as const },
  { href: "/library", label: "Bibliothèque", icon: "library" as const },
  { href: "/wallet", label: "Wallet", icon: "wallet" as const },
  { href: "/profile", label: "Profil", icon: "profile" as const },
] as const;

export type ListenerNavIcon = MusicNavIconName;

interface SidebarNavItemProps {
  href: string;
  icon: MusicNavIconName;
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
    <MusicNavLink
      href={href}
      label={label}
      icon={icon}
      active={isActive}
      prefetch={prefetchEnabled}
      onMouseEnter={() => prefetchOnHover(href)}
      onFocus={() => prefetchOnHover(href)}
    />
  );
});

export { isListenerNavActive };
