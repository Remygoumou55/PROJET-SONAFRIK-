import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./types";

export type SonafrikSupabaseClient = SupabaseClient<Database>;

export interface SupabaseClientOptions {
  url: string;
  anonKey: string;
}

export function createSonafrikClient(
  options: SupabaseClientOptions,
): SonafrikSupabaseClient {
  return createClient<Database>(options.url, options.anonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });
}

export function createSonafrikServerClient(
  options: SupabaseClientOptions & { serviceRoleKey: string },
): SupabaseClient<Database> {
  return createClient<Database>(options.url, options.serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
