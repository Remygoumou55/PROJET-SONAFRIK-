import type { SonafrikSupabaseClient } from "@sonafrik/database";
import type { Json } from "@sonafrik/database/types";
import type {
  Notification,
  Profile,
  UserPreferences,
  UserRole,
  UserSession,
} from "@sonafrik/types";

export class IdentityRepository {
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

  async updateProfile(
    userId: string,
    updates: {
      full_name?: string;
      bio?: string | null;
      city?: string;
      country_code?: string;
      email?: string | null;
      avatar_path?: string;
      locale?: string;
    },
  ): Promise<Profile> {
    const { data, error } = await this.client
      .from("profiles")
      .update({ ...updates, updated_by: userId })
      .eq("id", userId)
      .select("*")
      .single();

    if (error) throw error;
    return data as Profile;
  }

  async softDeleteProfile(userId: string): Promise<void> {
    const { error } = await this.client
      .from("profiles")
      .update({ deleted_at: new Date().toISOString(), updated_by: userId })
      .eq("id", userId);

    if (error) throw error;
  }

  async getPreferences(userId: string): Promise<UserPreferences | null> {
    const { data, error } = await this.client
      .from("user_preferences")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) throw error;
    return data as UserPreferences | null;
  }

  async updatePreferences(
    userId: string,
    updates: Partial<
      Omit<UserPreferences, "user_id" | "created_at" | "updated_at">
    >,
  ): Promise<UserPreferences> {
    const { data, error } = await this.client
      .from("user_preferences")
      .update({ ...updates, updated_by: userId })
      .eq("user_id", userId)
      .select("*")
      .single();

    if (error) throw error;
    return data as UserPreferences;
  }

  async getNotifications(userId: string, limit = 50): Promise<Notification[]> {
    const { data, error } = await this.client
      .from("notifications")
      .select("*")
      .eq("user_id", userId)
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) throw error;
    return (data ?? []) as Notification[];
  }

  async getUnreadCount(userId: string): Promise<number> {
    const { count, error } = await this.client
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .is("read_at", null)
      .is("deleted_at", null);

    if (error) throw error;
    return count ?? 0;
  }

  async markNotificationRead(notificationId: string): Promise<void> {
    const { error } = await this.client.rpc("mark_notification_read", {
      p_notification_id: notificationId,
    });
    if (error) throw error;
  }

  async markAllNotificationsRead(): Promise<number> {
    const { data, error } = await this.client.rpc("mark_all_notifications_read");
    if (error) throw error;
    return (data as number) ?? 0;
  }

  async getUserRoles(userId: string): Promise<UserRole[]> {
    const { data: assignments, error } = await this.client
      .from("user_roles")
      .select("role_id")
      .eq("user_id", userId);

    if (error) throw error;
    if (!assignments?.length) return [];

    const roleIds = assignments.map((row) => row.role_id);
    const { data: roles, error: rolesError } = await this.client
      .from("roles")
      .select("name")
      .in("id", roleIds);

    if (rolesError) throw rolesError;

    return (roles ?? [])
      .map((role) => role.name)
      .filter((name): name is UserRole =>
        name === "auditeur" ||
        name === "artiste" ||
        name === "auditeur_artiste" ||
        name === "admin",
      );
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

  async logAudit(
    action: string,
    entityType?: string,
    entityId?: string,
    metadata?: Record<string, unknown>,
  ): Promise<void> {
    const { error } = await this.client.rpc("log_audit_event_authenticated", {
      p_action: action,
      p_entity_type: entityType,
      p_entity_id: entityId,
      p_metadata: (metadata ?? {}) as Json,
    });
    if (error) throw error;
  }
}
