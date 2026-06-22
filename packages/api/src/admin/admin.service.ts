import type { SonafrikSupabaseClient } from "@sonafrik/database";
import type { FeatureFlag, SystemSetting } from "@sonafrik/types";
import { AdminError } from "./errors";
import { AdminRepository } from "./admin.repository";
import { toggleFeatureFlagSchema, updateSystemSettingSchema } from "./schemas";

export class AdminService {
  private readonly repository: AdminRepository;

  constructor(private readonly client: SonafrikSupabaseClient) {
    this.repository = new AdminRepository(client);
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
    const table = entityType === "album" ? "albums" : "tracks";
    const updates: { publication_status: string; published_at?: string; rejection_reason?: string } = {
      publication_status: action,
    };
    if (action === "published") updates.published_at = new Date().toISOString();
    if (action === "rejected" && reason) updates.rejection_reason = reason;
    await this.repository.reviewCatalogItem(id, table, updates)
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
}

export function createAdminService(client: SonafrikSupabaseClient): AdminService {
  return new AdminService(client);
}
