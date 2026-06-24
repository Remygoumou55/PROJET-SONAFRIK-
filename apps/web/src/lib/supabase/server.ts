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

// Fetch avec AbortController — protège chaque requête Supabase contre les hangs infinis.
// Supabase free tier peut prendre 10-30s en cold start → sans timeout, la page ne répond jamais.
// 8s : suffisant pour une requête normale, court-circuite un cold start.
function fetchWithTimeout(timeoutMs: number): typeof fetch {
  return (input, init) => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    return fetch(input, { ...init, signal: controller.signal }).finally(() =>
      clearTimeout(timer),
    );
  };
}

// Mode bypass local : toutes les requêtes Supabase renvoient des tableaux vides immédiatement.
// Évite tout cold start, tout timeout, tout blocage de page en dev.
// JAMAIS actif sur Vercel (BYPASS_AUTH + VERCEL !== "1").
function fetchBypassMode(): typeof fetch {
  return (input, _init) => {
    const url = String(typeof input === "object" && "url" in input ? (input as Request).url : input);
    // Requêtes REST PostgREST → tableau vide
    if (url.includes("/rest/v1/")) {
      return Promise.resolve(
        new Response("[]", {
          status: 200,
          headers: { "Content-Type": "application/json", "Content-Range": "*/0" },
        }),
      );
    }
    // Appels RPC → null
    if (url.includes("/functions/v1/") || url.includes("/rpc/")) {
      return Promise.resolve(
        new Response("null", { status: 200, headers: { "Content-Type": "application/json" } }),
      );
    }
    // Auth → no session
    if (url.includes("/auth/v1/")) {
      return Promise.resolve(
        new Response('{"user":null,"session":null}', {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      );
    }
    // Tout le reste (storage, etc.) → fetch réel avec timeout court
    return fetchWithTimeout(3000)(input, _init);
  };
}

function isBypassActive(): boolean {
  return process.env.BYPASS_AUTH === "true" && process.env.VERCEL !== "1";
}

const SUPABASE_FETCH_TIMEOUT_MS = 8000;

// Client anon sans cookies — pour unstable_cache (données publiques, pas de session).
export function getSupabasePublicClient(): SonafrikSupabaseClient {
  const { url, anonKey } = getSupabaseEnv();
  return createClient<Database>(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { fetch: isBypassActive() ? fetchBypassMode() : fetchWithTimeout(SUPABASE_FETCH_TIMEOUT_MS) },
  }) as unknown as SonafrikSupabaseClient;
}

// Client service role — bypass RLS complet — réservé aux routes admin server-side.
// Passer { adminVerified: true } uniquement après verifyAdminForAction() / requireAdmin().
export function getSupabaseAdminClient(options?: { adminVerified?: boolean }): SonafrikSupabaseClient {
  if (process.env.VERCEL === "1" && !options?.adminVerified) {
    throw new Error("getSupabaseAdminClient: adminVerified requis en production.");
  }
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) throw new Error("SUPABASE_SERVICE_ROLE_KEY manquant");
  return createClient<Database>(url, serviceKey, {
    auth: { persistSession: false },
    global: { fetch: isBypassActive() ? fetchBypassMode() : fetchWithTimeout(SUPABASE_FETCH_TIMEOUT_MS) },
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
      global: { fetch: isBypassActive() ? fetchBypassMode() : fetchWithTimeout(SUPABASE_FETCH_TIMEOUT_MS) },
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
