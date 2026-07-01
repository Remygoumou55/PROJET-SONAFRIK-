import type { SonafrikSupabaseClient } from "@sonafrik/database";
import type { FeatureFlag, SystemSetting } from "@sonafrik/types";
import { AdminConfigRepository } from "./admin.config.repository";
import { AdminDashboardRepository } from "./admin.dashboard.repository";
import { AdminFinancialRepository } from "./admin.financial.repository";
import { AdminFraudRepository } from "./admin.fraud.repository";
import { AdminMetricsRepository } from "./admin.metrics.repository";
import { AdminModerationRepository } from "./admin.moderation.repository";
import { AdminAnalyticsRepository } from "./admin.analytics.repository";
import { AdminAwardsRepository } from "./admin.awards.repository";
import { AdminBeatStoreRepository, type BeatStoreFilter } from "./admin.beatstore.repository";
import type {
  AdminAlert,
  AdminAnalyticsDashboard,
  AdminAwardsDashboard,
  AdminBeatStoreDashboard,
  AdminCockpitData,
  AdminDashboardKpis,
  AdminFraudMetrics,
  AdminFraudSession,
  AdminFraudIncidentsPage,
  AdminFraudStreamEvent,
  AdminFraudSupervisionStats,
  AdminHealthSnapshot,
  AdminLiveSnapshot,
  AdminModerationMetrics,
  AdminNavBadges,
  AdminUserMetrics,
  AdminRevenueDashboardData,
  AdminWithdrawalsDashboardMeta,
  AdminRightsClaim,
  LiveControlSnapshot,
  PendingCatalogItem,
} from "./types";

export class AdminRepository {
  private readonly config: AdminConfigRepository;
  private readonly moderation: AdminModerationRepository;
  private readonly metrics: AdminMetricsRepository;
  private readonly dashboard: AdminDashboardRepository;
  private readonly financial: AdminFinancialRepository;
  private readonly fraud: AdminFraudRepository;
  private readonly analytics: AdminAnalyticsRepository;
  private readonly awards: AdminAwardsRepository;
  private readonly beatstore: AdminBeatStoreRepository;

  constructor(client: SonafrikSupabaseClient) {
    this.config = new AdminConfigRepository(client);
    this.moderation = new AdminModerationRepository(client);
    this.metrics = new AdminMetricsRepository(client);
    this.dashboard = new AdminDashboardRepository(client, this.metrics);
    this.financial = new AdminFinancialRepository(client);
    this.fraud = new AdminFraudRepository(client, this.metrics);
    this.analytics = new AdminAnalyticsRepository(client);
    this.awards = new AdminAwardsRepository(client);
    this.beatstore = new AdminBeatStoreRepository(client);
  }

  listFeatureFlags(): Promise<FeatureFlag[]> {
    return this.config.listFeatureFlags();
  }

  toggleFeatureFlag(name: string, enabled: boolean, updatedBy: string | null): Promise<FeatureFlag> {
    return this.config.toggleFeatureFlag(name, enabled, updatedBy);
  }

  listSystemSettings(): Promise<SystemSetting[]> {
    return this.config.listSystemSettings();
  }

  updateSystemSetting(
    key: string,
    value: unknown,
    updatedBy: string | null,
    motive?: string | null,
  ): Promise<SystemSetting> {
    return this.config.updateSystemSetting(key, value, updatedBy, motive);
  }

  listSystemSettingAuditHistory(limit?: number) {
    return this.config.listSystemSettingAuditHistory(limit);
  }

  getSystemSettingAuditHistory(key: string, limit?: number) {
    return this.config.getSystemSettingAuditHistory(key, limit);
  }

  isFeatureEnabled(name: string): Promise<boolean> {
    return this.config.isFeatureEnabled(name);
  }

  reviewCatalogItem(
    id: string,
    entityType: "album" | "track",
    action: "published" | "rejected",
    reason?: string,
  ): Promise<void> {
    return this.moderation.reviewCatalogItem(id, entityType, action, reason);
  }

  updateRightsClaim(id: string, status: AdminRightsClaim["status"], notes?: string): Promise<void> {
    return this.moderation.updateRightsClaim(id, status, notes);
  }

  listPendingCatalogItems(limit = 200): Promise<PendingCatalogItem[]> {
    return this.moderation.listPendingCatalogItems(limit);
  }

  listRightsClaims(limit = 100): Promise<AdminRightsClaim[]> {
    return this.moderation.listRightsClaims(limit);
  }

  listFraudSessions(limit = 50): Promise<AdminFraudSession[]> {
    return this.moderation.listFraudSessions(limit);
  }

  listFraudIncidentsPage(limit = 200, offset = 0): Promise<AdminFraudIncidentsPage> {
    return this.fraud.listFraudIncidentsPage(limit, offset);
  }

  getFraudSupervisionStats(): Promise<AdminFraudSupervisionStats> {
    return this.fraud.getFraudSupervisionStats();
  }

  listFraudSessionEvents(sessionId: string, limit = 40): Promise<AdminFraudStreamEvent[]> {
    return this.fraud.listSessionStreamEvents(sessionId, limit);
  }

  listFraudReviewStates(adminUserId: string) {
    return this.fraud.listFraudReviewStates(adminUserId);
  }

  upsertFraudReviewState(
    adminUserId: string,
    incidentId: string,
    patch: Partial<{ treated: boolean; archived: boolean; hidden: boolean; notes: string[] }>,
  ) {
    return this.fraud.upsertFraudReviewState(adminUserId, incidentId, patch);
  }

  bulkUpsertFraudReviewStates(
    adminUserId: string,
    incidentIds: string[],
    patch: Partial<{ treated: boolean; archived: boolean; hidden: boolean }>,
  ) {
    return this.fraud.bulkUpsertFraudReviewStates(adminUserId, incidentIds, patch);
  }

  getFraudMetrics(): Promise<AdminFraudMetrics> {
    return this.metrics.getFraudMetrics();
  }

  getModerationMetrics(): Promise<AdminModerationMetrics> {
    return this.metrics.getModerationMetrics();
  }

  getUserMetrics(): Promise<AdminUserMetrics> {
    return this.metrics.getUserMetrics();
  }

  async getAdminLiveSnapshot(): Promise<AdminLiveSnapshot> {
    const [fraudMetrics, moderationMetrics, userMetrics] = await Promise.all([
      this.metrics.getFraudMetrics(),
      this.metrics.getModerationMetrics(),
      this.metrics.getUserMetrics(),
    ]);
    return {
      navBadges: this.metrics.buildNavBadges(fraudMetrics, moderationMetrics),
      fraudMetrics,
      moderationMetrics,
      userMetrics,
      fetchedAt: new Date().toISOString(),
    };
  }

  getDashboardKpis(): Promise<AdminDashboardKpis> {
    return this.dashboard.getDashboardKpis();
  }

  getNavBadges(): Promise<AdminNavBadges> {
    return this.dashboard.getNavBadges();
  }

  getCockpitData(): Promise<AdminCockpitData> {
    return this.dashboard.getCockpitData();
  }

  listUnreadAdminAlerts(limit = 10): Promise<AdminAlert[]> {
    return this.dashboard.listUnreadAdminAlerts(limit);
  }

  getHealthSnapshot(): Promise<AdminHealthSnapshot> {
    return this.dashboard.getHealthSnapshot();
  }

  getLiveControlSnapshot(): Promise<LiveControlSnapshot> {
    return this.dashboard.getLiveControlSnapshot();
  }

  getRevenueDashboardData(): Promise<AdminRevenueDashboardData> {
    return this.financial.getRevenueDashboardData();
  }

  getWithdrawalsDashboardMeta(
    filter: string,
    page: number,
    limit: number,
  ): Promise<AdminWithdrawalsDashboardMeta> {
    return this.financial.getWithdrawalsDashboardMeta(filter, page, limit);
  }

  getWalletBalancesByUserIds(userIds: string[]): Promise<Record<string, number>> {
    return this.financial.getWalletBalancesByUserIds(userIds);
  }

  getAnalyticsDashboard(): Promise<AdminAnalyticsDashboard> {
    return this.analytics.getDashboard();
  }

  getAwardsDashboard(): Promise<AdminAwardsDashboard> {
    return this.awards.getDashboard();
  }

  closeAwardVotes(editionId: string): Promise<void> {
    return this.awards.closeVotes(editionId);
  }

  distributeAwardPrizes(editionId: string, adminNote?: string): Promise<void> {
    return this.awards.distributePrizes(editionId, adminNote);
  }

  getBeatStoreDashboard(params: {
    filter: BeatStoreFilter;
    page: number;
    limit: number;
  }): Promise<AdminBeatStoreDashboard> {
    return this.beatstore.getDashboard(params);
  }

  approveBeat(beatId: string): Promise<void> {
    return this.beatstore.approveBeat(beatId);
  }

  rejectBeat(beatId: string, reason: string): Promise<void> {
    return this.beatstore.rejectBeat(beatId, reason);
  }

  deleteBeat(beatId: string): Promise<void> {
    return this.beatstore.deleteBeat(beatId);
  }
}
