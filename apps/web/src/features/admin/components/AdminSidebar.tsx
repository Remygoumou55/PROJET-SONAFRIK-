"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { AdminNavBadges } from "@sonafrik/api/admin";
import {
  ADMIN_NAV_SECTIONS,
  type AdminNavBadgeKind,
  type AdminNavItem,
} from "../lib/admin-nav";

interface AdminSidebarProps {
  badges?: AdminNavBadges;
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

export function AdminSidebar({ badges }: AdminSidebarProps) {
  const pathname = usePathname();
  const resolvedBadges: AdminNavBadges = badges ?? {
    content: 0,
    pendingRightsClaims: 0,
    fraudSessions: 0,
    withdrawals: 0,
  };

  return (
    <aside className="admin-sidebar" aria-label="Navigation admin">
      <div className="admin-sidebar-logo">
        <p className="admin-logo-brand">
          SON<span className="admin-logo-accent">AFRIK</span>
        </p>
        <span className="admin-logo-badge">Back-office</span>
      </div>

      <Link href="/listen" className="admin-sidebar-back">
        ← Retour à l&apos;app
      </Link>

      {ADMIN_NAV_SECTIONS.map((section) => (
        <div key={section.title} className="admin-nav-section">
          <span className="admin-nav-section-title">{section.title}</span>
          {section.items.map((item) => {
            const active = isNavActive(pathname, item.href);
            const badge = resolveBadge(item, resolvedBadges);
            return (
              <Link
                key={item.href}
                href={item.href}
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
