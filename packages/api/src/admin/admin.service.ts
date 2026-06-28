import type { SonafrikSupabaseClient } from "@sonafrik/database";
import type { FeatureFlag, SystemSetting, RoyaltyCycle } from "@sonafrik/types";
import { AdminError } from "./errors";
import { AdminRepository } from "./admin.repository";
import { AdminArtistsRepository, AdminUsersRepository } from "./admin.users.repository";
import { createRoyaltyService, type RoyaltyService } from "../royalties/royalty.service";
import { toggleFeatureFlagSchema, updateSystemSettingSchema, triggerRoyaltyCycleSchema } from "./schemas";
import type { TriggerRoyaltyCycleInput } from "./schemas";
import type {
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
import type {
  AdminArtistsFilter,
  AdminArtistsListResult,
  AdminCreatorTier,
  AdminUsersFilter,
  AdminUsersListResult,
} from "@sonafrik/types";

export class AdminService {
  private readonly repository: AdminRepository;
  private readonly users: AdminUsersRepository;
  private readonly artists: AdminArtistsRepository;
  private readonly royalty: RoyaltyService;

  constructor(private readonly client: SonafrikSupabaseClient) {
    this.repository = new AdminRepository(client);
    this.users = new AdminUsersRepository(client);
    this.artists = new AdminArtistsRepository(client);
    this.royalty = createRoyaltyService(client);
  }

  private async getOptionalUserId(): Promise<string | null> {
    const { data: { user } } = await this.client.auth.getUser();
    return user?.id ?? null;
  }

  async listFeatureFlags(): Promise<FeatureFlag[]> {
    return this.repository.listFeatureFlags();
  }

  async toggleFeatureFlag(name: string, enabled: boolean): Promise<FeatureFlag> {
    const parsed = toggleFeatureFlagSchema.safeParse({ name, enabled });
    if (!parsed.success) throw new AdminError("flag_not_found");

    const userId = await this.getOptionalUserId();
    return this.repository.toggleFeatureFlag(name, enabled, userId);
  }

  async listSystemSettings(): Promise<SystemSetting[]> {
    return this.repository.listSystemSettings();
  }

  async updateSystemSetting(key: string, value: unknown): Promise<SystemSetting> {
    const parsed = updateSystemSettingSchema.safeParse({ key, value });
    if (!parsed.success) throw new AdminError("setting_not_found");

    const userId = await this.getOptionalUserId();
    return this.repository.updateSystemSetting(key, value, userId);
  }

  async reviewCatalogItem(
    id: string,
    entityType: "album" | "track",
    action: "published" | "rejected",
    reason?: string,
  ): Promise<void> {
    await this.repository.reviewCatalogItem(id, entityType, action, reason);
  }

  async updateRightsClaim(
    id: string,
    status: "accepted" | "rejected" | "escalated" | "pending",
    notes?: string,
  ): Promise<void> {
    await this.repository.updateRightsClaim(id, status, notes);
  }

  async listPendingCatalogItems(limit = 200): Promise<PendingCatalogItem[]> {
    return this.repository.listPendingCatalogItems(limit);
  }

  async listRightsClaims(limit = 100): Promise<AdminRightsClaim[]> {
    return this.repository.listRightsClaims(limit);
  }

  async listFraudSessions(limit = 50): Promise<AdminFraudSession[]> {
    return this.repository.listFraudSessions(limit);
  }

  async listFraudIncidentsPage(limit = 200, offset = 0): Promise<AdminFraudIncidentsPage> {
    return this.repository.listFraudIncidentsPage(limit, offset);
  }

  async getFraudSupervisionStats(): Promise<AdminFraudSupervisionStats> {
    return this.repository.getFraudSupervisionStats();
  }

  async listFraudSessionEvents(sessionId: string, limit = 40): Promise<AdminFraudStreamEvent[]> {
    return this.repository.listFraudSessionEvents(sessionId, limit);
  }

  async getFraudMetrics(): Promise<AdminFraudMetrics> {
    return this.repository.getFraudMetrics();
  }

  async getModerationMetrics(): Promise<AdminModerationMetrics> {
    return this.repository.getModerationMetrics();
  }

  async getUserMetrics(): Promise<AdminUserMetrics> {
    return this.repository.getUserMetrics();
  }

  async getAdminLiveSnapshot(): Promise<AdminLiveSnapshot> {
    return this.repository.getAdminLiveSnapshot();
  }

  async getDashboardKpis(): Promise<AdminDashboardKpis> {
    return this.repository.getDashboardKpis();
  }

  async getNavBadges(): Promise<AdminNavBadges> {
    return this.repository.getNavBadges();
  }

  async getCockpitData(): Promise<AdminCockpitData> {
    return this.repository.getCockpitData();
  }

  async getRevenueDashboardData(): Promise<AdminRevenueDashboardData> {
    return this.repository.getRevenueDashboardData();
  }

  async getWithdrawalsDashboardMeta(
    filter: string,
    page: number,
    limit: number,
  ): Promise<AdminWithdrawalsDashboardMeta> {
    return this.repository.getWithdrawalsDashboardMeta(filter, page, limit);
  }

  async getWalletBalancesByUserIds(userIds: string[]): Promise<Record<string, number>> {
    return this.repository.getWalletBalancesByUserIds(userIds);
  }

  async getHealthSnapshot(): Promise<AdminHealthSnapshot> {
    return this.repository.getHealthSnapshot();
  }

  async getLiveControlSnapshot(): Promise<LiveControlSnapshot> {
    return this.repository.getLiveControlSnapshot();
  }

  async listRoyaltyCycles(limit = 12): Promise<RoyaltyCycle[]> {
    return this.royalty.listRoyaltyCycles(limit);
  }

  async triggerRoyaltyCycle(input: TriggerRoyaltyCycleInput) {
    const parsed = triggerRoyaltyCycleSchema.safeParse(input);
    if (!parsed.success) throw new AdminError("update_failed");
    try {
      return await this.royalty.triggerRoyaltyCycle(parsed.data);
    } catch {
      throw new AdminError("update_failed");
    }
  }

  async listUsers(params: {
    q?: string;
    filter?: AdminUsersFilter;
    page?: number;
  }): Promise<AdminUsersListResult> {
    return this.users.listUsers(params);
  }

  async warnUser(userId: string, reason: string, adminNote: string): Promise<void> {
    await this.users.warnUser(userId, reason, adminNote).catch(() => {
      throw new AdminError("update_failed");
    });
  }

  async suspendUser(userId: string, durationDays: number, reason: string): Promise<void> {
    await this.users.suspendUser(userId, durationDays, reason).catch(() => {
      throw new AdminError("update_failed");
    });
  }

  async deleteUser(userId: string, reason: string): Promise<void> {
    await this.users.deleteUser(userId, reason).catch(() => {
      throw new AdminError("update_failed");
    });
  }

  async listArtists(params: {
    q?: string;
    filter?: AdminArtistsFilter;
    page?: number;
  }): Promise<AdminArtistsListResult> {
    return this.artists.listArtists(params);
  }

  async verifyArtist(creatorId: string, approved: boolean, note: string): Promise<void> {
    await this.artists.verifyArtist(creatorId, approved, note).catch(() => {
      throw new AdminError("update_failed");
    });
  }

  async changeArtistTier(creatorId: string, newTier: AdminCreatorTier): Promise<void> {
    await this.artists.changeArtistTier(creatorId, newTier).catch(() => {
      throw new AdminError("update_failed");
    });
  }

  async suspendCreator(creatorId: string, reason: string): Promise<void> {
    await this.artists.suspendCreator(creatorId, reason).catch(() => {
      throw new AdminError("update_failed");
    });
  }

  async warnCreatorOwner(ownerId: string, reason: string, note: string): Promise<void> {
    await this.artists.warnCreatorOwner(ownerId, reason, note).catch(() => {
      throw new AdminError("update_failed");
    });
  }
}

export function createAdminService(client: SonafrikSupabaseClient): AdminService {
  return new AdminService(client);
}

export type {
  AdminCockpitData,
  AdminDashboardKpis,
  AdminFraudMetrics,
  AdminFraudSession,
  AdminHealthSnapshot,
  AdminLiveSnapshot,
  AdminModerationMetrics,
  AdminNavBadges,
  AdminUserMetrics,
  AdminRightsClaim,
  LiveControlSnapshot,
  PendingCatalogItem,
} from "./types";
