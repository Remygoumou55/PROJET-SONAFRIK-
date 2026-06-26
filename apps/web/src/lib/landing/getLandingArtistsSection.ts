import { unstable_cache } from "next/cache";
import type { LandingArtistsSection, LandingFounderArtist } from "@sonafrik/types";
import { getSupabasePublicClient } from "@/lib/supabase/server";
import { getArtistInitials } from "./artistDisplay";

const EMPTY: LandingArtistsSection = {
  artists: [],
  trackCount: 0,
  featuredTrack: null,
};

type ArtistProfileRow = {
  creator_id: string;
  stage_name: string;
  genres: string[] | null;
  slug: string;
  is_public: boolean;
};

async function fetchLandingArtistsSection(): Promise<LandingArtistsSection> {
  try {
    const supabase = getSupabasePublicClient();

    const [tracksRes, countRes, featuredRes] = await Promise.all([
      supabase
        .from("tracks")
        .select("creator_id")
        .eq("publication_status", "published")
        .is("deleted_at", null)
        .order("created_at", { ascending: true })
        .limit(200),
      supabase
        .from("tracks")
        .select("id", { count: "exact", head: true })
        .eq("publication_status", "published")
        .is("deleted_at", null),
      supabase
        .from("tracks")
        .select("title, creator_id")
        .eq("publication_status", "published")
        .is("deleted_at", null)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

    const creatorOrder: string[] = [];
    const seen = new Set<string>();
    for (const row of tracksRes.data ?? []) {
      const id = row.creator_id as string;
      if (seen.has(id)) continue;
      seen.add(id);
      creatorOrder.push(id);
      if (creatorOrder.length >= 8) break;
    }

    if (creatorOrder.length === 0) {
      return {
        artists: [],
        trackCount: countRes.count ?? 0,
        featuredTrack: null,
      };
    }

    const { data: profiles } = await supabase
      .from("artist_profiles")
      .select("creator_id, stage_name, genres, slug, is_public")
      .in("creator_id", creatorOrder)
      .eq("is_public", true);

    const profileByCreator = new Map<string, ArtistProfileRow>();
    for (const row of profiles ?? []) {
      profileByCreator.set(row.creator_id, row as ArtistProfileRow);
    }

    const artists: LandingFounderArtist[] = [];
    for (const creatorId of creatorOrder) {
      const ap = profileByCreator.get(creatorId);
      if (!ap?.stage_name) continue;
      artists.push({
        creatorId,
        stageName: ap.stage_name,
        slug: ap.slug,
        genre: ap.genres?.[0] ?? "Musique",
        initials: getArtistInitials(ap.stage_name),
        paletteIndex: artists.length,
      });
    }

    let featuredTrack: LandingArtistsSection["featuredTrack"] = null;
    if (featuredRes.data?.title && featuredRes.data.creator_id) {
      const featuredProfile = profileByCreator.get(featuredRes.data.creator_id);
      const featuredName =
        featuredProfile?.stage_name ??
        (
          await supabase
            .from("artist_profiles")
            .select("stage_name")
            .eq("creator_id", featuredRes.data.creator_id)
            .eq("is_public", true)
            .maybeSingle()
        ).data?.stage_name;

      if (featuredName) {
        featuredTrack = {
          title: featuredRes.data.title,
          artistName: featuredName,
          initials: getArtistInitials(featuredName),
        };
      }
    }

    return {
      artists,
      trackCount: countRes.count ?? 0,
      featuredTrack,
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
