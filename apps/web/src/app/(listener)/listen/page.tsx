import { Suspense } from "react";
import { unstable_cache } from "next/cache";
import type { Metadata } from "next";
import type {
  DiscoveryAlbum,
  DiscoveryArtist,
  DiscoveryTrack,
  ListenMusicCategory,
  NewReleasesResult,
  TrendingTrack,
} from "@sonafrik/types";
import { createDiscoveryService } from "@sonafrik/api/discovery";
import {
  createListenerService,
  filterDiscoveryTracksByCategory,
  filterTrendingTracksByCategory,
  parseListenMusicCategory,
} from "@sonafrik/api/listener";
import { requireIdentityContext } from "@/features/identity/lib/requireIdentity";
import { getSupabasePublicClient } from "@/lib/supabase/public";
import { getDailyProverb } from "@/lib/proverbs";
import { HomepageHero } from "@/features/listener/components/HomepageHero";
import { ListenStreamingHeader } from "@/features/listener/components/ListenStreamingHeader";
import { HomepageContentSections, ContentSkeleton } from "@/features/listener/components/HomepageContentSections";
import type { HomepageData } from "@/features/listener/components/HomepageContentSections";

export const metadata: Metadata = {
  title: "Accueil — SONAFRIK",
  description: "Découvrez la musique africaine sur SONAFRIK.",
};

function createHomepageLoader(category: ListenMusicCategory) {
  return unstable_cache(
    async function _getHomepageContent(): Promise<HomepageData> {
      try {
        const supabase = getSupabasePublicClient();
        const listener = createListenerService(supabase);
        const discovery = createDiscoveryService(supabase);

        const [
          curated,
          newTracksRaw,
          topGuineaRaw,
          discoveriesRaw,
          newReleasesResult,
          suggestedArtistsRaw,
        ] = await Promise.all([
          listener.getHomepageCurated(8).catch(() => ({ playlists: [], artists: [], genres: [] })),
          listener.getLatestPublishedTracks(24).catch((): DiscoveryTrack[] => []),
          listener.getTopGuineaTracks(24).catch((): TrendingTrack[] => []),
          discovery.getDiscoveryFeed({ limit: 16 }).catch((): DiscoveryTrack[] => []),
          discovery
            .getNewReleases({ type: "all", days: 365, limit: 16 })
            .catch((): NewReleasesResult => ({ tracks: [], albums: [] as DiscoveryAlbum[], artists: [] })),
          discovery.getSuggestedArtists({ limit: 12 }).catch((): DiscoveryArtist[] => []),
        ]);

        const mergedNewTracksRaw =
          newTracksRaw.length > 0 ? newTracksRaw : (newReleasesResult.tracks ?? []);

        let newTracks = mergedNewTracksRaw;
        let topGuineaTracks = topGuineaRaw;
        let discoveries = discoveriesRaw;
        let suggestedArtists = suggestedArtistsRaw;

        if (category !== "all") {
          const creatorIds = [
            ...new Set([
              ...mergedNewTracksRaw.map((t) => t.creator_id),
              ...topGuineaRaw.map((t) => t.creator_id),
              ...discoveriesRaw.map((t) => t.creator_id),
              ...suggestedArtistsRaw.map((a) => a.creator_id),
            ]),
          ];
          const geoMap = await listener.getCreatorGeoMap(creatorIds);
          newTracks = filterDiscoveryTracksByCategory(mergedNewTracksRaw, category, geoMap);
          topGuineaTracks = filterTrendingTracksByCategory(topGuineaRaw, category, geoMap);
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
          playlists: curated.playlists,
          artists: curated.artists,
          genres: curated.genres,
          newTracks: newTracks.slice(0, 10),
          topGuineaTracks: topGuineaTracks.slice(0, 10),
          trending: topGuineaTracks.slice(0, 10),
          discoveries: discoveries.slice(0, 8),
          newAlbums: newReleasesResult.albums,
          suggestedArtists: suggestedArtists.slice(0, 8),
          hadError: false,
        };
      } catch {
        return {
          playlists: [],
          artists: [],
          genres: [],
          newTracks: [],
          topGuineaTracks: [],
          trending: [],
          discoveries: [],
          newAlbums: [],
          suggestedArtists: [],
          hadError: true,
        };
      }
    },
    [`homepage-content-v4-${category}`],
    { revalidate: 120, tags: ["homepage", "catalog-tracks"] },
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

  const hour = new Date().getUTCHours();
  const greeting = hour < 12 ? "Bonjour" : hour < 18 ? "Bon après-midi" : "Bonsoir";
  const proverb = getDailyProverb();

  return (
    <div className="listen-page" style={{ backgroundColor: "var(--color-noir-profond)", minHeight: "100%" }}>
      <ListenStreamingHeader fullName={profile.full_name} unreadNotifications={unreadNotifications} />
      <HomepageHero
        fullName={profile.full_name}
        greeting={greeting}
        proverb={proverb}
        unreadNotifications={unreadNotifications}
        compactActions
      />
      <Suspense fallback={<ContentSkeleton />}>
        <HomepageContentFetcher promise={contentPromise} />
      </Suspense>
    </div>
  );
}
