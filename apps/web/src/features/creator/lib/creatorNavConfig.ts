export type CreatorNavSection = { type: "section"; label: string };

export type CreatorNavLink = {
  type?: "link";
  href: string;
  label: string;
  icon: string;
  exact?: boolean;
  badge?: number;
};

export type CreatorNavEntry = CreatorNavSection | CreatorNavLink;

export function buildCreatorNavEntries(_pendingVerifications = 0): CreatorNavEntry[] {
  return [
    { href: "/creator",           label: "Vue d'ensemble", icon: "📊", exact: true },
    { href: "/creator/catalog",   label: "Mon catalogue",  icon: "🎵", exact: true },
    { href: "/creator/analytics", label: "Statistiques",   icon: "📈", exact: true },
    { href: "/creator/identity",  label: "Mon profil",     icon: "👤" },
  ];
}

export function getCreatorNavLinks(entries: CreatorNavEntry[]): CreatorNavLink[] {
  return entries.filter((entry): entry is CreatorNavLink => "href" in entry);
}
