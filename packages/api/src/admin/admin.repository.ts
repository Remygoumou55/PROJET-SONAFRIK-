import type { SonafrikSupabaseClient } from "@sonafrik/database";
import type { FeatureFlag, SystemSetting } from "@sonafrik/types";
import { AdminConfigRepository } from "./admin.config.repository";
import { AdminDashboardRepository } from "./admin.dashboard.repository";
import { AdminFinancialRepository } from "./admin.financial.repository";
import { AdminFraudRepository } from "./admin.fraud.repository";
import { AdminModerationRepository } from "./admin.moderation.repository";
import type {
  AdminAlert,
  AdminCockpitData,
  AdminDashboardKpis,
  AdminFraudSession,
  AdminFraudIncidentsPage,
  AdminFraudStreamEvent,
  AdminFraudSupervisionStats,
  AdminHealthSnapshot,
  AdminNavBadges,
  AdminRevenueDashboardData,
  AdminWithdrawalsDashboardMeta,
  AdminRightsClaim,
  LiveControlSnapshot,
  PendingCatalogItem,
} from "./types";

export class AdminRepository {
  private readonly config: AdminConfigRepository;
  private readonly moderation: AdminModerationRepository;
  private readonly dashboard: AdminDashboardRepository;
  private readonly financial: AdminFinancialRepository;
  private readonly fraud: AdminFraudRepository;

  constructor(client: SonafrikSupabaseClient) {
    this.config = new AdminConfigRepository(client);
    this.moderation = new AdminModerationRepository(client);
    this.dashboard = new AdminDashboardRepository(client);
    this.financial = new AdminFinancialRepository(client);
    this.fraud = new AdminFraudRepository(client);
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

  updateSystemSetting(key: string, value: unknown, updatedBy: string | null): Promise<SystemSetting> {
    return this.config.updateSystemSetting(key, value, updatedBy);
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
}
