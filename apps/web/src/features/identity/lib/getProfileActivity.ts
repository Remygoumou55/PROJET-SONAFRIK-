import { createCatalogService } from "@sonafrik/api/catalog";
import { createIdentityService } from "@sonafrik/api/identity";
import type { Profile } from "@sonafrik/types";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { isArtistAccount, type ProfileActivitySummary } from "./profilePresentation";

export async function getProfileActivity(profile: Profile): Promise<ProfileActivitySummary> {
  const supabase = await getSupabaseServerClient();
  const identity = createIdentityService(supabase);

  let lastConnection: string | null = null;
  let publishedAlbums: number | null = null;
  let publishedTracks: number | null = null;

  try {
    const sessions = await identity.getActiveSessions();
    lastConnection = sessions[0]?.last_active_at ?? null;
  } catch {
    lastConnection = null;
  }

  if (isArtistAccount(profile.account_type)) {
    try {
      const catalog = createCatalogService(supabase);
      const catalogContext = await catalog.getCatalogContext();
      publishedAlbums = catalogContext.albumsCount + catalogContext.singlesCount;
      publishedTracks = catalogContext.tracksCount;
    } catch {
      publishedAlbums = null;
      publishedTracks = null;
    }
  }

  return {
    memberSince: profile.created_at,
    lastConnection,
    publishedAlbums,
    publishedTracks,
  };
}
