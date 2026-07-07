"use client";

import Link from "next/link";
import { memo, useEffect, useMemo, useState } from "react";
import { useSmartPrefetch } from "@/lib/performance/smart-prefetch";
import { MusicNavIcon } from "./MusicNavIcon";
import { MusicNavBadge } from "./MusicNavBadge";
import type { MusicNavIconName } from "./musicNavTypes";

export interface MusicMobileNavItem {
  href: string;
  label: string;
  icon: MusicNavIconName;
  exact?: boolean;
  badge?: number;
}

interface MusicMobilePillNavProps {
  items: MusicMobileNavItem[];
  activePath: string;
  ariaLabel: string;
  className?: string;
  isActive?: (href: string, activePath: string, exact?: boolean) => boolean;
}

function defaultIsActive(href: string, activePath: string, exact?: boolean): boolean {
  if (exact) return activePath === href;
  return activePath === href || activePath.startsWith(`${href}/`);
}

function MusicMobilePillNavView({
  items,
  activePath,
  ariaLabel,
  className = "",
  isActive = defaultIsActive,
}: MusicMobilePillNavProps) {
  const [pendingHref, setPendingHref] = useState<string | null>(null);
  const navHrefs = useMemo(() => items.map((item) => item.href), [items]);
  const { prefetchOnHover } = useSmartPrefetch(navHrefs);

  useEffect(() => {
    setPendingHref(null);
  }, [activePath]);

  return (
    <nav className={`music-mobile-nav${className ? ` ${className}` : ""}`} aria-label={ariaLabel}>
      <div className="music-mobile-nav__scroll">
        {items.map((item) => {
          const active = isActive(item.href, activePath, item.exact);
          const pending = pendingHref === item.href && !active;
          return (
            <Link
              key={item.href}
              href={item.href}
              prefetch
              scroll
              className={`music-mobile-nav__pill${active ? " music-mobile-nav__pill--active" : ""}${pending ? " music-mobile-nav__pill--pending" : ""}`}
              aria-current={active ? "page" : undefined}
              aria-busy={pending || undefined}
              onClick={() => {
                if (!active) setPendingHref(item.href);
              }}
              onTouchStart={() => prefetchOnHover(item.href)}
              onMouseEnter={() => prefetchOnHover(item.href)}
              onFocus={() => prefetchOnHover(item.href)}
            >
              <MusicNavIcon name={item.icon} size={16} />
              <span>{item.label}</span>
              {item.badge && item.badge > 0 ? (
                <MusicNavBadge kind="pending" label={item.badge} />
              ) : null}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export const MusicMobilePillNav = memo(MusicMobilePillNavView);
