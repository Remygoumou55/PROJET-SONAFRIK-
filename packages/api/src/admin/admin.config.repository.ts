import type { Json } from "@sonafrik/database/types";
import type { FeatureFlag, SystemSetting } from "@sonafrik/types";
import type { AdminRepoClient } from "./admin.shared";

export class AdminConfigRepository {
  constructor(private readonly client: AdminRepoClient) {}

  async listFeatureFlags(): Promise<FeatureFlag[]> {
    const { data, error } = await this.client
      .from("feature_flags")
      .select("*")
      .order("name");
    if (error) throw error;
    return (data ?? []) as unknown as FeatureFlag[];
  }

  async toggleFeatureFlag(
    name: string,
    enabled: boolean,
    updatedBy: string | null,
  ): Promise<FeatureFlag> {
    const { data, error } = await this.client
      .from("feature_flags")
      .update({ enabled, updated_by: updatedBy })
      .eq("name", name)
      .select("*")
      .single();
    if (error) throw error;
    return data as unknown as FeatureFlag;
  }

  async listSystemSettings(): Promise<SystemSetting[]> {
    const { data, error } = await this.client
      .from("system_settings")
      .select("*")
      .order("category")
      .order("key");
    if (error) throw error;
    return (data ?? []) as unknown as SystemSetting[];
  }

  async updateSystemSetting(
    key: string,
    value: unknown,
    updatedBy: string | null,
  ): Promise<SystemSetting> {
    const { data, error } = await this.client
      .from("system_settings")
      .update({ value: value as Json, updated_by: updatedBy })
      .eq("key", key)
      .select("*")
      .single();
    if (error) throw error;
    return data as unknown as SystemSetting;
  }

  async isFeatureEnabled(name: string): Promise<boolean> {
    const { data, error } = await this.client
      .from("feature_flags")
      .select("enabled")
      .eq("name", name)
      .maybeSingle();
    if (error) throw error;
    return (data as { enabled: boolean } | null)?.enabled ?? false;
  }
}
