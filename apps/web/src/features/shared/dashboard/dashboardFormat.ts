/** Formatage monétaire compact — cartes wallet & KPI dashboard. */
export function formatDashboardGnf(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M GNF`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}k GNF`;
  return `${Math.round(n).toLocaleString("fr-FR")} GNF`;
}

export function formatActivityDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
    });
  } catch {
    return "";
  }
}
