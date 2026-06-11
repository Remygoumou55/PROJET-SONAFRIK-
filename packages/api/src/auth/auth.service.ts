import type { SonafrikSupabaseClient } from "@sonafrik/database";
import type { Profile } from "@sonafrik/types";
import { AuthRepository } from "./auth.repository";
import { AuthError, mapSupabaseAuthError } from "./errors";
import {
  completeOnboardingSchema,
  registerSessionSchema,
  requestOtpSchema,
  verifyOtpSchema,
  type CompleteOnboardingInput,
  type RegisterSessionInput,
  type RequestOtpInput,
  type VerifyOtpInput,
} from "./schemas";

export class AuthService {
  private readonly repository: AuthRepository;

  constructor(private readonly client: SonafrikSupabaseClient) {
    this.repository = new AuthRepository(client);
  }

  async requestOtp(input: RequestOtpInput): Promise<void> {
    const parsed = requestOtpSchema.safeParse(input);
    if (!parsed.success) {
      throw new AuthError("invalid_phone");
    }

    const { error } = await this.client.auth.signInWithOtp({
      phone: parsed.data.phone,
      options: { channel: "sms" },
    });

    if (error) throw mapSupabaseAuthError(error);
  }

  async verifyOtp(input: VerifyOtpInput): Promise<{ userId: string; profile: Profile | null }> {
    const parsed = verifyOtpSchema.safeParse(input);
    if (!parsed.success) {
      const field = parsed.error.issues[0]?.path[0];
      throw new AuthError(field === "token" ? "invalid_otp" : "invalid_phone");
    }

    const { data, error } = await this.client.auth.verifyOtp({
      phone: parsed.data.phone,
      token: parsed.data.token,
      type: "sms",
    });

    if (error) throw mapSupabaseAuthError(error);
    if (!data.user) throw new AuthError("unknown");

    const profile = await this.repository.getProfile(data.user.id);

    await this.repository.logAudit("auth.otp.verified", "profiles", data.user.id, {
      phone: parsed.data.phone,
    });

    return { userId: data.user.id, profile };
  }

  async completeOnboarding(
    userId: string,
    input: CompleteOnboardingInput,
  ): Promise<Profile> {
    const parsed = completeOnboardingSchema.safeParse(input);
    if (!parsed.success) {
      const path = parsed.error.issues[0]?.path[0];
      if (path === "accountType") throw new AuthError("account_type_required");
      throw new AuthError("unknown");
    }

    const profile = await this.repository.updateProfileOnboarding(
      userId,
      parsed.data.accountType,
      parsed.data.fullName,
    );

    // assignRole et logAudit sont non-bloquants : le profil est déjà mis à jour.
    // Une RPC manquante en prod ne doit pas empêcher l'utilisateur d'accéder à l'app.
    await this.repository.assignRole(userId, parsed.data.accountType).catch(() => {
      // Non-bloquant : RPC peut être indisponible en preview deploy
    });

    await this.repository.logAudit("auth.onboarding.completed", "profiles", userId, {
      account_type: parsed.data.accountType,
    }).catch(() => {
      // Non-bloquant
    });

    return profile;
  }

  async getCurrentUserId(): Promise<string | null> {
    const {
      data: { user },
      error,
    } = await this.client.auth.getUser();

    if (error) throw mapSupabaseAuthError(error);
    return user?.id ?? null;
  }

  async completeOnboardingForCurrentUser(input: CompleteOnboardingInput): Promise<Profile> {
    const userId = await this.getCurrentUserId();
    if (!userId) throw new AuthError("session_expired");
    return this.completeOnboarding(userId, input);
  }

  async registerCurrentSession(input: RegisterSessionInput): Promise<void> {
    const userId = await this.getCurrentUserId();
    if (!userId) throw new AuthError("session_expired");
    return this.registerSession(userId, input);
  }

  async getCurrentProfile(): Promise<Profile | null> {
    const {
      data: { user },
      error,
    } = await this.client.auth.getUser();

    // AuthSessionMissingError = visiteur anonyme — comportement normal, pas une erreur
    if (error) {
      if (error.message?.includes("Auth session missing")) return null;
      throw mapSupabaseAuthError(error);
    }
    if (!user) return null;

    return this.repository.getProfile(user.id);
  }

  async registerSession(userId: string, input: RegisterSessionInput): Promise<void> {
    const parsed = registerSessionSchema.safeParse(input);
    if (!parsed.success) throw new AuthError("unknown");

    await this.repository.createSession(userId, parsed.data);

    await this.repository.logAudit("auth.session.registered", "user_sessions", userId, {
      platform: parsed.data.platform,
    });
  }

  async signOut(): Promise<void> {
    const {
      data: { user },
    } = await this.client.auth.getUser();

    if (user) {
      await this.repository.logAudit("auth.signout", "profiles", user.id);
    }

    const { error } = await this.client.auth.signOut();
    if (error) throw mapSupabaseAuthError(error);
  }

  async getSessions(userId: string) {
    return this.repository.getActiveSessions(userId);
  }

  async revokeSession(userId: string, sessionId: string): Promise<void> {
    await this.repository.revokeSession(userId, sessionId);
    await this.repository.logAudit("auth.session.revoked", "user_sessions", sessionId);
  }
}

export function createAuthService(client: SonafrikSupabaseClient): AuthService {
  return new AuthService(client);
}
