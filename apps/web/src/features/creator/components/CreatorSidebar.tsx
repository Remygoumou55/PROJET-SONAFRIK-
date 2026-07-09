"use client";

import { usePathname } from "next/navigation";
import {
  MusicSidebar,
  MusicNavFromSections,
  groupCreatorNavEntries,
  getCreatorNavLinks,
  type CreatorNavEntry,
} from "@/features/shared/navigation";
import { useSmartPrefetch } from "@/lib/performance/smart-prefetch";
import { useMemo } from "react";

function isNavActive(href: string, pathname: string, exact?: boolean): boolean {
  if (exact) return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

interface CreatorSidebarProps {
  navEntries: CreatorNavEntry[];
}

export function CreatorSidebar({ navEntries }: CreatorSidebarProps) {
  const pathname = usePathname();
  const sections = useMemo(() => groupCreatorNavEntries(navEntries), [navEntries]);
  const navHrefs = useMemo(() => getCreatorNavLinks(navEntries).map((l) => l.href), [navEntries]);
  const { prefetchOnHover } = useSmartPrefetch(navHrefs);

  return (
    <MusicSidebar
      role="artist"
      ariaLabel="Navigation artiste"
      className="music-sidebar--creator"
    >
      <MusicNavFromSections
        sections={sections}
        pathname={pathname}
        ariaLabel="Menu artiste"
        isActive={isNavActive}
        onPrefetch={prefetchOnHover}
      />
    </MusicSidebar>
  );
}

export function getCreatorSidebarPrefetchHrefs(navEntries: CreatorNavEntry[]): string[] {
  return getCreatorNavLinks(navEntries).map((link) => link.href);
}
