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
    { type: "section", label: "Espace artiste" },
    { href: "/creator", label: "Vue d'ensemble", icon: "📊", exact: true },
    { href: "/creator/analytics", label: "Mes statistiques", icon: "📈", exact: true },
    { type: "section", label: "Mon catalogue" },
    { href: "/creator/catalog", label: "Tout mon catalogue", icon: "💿", exact: true },
    { href: "/creator/catalog/tracks", label: "Uploader un morceau", icon: "🎵" },
    { href: "/creator/catalog/releases", label: "Mes sorties", icon: "📀" },
    { type: "section", label: "Mon profil" },
    { href: "/creator/identity", label: "Identité artiste", icon: "👤" },
    {
      href: "/creator/verification",
      label: "Vérification",
      icon: "✓",
      badge: pendingVerifications,
    },
    { href: "/creator/rights", label: "Droits et contrats", icon: "⚖️" },
    { href: "/creator/labels", label: "Labels", icon: "🏷" },
    { href: "/creator/team", label: "Équipe", icon: "👥" },
  ];
}

export function getCreatorNavLinks(entries: CreatorNavEntry[]): CreatorNavLink[] {
  return entries.filter((entry): entry is CreatorNavLink => "href" in entry);
}
