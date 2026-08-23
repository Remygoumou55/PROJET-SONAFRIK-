
import { memo } from "react";
import { MusicMobilePillNav, type MusicMobileNavItem } from "@/features/shared/navigation";
import { IDENTITY_NAV_ENTRIES, isIdentityNavActive } from "../lib/identityNavConfig";

interface IdentityMobileNavProps {
  activePath: string;
  unreadNotifications?: number;
}

function IdentityMobileNavView({ activePath, unreadNotifications = 0 }: IdentityMobileNavProps) {
  const items: MusicMobileNavItem[] = IDENTITY_NAV_ENTRIES.map((item) => ({
    href: item.href,
    label: item.shortLabel,
    icon: item.icon,
    exact: item.exact,
    badge:
      item.href === "/settings/notifications" && unreadNotifications > 0
        ? unreadNotifications
        : undefined,
  }));

  return (
    <MusicMobilePillNav
      items={items}
      activePath={activePath}
      ariaLabel="Navigation profil et paramÃ¨tres"
      isActive={isIdentityNavActive}
    />
  );
}

export const IdentityMobileNav = memo(IdentityMobileNavView);
