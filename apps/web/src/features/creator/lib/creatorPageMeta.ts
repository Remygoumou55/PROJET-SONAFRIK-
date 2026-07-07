export function resolveCreatorPageTitle(pathname: string): string {
  if (pathname === "/creator/catalog/tracks") return "Mes publications";
  if (pathname.startsWith("/creator/catalog/tracks/new")) return "Publier";
  if (/^\/creator\/catalog\/tracks\/[^/]+\/edit/.test(pathname)) return "Modifier la publication";
  if (pathname.startsWith("/creator/catalog/releases")) return "Albums et morceaux";
  if (pathname.startsWith("/creator/catalog")) return "Mon catalogue";
  if (pathname.startsWith("/creator/analytics")) return "Tes stats";
  if (pathname.startsWith("/creator/identity")) return "Mon profil";
  if (pathname === "/creator") return "Vue d'ensemble";
  return "Espace Artiste";
}

export function resolveCreatorPageSubtitle(pathname: string): string | null {
  if (pathname === "/creator/catalog/tracks") {
    return "Gérez vos publications, suivez leur validation et leur diffusion.";
  }
  if (pathname.startsWith("/creator/catalog/tracks/new")) {
    return "Partagez votre musique avec le monde entier 🚀";
  }
  return null;
}
