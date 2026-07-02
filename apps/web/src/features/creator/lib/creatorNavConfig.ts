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
    { href: "/creator",                  label: "Vue d'ensemble",  icon: "🏠", exact: true },
    { href: "/creator/catalog/tracks",   label: "Publier",         icon: "🎵", exact: false },
    { href: "/creator/publications",     label: "Mes publications", icon: "📋", exact: false },
    { href: "/creator/analytics",        label: "Analytics",       icon: "📊", exact: true },
    { href: "/wallet",                   label: "Wallet",          icon: "👛", exact: false },
    { type: "section",                   label: "" },
    { href: "/creator/identity",         label: "Paramètres",      icon: "⚙", exact: false },
    { href: "/profile",                  label: "Aide & Support",  icon: "❓", exact: false },
  ];
}

export function getCreatorNavLinks(entries: CreatorNavEntry[]): CreatorNavLink[] {
  return entries.filter((entry): entry is CreatorNavLink => "href" in entry);
}
