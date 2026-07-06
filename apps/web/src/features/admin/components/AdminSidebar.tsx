"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { AdminNavBadges } from "@sonafrik/api/admin";
import { useAdminNavBadges } from "@/features/shared/ldse/admin/AdminLdseProvider";
import { useSmartPrefetch } from "@/lib/performance/smart-prefetch";
import {
  buildAdminNavSections,
  type AdminNavBadgeKind,
  type AdminNavItem,
  type AdminNavFeatureFlags,
} from "../lib/admin-nav";

interface AdminSidebarProps {
  badges?: AdminNavBadges;
  onNavigate?: () => void;
  featureFlags?: AdminNavFeatureFlags;
}

function isNavActive(pathname: string, href: string): boolean {
  if (href === "/admin") return pathname === "/admin";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function resolveBadge(
  item: AdminNavItem,
  badges: AdminNavBadges,
): { kind: AdminNavBadgeKind; label: string } | null {
  if (item.href === "/admin/catalog" && badges.content > 0) {
    return { kind: "pending", label: String(badges.content) };
  }
  if (item.href === "/admin/rights" && badges.pendingRightsClaims > 0) {
    return { kind: "alert", label: String(badges.pendingRightsClaims) };
  }
  if (item.href === "/admin/fraud" && badges.fraudSessions > 0) {
    return { kind: "alert", label: String(badges.fraudSessions) };
  }
  if (item.href === "/admin/finance" && badges.withdrawals > 0) {
    return { kind: "pending", label: String(badges.withdrawals) };
  }
  if (item.badge === "live") {
    return { kind: "live", label: "live" };
  }
  return null;
}

export function AdminSidebar({ badges, onNavigate, featureFlags }: AdminSidebarProps) {
  const pathname = usePathname();
  const liveBadges = useAdminNavBadges(badges);
  const resolvedBadges = liveBadges;
  const navSections = buildAdminNavSections(featureFlags);
  const navHrefs = navSections.flatMap((section) => section.items.map((item) => item.href));
  const { prefetchOnHover } = useSmartPrefetch(navHrefs);

  return (
    <aside id="admin-sidebar-nav" className="admin-sidebar" aria-label="Navigation admin">
      <div className="admin-sidebar-logo">
        <p className="admin-logo-brand">
          SON<span className="admin-logo-accent">AFRIK</span>
        </p>
        <span className="admin-logo-badge">Back-office</span>
      </div>

      <Link href="/listen" className="admin-sidebar-back" onClick={onNavigate}>
        ← Retour à l&apos;app
      </Link>

      {navSections.map((section) => (
        <div key={section.title} className="admin-nav-section">
          <span className="admin-nav-section-title">{section.title}</span>
          {section.items.map((item) => {
            const active = isNavActive(pathname, item.href);
            const badge = resolveBadge(item, resolvedBadges);
            return (
              <Link
                key={item.href}
                href={item.href}
                prefetch
                onClick={onNavigate}
                onMouseEnter={() => prefetchOnHover(item.href)}
                onFocus={() => prefetchOnHover(item.href)}
                className={`admin-nav-item${active ? " admin-nav-item--active" : ""}`}
                aria-current={active ? "page" : undefined}
              >
                <span className="admin-nav-icon" aria-hidden="true">
                  {item.icon}
                </span>
                {item.label}
                {badge ? (
                  <span className={`admin-nav-badge admin-nav-badge--${badge.kind}`}>
                    {badge.label}
                  </span>
                ) : null}
              </Link>
            );
          })}
        </div>
      ))}

      <div className="admin-sidebar-footer">SONAFRIK Admin · v1.0</div>
    </aside>
  );
}
