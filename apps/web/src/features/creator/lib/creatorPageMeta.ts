export function resolveCreatorPageTitle(pathname: string): string {
  if (pathname === "/creator/catalog/tracks") return "Mes publications";
  if (pathname.startsWith("/creator/catalog/tracks/new")) return "Publier";
  if (/^\/creator\/catalog\/tracks\/[^/]+\/edit/.test(pathname)) return "Modifier la publication";
  if (pathname.startsWith("/creator/catalog/releases")) return "Albums et morceaux";
  if (pathname.startsWith("/creator/publications")) return "Mes publications";
  if (pathname.startsWith("/creator/catalog")) return "Mon catalogue";
  if (pathname.startsWith("/creator/analytics")) return "Analytics";
  if (pathname.startsWith("/creator/identity")) return "Paramètres";
  if (pathname.startsWith("/creator/verification")) return "Vérification";
  if (pathname.startsWith("/creator/rights")) return "Droits";
  if (pathname.startsWith("/creator/team")) return "Équipe";
  if (pathname.startsWith("/creator/labels")) return "Labels";
  if (pathname.startsWith("/wallet")) return "Wallet";
  if (pathname.startsWith("/settings/help")) return "Aide & Support";
  if (pathname === "/creator") return "Vue d'ensemble";
  return "Espace Artiste";
}

export function resolveCreatorPageSubtitle(pathname: string): string | null {
  if (pathname === "/creator/catalog/tracks") {
    return "Gérez votre catalogue musical et suivez chaque publication.";
  }
  if (pathname.startsWith("/creator/catalog/tracks/new")) {
    return "Partagez votre musique avec le monde entier 🚀";
  }
  return null;
}
