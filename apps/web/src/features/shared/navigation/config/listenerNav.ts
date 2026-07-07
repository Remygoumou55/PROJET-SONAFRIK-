import type { MusicNavIconName, MusicNavSectionConfig } from "../musicNavTypes";

export const LISTENER_NAV_SECTIONS: MusicNavSectionConfig[] = [
  {
    title: "ÉCOUTER",
    items: [
      { href: "/listen", label: "Accueil", icon: "home", exact: false },
      { href: "/search", label: "Explorer", icon: "search" },
      { href: "/library", label: "Bibliothèque", icon: "library" },
    ],
  },
  {
    title: "COMPTE",
    items: [
      { href: "/wallet", label: "Wallet", icon: "wallet" },
      { href: "/profile", label: "Profil", icon: "profile" },
    ],
  },
];

export const LISTENER_MOBILE_NAV_ITEMS = LISTENER_NAV_SECTIONS.flatMap((s) => s.items);

export function isListenerNavActive(href: string, pathname: string): boolean {
  if (href === "/listen") {
    return pathname === "/listen" || pathname.startsWith("/listen/");
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export type ListenerNavIcon = MusicNavIconName;
