"use client";

import { useMemo } from "react";
import {
  MusicMobilePillNav,
  getCreatorNavLinks,
  type CreatorNavEntry,
  type MusicMobileNavItem,
} from "@/features/shared/navigation";

interface CreatorMobileNavProps {
  activePath: string;
  navEntries: CreatorNavEntry[];
}

function isActive(href: string, activePath: string, exact?: boolean): boolean {
  if (exact) return activePath === href;
  return activePath === href || activePath.startsWith(`${href}/`);
}

export function CreatorMobileNav({ activePath, navEntries }: CreatorMobileNavProps) {
  const items = useMemo<MusicMobileNavItem[]>(
    () =>
      getCreatorNavLinks(navEntries).map((link) => ({
        href: link.href,
        label: link.label,
        icon: link.icon,
        exact: link.exact,
        badge: link.badge,
      })),
    [navEntries],
  );

  return (
    <MusicMobilePillNav
      items={items}
      activePath={activePath}
      ariaLabel="Navigation espace artiste"
      className="music-mobile-nav--creator"
      isActive={isActive}
    />
  );
}
