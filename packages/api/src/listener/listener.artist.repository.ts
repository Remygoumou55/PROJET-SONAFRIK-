import type { SonafrikSupabaseClient } from "@sonafrik/database";
import { fetchStageNamesByCreatorIds } from "../common/stage-name.helpers";
import type {
  DiscoveryTrack,
  ListenMusicCategory,
  TrackWithMeta,
  TrendingTrack,
} from "@sonafrik/types";
import {
  type CreatorGeoProfile,
  filterDiscoveryTracksByCategory,
  filterTrendingTracksByCategory,
} from "./category-filter";
import type {
  ListenerArtistProfile,
  ListenerArtistRelease,
} from "./types";

export class ListenerArtistRepository {
  constructor(private readonly client: SonafrikSupabaseClient) {}

  async getPublicArtistProfile(creatorId: string): Promise<ListenerArtistProfile | null> {
    const { data: rpcData, error: rpcError } = await this.client.rpc("get_public_artist_profile", {
      p_creator_id: creatorId,
    });

    if (!rpcError && rpcData && typeof rpcData === "object" && !Array.isArray(rpcData)) {
      const raw = rpcData as Record<string, unknown>;
      const stageName = String(raw.stage_name ?? "").trim();
      if (stageName.length > 0) {
        return {
          creator_id: String(raw.creator_id ?? creatorId),
          stage_name: stageName,
          bio: (raw.bio as string | null) ?? null,
          genres: Array.isArray(raw.genres) ? (raw.genres as string[]) : [],
          cover_path: (raw.cover_path as string | null) ?? null,
          banner_path: (raw.banner_path as string | null) ?? null,
          verified: Boolean(raw.verified),
        };
      }
    }

    const { data, error } = await this.client
      .from("artist_profiles")
      .select("creator_id, stage_name, bio, genres, cover_path, banner_path, verified, is_public")
      .eq("creator_id", creatorId)
      .eq("is_public", true)
      .maybeSingle();
    if (error) throw error;
    if (!data) return null;

    const raw = data as Record<string, unknown>;
    return {
      creator_id: String(raw.creator_id ?? ""),
      stage_name: String(raw.stage_name ?? ""),
      bio: (raw.bio as string | null) ?? null,
      genres: Array.isArray(raw.genres) ? (raw.genres as string[]) : [],
      cover_path: (raw.cover_path as string | null) ?? null,
      banner_path: (raw.banner_path as string | null) ?? null,
      verified: Boolean(raw.verified),
    };
  }

  async getPublishedAlbumsForArtist(creatorId: string, limit = 12): Promise<ListenerArtistRelease[]> {
    const { data, error } = await this.client
      .from("albums")
      .select("id, title, release_type, cover_path, release_date")
      .eq("creator_id", creatorId)
      .eq("publication_status", "published")
      .is("deleted_at", null)
      .order("release_date", { ascending: false })
      .limit(limit);
    if (error) throw error;

    return (data ?? []).map((a) => {
      const r = a as unknown as Record<string, unknown>;
      return {
        id: String(r.id ?? ""),
        title: String(r.title ?? ""),
        release_type: String(r.release_type ?? "album"),
        cover_url: (r.cover_path as string | null) ?? null,
        release_date: (r.release_date as string | null) ?? null,
      };
    });
  }

  async getPublishedTracksForArtist(
    creatorId: string,
    artistName: string,
    albumCovers: Map<string, string | null>,
    limit = 10,
  ): Promise<TrackWithMeta[]> {
    const { data, error } = await this.client
      .from("tracks")
      .select("id, title, duration_seconds, track_number, creator_id, publication_status, album_id")
      .eq("creator_id", creatorId)
      .eq("publication_status", "published")
      .is("deleted_at", null)
      .order("published_at", { ascending: false })
      .limit(limit);
    if (error) throw error;

    return (data ?? []).map((t) => {
      const r = t as Record<string, unknown>;
      const albumId = (r.album_id as string | null) ?? null;
      return {
        id: String(r.id ?? ""),
        title: String(r.title ?? ""),
        duration_seconds: typeof r.duration_seconds === "number" ? r.duration_seconds : null,
        track_number: typeof r.track_number === "number" ? r.track_number : null,
        creator_id: String(r.creator_id ?? ""),
        publication_status: String(r.publication_status ?? ""),
        album_id: albumId,
        artist_name: artistName,
        cover_url: albumId ? (albumCovers.get(albumId) ?? null) : null,
      } as TrackWithMeta;
    });
  }

  async getArtistPublicStats(creatorId: string): Promise<{ follower_count: number; total_streams: number; track_count: number }> {
    const [followResult, tracksResult] = await Promise.all([
      this.client
        .from("follows")
        .select("*", { count: "exact", head: true })
        .eq("entity_type", "artist")
        .eq("entity_id", creatorId),
      this.client
        .from("tracks")
        .select("play_count")
        .eq("creator_id", creatorId)
        .eq("publication_status", "published")
        .is("deleted_at", null),
    ]);

    const follower_count = followResult.count ?? 0;
    const rows = tracksResult.data ?? [];
    const track_count = rows.length;
    const total_streams = rows.reduce((acc, r) => {
      const row = r as Record<string, unknown>;
      return acc + (typeof row.play_count === "number" ? row.play_count : 0);
    }, 0);

    return { follower_count, total_streams, track_count };
  }

  async getPinnedTracksForArtist(
    creatorId: string,
    artistName: string,
    albumCovers: Map<string, string | null>,
  ): Promise<TrackWithMeta[]> {
    const { data, error } = await this.client
      .from("tracks")
      .select("id, title, duration_seconds, track_number, creator_id, publication_status, album_id, play_count, is_pinned, pin_order")
      .eq("creator_id", creatorId)
      .eq("publication_status", "published")
      .eq("is_pinned", true)
      .is("deleted_at", null)
      .order("pin_order", { ascending: true })
      .limit(3);
    if (error) throw error;

    return (data ?? []).map((t) => {
      const r = t as Record<string, unknown>;
      const albumId = (r.album_id as string | null) ?? null;
      return {
        id: String(r.id ?? ""),
        title: String(r.title ?? ""),
        duration_seconds: typeof r.duration_seconds === "number" ? r.duration_seconds : null,
        track_number: typeof r.track_number === "number" ? r.track_number : null,
        creator_id: String(r.creator_id ?? ""),
        publication_status: String(r.publication_status ?? ""),
        album_id: albumId,
        artist_name: artistName,
        cover_url: albumId ? (albumCovers.get(albumId) ?? null) : null,
        play_count: typeof r.play_count === "number" ? r.play_count : 0,
      } as TrackWithMeta & { play_count: number };
    });
  }

  async getPublishedTracksForArtistSorted(
    creatorId: string,
    artistName: string,
    albumCovers: Map<string, string | null>,
    sort: "popular" | "recent" | "oldest" = "recent",
    limit = 30,
  ): Promise<(TrackWithMeta & { play_count: number })[]> {
    let query = this.client
      .from("tracks")
      .select("id, title, duration_seconds, track_number, creator_id, publication_status, album_id, play_count")
      .eq("creator_id", creatorId)
      .eq("publication_status", "published")
      .is("deleted_at", null)
      .limit(limit);

    if (sort === "popular") {
      query = query.order("play_count", { ascending: false });
    } else if (sort === "oldest") {
      query = query.order("published_at", { ascending: true });
    } else {
      query = query.order("published_at", { ascending: false });
    }

    const { data, error } = await query;
    if (error) throw error;

    return (data ?? []).map((t) => {
      const r = t as Record<string, unknown>;
      const albumId = (r.album_id as string | null) ?? null;
      return {
        id: String(r.id ?? ""),
        title: String(r.title ?? ""),
        duration_seconds: typeof r.duration_seconds === "number" ? r.duration_seconds : null,
        track_number: typeof r.track_number === "number" ? r.track_number : null,
        creator_id: String(r.creator_id ?? ""),
        publication_status: String(r.publication_status ?? ""),
        album_id: albumId,
        artist_name: artistName,
        cover_url: albumId ? (albumCovers.get(albumId) ?? null) : null,
        play_count: typeof r.play_count === "number" ? r.play_count : 0,
      } as TrackWithMeta & { play_count: number };
    });
  }

  async getCreatorGeoMap(creatorIds: string[]): Promise<Map<string, CreatorGeoProfile>> {
    const map = new Map<string, CreatorGeoProfile>();
    if (creatorIds.length === 0) return map;

    const { data: creators, error: creatorsError } = await this.client
      .from("creators")
      .select("id, owner_id")
      .in("id", creatorIds);

    if (creatorsError) throw creatorsError;
    if (!creators?.length) return map;

    const ownerIds = [...new Set(creators.map((c) => c.owner_id as string))];
    const { data: profiles, error: profilesError } = await this.client
      .from("profiles")
      .select("id, country_code, origin_region")
      .in("id", ownerIds);

    if (profilesError) throw profilesError;

    const geoByOwner = new Map(
      (profiles ?? []).map((p) => [
        p.id as string,
        {
          countryCode: (p.country_code as string | null) ?? null,
          originRegion: (p.origin_region as string | null) ?? null,
        },
      ]),
    );

    for (const creator of creators) {
      map.set(creator.id as string, geoByOwner.get(creator.owner_id as string) ?? {
        countryCode: null,
        originRegion: null,
      });
    }

    return map;
  }

  async filterDiscoveryByCategory(
    tracks: DiscoveryTrack[],
    category: ListenMusicCategory,
  ): Promise<DiscoveryTrack[]> {
    const creatorIds = [...new Set(tracks.map((t) => t.creator_id))];
    const geoMap = await this.getCreatorGeoMap(creatorIds);
    return filterDiscoveryTracksByCategory(tracks, category, geoMap);
  }

  async filterTrendingByCategory(
    tracks: TrendingTrack[],
    category: ListenMusicCategory,
  ): Promise<TrendingTrack[]> {
    const creatorIds = [...new Set(tracks.map((t) => t.creator_id))];
    const geoMap = await this.getCreatorGeoMap(creatorIds);
    return filterTrendingTracksByCategory(tracks, category, geoMap);
  }

  async getArtistStageName(creatorId: string): Promise<string | null> {
    const names = await fetchStageNamesByCreatorIds(this.client, [creatorId]);
    return names.get(creatorId) ?? null;
  }
}
