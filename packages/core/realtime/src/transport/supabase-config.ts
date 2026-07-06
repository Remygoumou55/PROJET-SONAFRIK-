import type { SupabasePostgresSubscription } from "./supabase-types";

/** Abonnements Realtime par défaut — catalog, notifications, listener live, admin snapshot. */
export const DEFAULT_SRTSP_SUPABASE_SUBSCRIPTIONS: SupabasePostgresSubscription[] = [
  { table: "tracks", events: ["INSERT", "UPDATE", "DELETE"] },
  { table: "notifications", events: ["INSERT"] },
  { table: "track_reaction_counts", events: ["INSERT", "UPDATE"] },
  { table: "stream_sessions", events: ["INSERT", "UPDATE", "DELETE"] },
  { table: "profiles", events: ["INSERT", "UPDATE"] },
  { table: "artist_profiles", events: ["INSERT", "UPDATE"] },
  { table: "withdrawals", events: ["INSERT", "UPDATE"] },
  { table: "rights_claims", events: ["INSERT", "UPDATE"] },
  { table: "creator_verifications", events: ["INSERT", "UPDATE"] },
  { table: "wallet_ledger", events: ["INSERT"] },
  { table: "albums", events: ["INSERT", "UPDATE"] },
];
