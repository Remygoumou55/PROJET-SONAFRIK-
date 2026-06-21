import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { cache } from "react";
import type { Database } from "@sonafrik/database/types";
import type { SonafrikSupabaseClient } from "@sonafrik/database";

function getSupabaseEnv(): { url: string; anonKey: string } {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) throw new Error("Configuration Supabase manquante");

  return { url, anonKey };
}

// Client service role — bypass RLS complet — réservé aux routes admin server-side.
// JAMAIS exposé côté client. JAMAIS utilisé sur Vercel sans vérification BYPASS_AUTH.
export function getSupabaseAdminClient(): SonafrikSupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) throw new Error("SUPABASE_SERVICE_ROLE_KEY manquant");
  return createClient<Database>(url, serviceKey, {
    auth: { persistSession: false },
  }) as unknown as SonafrikSupabaseClient;
}

// React.cache() déduplique les appels dans le même rendu serveur :
// layout.tsx + page.tsx + composants qui appellent getSupabaseServerClient()
// partagent la même instance — une seule création par request HTTP.
export const getSupabaseServerClient = cache(
  async (): Promise<SonafrikSupabaseClient> => {
    const cookieStore = await cookies();
    const { url, anonKey } = getSupabaseEnv();

    return createServerClient<Database>(url, anonKey, {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            /* Server Component — ignore */
          }
        },
      },
    }) as unknown as SonafrikSupabaseClient;
  },
);
