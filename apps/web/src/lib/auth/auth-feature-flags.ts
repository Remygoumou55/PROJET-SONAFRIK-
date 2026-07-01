import type { SonafrikSupabaseClient } from "@sonafrik/database";

export const AUTH_PHONE_FLAG_NAME = "auth_phone_enabled" as const;

export interface AuthFeatureFlags {
  readonly phoneAuthEnabled: boolean;
}

export const DEFAULT_AUTH_FEATURE_FLAGS: AuthFeatureFlags = {
  phoneAuthEnabled: false,
};

const FLAG_FETCH_TIMEOUT_MS = 2_500;

async function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  const timeout = new Promise<T>((_, reject) => {
    setTimeout(() => reject(new Error("auth_flags_timeout")), ms);
  });
  return Promise.race([promise, timeout]);
}

type AuthFlagsRpcClient = {
  rpc(
    fn: "get_auth_feature_flags",
  ): Promise<{ data: Record<string, unknown> | null; error: { message: string } | null }>;
};

/** Flags auth publics (page connexion — anon OK via RPC SECURITY DEFINER). */
export async function resolveAuthFeatureFlags(
  client: SonafrikSupabaseClient,
): Promise<AuthFeatureFlags> {
  try {
    const fetchFlags = (client as unknown as AuthFlagsRpcClient)
      .rpc("get_auth_feature_flags")
      .then(({ data, error }) => {
        if (error) throw error;
        const payload = data ?? {};
        return {
          phoneAuthEnabled: payload.auth_phone_enabled === true,
        } satisfies AuthFeatureFlags;
      });

    return await withTimeout(fetchFlags, FLAG_FETCH_TIMEOUT_MS);
  } catch {
    return DEFAULT_AUTH_FEATURE_FLAGS;
  }
}
