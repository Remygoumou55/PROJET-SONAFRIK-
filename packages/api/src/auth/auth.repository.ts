import type { SonafrikSupabaseClient } from "@sonafrik/database";
import type { Json } from "@sonafrik/database/types";
import type { AccountType, Profile, UserSession } from "@sonafrik/types";

export class AuthRepository {
  constructor(private readonly client: SonafrikSupabaseClient) {}

  async getProfile(userId: string): Promise<Profile | null> {
    const { data, error } = await this.client
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .is("deleted_at", null)
      .maybeSingle();

    if (error) throw error;
    return data as Profile | null;
  }

  async updateProfileOnboarding(
    userId: string,
    accountType: AccountType,
    fullName: string,
  ): Promise<Profile> {
    const { data, error } = await this.client
      .from("profiles")
      .upsert(
        {
          id: userId,
          account_type: accountType,
          full_name: fullName,
          onboarding_completed: true,
          updated_by: userId,
          created_by: userId,
        },
        { onConflict: "id" },
      )
      .select("*")
      .single();

    if (error) throw error;
    return data as Profile;
  }

  async assignRole(userId: string, accountType: AccountType): Promise<void> {
    const { error } = await this.client.rpc("assign_role_for_account_type", {
      p_user_id: userId,
      p_account_type: accountType,
      p_assigned_by: userId,
    });

    if (error) throw error;
  }

  async logAudit(
    action: string,
    entityType?: string,
    entityId?: string,
    metadata?: Record<string, unknown>,
  ): Promise<void> {
    const { error } = await this.client.rpc("log_audit_event_authenticated", {
      p_action: action,
      p_entity_type: entityType ?? undefined,
      p_entity_id: entityId ?? undefined,
      p_metadata: (metadata ?? {}) as Json,
    });

    if (error) throw error;
  }

  async createSession(
    userId: string,
    input: {
      deviceId?: string;
      deviceName?: string;
      platform: "web" | "ios" | "android";
      userAgent?: string;
    },
  ): Promise<UserSession> {
    const { data, error } = await this.client
      .from("user_sessions")
      .insert({
        user_id: userId,
        device_id: input.deviceId ?? null,
        device_name: input.deviceName ?? null,
        platform: input.platform,
        user_agent: input.userAgent ?? null,
        created_by: userId,
        updated_by: userId,
      })
      .select("*")
      .single();

    if (error) throw error;
    return data as UserSession;
  }

  async getActiveSessions(userId: string): Promise<UserSession[]> {
    const { data, error } = await this.client
      .from("user_sessions")
      .select("*")
      .eq("user_id", userId)
      .is("revoked_at", null)
      .order("last_active_at", { ascending: false });

    if (error) throw error;
    return (data ?? []) as UserSession[];
  }

  async revokeSession(userId: string, sessionId: string): Promise<void> {
    const { error } = await this.client
      .from("user_sessions")
      .update({ revoked_at: new Date().toISOString(), updated_by: userId })
      .eq("id", sessionId)
      .eq("user_id", userId);

    if (error) throw error;
  }
}
