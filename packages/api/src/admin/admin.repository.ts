import type { SonafrikSupabaseClient } from "@sonafrik/database";
import type { Json } from "@sonafrik/database/types";
import type { FeatureFlag, SystemSetting } from "@sonafrik/types";

export class AdminRepository {
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

  async reviewCatalogItem(
    id: string,
    entityType: "album" | "track",
    action: "published" | "rejected",
    reason?: string,
  ): Promise<void> {
    if (entityType === "album") {
      const { error } = await this.client.rpc("review_album_publication", {
        p_album_id: id,
        p_status: action,
        ...(action === "rejected" && reason ? { p_rejection_reason: reason } : {}),
      });
      if (error) throw error;
      return;
    }

    const { error } = await this.client.rpc("review_track_publication", {
      p_track_id: id,
      p_status: action,
      ...(action === "rejected" && reason ? { p_rejection_reason: reason } : {}),
    });
    if (error) throw error;
  }

  async updateRightsClaim(
    id: string,
    status: string,
    notes?: string,
  ): Promise<void> {
    const patch: { status: string; reviewed_at: string; resolution_notes?: string } = {
      status,
      reviewed_at: new Date().toISOString(),
    };
    if (notes) patch.resolution_notes = notes;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await this.client.from("rights_claims").update(patch as any).eq("id", id);
    if (error) throw error;
  }
}
