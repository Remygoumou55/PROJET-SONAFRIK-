import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@sonafrik/database/types";
import type { SonafrikSupabaseClient } from "@sonafrik/database";
import { createSonafrikClient } from "@sonafrik/database";

let client: SonafrikSupabaseClient | undefined;

function getSupabaseEnv(): { url: string; anonKey: string } {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (url && anonKey) return { url, anonKey };

  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "[SONAFRIK] NEXT_PUBLIC_SUPABASE_URL et NEXT_PUBLIC_SUPABASE_ANON_KEY sont requis en production.",
    );
  }

  // Supabase local dev uniquement — jamais atteint en production
  return {
    url: "http://127.0.0.1:54321",
    anonKey:
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0",
  };
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
