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

export function getSupabaseBrowserClient(): SonafrikSupabaseClient {
  if (client) return client;

  const { url, anonKey } = getSupabaseEnv();
  client = createBrowserClient<Database>(url, anonKey) as unknown as SonafrikSupabaseClient;
  return client;
}

/** Client typé SONAFRIK (fallback sans cookies SSR) */
export function getSonafrikClient(): SonafrikSupabaseClient {
  const { url, anonKey } = getSupabaseEnv();
  return createSonafrikClient({ url, anonKey });
}
