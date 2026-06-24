import { countQuery, type AdminRepoClient } from "./admin.shared";
import type { AdminAlert, AdminDashboardKpis, AdminHealthCheck, AdminHealthSnapshot } from "./types";

export class AdminDashboardRepository {
  constructor(private readonly client: AdminRepoClient) {}

  async getDashboardKpis(): Promise<AdminDashboardKpis> {
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const nowIso = new Date().toISOString();

    const [
      totalUsers,
      premiumUsers,
      streamsToday,
      streamsTotal,
      pendingAlbums,
      pendingTracks,
      fraudSessions,
      pendingWithdrawals,
    ] = await Promise.all([
      countQuery(
        this.client.from("profiles").select("*", { count: "exact", head: true }).is("deleted_at", null),
      ),
      countQuery(
        this.client
          .from("profiles")
          .select("*", { count: "exact", head: true })
          .eq("is_premium", true)
          .gt("premium_expires_at", nowIso),
      ),
      countQuery(
        this.client
          .from("stream_sessions")
          .select("*", { count: "exact", head: true })
          .gte("started_at", today.toISOString()),
      ),
      countQuery(this.client.from("stream_sessions").select("*", { count: "exact", head: true })),
      countQuery(
        this.client
          .from("albums")
          .select("*", { count: "exact", head: true })
          .eq("publication_status", "pending_review")
          .is("deleted_at", null),
      ),
      countQuery(
        this.client
          .from("tracks")
          .select("*", { count: "exact", head: true })
          .eq("publication_status", "pending_review")
          .is("deleted_at", null),
      ),
      countQuery(
        this.client
          .from("stream_sessions")
          .select("*", { count: "exact", head: true })
          .filter("fraud_flags", "neq", "{}"),
      ),
      countQuery(
        this.client
          .from("withdrawals")
          .select("*", { count: "exact", head: true })
          .eq("status", "pending"),
      ),
    ]);

    let launchCurrent = 0;
    let launchTarget = 2000;
    try {
      const { data: launchData } = await this.client.rpc("get_launch_progress");
      const lp = launchData as { current: number; target: number } | null;
      if (lp) {
        launchCurrent = Number(lp.current);
        launchTarget = Number(lp.target);
      }
    } catch {
      // non bloquant
    }

    return {
      totalUsers,
      premiumUsers,
      streamsToday,
      streamsTotal,
      pendingCatalog: pendingAlbums + pendingTracks,
      pendingWithdrawals,
      fraudSessions,
      launchCurrent,
      launchTarget,
    };
  }

  async listUnreadAdminAlerts(limit = 10): Promise<AdminAlert[]> {
    const { data, error } = await this.client
      .from("admin_notifications")
      .select("id, type, message, created_at")
      .eq("is_read", false)
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) throw error;
    return (data ?? []) as AdminAlert[];
  }

  private async runHealthCheck(
    label: string,
    fn: () => Promise<{ detail: string }>,
  ): Promise<AdminHealthCheck> {
    const start = Date.now();
    try {
      const { detail } = await fn();
      return { label, ok: true, latencyMs: Date.now() - start, detail };
    } catch (err) {
      return {
        label,
        ok: false,
        latencyMs: Date.now() - start,
        detail: err instanceof Error ? err.message : String(err),
      };
    }
  }

  async getHealthSnapshot(): Promise<AdminHealthSnapshot> {
    const [db, storage, wallets, payments, alerts] = await Promise.all([
      this.runHealthCheck("Base de données", async () => {
        const { count, error } = await this.client
          .from("tracks")
          .select("*", { count: "exact", head: true });
        if (error) throw error;
        return { detail: `${count ?? 0} morceaux indexés` };
      }),
      this.runHealthCheck("Supabase Storage", async () => {
        const { data, error } = await this.client.storage.from("covers").list("", { limit: 1 });
        if (error) throw error;
        return { detail: `${data?.length ?? 0} fichier(s) trouvé(s) dans covers/` };
      }),
      this.runHealthCheck("Wallets", async () => {
        const { count, error } = await this.client
          .from("wallets")
          .select("*", { count: "exact", head: true });
        if (error) throw error;
        return { detail: `${count ?? 0} wallets actifs` };
      }),
      this.runHealthCheck("Paiements confirmés", async () => {
        const { count, error } = await this.client
          .from("payment_intents")
          .select("*", { count: "exact", head: true })
          .eq("status", "confirmed");
        if (error) throw error;
        return { detail: `${count ?? 0} total` };
      }),
      this.listUnreadAdminAlerts(10).catch(() => [] as AdminAlert[]),
    ]);

    return {
      checks: [db, storage, wallets, payments],
      alerts,
    };
  }
}
