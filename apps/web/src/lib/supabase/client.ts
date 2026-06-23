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

  // En mode audit local : mock getUser() seulement sans session réelle.
  // Ne pas remplacer l'objet auth (casse _useSession) — getSession reste intact pour stream-start.
  if (process.env.NEXT_PUBLIC_LOCAL_AUDIT_MODE === "true") {
    const auth = client.auth;
    auth.getUser = async () => {
      const { data: { session } } = await auth.getSession();
      if (session?.user) {
        return { data: { user: session.user }, error: null };
      }
      return {
        data: { user: DEV_MOCK_USER as unknown as import("@supabase/supabase-js").User },
        error: null,
      };
    };
  }

  return client;
}

/** Client typé SONAFRIK (fallback sans cookies SSR) */
export function getSonafrikClient(): SonafrikSupabaseClient {
  const { url, anonKey } = getSupabaseEnv();
  return createSonafrikClient({ url, anonKey });
}
