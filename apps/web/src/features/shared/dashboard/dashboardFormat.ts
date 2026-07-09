/** Formatage monétaire compact — cartes wallet & KPI dashboard. */
export function formatDashboardGnf(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M GNF`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}k GNF`;
  return `${Math.round(n).toLocaleString("fr-FR")} GNF`;
}

export function formatActivityDate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
      timeZone: "UTC",
    });
  } catch {
    return "";
  }
}
