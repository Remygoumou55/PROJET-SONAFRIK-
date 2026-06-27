import { createClient } from "@supabase/supabase-js";
import type { Database } from "@sonafrik/database/types";
import type { SonafrikSupabaseClient } from "@sonafrik/database";

function getSupabaseEnv(): { url: string; anonKey: string } {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) throw new Error("Configuration Supabase manquante");
  return { url, anonKey };
}

function fetchWithTimeout(timeoutMs: number): typeof fetch {
  return (input, init) => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    return fetch(input, { ...init, signal: controller.signal }).finally(() =>
      clearTimeout(timer),
    );
  };
}

const SUPABASE_FETCH_TIMEOUT_MS = 8000;

/** Client anon sans cookies — safe pour unstable_cache et données publiques. */
export function getSupabasePublicClient(): SonafrikSupabaseClient {
  const { url, anonKey } = getSupabaseEnv();
  return createClient<Database>(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { fetch: fetchWithTimeout(SUPABASE_FETCH_TIMEOUT_MS) },
  }) as unknown as SonafrikSupabaseClient;
}
