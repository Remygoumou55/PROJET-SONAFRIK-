/** Bornes temporelles UTC — SSOT fraude admin (Guinée = UTC+0, serveur-agnostique). */

export function startOfTodayUtc(): string {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  return d.toISOString();
}

export function startOfMonthUtc(): string {
  const d = new Date();
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1)).toISOString();
}

export function fiveMinutesAgoIso(): string {
  return new Date(Date.now() - 5 * 60 * 1000).toISOString();
}
