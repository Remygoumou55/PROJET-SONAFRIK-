import { countQuery, type AdminRepoClient } from "./admin.shared";
import type {
  AdminFraudMetrics,
  AdminModerationMetrics,
  AdminNavBadges,
  AdminUserMetrics,
} from "./types";

function startOfTodayUtc(): string {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  return d.toISOString();
}

function startOfMonthLocal(): string {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
}

function startOfTodayLocal(): string {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
}

function weekAgoLocal(): string {
  const now = new Date();
  return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
}

/**
 * Métriques admin canoniques (LDSE / SSOT).
 * Toute l'app admin DOIT utiliser ces méthodes — jamais de requête ad hoc pour ces comptages.
 */
export class AdminMetricsRepository {
  constructor(private readonly client: AdminRepoClient) {}

  private flaggedSessionsBase() {
    return this.client
      .from("stream_sessions")
      .select("*", { count: "exact", head: true })
      .filter("fraud_flags", "neq", "{}");
  }

  private pendingAlbumsQuery() {
    return this.client
      .from("albums")
      .select("*", { count: "exact", head: true })
      .eq("publication_status", "pending_review")
      .is("deleted_at", null);
  }

  private pendingTracksQuery() {
    return this.client
      .from("tracks")
      .select("*", { count: "exact", head: true })
      .eq("publication_status", "pending_review")
      .is("deleted_at", null);
  }

  async getFraudMetrics(): Promise<AdminFraudMetrics> {
    const [totalFlagged, flaggedThisMonth, flaggedToday] = await Promise.all([
      countQuery(this.flaggedSessionsBase()),
      countQuery(this.flaggedSessionsBase().gte("started_at", startOfMonthLocal())),
      countQuery(this.flaggedSessionsBase().gte("started_at", startOfTodayUtc())),
    ]);

    return { totalFlagged, flaggedThisMonth, flaggedToday };
  }

  async getModerationMetrics(): Promise<AdminModerationMetrics> {
    const [
      pendingAlbums,
      pendingTracks,
      pendingWithdrawals,
      pendingRightsClaims,
      pendingArtistVerifications,
    ] = await Promise.all([
      countQuery(this.pendingAlbumsQuery()),
      countQuery(this.pendingTracksQuery()),
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
          .from("creator_verifications")
          .select("*", { count: "exact", head: true })
          .eq("status", "pending"),
      ),
    ]);

    return {
      pendingAlbums,
      pendingTracks,
      pendingCatalog: pendingAlbums + pendingTracks,
      pendingWithdrawals,
      pendingRightsClaims,
      pendingArtistVerifications,
    };
  }

  async getUserMetrics(): Promise<AdminUserMetrics> {
    const nowIso = new Date().toISOString();
    const today = startOfTodayLocal();
    const weekAgo = weekAgoLocal();

    const [totalUsers, premiumUsers, newUsersToday, activeArtists, newArtistsThisWeek] =
      await Promise.all([
        countQuery(
          this.client.from("profiles").select("*", { count: "exact", head: true }).is("deleted_at", null),
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
            .from("profiles")
            .select("*", { count: "exact", head: true })
            .gte("created_at", today)
            .is("deleted_at", null),
        ),
        countQuery(
          this.client
            .from("artist_profiles")
            .select("*", { count: "exact", head: true })
            .eq("is_public", true),
        ),
        countQuery(
          this.client
            .from("artist_profiles")
            .select("*", { count: "exact", head: true })
            .gte("created_at", weekAgo),
        ),
      ]);

    return {
      totalUsers,
      premiumUsers,
      newUsersToday,
      activeArtists,
      newArtistsThisWeek,
    };
  }

  buildNavBadges(
    fraudMetrics: AdminFraudMetrics,
    moderationMetrics: AdminModerationMetrics,
  ): AdminNavBadges {
    return {
      content: moderationMetrics.pendingCatalog,
      pendingRightsClaims: moderationMetrics.pendingRightsClaims,
      fraudSessions: fraudMetrics.totalFlagged,
      withdrawals: moderationMetrics.pendingWithdrawals,
    };
  }
}
