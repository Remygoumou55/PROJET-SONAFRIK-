import { createClient } from "@supabase/supabase-js";
import { unstable_cache } from "next/cache";
import type { LandingArtistsSection, LandingFounderArtist } from "@sonafrik/types";
import { getArtistInitials } from "./artistDisplay";

const EMPTY: LandingArtistsSection = {
  artists: [],
  trackCount: 0,
  featuredTrack: null,
};

type ArtistProfileRow = {
  stage_name: string;
  genres: string[] | null;
  slug: string;
  is_public: boolean;
};

async function fetchLandingArtistsSection(): Promise<LandingArtistsSection> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return EMPTY;

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    const supabase = createClient(url, key, {
      global: {
        fetch: (input, init) =>
          fetch(input, { ...init, signal: controller.signal }).finally(() => clearTimeout(timer)),
      },
    });

    const [tracksRes, countRes, featuredRes] = await Promise.all([
      supabase
        .from("tracks")
        .select("creator_id, artist_profiles!inner(stage_name, genres, slug, is_public)")
        .eq("publication_status", "published")
        .is("deleted_at", null)
        .order("created_at", { ascending: false })
        .limit(80),
      supabase
        .from("tracks")
        .select("id", { count: "exact", head: true })
        .eq("publication_status", "published")
        .is("deleted_at", null),
      supabase
        .from("tracks")
        .select("title, artist_profiles!inner(stage_name)")
        .eq("publication_status", "published")
        .is("deleted_at", null)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

    const seen = new Set<string>();
    const artists: LandingFounderArtist[] = [];

    for (const row of tracksRes.data ?? []) {
      const profile = row.artist_profiles as ArtistProfileRow | ArtistProfileRow[] | null;
      const ap = Array.isArray(profile) ? profile[0] : profile;
      if (!ap?.is_public || !ap.stage_name) continue;

      const creatorId = row.creator_id as string;
      if (seen.has(creatorId)) continue;
      seen.add(creatorId);

      artists.push({
        creatorId,
        stageName: ap.stage_name,
        slug: ap.slug,
        genre: ap.genres?.[0] ?? "Musique",
        initials: getArtistInitials(ap.stage_name),
        paletteIndex: artists.length,
      });

      if (artists.length >= 8) break;
    }

    const featuredRow = featuredRes.data;
    const featuredProfile = featuredRow?.artist_profiles as { stage_name: string } | { stage_name: string }[] | null;
    const featuredName = Array.isArray(featuredProfile)
      ? featuredProfile[0]?.stage_name
      : featuredProfile?.stage_name;

    return {
      artists,
      trackCount: countRes.count ?? 0,
      featuredTrack:
        featuredRow?.title && featuredName
          ? {
              title: featuredRow.title,
              artistName: featuredName,
              initials: getArtistInitials(featuredName),
            }
          : null,
    };
  } catch {
    return EMPTY;
  }
}

export const getLandingArtistsSection = unstable_cache(
  fetchLandingArtistsSection,
  ["landing-artists-section"],
  { revalidate: 300, tags: ["landing-artists"] },
);
