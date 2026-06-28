"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ADMIN_NAV_SECTIONS,
  type AdminNavBadgeKind,
  type AdminNavItem,
} from "../lib/admin-nav";

export interface AdminNavBadges {
  content?: number;
  moderation?: number;
  withdrawals?: number;
}

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
  if (item.href === "/admin/catalog" && badges.content && badges.content > 0) {
    return { kind: "pending", label: String(badges.content) };
  }
  if (item.href === "/admin/moderation" && badges.moderation && badges.moderation > 0) {
    return { kind: "alert", label: String(badges.moderation) };
  }
  if (item.href === "/admin/fraud" && badges.moderation && badges.moderation > 0) {
    return { kind: "alert", label: String(badges.moderation) };
  }
  if (item.href === "/admin/withdrawals" && badges.withdrawals && badges.withdrawals > 0) {
    return { kind: "pending", label: String(badges.withdrawals) };
  }
  if (item.badge === "live") return { kind: "live", label: "live" };
  if (item.badge === "alert") return { kind: "alert", label: "!" };
  if (item.badge === "pending") return { kind: "pending", label: "•" };
  return null;
}

export function AdminSidebar({ badges = {} }: AdminSidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="admin-sidebar" aria-label="Navigation admin">
      <div className="admin-sidebar-logo">
        <p className="admin-logo-brand">
          SON<span className="admin-logo-accent">AFRIK</span>
        </p>
        <span className="admin-logo-badge">Super Admin</span>
      </div>

      <Link href="/listen" className="admin-sidebar-back">
        ← Retour à l&apos;app
      </Link>

      {ADMIN_NAV_SECTIONS.map((section) => (
        <div key={section.title} className="admin-nav-section">
          <span className="admin-nav-section-title">{section.title}</span>
          {section.items.map((item) => {
            const active = isNavActive(pathname, item.href);
            const badge = resolveBadge(item, badges);
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
