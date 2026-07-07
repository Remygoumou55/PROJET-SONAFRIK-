"use client";

import type { ListenerSidebarData } from "@sonafrik/types";
import { usePathname } from "next/navigation";
import {
  MusicSidebar,
  MusicNavMenu,
  MusicNavSection,
  LISTENER_NAV_SECTIONS,
  isListenerNavActive,
  type MusicNavItemConfig,
} from "@/features/shared/navigation";
import { RecentlyPlayedSection } from "./RecentlyPlayedSection";
import { QuickPlaylists } from "./QuickPlaylists";
import { SidebarMiniPlayer } from "./SidebarMiniPlayer";
import { SidebarNavItem } from "./SidebarNavItem";

interface ListenerDesktopSidebarProps {
  sidebarData: ListenerSidebarData;
}

export function ListenerDesktopSidebar({ sidebarData }: ListenerDesktopSidebarProps) {
  const pathname = usePathname();

  return (
    <MusicSidebar
      role="listener"
      ariaLabel="Navigation musicale SONAFRIK"
      className="music-sidebar--listener"
    >
      <MusicNavMenu ariaLabel="Menu principal">
        {LISTENER_NAV_SECTIONS.map((section) => (
          <MusicNavSection key={section.title} title={section.title}>
            {section.items.map((item: MusicNavItemConfig) => (
              <SidebarNavItem
                key={item.href}
                href={item.href}
                icon={item.icon}
                label={item.label}
                isActive={isListenerNavActive(item.href, pathname)}
              />
            ))}
          </MusicNavSection>
        ))}
      </MusicNavMenu>

      <div className="music-nav__separator" role="separator" />

      <RecentlyPlayedSection tracks={sidebarData.recentTracks} />
      <QuickPlaylists
        favoritesCount={sidebarData.favoritesCount}
        downloadsCount={sidebarData.downloadsCount}
      />

      <div className="ls-spacer" />

      <SidebarMiniPlayer />
    </MusicSidebar>
  );
}
