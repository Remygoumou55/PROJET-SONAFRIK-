import type { SonafrikSupabaseClient } from "@sonafrik/database";
import type { FeatureFlag, SystemSetting } from "@sonafrik/types";

export class AdminRepository {
  constructor(private readonly client: SonafrikSupabaseClient) {}

  async listFeatureFlags(): Promise<FeatureFlag[]> {
    const { data, error } = await this.client
      .from("feature_flags" as never)
      .select("*")
      .order("name");
    if (error) throw error;
    return (data ?? []) as unknown as FeatureFlag[];
  }

  async toggleFeatureFlag(
    name: string,
    enabled: boolean,
    updatedBy: string,
  ): Promise<FeatureFlag> {
    const { data, error } = await this.client
      .from("feature_flags" as never)
      .update({ enabled, updated_by: updatedBy } as never)
      .eq("name" as never, name)
      .select("*")
      .single();
    if (error) throw error;
    return data as unknown as FeatureFlag;
  }

  async listSystemSettings(): Promise<SystemSetting[]> {
    const { data, error } = await this.client
      .from("system_settings" as never)
      .select("*")
      .order("category" as never)
      .order("key" as never);
    if (error) throw error;
    return (data ?? []) as unknown as SystemSetting[];
  }

  async updateSystemSetting(
    key: string,
    value: unknown,
    updatedBy: string,
  ): Promise<SystemSetting> {
    const { data, error } = await this.client
      .from("system_settings" as never)
      .update({ value, updated_by: updatedBy } as never)
      .eq("key" as never, key)
      .select("*")
      .single();
    if (error) throw error;
    return data as unknown as SystemSetting;
  }
}
