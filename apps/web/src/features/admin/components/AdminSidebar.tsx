"use client";

import { usePathname } from "next/navigation";
import type { AdminNavBadges } from "@sonafrik/api/admin";
import { useAdminNavBadges } from "@/features/shared/ldse/admin/AdminLdseProvider";
import { useSmartPrefetch } from "@/lib/performance/smart-prefetch";
import {
  MusicSidebar,
  MusicNavBackLink,
  MusicNavFromSections,
  type MusicNavBadgeKind,
} from "@/features/shared/navigation";
import {
  buildAdminNavSections,
  type AdminNavItem,
  type AdminNavFeatureFlags,
} from "../lib/admin-nav";

interface AdminSidebarProps {
  badges?: AdminNavBadges;
  onNavigate?: () => void;
  featureFlags?: AdminNavFeatureFlags;
  storyPulse?: string;
}

function isNavActive(pathname: string, href: string): boolean {
  if (href === "/admin") return pathname === "/admin";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function resolveBadge(
  item: AdminNavItem,
  badges: AdminNavBadges,
): { kind: MusicNavBadgeKind; label: string | number } | null {
  if (item.href === "/admin/catalog" && badges.content > 0) {
    return { kind: "pending", label: badges.content };
  }
  if (item.href === "/admin/rights" && badges.pendingRightsClaims > 0) {
    return { kind: "alert", label: badges.pendingRightsClaims };
  }
  if (item.href === "/admin/fraud" && badges.fraudSessions > 0) {
    return { kind: "alert", label: badges.fraudSessions };
  }
  if (item.href === "/admin/finance" && badges.withdrawals > 0) {
    return { kind: "pending", label: badges.withdrawals };
  }
  if (item.badge === "live") {
    return { kind: "live", label: "live" };
  }
  return null;
}

export function AdminSidebar({ badges, onNavigate, featureFlags, storyPulse }: AdminSidebarProps) {
  const pathname = usePathname();
  const liveBadges = useAdminNavBadges(badges);
  const navSections = buildAdminNavSections(featureFlags);
  const navHrefs = navSections.flatMap((section) => section.items.map((item) => item.href));
  const { prefetchOnHover } = useSmartPrefetch(navHrefs);

  const sections = navSections.map((section) => ({
    title: section.title,
    items: section.items.map((item) => ({
      href: item.href,
      label: item.label,
      icon: item.icon,
    })),
  }));

  return (
    <MusicSidebar
      id="admin-sidebar-nav"
      role="admin"
      ariaLabel="Navigation admin"
      className="music-sidebar--admin"
      storyPulse={storyPulse}
      footer={<span>SONAFRIK Admin · v1.0</span>}
    >
      <MusicNavBackLink href="/listen" label="Retour à l'app" onNavigate={onNavigate} />
      <MusicNavFromSections
        sections={sections}
        pathname={pathname}
        ariaLabel="Modules admin"
        isActive={(href, path) => isNavActive(path, href)}
        resolveBadge={(item) => {
          const adminItem = navSections
            .flatMap((s) => s.items)
            .find((i) => i.href === item.href);
          if (!adminItem) return null;
          return resolveBadge(adminItem, liveBadges);
        }}
        onNavigate={onNavigate}
        onPrefetch={prefetchOnHover}
      />
    </MusicSidebar>
  );
}
