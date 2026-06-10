/** Utilitaires partagés SONAFRIK */

export function formatGnf(amount: number): string {
  return new Intl.NumberFormat("fr-GN", {
    style: "currency",
    currency: "GNF",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function isValidListenProgress(progressPercent: number): boolean {
  return progressPercent >= 90;
}
