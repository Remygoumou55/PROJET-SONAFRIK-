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

export function buildCreatorNavEntries(pendingVerifications = 0): CreatorNavEntry[] {
  return [
    { href: "/creator",                  label: "Vue d'ensemble",  icon: "🏠", exact: true },
    { href: "/creator/catalog/tracks/new", label: "Publier",         icon: "🎵", exact: false },
    { href: "/creator/catalog/tracks",   label: "Mes publications", icon: "📋", exact: true },
    { href: "/creator/analytics",        label: "Analytics",       icon: "📊", exact: true },
    { href: "/wallet",                   label: "Wallet",          icon: "👛", exact: false },
    { type: "section",                   label: "" },
    {
      href: "/creator/identity",
      label: "Paramètres",
      icon: "⚙",
      exact: false,
      badge: pendingVerifications > 0 ? pendingVerifications : undefined,
    },
    { href: "/settings/help",            label: "Aide & Support",  icon: "❓", exact: false },
  ];
}

export function getCreatorNavLinks(entries: CreatorNavEntry[]): CreatorNavLink[] {
  return entries.filter((entry): entry is CreatorNavLink => "href" in entry);
}
