import { Suspense } from "react";
import { unstable_cache } from "next/cache";
import type { Metadata } from "next";
import type { DiscoveryAlbum, DiscoveryArtist, DiscoveryTrack, NewReleasesResult, TrendingTrack } from "@sonafrik/types";
import { createRecommendationService } from "@sonafrik/api/recommendation";
import { createDiscoveryService } from "@sonafrik/api/discovery";
import { requireIdentityContext } from "@/features/identity/lib/requireIdentity";
import { getSupabasePublicClient } from "@/lib/supabase/server";
import { getDailyProverb } from "@/lib/proverbs";
import { HomepageHero } from "@/features/streaming/components/HomepageHero";
import { HomepageContentSections, ContentSkeleton } from "@/features/streaming/components/HomepageContentSections";
import type { HomepageData } from "@/features/streaming/components/HomepageContentSections";

export const metadata: Metadata = {
  title: "Accueil — SONAFRIK",
  description: "Découvrez la musique africaine sur SONAFRIK.",
};

// Données homepage mises en cache 5 min (7 requêtes publiques, client anon).
const getHomepageContent = unstable_cache(
  async function _getHomepageContent(): Promise<HomepageData> {
    try {
      const supabase = getSupabasePublicClient();
      const recommendation = createRecommendationService(supabase);
      const discovery = createDiscoveryService(supabase);

      const [
        playlistsResult,
        artistsResult,
        genresResult,
        trending,
        discoveries,
        newReleasesResult,
        suggestedArtists,
      ] = await Promise.all([
        Promise.resolve(supabase.from("playlists").select("id, title, track_count").eq("is_public", true).is("deleted_at", null).order("updated_at", { ascending: false }).limit(8))
          .catch((): { data: null } => ({ data: null })),
        Promise.resolve(supabase.from("artist_profiles").select("creator_id, stage_name, genres").eq("is_public", true).order("created_at", { ascending: false }).limit(8))
          .catch((): { data: null } => ({ data: null })),
        Promise.resolve(supabase.from("genres").select("id, name").eq("is_active", true).is("deleted_at", null).order("sort_order").limit(14))
          .catch((): { data: null } => ({ data: null })),
        recommendation.getTrendingTracks({ window: "7d", limit: 10 }).catch((): TrendingTrack[] => []),
        discovery.getDiscoveryFeed({ limit: 8 }).catch((): DiscoveryTrack[] => []),
        discovery.getNewReleases({ type: "album", days: 60, limit: 8 }).catch((): NewReleasesResult => ({ tracks: [], albums: [] as DiscoveryAlbum[], artists: [] })),
        discovery.getSuggestedArtists({ limit: 8 }).catch((): DiscoveryArtist[] => []),
      ]);

      return {
        playlists: (playlistsResult.data ?? []) as HomepageData["playlists"],
        artists: (artistsResult.data ?? []) as HomepageData["artists"],
        genres: (genresResult.data ?? []) as HomepageData["genres"],
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
