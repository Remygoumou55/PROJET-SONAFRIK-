import type { SonafrikSupabaseClient } from "@sonafrik/database";

/** Résout stage_name par creator_id — évite l'embed PostgREST albums/tracks → artist_profiles (PGRST200). */
export async function fetchStageNamesByCreatorIds(
  client: SonafrikSupabaseClient,
  creatorIds: string[],
): Promise<Map<string, string>> {
  const unique = [...new Set(creatorIds.filter(Boolean))];
  if (unique.length === 0) return new Map();

  const { data, error } = await client
    .from("artist_profiles")
    .select("creator_id, stage_name")
    .in("creator_id", unique);

  if (error) throw error;

  const map = new Map<string, string>();
  for (const row of data ?? []) {
    if (row.creator_id && row.stage_name) {
      map.set(row.creator_id, row.stage_name);
    }
  }
  return map;
}
