import type { SupabaseClient } from "@supabase/supabase-js";
import type { TrackWithMeta } from "@sonafrik/types";
import { createCatalogService } from "@sonafrik/api/catalog";
import { createListenerService } from "@sonafrik/api/listener";
import type { ListenerArtistProfile } from "@sonafrik/api/listener";
import { filterValidAlbums, filterValidTracks, isValidContentName } from "@/lib/content-filter";

export type ArtistPublicSort = "popular" | "recent" | "oldest";

export interface ArtistPublicPageData {
  artist: ListenerArtistProfile;
  validAlbums: Awaited<ReturnType<ReturnType<typeof createListenerService>["getPublishedAlbumsForArtist"]>>;
  validPinned: TrackWithMeta[];
  validTracks: TrackWithMeta[];
  appearances: Awaited<ReturnType<ReturnType<typeof createCatalogService>["getTracksFeaturingCreator"]>>;
  stats: Awaited<ReturnType<ReturnType<typeof createListenerService>["getArtistPublicStats"]>>;
  tipsEnabled: boolean;
}

export async function fetchArtistPublicPageData(
  supabase: SupabaseClient,
  artistId: string,
  sort: ArtistPublicSort = "recent",
): Promise<ArtistPublicPageData | null> {
  const listener = createListenerService(supabase);
  const catalog = createCatalogService(supabase);

  const artist = await listener.getPublicArtistProfile(artistId);
  if (!artist || !isValidContentName(artist.stage_name)) return null;

  const [albums, tipsEnabled, appearances, stats] = await Promise.all([
    listener.getPublishedAlbumsForArtist(artistId, 12),
    listener.isFeatureEnabled("tips"),
    catalog.getTracksFeaturingCreator(artistId),
    listener.getArtistPublicStats(artistId),
  ]);

  const validAlbums = filterValidAlbums(albums);
  const albumCoverMap = new Map(validAlbums.map((a) => [a.id, a.cover_url]));

  const [pinnedTracks, allTracks] = await Promise.all([
    listener.getPinnedTracksForArtist(artistId, artist.stage_name, albumCoverMap),
    listener.getPublishedTracksForArtistSorted(artistId, artist.stage_name, albumCoverMap, sort, 30),
  ]);

  return {
    artist,
    validAlbums,
    validPinned: filterValidTracks(pinnedTracks) as TrackWithMeta[],
    validTracks: filterValidTracks(allTracks) as TrackWithMeta[],
    appearances,
    stats,
    tipsEnabled,
  };
}
