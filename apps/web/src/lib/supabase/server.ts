import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { cache } from "react";
import type { Database } from "@sonafrik/database/types";
import type { SonafrikSupabaseClient } from "@sonafrik/database";

function getSupabaseEnv(): { url: string; anonKey: string } {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (url && anonKey) return { url, anonKey };

  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "[SONAFRIK] NEXT_PUBLIC_SUPABASE_URL et NEXT_PUBLIC_SUPABASE_ANON_KEY sont requis en production.",
    );
  }

  return {
    url: "http://127.0.0.1:54321",
    anonKey:
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0",
  };
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
