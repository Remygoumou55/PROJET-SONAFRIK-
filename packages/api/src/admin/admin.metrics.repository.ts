import { countQuery, type AdminRepoClient } from "./admin.shared";
import { validateFraudSupervisionCoherence } from "./admin.fraud.coherence";
import {
  FRAUD_ATTENTION_FLAGS,
  FRAUD_CRITICAL_FLAGS,
  FRAUD_CONFIRMED_FLAGS,
  FRAUD_IMPORTANT_FLAGS,
  pgArrayOverlapLiteral,
} from "./admin.fraud.hierarchy";
import { fiveMinutesAgoIso, startOfMonthUtc, startOfTodayUtc } from "./admin.time";
import type {
  AdminFraudMetrics,
  AdminFraudSupervisionStats,
  AdminModerationMetrics,
  AdminNavBadges,
  AdminUserMetrics,
} from "./types";

function weekAgoUtc(): string {
  return new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
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

  private flaggedSince(iso: string) {
    return this.flaggedSessionsBase().gte("started_at", iso);
  }

  private countFlaggedOverlap(flags: readonly string[], since?: string): Promise<number> {
    let q = this.client
      .from("stream_sessions")
      .select("*", { count: "exact", head: true })
      .filter("fraud_flags", "neq", "{}")
      .filter("fraud_flags", "ov", pgArrayOverlapLiteral(flags));
    if (since) q = q.gte("started_at", since);
    return countQuery(q);
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
    const todayStart = startOfTodayUtc();
    const monthStart = startOfMonthUtc();

    const [totalFlagged, flaggedThisMonth, flaggedToday] = await Promise.all([
      countQuery(this.flaggedSessionsBase()),
      countQuery(this.flaggedSince(monthStart)),
      countQuery(this.flaggedSince(todayStart)),
    ]);

    return { totalFlagged, flaggedThisMonth, flaggedToday };
  }

  /**
   * Snapshot supervision fraude — dérivé uniquement de getFraudMetrics + comptages canoniques.
   * Une seule source pour sidebar, dashboard, KPI, listes.
   */
  async getFraudSupervisionStats(): Promise<AdminFraudSupervisionStats> {
    const fraudMetrics = await this.getFraudMetrics();
    const todayStart = startOfTodayUtc();

    const [
      todayTotal,
      activeSessions,
      validListensToday,
      rejectedListensToday,
      criticalIncidents,
      criticalToday,
      confirmedFraudToday,
      importantToday,
      attentionToday,
      watchAccounts,
    ] = await Promise.all([
      countQuery(
        this.client
          .from("stream_sessions")
          .select("*", { count: "exact", head: true })
          .gte("started_at", todayStart),
      ),
      countQuery(
        this.client
          .from("stream_sessions")
          .select("*", { count: "exact", head: true })
          .is("completed_at", null)
          .gte("last_heartbeat_at", fiveMinutesAgoIso()),
      ),
      countQuery(
        this.client
          .from("stream_sessions")
          .select("*", { count: "exact", head: true })
          .gte("started_at", todayStart)
          .eq("is_valid_listen", true)
          .filter("fraud_flags", "eq", "{}"),
      ),
      countQuery(
        this.client
          .from("stream_sessions")
          .select("*", { count: "exact", head: true })
          .gte("started_at", todayStart)
          .eq("is_valid_listen", false),
      ),
      this.countFlaggedOverlap(FRAUD_CRITICAL_FLAGS),
      this.countFlaggedOverlap(FRAUD_CRITICAL_FLAGS, todayStart),
      this.countFlaggedOverlap(FRAUD_CONFIRMED_FLAGS, todayStart),
      this.countFlaggedOverlap(FRAUD_IMPORTANT_FLAGS, todayStart),
      this.countFlaggedOverlap(FRAUD_ATTENTION_FLAGS, todayStart),
      countQuery(
        this.client
          .from("profiles")
          .select("*", { count: "exact", head: true })
          .gte("fraud_score", 70)
          .is("deleted_at", null),
      ),
    ]);

    const listenSuccessRate =
      todayTotal > 0 ? Math.round((validListensToday / todayTotal) * 100) : 100;

    const stats: AdminFraudSupervisionStats = {
      totalFlagged: fraudMetrics.totalFlagged,
      totalIncidents: fraudMetrics.totalFlagged,
      flaggedThisMonth: fraudMetrics.flaggedThisMonth,
      flaggedToday: fraudMetrics.flaggedToday,
      todayTotal,
      activeSessions,
      fraudDetectedToday: fraudMetrics.flaggedToday,
      suspicionsToday: fraudMetrics.flaggedToday,
      confirmedFraudToday,
      criticalIncidents,
      criticalToday,
      importantToday,
      attentionToday,
      watchAccounts,
      validListensToday,
      rejectedListensToday,
      listenSuccessRate,
      normalSessionsToday: validListensToday,
      suspendedAccountsHint: watchAccounts,
    };

    validateFraudSupervisionCoherence(stats);

    return stats;
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
    const today = startOfTodayUtc();
    const weekAgo = weekAgoUtc();

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
