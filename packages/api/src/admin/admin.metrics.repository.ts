import { countQuery, type AdminRepoClient } from "./admin.shared";
import type { AdminFraudMetrics } from "./types";

function startOfTodayUtc(): string {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  return d.toISOString();
}

function startOfMonthLocal(): string {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
}

/**
 * Comptage canonique des sessions fraude.
 * Toute l'app admin DOIT utiliser ces méthodes — jamais de requête ad hoc.
 */
export class AdminMetricsRepository {
  constructor(private readonly client: AdminRepoClient) {}

  private flaggedSessionsBase() {
    return this.client
      .from("stream_sessions")
      .select("*", { count: "exact", head: true })
      .filter("fraud_flags", "neq", "{}");
  }

  async getFraudMetrics(): Promise<AdminFraudMetrics> {
    const [totalFlagged, flaggedThisMonth, flaggedToday] = await Promise.all([
      countQuery(this.flaggedSessionsBase()),
      countQuery(this.flaggedSessionsBase().gte("started_at", startOfMonthLocal())),
      countQuery(this.flaggedSessionsBase().gte("started_at", startOfTodayUtc())),
    ]);

    return { totalFlagged, flaggedThisMonth, flaggedToday };
  }
}
