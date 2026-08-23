import type { SonafrikSupabaseClient } from "@sonafrik/database";
import type { Json } from "@sonafrik/database/types";
import type { FeatureFlag, SystemSetting, SystemSettingAuditEntry } from "@sonafrik/types";

export type { SystemSettingAuditEntry };

export class AdminConfigRepository {
  constructor(private readonly client: SonafrikSupabaseClient) {}

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
    motive?: string | null,
  ): Promise<SystemSetting> {
    const { data: previous, error: readError } = await this.client
      .from("system_settings")
      .select("value")
      .eq("key", key)
      .maybeSingle();
    if (readError) throw readError;

    const { data, error } = await this.client
      .from("system_settings")
      .update({ value: value as Json, updated_by: updatedBy })
      .eq("key", key)
      .select("*")
      .single();
    if (error) throw error;

    if (updatedBy) {
      const { error: auditError } = await this.client.rpc("log_audit_event", {
        p_actor_id: updatedBy,
        p_action: "admin.system_setting.updated",
        p_entity_type: "system_settings",
        p_metadata: {
          key,
          previous_value: previous?.value ?? null,
          new_value: value,
          motive: motive ?? null,
        } as Json,
      });
      if (auditError) throw auditError;
    }

    return data as unknown as SystemSetting;
  }

  async listSystemSettingAuditHistory(limit = 100): Promise<SystemSettingAuditEntry[]> {
    const { data, error } = await this.client
      .from("audit_logs")
      .select("id, actor_id, created_at, metadata")
      .eq("action", "admin.system_setting.updated")
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) throw error;

    return (data ?? []).map((row) => {
      const meta = (row.metadata ?? {}) as Record<string, unknown>;
      return {
        id: row.id as string,
        settingKey: String(meta.key ?? ""),
        actorId: (row.actor_id as string | null) ?? null,
        previousValue: meta.previous_value ?? null,
        newValue: meta.new_value ?? null,
        motive: typeof meta.motive === "string" ? meta.motive : null,
        createdAt: row.created_at as string,
      };
    });
  }

  async getSystemSettingAuditHistory(key: string, limit = 20): Promise<SystemSettingAuditEntry[]> {
    const rows = await this.listSystemSettingAuditHistory(limit * 3);
    return rows.filter((r) => r.settingKey === key).slice(0, limit);
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
