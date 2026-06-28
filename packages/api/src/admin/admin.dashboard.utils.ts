/** Crédits wallet uniquement — les débits ont aussi amount_gnf > 0. */
export function sumWalletCreditGnf(rows: ReadonlyArray<{ amount_gnf: number }>): number {
  return rows.reduce((sum, row) => sum + (row.amount_gnf ?? 0), 0);
}

export function bucketMonthlyWalletCredits(
  rows: ReadonlyArray<{ amount_gnf: number; created_at: string }>,
  monthKeys: string[],
): Map<string, number> {
  const monthlyMap = new Map<string, number>();
  for (const key of monthKeys) {
    monthlyMap.set(key, 0);
  }
  for (const row of rows) {
    const d = new Date(row.created_at);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    if (monthlyMap.has(key)) {
      monthlyMap.set(key, (monthlyMap.get(key) ?? 0) + (row.amount_gnf ?? 0));
    }
  }
  return monthlyMap;
}

export function buildMonthKeys(reference: Date, count = 12): string[] {
  const keys: string[] = [];
  for (let i = count - 1; i >= 0; i -= 1) {
    const d = new Date(reference.getFullYear(), reference.getMonth() - i, 1);
    keys.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  }
  return keys;
}

export function formatMonthKeyLabel(monthKey: string): string {
  const [year, month] = monthKey.split("-");
  return new Date(Number(year), Number(month) - 1, 1).toLocaleDateString("fr-FR", {
    month: "short",
    year: "2-digit",
  });
}

export function computeRevenueChangePercent(current: number, previous: number): string | null {
  if (previous <= 0) return null;
  return (((current - previous) / previous) * 100).toFixed(1);
}
