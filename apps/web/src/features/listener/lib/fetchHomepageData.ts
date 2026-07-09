import type { SupabaseClient } from "@supabase/supabase-js";
import type { DiscoveryArtist, DiscoveryTrack, HeroItemAlbum, ListenMusicCategory } from "@sonafrik/types";
import { createDiscoveryService } from "@sonafrik/api/discovery";
import {
  createListenerService,
  filterDiscoveryTracksByCategory,
  filterTrendingTracksByCategory,
  parseListenMusicCategory,
  type TopGuineaFeed,
} from "@sonafrik/api/listener";
import {
  filterValidArtists,
  filterValidPlaylists,
  filterValidTracks,
} from "@/lib/content-filter";
import type { HomepageData } from "../components/HomepageContentSections";

function dedupeDiscoveryTracks(tracks: DiscoveryTrack[]): DiscoveryTrack[] {
  const seen = new Set<string>();
  return tracks.filter((track) => {
    if (seen.has(track.track_id)) return false;
    seen.add(track.track_id);
    return true;
  });
}

/** Charge les sections accueil auditeur — SSR et refresh SRTSP client. */
export async function fetchHomepageData(
  supabase: SupabaseClient,
  categoryInput: string,
): Promise<HomepageData> {
  const category = parseListenMusicCategory(categoryInput);

  try {
    const listener = createListenerService(supabase);
    const discovery = createDiscoveryService(supabase);

    const [curated, topGuineaRaw, discoveriesRaw, newReleasesResult, suggestedArtistsRaw, featuredAlbumsRaw] =
      await Promise.all([
        listener.getHomepageCurated(8).catch(() => ({ playlists: [], artists: [], genres: [] })),
        listener.getTopGuineaTracks(24).catch((): TopGuineaFeed => ({
          tracks: [],
          period: "7d",
          periodLabel: "7 derniers jours",
        })),
        discovery.getDiscoveryFeed({ limit: 10 }).catch((): DiscoveryTrack[] => []),
        discovery
          .getNewReleases({ type: "track", days: 365, limit: 20 })
          .catch((): { tracks: DiscoveryTrack[] } => ({ tracks: [] })),
        discovery.getSuggestedArtists({ limit: 8 }).catch((): DiscoveryArtist[] => []),
        listener.getHeroFeaturedAlbums(60, 8).catch((): HeroItemAlbum[] => []),
      ]);

    const discoveryPoolRaw = dedupeDiscoveryTracks(newReleasesResult.tracks ?? []);

    let discoveryTracks = discoveryPoolRaw;
    const topGuineaFeed = topGuineaRaw;
    let topGuineaTracks = topGuineaRaw.tracks;
    let discoveries = discoveriesRaw;
    let suggestedArtists = suggestedArtistsRaw;

    if (category !== "all") {
      const creatorIds = [
        ...new Set([
          ...discoveryPoolRaw.map((t) => t.creator_id),
          ...topGuineaRaw.tracks.map((t) => t.creator_id),
          ...discoveriesRaw.map((t) => t.creator_id),
          ...suggestedArtistsRaw.map((a) => a.creator_id),
        ]),
      ];
      const geoMap = await listener.getCreatorGeoMap(creatorIds);
      discoveryTracks = filterDiscoveryTracksByCategory(discoveryPoolRaw, category, geoMap);
      topGuineaTracks = filterTrendingTracksByCategory(topGuineaRaw.tracks, category, geoMap);
      discoveries = filterDiscoveryTracksByCategory(discoveriesRaw, category, geoMap);
      suggestedArtists = suggestedArtistsRaw.filter((artist) =>
        filterDiscoveryTracksByCategory(
          [
            {
              track_id: artist.creator_id,
              title: artist.stage_name,
              slug: artist.slug,
              duration_seconds: null,
              artist_name: artist.stage_name,
              creator_id: artist.creator_id,
              album_id: null,
              album_title: null,
              cover_path: artist.cover_path,
              published_at: artist.created_at ?? null,
              like_count: 0,
              stream_count: artist.stream_count,
              discovery_score: 0,
            },
          ],
          category as ListenMusicCategory,
          geoMap,
        ).length > 0,
      );
    }

    return {
      playlists: filterValidPlaylists(curated.playlists),
      artists: filterValidArtists(curated.artists),
      genres: curated.genres,
      discoveryTracks: filterValidTracks(discoveryTracks).slice(0, 20),
      topGuineaTracks: filterValidTracks(topGuineaTracks).slice(0, 10),
      topGuineaPeriodLabel: topGuineaFeed.periodLabel,

      discoveries: filterValidTracks(discoveries).slice(0, 8),
      suggestedArtists: filterValidArtists(suggestedArtists).slice(0, 8),
      featuredAlbums: featuredAlbumsRaw.slice(0, 8),
      hadError: false,
    };
  } catch {
    return {
      playlists: [],
      artists: [],
      genres: [],
      discoveryTracks: [],
      topGuineaTracks: [],

      discoveries: [],
      suggestedArtists: [],
      featuredAlbums: [],
      hadError: true,
    };
  }
}
