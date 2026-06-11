import type { SonafrikSupabaseClient } from "@sonafrik/database";
import type {
  IdentityContext,
  Notification,
  Profile,
  UserPreferences,
  UserRole,
  UserSession,
} from "@sonafrik/types";
import { IdentityError } from "./errors";
import { IdentityRepository } from "./identity.repository";
import {
  avatarUploadRequestSchema,
  updatePreferencesSchema,
  updateProfileSchema,
  type UpdatePreferencesInput,
  type UpdateProfileInput,
} from "./schemas";

export class IdentityService {
  private readonly repository: IdentityRepository;

  constructor(private readonly client: SonafrikSupabaseClient) {
    this.repository = new IdentityRepository(client);
  }

  private async requireUserId(): Promise<string> {
    const {
      data: { user },
    } = await this.client.auth.getUser();
    if (!user) throw new IdentityError("unauthorized");
    return user.id;
  }

  async getIdentityContext(): Promise<IdentityContext> {
    const userId = await this.requireUserId();
    const [profile, preferences, roles, unreadNotifications, sessions] = await Promise.all([
      this.repository.getProfile(userId),
      this.repository.getPreferences(userId),
      this.repository.getUserRoles(userId),
      this.repository.getUnreadCount(userId),
      this.repository.getActiveSessions(userId),
    ]);

    if (!profile) throw new IdentityError("profile_not_found");

    // user_preferences peut manquer pour les utilisateurs OAuth (Google) si le
    // trigger handle_new_user_preferences n'a pas encore été exécuté — créer
    // la ligne avec les valeurs par défaut plutôt que d'interrompre le rendu
    const resolvedPreferences =
      preferences ??
      (await this.repository.upsertDefaultPreferences(userId));

    return {
      profile,
      preferences: resolvedPreferences,
      roles,
      unreadNotifications,
      activeSessions: sessions.length,
    };
  }

  async getProfile(): Promise<Profile> {
    const userId = await this.requireUserId();
    const profile = await this.repository.getProfile(userId);
    if (!profile) throw new IdentityError("profile_not_found");
    return profile;
  }

  async updateProfile(input: UpdateProfileInput): Promise<Profile> {
    const parsed = updateProfileSchema.safeParse(input);
    if (!parsed.success) throw new IdentityError("invalid_profile_data");

    const userId = await this.requireUserId();
    const updates: Parameters<IdentityRepository["updateProfile"]>[1] = {};

    if (parsed.data.fullName !== undefined) updates.full_name = parsed.data.fullName;
    if (parsed.data.bio !== undefined) updates.bio = parsed.data.bio;
    if (parsed.data.city !== undefined) updates.city = parsed.data.city;
    if (parsed.data.countryCode !== undefined) updates.country_code = parsed.data.countryCode;
    if (parsed.data.email !== undefined) updates.email = parsed.data.email;

    const profile = await this.repository.updateProfile(userId, updates);

    await this.repository.logAudit("identity.profile.updated", "profiles", userId, {
      fields: Object.keys(parsed.data),
    });

    return profile;
  }

  async getPreferences(): Promise<UserPreferences> {
    const userId = await this.requireUserId();
    const preferences = await this.repository.getPreferences(userId);
    if (!preferences) throw new IdentityError("preferences_not_found");
    return preferences;
  }

  async updatePreferences(input: UpdatePreferencesInput): Promise<UserPreferences> {
    const parsed = updatePreferencesSchema.safeParse(input);
    if (!parsed.success) throw new IdentityError("invalid_preferences");

    const userId = await this.requireUserId();
    const d = parsed.data;

    const preferences = await this.repository.updatePreferences(userId, {
      language: d.language,
      audio_quality: d.audioQuality,
      data_saver: d.dataSaver,
      autoplay_on_wifi: d.autoplayOnWifi,
      autoplay_on_cellular: d.autoplayOnCellular,
      explicit_content_allowed: d.explicitContentAllowed,
      profile_visibility: d.profileVisibility,
      show_listening_activity: d.showListeningActivity,
      push_notifications: d.pushNotifications,
      email_notifications: d.emailNotifications,
      sms_notifications: d.smsNotifications,
      marketing_notifications: d.marketingNotifications,
      awards_reminders: d.awardsReminders,
      new_releases_alerts: d.newReleasesAlerts,
      artist_comment_replies: d.artistCommentReplies,
      timezone: d.timezone,
    });

    if (d.language) {
      await this.repository.updateProfile(userId, { locale: d.language });
    }

    await this.repository.logAudit("identity.preferences.updated", "user_preferences", userId);
    return preferences;
  }

  async getNotifications(limit?: number): Promise<Notification[]> {
    const userId = await this.requireUserId();
    return this.repository.getNotifications(userId, limit);
  }

  async markNotificationRead(notificationId: string): Promise<void> {
    await this.requireUserId();
    try {
      await this.repository.markNotificationRead(notificationId);
    } catch {
      throw new IdentityError("notification_not_found");
    }
  }

  async markAllNotificationsRead(): Promise<number> {
    await this.requireUserId();
    return this.repository.markAllNotificationsRead();
  }

  async getActiveSessions(): Promise<UserSession[]> {
    const userId = await this.requireUserId();
    return this.repository.getActiveSessions(userId);
  }

  async revokeSession(sessionId: string): Promise<void> {
    const userId = await this.requireUserId();
    await this.repository.revokeSession(userId, sessionId);
    await this.repository.logAudit("identity.session.revoked", "user_sessions", sessionId);
  }

  async requestAvatarUploadUrl(contentType: string): Promise<{
    signedUrl: string;
    path: string;
    token: string;
    expiresIn: number;
  }> {
    const parsed = avatarUploadRequestSchema.safeParse({ contentType });
    if (!parsed.success) throw new IdentityError("avatar_type_invalid");

    await this.requireUserId();

    const { data, error } = await this.client.functions.invoke("avatar-signed-url", {
      body: { action: "upload", contentType: parsed.data.contentType },
    });

    if (error || !data?.signedUrl) {
      throw new IdentityError("avatar_upload_failed");
    }

    await this.repository.logAudit("identity.avatar.upload_requested", "profiles");

    return data as { signedUrl: string; path: string; token: string; expiresIn: number };
  }

  async getAvatarSignedUrl(): Promise<string | null> {
    await this.requireUserId();

    const { data, error } = await this.client.functions.invoke("avatar-signed-url", {
      body: { action: "read" },
    });

    if (error) throw new IdentityError("unknown");
    return (data?.signedUrl as string | null) ?? null;
  }

  async requestAccountDeletion(): Promise<void> {
    const userId = await this.requireUserId();
    await this.repository.softDeleteProfile(userId);
    await this.repository.logAudit("identity.account.deletion_requested", "profiles", userId);
    await this.client.auth.signOut();
  }

  async getRoles(): Promise<UserRole[]> {
    const userId = await this.requireUserId();
    return this.repository.getUserRoles(userId);
  }
}

export function createIdentityService(client: SonafrikSupabaseClient): IdentityService {
  return new IdentityService(client);
}
