import type { SonafrikSupabaseClient } from "@sonafrik/database";
import type {
  DiscoveryTrack,
  HeroItemAlbum,
  HeroItemArtist,
  RecommendedTrack,
  TrendingTrack,
} from "@sonafrik/types";
import type { ListenerHomepageCurated, TopGuineaFeed, TopGuineaPeriod } from "./types";

export class ListenerDiscoveryRepository {
  constructor(private readonly client: SonafrikSupabaseClient) {}

  async getLatestPublishedTracks(limit = 10): Promise<DiscoveryTrack[]> {
    const { data, error } = await this.client.rpc("get_new_releases", {
      p_type: "track",
      p_days: 3650,
      p_limit: limit,
    });
    if (error) throw error;
    const payload = data as unknown as { tracks?: DiscoveryTrack[] } | null;
    return payload?.tracks ?? [];
  }

  async getTopGuineaTracks(limit = 10): Promise<TopGuineaFeed> {
    const { data, error } = await this.client.rpc("get_top_guinea_feed", {
      p_limit: limit,
    });
    if (error) throw error;

    const payload = data as {
      period?: TopGuineaPeriod;
      period_label?: string;
      tracks?: TrendingTrack[];
    } | null;

    const tracks = (payload?.tracks ?? []) as TrendingTrack[];
    if (tracks.length > 0) {
      return {
        tracks,
        period: payload?.period ?? "all",
        periodLabel: payload?.period_label ?? "Toutes périodes",
      };
    }

    const latest = await this.getLatestPublishedTracks(limit);
    return {
      period: "all",
      periodLabel: "Nouveautés",
      tracks: latest.map((track) => ({
        track_id: track.track_id,
        title: track.title,
        slug: track.slug,
        duration_seconds: track.duration_seconds,
        artist_name: track.artist_name,
        creator_id: track.creator_id,
        album_id: track.album_id,
        album_title: track.album_title,
        cover_path: track.cover_path,
        listen_count: track.stream_count ?? 0,
        unique_listeners: 0,
        trending_score: 0,
      })),
    };
  }

  async getHomepageCurated(limit = 8): Promise<ListenerHomepageCurated> {
    const [playlistsRes, artistsRes, genresRes] = await Promise.all([
      this.client
        .from("playlists")
        .select("id, title, track_count")
        .eq("is_public", true)
        .is("deleted_at", null)
        .order("updated_at", { ascending: false })
        .limit(limit),
      this.client
        .from("artist_profiles")
        .select("creator_id, stage_name, genres")
        .eq("is_public", true)
        .order("created_at", { ascending: false })
        .limit(limit),
      this.client
        .from("genres")
        .select("id, name")
        .eq("is_active", true)
        .is("deleted_at", null)
        .order("sort_order")
        .limit(14),
    ]);

    if (playlistsRes.error) throw playlistsRes.error;
    if (artistsRes.error) throw artistsRes.error;
    if (genresRes.error) throw genresRes.error;

    return {
      playlists: (playlistsRes.data ?? []) as ListenerHomepageCurated["playlists"],
      artists: (artistsRes.data ?? []) as ListenerHomepageCurated["artists"],
      genres: (genresRes.data ?? []) as ListenerHomepageCurated["genres"],
    };
  }

  async getDiscoverModeTracks(userId: string, limit = 20): Promise<DiscoveryTrack[]> {
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

    const { data: sessions, error: sessionsError } = await this.client
      .from("stream_sessions")
      .select("track_id")
      .eq("user_id", userId)
      .eq("is_valid_listen", true)
      .gte("started_at", since)
      .limit(100);

    if (sessionsError) throw sessionsError;

    const listenedTrackIds = new Set((sessions ?? []).map((row) => row.track_id as string));

    const { data, error } = await this.client.rpc("get_new_releases", {
      p_type: "track",
      p_days: 90,
      p_limit: limit * 3,
    });
    if (error) throw error;

    const payload = data as unknown as { tracks?: DiscoveryTrack[] } | null;
    const candidates = payload?.tracks ?? [];

    const daySeed =
      new Date().getFullYear() * 10000 +
      (new Date().getMonth() + 1) * 100 +
      new Date().getDate();

    return candidates
      .filter((track) => !listenedTrackIds.has(track.track_id))
      .sort((a, b) => {
        const hashA = (a.track_id.charCodeAt(0) * daySeed) % 100;
        const hashB = (b.track_id.charCodeAt(0) * daySeed) % 100;
        return hashA - hashB;
      })
      .slice(0, limit);
  }

  async getTrendingArtistsMixed(limit = 20): Promise<HeroItemArtist[]> {
    const { data, error } = await this.client.rpc("get_trending_artists_mixed", {
      p_limit: limit,
    });
    if (error) throw error;
    const rows = (data as unknown[]) ?? [];
    return rows.map((r) => {
      const row = r as Record<string, unknown>;
      return {
        content_type: "artist" as const,
        creator_id: String(row.creator_id ?? ""),
        stage_name: String(row.stage_name ?? ""),
        slug: String(row.slug ?? ""),
        cover_path: row.cover_path != null ? String(row.cover_path) : null,
        verified: Boolean(row.verified ?? false),
        listen_count: Number(row.listen_count ?? 0),
        genre_primary: row.genre_primary != null ? String(row.genre_primary) : null,
        bio_short: row.bio_short != null ? String(row.bio_short) : null,
        first_track_id: row.first_track_id != null ? String(row.first_track_id) : null,
        first_track_slug: row.first_track_slug != null ? String(row.first_track_slug) : null,
      };
    });
  }

  async getHeroFeaturedAlbums(days = 30, limit = 6): Promise<HeroItemAlbum[]> {
    const { data, error } = await this.client.rpc("get_hero_featured_albums", {
      p_days: days,
      p_limit: limit,
    });
    if (error) throw error;
    const rows = (data as unknown[]) ?? [];
    return rows.map((r) => {
      const row = r as Record<string, unknown>;
      return {
        content_type: "album" as const,
        album_id: String(row.album_id ?? ""),
        album_title: String(row.album_title ?? ""),
        release_type: String(row.release_type ?? "album"),
        release_date: row.release_date != null ? String(row.release_date) : null,
        cover_path: row.cover_path != null ? String(row.cover_path) : null,
        creator_id: String(row.creator_id ?? ""),
        stage_name: String(row.stage_name ?? ""),
        artist_slug: String(row.artist_slug ?? ""),
        genre_primary: row.genre_primary != null ? String(row.genre_primary) : null,
        verified: Boolean(row.verified ?? false),
        bio_short: row.bio_short != null ? String(row.bio_short) : null,
      };
    });
  }

  async getRecommendedTracks(limit = 20): Promise<RecommendedTrack[]> {
    const { data, error } = await this.client.rpc("get_recommended_tracks_mvp", {
      p_limit: limit,
    });
    if (error) throw error;
    const rows = (data as unknown[]) ?? [];
    return rows.map((r) => {
      const row = r as Record<string, unknown>;
      return {
        track_id: String(row.track_id ?? ""),
        title: String(row.title ?? ""),
        slug: String(row.slug ?? ""),
        duration_seconds: row.duration_seconds != null ? Number(row.duration_seconds) : null,
        artist_name: row.artist_name != null ? String(row.artist_name) : null,
        creator_id: String(row.creator_id ?? ""),
        album_id: row.album_id != null ? String(row.album_id) : null,
        album_title: row.album_title != null ? String(row.album_title) : null,
        cover_path: row.cover_path != null ? String(row.cover_path) : null,
        recommendation_score: Number(row.recommendation_score ?? 0),
        reason: (row.reason as RecommendedTrack["reason"]) ?? "trending",
      };
    });
  }
}
