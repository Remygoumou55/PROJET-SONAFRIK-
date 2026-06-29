import type { SonafrikSupabaseClient } from "@sonafrik/database";
import type { TrackCredit } from "@sonafrik/types";

/** Résout creator.id depuis profiles.id (owner_id) — liens /listen/artist/[creator_id]. */
export async function fetchCreatorIdsByProfileIds(
  client: SonafrikSupabaseClient,
  profileIds: string[],
): Promise<Map<string, string>> {
  const unique = [...new Set(profileIds.filter(Boolean))];
  if (unique.length === 0) return new Map();

  const { data, error } = await client
    .from("creators")
    .select("id, owner_id")
    .in("owner_id", unique)
    .is("deleted_at", null);

  if (error) throw error;

  const map = new Map<string, string>();
  for (const row of data ?? []) {
    if (row.owner_id && row.id) {
      map.set(row.owner_id as string, row.id as string);
    }
  }
  return map;
}

export async function enrichTrackCreditsWithCreatorIds(
  client: SonafrikSupabaseClient,
  credits: TrackCredit[],
): Promise<TrackCredit[]> {
  const profileIds = credits
    .map((c) => c.contributor_profile_id)
    .filter((id): id is string => Boolean(id));
  if (profileIds.length === 0) return credits;

  const creatorByProfile = await fetchCreatorIdsByProfileIds(client, profileIds);
  return credits.map((credit) => ({
    ...credit,
    contributor_creator_id: credit.contributor_profile_id
      ? (creatorByProfile.get(credit.contributor_profile_id) ?? null)
      : null,
  }));
}
