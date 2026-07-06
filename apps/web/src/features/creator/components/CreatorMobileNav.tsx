"use client";

import Link from "next/link";
import { memo, useEffect, useMemo, useState } from "react";
import { getCreatorNavLinks, type CreatorNavEntry } from "../lib/creatorNavConfig";
import { useSmartPrefetch } from "@/lib/performance/smart-prefetch";

interface CreatorMobileNavProps {
  activePath: string;
  navEntries: CreatorNavEntry[];
}

function isActive(href: string, activePath: string, exact?: boolean): boolean {
  if (exact) return activePath === href;
  return activePath === href || activePath.startsWith(`${href}/`);
}

function CreatorMobileNavView({ activePath, navEntries }: CreatorMobileNavProps) {
  const [pendingHref, setPendingHref] = useState<string | null>(null);
  const links = getCreatorNavLinks(navEntries);
  const navHrefs = useMemo(() => links.map((link) => link.href), [links]);
  const { prefetchOnHover } = useSmartPrefetch(navHrefs);

  useEffect(() => {
    setPendingHref(null);
  }, [activePath]);

  return (
    <nav className="creator-mobile-nav" aria-label="Navigation espace artiste">
      <div className="creator-mobile-nav__scroll">
        {links.map((item) => {
          const active = isActive(item.href, activePath, item.exact);
          const pending = pendingHref === item.href && !active;
          return (
            <Link
              key={item.href}
              href={item.href}
              prefetch
              scroll
              className={`creator-mobile-nav__pill${active ? " creator-mobile-nav__pill--active" : ""}${pending ? " creator-mobile-nav__pill--pending" : ""}`}
              aria-current={active ? "page" : undefined}
              aria-busy={pending || undefined}
              onClick={() => {
                if (!active) setPendingHref(item.href);
              }}
              onTouchStart={() => prefetchOnHover(item.href)}
              onMouseEnter={() => prefetchOnHover(item.href)}
              onFocus={() => prefetchOnHover(item.href)}
            >
              <span className="creator-mobile-nav__icon" aria-hidden="true">
                {item.icon}
              </span>
              <span className="creator-mobile-nav__label">{item.label}</span>
              {item.badge && item.badge > 0 ? (
                <span className="creator-mobile-nav__badge" aria-label={`${item.badge} en attente`}>
                  {item.badge}
                </span>
              ) : null}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export const CreatorMobileNav = memo(CreatorMobileNavView);
