import { Suspense } from "react";
import { createPublicCachedQuery } from "@/lib/cache";
import type { Metadata } from "next";
import type {
  DiscoveryArtist,
  DiscoveryTrack,
  ListenMusicCategory,
} from "@sonafrik/types";
import { createDiscoveryService } from "@sonafrik/api/discovery";
import {
  createListenerService,
  filterDiscoveryTracksByCategory,
  filterTrendingTracksByCategory,
  parseListenMusicCategory,
  type TopGuineaFeed,
} from "@sonafrik/api/listener";
import { requireIdentityContext } from "@/features/identity/lib/requireIdentity";
import { getSupabasePublicClient } from "@/lib/supabase/public";
import {
  filterValidArtists,
  filterValidPlaylists,
  filterValidTracks,
} from "@/lib/content-filter";
import { HomepageHero } from "@/features/listener/components/HomepageHero";
import { ListenStreamingHeader } from "@/features/listener/components/ListenStreamingHeader";
import { HomepageContentSections, ContentSkeleton } from "@/features/listener/components/HomepageContentSections";
import type { HomepageData } from "@/features/listener/components/HomepageContentSections";

export const metadata: Metadata = {
  title: "Accueil — SONAFRIK",
  description: "Découvrez la musique africaine sur SONAFRIK.",
};

function dedupeDiscoveryTracks(tracks: DiscoveryTrack[]): DiscoveryTrack[] {
  const seen = new Set<string>();
  return tracks.filter((track) => {
    if (seen.has(track.track_id)) return false;
    seen.add(track.track_id);
    return true;
  });
}

function createHomepageLoader(category: ListenMusicCategory) {
  return createPublicCachedQuery(
    `homepage-content-v8-${category}`,
    async function _getHomepageContent(): Promise<HomepageData> {
      try {
        const supabase = getSupabasePublicClient();
        const listener = createListenerService(supabase);
        const discovery = createDiscoveryService(supabase);

        const [
          curated,
          topGuineaRaw,
          discoveriesRaw,
          newReleasesResult,
          suggestedArtistsRaw,
        ] = await Promise.all([
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
              category,
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
          trending: [],
          discoveries: filterValidTracks(discoveries).slice(0, 8),
          suggestedArtists: filterValidArtists(suggestedArtists).slice(0, 8),
          hadError: false,
        };
      } catch {
        return {
          playlists: [],
          artists: [],
          genres: [],
          discoveryTracks: [],
          topGuineaTracks: [],
          trending: [],
          discoveries: [],
          suggestedArtists: [],
          hadError: true,
        };
      }
    },
    { revalidate: 300, tags: ["homepage", "catalog-tracks", "stream-listen-counts"] },
  );
}

async function HomepageContentFetcher({
  promise,
}: {
  promise: Promise<HomepageData>;
}) {
  const content = await promise;
  return <HomepageContentSections content={content} />;
}

export default async function ListenPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const params = await searchParams;
  const category = parseListenMusicCategory(params.category);
  const contentPromise = createHomepageLoader(category)();
  const { profile, unreadNotifications } = await requireIdentityContext();

  return (
    <div className="listen-page" style={{ backgroundColor: "var(--color-noir-profond)", minHeight: "100%" }}>
      <ListenStreamingHeader fullName={profile.full_name} unreadNotifications={unreadNotifications} />
      <HomepageHero fullName={profile.full_name} />
      <Suspense fallback={<ContentSkeleton />}>
        <HomepageContentFetcher promise={contentPromise} />
      </Suspense>
    </div>
  );
}
