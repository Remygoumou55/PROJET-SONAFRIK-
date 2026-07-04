"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { CreatorNavEntry } from "../lib/creatorNavConfig";

function isNavActive(href: string, exact: boolean | undefined, pathname: string): boolean {
  if (exact) return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

interface CreatorSidebarProps {
  navEntries: CreatorNavEntry[];
}

export function CreatorSidebar({ navEntries }: CreatorSidebarProps) {
  const pathname = usePathname();

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
            return <div key={`sep-${i}`} className="cs-nav-sep" role="separator" aria-hidden="true" />;
          }
          if (!("href" in entry)) return null;
          const active = isNavActive(entry.href, entry.exact, pathname);
          return (
            <Link
              key={entry.href}
              href={entry.href}
              className={`cs-nav-item${active ? " cs-nav-item--active" : ""}`}
              aria-current={active ? "page" : undefined}
            >
              <span className="cs-nav-icon" aria-hidden="true">{entry.icon}</span>
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
