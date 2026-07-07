import type { MusicNavSectionConfig } from "../musicNavTypes";

export type CreatorNavSection = { type: "section"; label: string };

export type CreatorNavLink = {
  type?: "link";
  href: string;
  label: string;
  icon: import("../musicNavTypes").MusicNavIconName;
  exact?: boolean;
  badge?: number;
};

export type CreatorNavEntry = CreatorNavSection | CreatorNavLink;

export function buildCreatorNavEntries(pendingVerifications = 0): CreatorNavEntry[] {
  return [
    { type: "section", label: "Créer" },
    { href: "/creator/catalog/tracks/new", label: "Publier", icon: "publish", exact: false },
    { href: "/creator/catalog/tracks", label: "Mes publications", icon: "publications", exact: true },
    { type: "section", label: "Comprendre" },
    { href: "/creator", label: "Vue d'ensemble", icon: "overview", exact: true },
    { href: "/creator/analytics", label: "Analytics", icon: "analytics", exact: true },
    { type: "section", label: "Revenus" },
    { href: "/wallet", label: "Wallet", icon: "wallet", exact: false },
    { type: "section", label: "" },
    {
      href: "/creator/identity",
      label: "Paramètres",
      icon: "settings",
      exact: false,
      badge: pendingVerifications > 0 ? pendingVerifications : undefined,
    },
    { href: "/settings/help", label: "Aide & Support", icon: "help", exact: false },
  ];
}

export function getCreatorNavLinks(entries: CreatorNavEntry[]): CreatorNavLink[] {
  return entries.filter((entry): entry is CreatorNavLink => "href" in entry);
}

export function groupCreatorNavEntries(entries: CreatorNavEntry[]): MusicNavSectionConfig[] {
  const sections: MusicNavSectionConfig[] = [];
  let current: MusicNavSectionConfig = { title: "", items: [] };

  for (const entry of entries) {
    if ("type" in entry && entry.type === "section") {
      if (current.items.length > 0 || current.title) {
        sections.push(current);
      }
      current = { title: entry.label, items: [] };
    } else if ("href" in entry) {
      current.items.push({
        href: entry.href,
        label: entry.label,
        icon: entry.icon,
        exact: entry.exact,
        badge: entry.badge,
      });
    }
  }

  if (current.items.length > 0) {
    sections.push(current);
  }

  return sections;
}
