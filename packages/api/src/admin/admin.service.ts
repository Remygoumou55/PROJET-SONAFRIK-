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

  private async requireUserId(): Promise<string> {
    const {
      data: { user },
    } = await this.client.auth.getUser();
    if (!user) throw new AdminError("unauthorized");
    return user.id;
  }

  async listFeatureFlags(): Promise<FeatureFlag[]> {
    return this.repository.listFeatureFlags();
  }

  async toggleFeatureFlag(name: string, enabled: boolean): Promise<FeatureFlag> {
    const parsed = toggleFeatureFlagSchema.safeParse({ name, enabled });
    if (!parsed.success) throw new AdminError("flag_not_found");

    const userId = await this.requireUserId();
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

    const userId = await this.requireUserId();
    const setting = await this.repository
      .updateSystemSetting(key, value, userId)
      .catch(() => { throw new AdminError("update_failed"); });
    return setting;
  }
}

export function createAdminService(client: SonafrikSupabaseClient): AdminService {
  return new AdminService(client);
}
