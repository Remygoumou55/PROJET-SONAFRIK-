import type { SonafrikSupabaseClient } from "@sonafrik/database";
import type { FeatureFlag, SystemSetting } from "@sonafrik/types";
import { AdminConfigRepository } from "./admin.config.repository";
import { AdminDashboardRepository } from "./admin.dashboard.repository";
import { AdminModerationRepository } from "./admin.moderation.repository";
import type {
  AdminAlert,
  AdminDashboardKpis,
  AdminFraudSession,
  AdminHealthSnapshot,
  AdminRightsClaim,
  LiveControlSnapshot,
  PendingCatalogItem,
} from "./types";

export class AdminRepository {
  private readonly config: AdminConfigRepository;
  private readonly moderation: AdminModerationRepository;
  private readonly dashboard: AdminDashboardRepository;

  constructor(client: SonafrikSupabaseClient) {
    this.config = new AdminConfigRepository(client);
    this.moderation = new AdminModerationRepository(client);
    this.dashboard = new AdminDashboardRepository(client);
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

  getDashboardKpis(): Promise<AdminDashboardKpis> {
    return this.dashboard.getDashboardKpis();
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
}
