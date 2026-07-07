"use client";

import Link from "next/link";
import { memo, useEffect, useMemo } from "react";
import { usePathname, useRouter } from "next/navigation";
import { usePerformanceFlags } from "@/lib/performance/performance-context";
import { prefetchRoute, useSmartPrefetch } from "@/lib/performance/smart-prefetch";
import { MusicNavIcon } from "./MusicNavIcon";
import type { MusicNavIconName, MusicNavItemConfig } from "./musicNavTypes";

const WALLET_HREF = "/wallet";

interface MusicBottomNavProps {
  items: readonly MusicNavItemConfig[];
  isActive: (href: string, pathname: string) => boolean;
  deferWalletPrefetch?: boolean;
  shortLabels?: Record<string, string>;
}

function MusicBottomNavView({
  items,
  isActive,
  deferWalletPrefetch = false,
  shortLabels = {},
}: MusicBottomNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { routePrefetchEnabled } = usePerformanceFlags();

  const prefetchHrefs = useMemo(
    () =>
      items
        .map((item) => item.href)
        .filter((href) => href !== WALLET_HREF || !deferWalletPrefetch),
    [items, deferWalletPrefetch],
  );
  const { prefetchOnHover } = useSmartPrefetch(prefetchHrefs, { enabled: routePrefetchEnabled });

  useEffect(() => {
    if (deferWalletPrefetch || !routePrefetchEnabled) return;
    prefetchRoute(router, WALLET_HREF);
  }, [deferWalletPrefetch, routePrefetchEnabled, router]);

  return (
    <nav className="music-bottom-nav" aria-label="Navigation principale">
      {items.map((item) => {
        const active = isActive(item.href, pathname);
        const deferWallet = item.href === WALLET_HREF && deferWalletPrefetch;
        const linkPrefetch = routePrefetchEnabled && !deferWallet;
        const label = shortLabels[item.href] ?? item.label;

        return (
          <Link
            key={item.href}
            href={item.href}
            prefetch={linkPrefetch}
            onTouchStart={() => {
              if (!deferWallet) prefetchOnHover(item.href);
            }}
            onMouseEnter={() => prefetchOnHover(item.href)}
            onFocus={() => prefetchOnHover(item.href)}
            className={`music-bottom-nav__item${active ? " music-bottom-nav__item--active" : ""}`}
            aria-current={active ? "page" : undefined}
          >
            <span className="music-bottom-nav__icon">
              <MusicNavIcon name={item.icon as MusicNavIconName} size={20} />
            </span>
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

export const MusicBottomNav = memo(MusicBottomNavView);
