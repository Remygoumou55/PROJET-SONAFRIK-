import { countQuery, type AdminRepoClient } from "./admin.shared";
import type {
  AdminAlert,
  AdminCockpitData,
  AdminDashboardKpis,
  AdminHealthCheck,
  AdminHealthSnapshot,
  AdminNavBadges,
  LiveControlSnapshot,
} from "./types";

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

  async getNavBadges(): Promise<AdminNavBadges> {
    const [
      pendingAlbums,
      pendingTracks,
      pendingWithdrawals,
      pendingClaims,
      fraudSessions,
    ] = await Promise.all([
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
          .from("withdrawals")
          .select("*", { count: "exact", head: true })
          .eq("status", "pending"),
      ),
      countQuery(
        this.client
          .from("rights_claims")
          .select("*", { count: "exact", head: true })
          .eq("status", "pending"),
      ),
      countQuery(
        this.client
          .from("stream_sessions")
          .select("*", { count: "exact", head: true })
          .filter("fraud_flags", "neq", "{}"),
      ),
    ]);

    return {
      content: pendingAlbums + pendingTracks,
      moderation: pendingClaims + fraudSessions,
      withdrawals: pendingWithdrawals,
    };
  }

  async getCockpitData(): Promise<AdminCockpitData> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999).toISOString();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 11, 1).toISOString();
    const nowIso = now.toISOString();

    const [
      totalUsers,
      newUsersToday,
      premiumUsers,
      activeArtists,
      newArtistsThisWeek,
      publishedTracks,
      pendingTracks,
      pendingAlbums,
      revenueThisMonthRes,
      revenueLastMonthRes,
      pendingSignalements,
      pendingWithdrawals,
      pendingArtistVerif,
      recentActivityRes,
      ledgerYearRes,
    ] = await Promise.all([
      countQuery(
        this.client.from("profiles").select("*", { count: "exact", head: true }).is("deleted_at", null),
      ),
      countQuery(
        this.client.from("profiles").select("*", { count: "exact", head: true }).gte("created_at", today),
      ),
      countQuery(
        this.client
          .from("profiles")
          .select("*", { count: "exact", head: true })
          .eq("is_premium", true)
          .gt("premium_expires_at", nowIso)
          .is("deleted_at", null),
      ),
      countQuery(
        this.client
          .from("artist_profiles")
          .select("*", { count: "exact", head: true })
          .eq("is_public", true),
      ),
      countQuery(
        this.client.from("artist_profiles").select("*", { count: "exact", head: true }).gte("created_at", weekAgo),
      ),
      countQuery(
        this.client
          .from("tracks")
          .select("*", { count: "exact", head: true })
          .eq("publication_status", "published")
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
          .from("albums")
          .select("*", { count: "exact", head: true })
          .eq("publication_status", "pending_review")
          .is("deleted_at", null),
      ),
      this.client.from("wallet_ledger").select("amount_gnf").gte("created_at", startOfMonth),
      this.client
        .from("wallet_ledger")
        .select("amount_gnf")
        .gte("created_at", startOfLastMonth)
        .lte("created_at", endOfLastMonth),
      countQuery(
        this.client
          .from("rights_claims")
          .select("*", { count: "exact", head: true })
          .eq("status", "pending"),
      ),
      countQuery(
        this.client
          .from("withdrawals")
          .select("*", { count: "exact", head: true })
          .eq("status", "pending"),
      ),
      countQuery(
        this.client
          .from("creator_verifications")
          .select("*", { count: "exact", head: true })
          .eq("status", "pending"),
      ),
      this.client
        .from("audit_logs")
        .select("id, action, created_at, metadata")
        .order("created_at", { ascending: false })
        .limit(10),
      this.client
        .from("wallet_ledger")
        .select("amount_gnf, created_at")
        .gte("created_at", twelveMonthsAgo),
    ]);

    if (revenueThisMonthRes.error) throw revenueThisMonthRes.error;
    if (revenueLastMonthRes.error) throw revenueLastMonthRes.error;
    if (recentActivityRes.error) throw recentActivityRes.error;
    if (ledgerYearRes.error) throw ledgerYearRes.error;

    const sumLedger = (rows: { amount_gnf: number }[]) =>
      rows.reduce((sum, row) => sum + (row.amount_gnf ?? 0), 0);

    const revenueThisMonth = sumLedger(revenueThisMonthRes.data ?? []);
    const revenueLastMonth = sumLedger(revenueLastMonthRes.data ?? []);
    const revenueChange =
      revenueLastMonth > 0
        ? (((revenueThisMonth - revenueLastMonth) / revenueLastMonth) * 100).toFixed(1)
        : null;

    const monthlyMap = new Map<string, number>();
    for (let i = 11; i >= 0; i -= 1) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      monthlyMap.set(key, 0);
    }
    for (const row of ledgerYearRes.data ?? []) {
      const d = new Date(row.created_at);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      if (monthlyMap.has(key)) {
        monthlyMap.set(key, (monthlyMap.get(key) ?? 0) + (row.amount_gnf ?? 0));
      }
    }

    const monthlyRevenue = [...monthlyMap.entries()].map(([monthKey, totalGnf]) => {
      const [year, month] = monthKey.split("-");
      const label = new Date(Number(year), Number(month) - 1, 1).toLocaleDateString("fr-FR", {
        month: "short",
        year: "2-digit",
      });
      return { monthKey, label, totalGnf };
    });

    const recentActivity = (recentActivityRes.data ?? []).map((row) => ({
      id: row.id as string,
      action: row.action as string,
      created_at: row.created_at as string,
      metadata: (row.metadata as Record<string, unknown> | null) ?? null,
    }));

    return {
      kpis: {
        totalUsers,
        newUsersToday,
        premiumUsers,
        activeArtists,
        newArtistsThisWeek,
        publishedTracks,
        pendingTracks: pendingTracks + pendingAlbums,
        revenueThisMonth,
        revenueLastMonth,
        revenueChange,
      },
      alerts: {
        pendingSignalements,
        pendingWithdrawals,
        pendingArtistVerif,
      },
      recentActivity,
      monthlyRevenue,
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
    const [db, storage, wallets, payments, royalties, alerts] = await Promise.all([
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
      this.runHealthCheck("Chaîne royalties", async () => {
        const [cyclesRes, ledgerRes, plansRes] = await Promise.all([
          this.client.from("royalty_cycles").select("*", { count: "exact", head: true }),
          this.client.from("wallet_ledger").select("*", { count: "exact", head: true }),
          this.client.from("subscription_plans").select("*", { count: "exact", head: true }).eq("is_active", true),
        ]);
        if (cyclesRes.error) throw cyclesRes.error;
        if (ledgerRes.error) throw ledgerRes.error;
        if (plansRes.error) throw plansRes.error;
        return {
          detail: `${cyclesRes.count ?? 0} cycles · ${ledgerRes.count ?? 0} ledger · ${plansRes.count ?? 0} plans actifs`,
        };
      }),
      this.listUnreadAdminAlerts(10).catch(() => [] as AdminAlert[]),
    ]);

    return {
      checks: [db, storage, wallets, payments, royalties],
      alerts,
    };
  }

  async getLiveControlSnapshot(): Promise<LiveControlSnapshot> {
    const [
      totalUsers,
      publishedTracks,
      validListens,
      royaltyCycles,
      ledgerEntries,
      recentTracksRes,
      recentListensRes,
      recentCyclesRes,
      recentLedgerRes,
    ] = await Promise.all([
      countQuery(
        this.client.from("profiles").select("*", { count: "exact", head: true }).is("deleted_at", null),
      ),
      countQuery(
        this.client
          .from("tracks")
          .select("*", { count: "exact", head: true })
          .eq("publication_status", "published"),
      ),
      countQuery(
        this.client
          .from("stream_sessions")
          .select("*", { count: "exact", head: true })
          .eq("is_valid_listen", true),
      ),
      countQuery(this.client.from("royalty_cycles").select("*", { count: "exact", head: true })),
      countQuery(this.client.from("wallet_ledger").select("*", { count: "exact", head: true })),
      this.client
        .from("tracks")
        .select("id, title, publication_status, created_at")
        .eq("publication_status", "published")
        .order("created_at", { ascending: false })
        .limit(5),
      this.client
        .from("stream_sessions")
        .select("id, is_valid_listen, created_at")
        .eq("is_valid_listen", true)
        .order("created_at", { ascending: false })
        .limit(5),
      this.client
        .from("royalty_cycles")
        .select("id, status, created_at")
        .order("created_at", { ascending: false })
        .limit(3),
      this.client
        .from("wallet_ledger")
        .select("id, amount_gnf, entry_type, created_at")
        .order("created_at", { ascending: false })
        .limit(5),
    ]);

    if (recentTracksRes.error) throw recentTracksRes.error;
    if (recentListensRes.error) throw recentListensRes.error;
    if (recentCyclesRes.error) throw recentCyclesRes.error;
    if (recentLedgerRes.error) throw recentLedgerRes.error;

    return {
      totalUsers,
      publishedTracks,
      validListens,
      royaltyCycles,
      ledgerEntries,
      recentTracks: recentTracksRes.data ?? [],
      recentListens: recentListensRes.data ?? [],
      recentCycles: recentCyclesRes.data ?? [],
      recentLedger: recentLedgerRes.data ?? [],
    };
  }
}
