import type { SonafrikSupabaseClient } from "@sonafrik/database";
import type { FeatureFlag, SystemSetting, RoyaltyCycle } from "@sonafrik/types";
import { AdminError } from "./errors";
import { AdminRepository } from "./admin.repository";
import { createRoyaltyService, type RoyaltyService } from "../royalties/royalty.service";
import { toggleFeatureFlagSchema, updateSystemSettingSchema, triggerRoyaltyCycleSchema } from "./schemas";
import type { TriggerRoyaltyCycleInput } from "./schemas";
import type {
  AdminCockpitData,
  AdminDashboardKpis,
  AdminFraudSession,
  AdminHealthSnapshot,
  AdminNavBadges,
  AdminRightsClaim,
  LiveControlSnapshot,
  PendingCatalogItem,
} from "./types";

export class AdminService {
  private readonly repository: AdminRepository;
  private readonly royalty: RoyaltyService;

  constructor(private readonly client: SonafrikSupabaseClient) {
    this.repository = new AdminRepository(client);
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
    const flag = await this.repository
      .toggleFeatureFlag(name, enabled, userId)
      .catch(() => { throw new AdminError("update_failed"); });
    return flag;
  }

  async listSystemSettings(): Promise<SystemSetting[]> {
    return this.repository.listSystemSettings();
  }

  async updateSystemSetting(key: string, value: unknown): Promise<SystemSetting> {
    const parsed = updateSystemSettingSchema.safeParse({ key, value });
    if (!parsed.success) throw new AdminError("setting_not_found");

    const userId = await this.getOptionalUserId();
    const setting = await this.repository
      .updateSystemSetting(key, value, userId)
      .catch(() => { throw new AdminError("update_failed"); });
    return setting;
  }

  async reviewCatalogItem(
    id: string,
    entityType: "album" | "track",
    action: "published" | "rejected",
    reason?: string,
  ): Promise<void> {
    await this.repository.reviewCatalogItem(id, entityType, action, reason)
      .catch(() => { throw new AdminError("update_failed"); });
  }

  async updateRightsClaim(
    id: string,
    status: "accepted" | "rejected" | "escalated" | "pending",
    notes?: string,
  ): Promise<void> {
    await this.repository.updateRightsClaim(id, status, notes)
      .catch(() => { throw new AdminError("update_failed"); });
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

  async getDashboardKpis(): Promise<AdminDashboardKpis> {
    return this.repository.getDashboardKpis();
  }

  async getNavBadges(): Promise<AdminNavBadges> {
    return this.repository.getNavBadges();
  }

  async getCockpitData(): Promise<AdminCockpitData> {
    return this.repository.getCockpitData();
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
}

export function createAdminService(client: SonafrikSupabaseClient): AdminService {
  return new AdminService(client);
}

export type {
  AdminCockpitData,
  AdminDashboardKpis,
  AdminFraudSession,
  AdminHealthSnapshot,
  AdminNavBadges,
  AdminRightsClaim,
  LiveControlSnapshot,
  PendingCatalogItem,
} from "./types";
