"use client";

import type { ListenerSidebarData } from "@sonafrik/types";
import { usePathname } from "next/navigation";
import { RecentlyPlayedSection } from "./RecentlyPlayedSection";
import { QuickPlaylists } from "./QuickPlaylists";
import { SidebarMiniPlayer } from "./SidebarMiniPlayer";
import { LISTENER_NAV_ITEMS, SidebarNavItem } from "./SidebarNavItem";

function isNavActive(href: string, pathname: string): boolean {
  if (href === "/listen") {
    return pathname === "/listen" || pathname.startsWith("/listen/");
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

function BrandLogo() {
  return (
    <div className="ls-logo">
      <div className="ls-logo-brand">
        SON<span className="ls-logo-accent">A</span>FRIK
      </div>
      <div className="ls-logo-slogan">Notre Bien Commun</div>
    </div>
  );
}

interface ListenerDesktopSidebarProps {
  sidebarData: ListenerSidebarData;
}

export function ListenerDesktopSidebar({ sidebarData }: ListenerDesktopSidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      className="listener-sidebar hidden md:flex"
      role="navigation"
      aria-label="Navigation musicale SONAFRIK"
    >
      <BrandLogo />

      <nav className="ls-nav" aria-label="Menu principal">
        {LISTENER_NAV_ITEMS.map((item) => (
          <SidebarNavItem
            key={item.href}
            href={item.href}
            icon={item.icon}
            label={item.label}
            isActive={isNavActive(item.href, pathname)}
          />
        ))}
      </nav>

      <div className="ls-divider" role="separator" />

      <RecentlyPlayedSection tracks={sidebarData.recentTracks} />
      <QuickPlaylists
        favoritesCount={sidebarData.favoritesCount}
        downloadsCount={sidebarData.downloadsCount}
      />

      <div className="ls-spacer" />

      <SidebarMiniPlayer />
    </aside>
  );
}
