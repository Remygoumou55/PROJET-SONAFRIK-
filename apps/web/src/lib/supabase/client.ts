import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@sonafrik/database/types";
import type { SonafrikSupabaseClient } from "@sonafrik/database";
import { createSonafrikClient } from "@sonafrik/database";

let client: SonafrikSupabaseClient | undefined;

function getSupabaseEnv(): { url: string; anonKey: string } {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) throw new Error("Configuration Supabase manquante");

  return { url, anonKey };
}

// Retourne true si le mode audit local est actif (jamais sur Vercel).
export function isLocalAuditMode(): boolean {
  return process.env.NEXT_PUBLIC_LOCAL_AUDIT_MODE === "true";
}

// Utilisateur mock stable retourné quand le mode audit est actif.
const DEV_MOCK_USER = {
  id: "dev-mock-id",
  email: "dev@sonafrik.test",
  phone: "+224000000000",
  app_metadata: { provider: "phone" },
  user_metadata: {},
  aud: "authenticated",
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
  role: "authenticated",
  last_sign_in_at: "2026-01-01T00:00:00Z",
} as const;

export function getSupabaseBrowserClient(): SonafrikSupabaseClient {
  if (client) return client;

  const { url, anonKey } = getSupabaseEnv();
  client = createBrowserClient<Database>(url, anonKey) as unknown as SonafrikSupabaseClient;

  // En mode audit local, on court-circuite auth.getUser() et auth.getSession()
  // pour que TOUS les services obtiennent un user mock sans appeler Supabase Auth.
  // JAMAIS actif sur Vercel (NEXT_PUBLIC_LOCAL_AUDIT_MODE n'est pas dans le bundle prod).
  if (process.env.NEXT_PUBLIC_LOCAL_AUDIT_MODE === "true") {
    const originalAuth = (client as unknown as { auth: Record<string, unknown> }).auth;
    (client as unknown as { auth: Record<string, unknown> }).auth = {
      ...originalAuth,
      getUser: async () => ({
        data: { user: DEV_MOCK_USER as unknown as import("@supabase/supabase-js").User },
        error: null,
      }),
      getSession: async () => ({ data: { session: null }, error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
    };
  }

  return client;
}

/** Client typé SONAFRIK (fallback sans cookies SSR) */
export function getSonafrikClient(): SonafrikSupabaseClient {
  const { url, anonKey } = getSupabaseEnv();
  return createSonafrikClient({ url, anonKey });
}
