import { Suspense } from "react";
import { unstable_cache } from "next/cache";
import type { Metadata } from "next";
import type { DiscoveryAlbum, DiscoveryArtist, DiscoveryTrack, NewReleasesResult, TrendingTrack } from "@sonafrik/types";
import { createRecommendationService } from "@sonafrik/api/recommendation";
import { createDiscoveryService } from "@sonafrik/api/discovery";
import { createListenerService } from "@sonafrik/api/listener";
import { requireIdentityContext } from "@/features/identity/lib/requireIdentity";
import { getSupabasePublicClient } from "@/lib/supabase/server";
import { getDailyProverb } from "@/lib/proverbs";
import { HomepageHero } from "@/features/listener/components/HomepageHero";
import { HomepageContentSections, ContentSkeleton } from "@/features/listener/components/HomepageContentSections";
import type { HomepageData } from "@/features/listener/components/HomepageContentSections";

export const metadata: Metadata = {
  title: "Accueil — SONAFRIK",
  description: "Découvrez la musique africaine sur SONAFRIK.",
};

const getHomepageContent = unstable_cache(
  async function _getHomepageContent(): Promise<HomepageData> {
    try {
      const supabase = getSupabasePublicClient();
      const listener = createListenerService(supabase);
      const recommendation = createRecommendationService(supabase);
      const discovery = createDiscoveryService(supabase);

      const [
        curated,
        trending,
        discoveries,
        newReleasesResult,
        suggestedArtists,
      ] = await Promise.all([
        listener.getHomepageCurated(8).catch(() => ({ playlists: [], artists: [], genres: [] })),
        recommendation.getTrendingTracks({ window: "7d", limit: 10 }).catch((): TrendingTrack[] => []),
        discovery.getDiscoveryFeed({ limit: 8 }).catch((): DiscoveryTrack[] => []),
        discovery.getNewReleases({ type: "album", days: 60, limit: 8 }).catch((): NewReleasesResult => ({ tracks: [], albums: [] as DiscoveryAlbum[], artists: [] })),
        discovery.getSuggestedArtists({ limit: 8 }).catch((): DiscoveryArtist[] => []),
      ]);

      return {
        playlists: curated.playlists,
        artists: curated.artists,
        genres: curated.genres,
        trending,
        discoveries,
        newAlbums: newReleasesResult.albums,
        suggestedArtists,
        hadError: false,
      };
    } catch {
      return { playlists: [], artists: [], genres: [], trending: [], discoveries: [], newAlbums: [], suggestedArtists: [], hadError: true };
    }
  },
  ["homepage-content"],
  { revalidate: 300, tags: ["homepage"] },
);

async function HomepageContentFetcher({ promise }: { promise: Promise<HomepageData> }) {
  const content = await promise;
  return <HomepageContentSections content={content} />;
}

export default async function ListenPage() {
  const contentPromise = getHomepageContent();
  const { profile, unreadNotifications } = await requireIdentityContext();

  const hour = new Date().getUTCHours();
  const greeting = hour < 12 ? "Bonjour" : hour < 18 ? "Bon après-midi" : "Bonsoir";
  const proverb = getDailyProverb();

  return (
    <div style={{ backgroundColor: "var(--color-noir-profond)", minHeight: "100%" }}>
      <HomepageHero
        fullName={profile.full_name}
        greeting={greeting}
        proverb={proverb}
        unreadNotifications={unreadNotifications}
      />
      <Suspense fallback={<ContentSkeleton />}>
        <HomepageContentFetcher promise={contentPromise} />
      </Suspense>
    </div>
  );
}
