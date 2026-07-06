"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { getCreatorNavLinks, type CreatorNavEntry } from "../lib/creatorNavConfig";
import { useSmartPrefetch } from "@/lib/performance/smart-prefetch";

function isNavActive(href: string, exact: boolean | undefined, pathname: string): boolean {
  if (exact) return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

interface CreatorSidebarProps {
  navEntries: CreatorNavEntry[];
}

export function CreatorSidebar({ navEntries }: CreatorSidebarProps) {
  const pathname = usePathname();
  const [pendingHref, setPendingHref] = useState<string | null>(null);
  const links = getCreatorNavLinks(navEntries);
  const navHrefs = useMemo(() => links.map((link) => link.href), [links]);
  const { prefetchOnHover } = useSmartPrefetch(navHrefs);

  useEffect(() => {
    setPendingHref(null);
  }, [pathname]);

  return (
    <aside className="cs-sidebar" role="navigation" aria-label="Navigation artiste">
      <div className="cs-logo">
        <span className="cs-logo-brand">
          SON<span className="cs-logo-accent">A</span>FRIK
        </span>
        <span className="cs-logo-sub">Espace Artiste</span>
      </div>

      <nav className="cs-nav" aria-label="Menu artiste">
        {navEntries.map((entry, i) => {
          if ("type" in entry && entry.type === "section") {
            return (
              <div
                key={`sep-${i}`}
                className="cs-nav-sep"
                role="separator"
                aria-hidden="true"
              />
            );
          }
          if (!("href" in entry)) return null;

          const active = isNavActive(entry.href, entry.exact, pathname);
          const pending = pendingHref === entry.href && !active;

          return (
            <Link
              key={entry.href}
              href={entry.href}
              prefetch
              scroll
              className={`cs-nav-item${active ? " cs-nav-item--active" : ""}${pending ? " cs-nav-item--pending" : ""}`}
              aria-current={active ? "page" : undefined}
              aria-busy={pending || undefined}
              onClick={() => {
                if (!active) setPendingHref(entry.href);
              }}
              onMouseEnter={() => prefetchOnHover(entry.href)}
              onFocus={() => prefetchOnHover(entry.href)}
            >
              <span className="cs-nav-icon" aria-hidden="true">
                {entry.icon}
              </span>
              <span>{entry.label}</span>
              {entry.badge && entry.badge > 0 ? (
                <span className="cs-nav-badge" aria-label={`${entry.badge} en attente`}>
                  {entry.badge}
                </span>
              ) : null}
            </Link>
          );
        })}
      </nav>

      <div className="cs-spacer" />
    </aside>
  );
}
