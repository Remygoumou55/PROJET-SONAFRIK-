import type { SonafrikSupabaseClient } from "@sonafrik/database";
import { enrichTrackCreditsWithCreatorIds } from "../common/profile-creator.helpers";
import { fetchStageNamesByCreatorIds } from "../common/stage-name.helpers";
import type {
  DiscoveryTrack,
  LyricLine,
  RecentlyPlayedTrack,
  TrackCredit,
  TrackListenCounts,
  TrackWithMeta,
  TrendingTrack,
} from "@sonafrik/types";
import type {
  ListenerAlbumDetail,
  ListenerAlbumMeta,
  ListenerHomepageCurated,
  ListenerPlaylistTrackRow,
  TopGuineaFeed,
  TopGuineaPeriod,
} from "./types";

export class ListenerTrackRepository {
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

  async getTrackListenCounts(trackId: string): Promise<TrackListenCounts> {
    const { data, error } = await this.client.rpc("get_track_listen_counts", {
      p_track_id: trackId,
    });
    if (error) throw error;
    const row = data as Record<string, unknown> | null;
    return {
      track_id: String(row?.track_id ?? trackId),
      all_time: Number(row?.all_time ?? 0),
      window_7d: Number(row?.window_7d ?? 0),
      window_30d: Number(row?.window_30d ?? 0),
      unique_listeners_all_time: Number(row?.unique_listeners_all_time ?? 0),
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

  async getPublishedAlbumMeta(albumId: string): Promise<ListenerAlbumMeta | null> {
    const { data, error } = await this.client
      .from("albums")
      .select("title, creator_id")
      .eq("id", albumId)
      .maybeSingle();
    if (error) throw error;
    if (!data) return null;
    const row = data as { title: string; creator_id: string };
    const stageNames = await fetchStageNamesByCreatorIds(this.client, [row.creator_id]);
    return { title: row.title, artistName: stageNames.get(row.creator_id) ?? null };
  }

  async getPublishedAlbumDetail(albumId: string): Promise<ListenerAlbumDetail | null> {
    const { data, error } = await this.client
      .from("albums")
      .select("id, title, description, cover_path, release_type, release_date, creator_id")
      .eq("id", albumId)
      .eq("publication_status", "published")
      .is("deleted_at", null)
      .maybeSingle();
    if (error) throw error;
    if (!data) return null;

    const raw = data as {
      id: string;
      title: string;
      description: string | null;
      cover_path: string | null;
      release_type: string;
      release_date: string | null;
      creator_id: string;
    };
    const stageNames = await fetchStageNamesByCreatorIds(this.client, [raw.creator_id]);
    const artistName = stageNames.get(raw.creator_id) ?? null;

    return {
      id: raw.id,
      title: raw.title,
      description: raw.description,
      cover_url: raw.cover_path,
      release_type: raw.release_type ?? "album",
      release_date: raw.release_date,
      creator_id: raw.creator_id,
      artist_name: artistName,
      artist_creator_id: raw.creator_id,
    };
  }

  async getPublishedTrackById(trackId: string): Promise<TrackWithMeta | null> {
    const { data, error } = await this.client
      .from("tracks")
      .select(
        "id, title, duration_seconds, track_number, creator_id, publication_status, album_id, albums!inner(cover_path)",
      )
      .eq("id", trackId)
      .eq("publication_status", "published")
      .is("deleted_at", null)
      .maybeSingle();

    if (error || !data) return null;

    const raw = data as unknown as {
      id: string;
      title: string;
      duration_seconds: number | null;
      track_number: number | null;
      creator_id: string;
      album_id: string;
      albums: { cover_path: string | null } | null;
    };

    const { data: profile } = await this.client
      .from("artist_profiles")
      .select("stage_name")
      .eq("creator_id", raw.creator_id)
      .maybeSingle();

    const coverPath = raw.albums?.cover_path ?? null;

    return {
      id: raw.id,
      title: raw.title,
      duration_seconds: raw.duration_seconds,
      track_number: raw.track_number,
      creator_id: raw.creator_id,
      album_id: raw.album_id,
      publication_status: "published",
      artist_name: (profile?.stage_name as string | undefined) ?? "Artiste",
      cover_url: coverPath,
    } as TrackWithMeta;
  }

  async getPublishedAlbumTracks(albumId: string, artistName: string | null, coverUrl: string | null): Promise<TrackWithMeta[]> {
    const { data, error } = await this.client
      .from("tracks")
      .select("id, title, duration_seconds, track_number, creator_id, publication_status")
      .eq("album_id", albumId)
      .eq("publication_status", "published")
      .is("deleted_at", null)
      .order("track_number", { ascending: true });
    if (error) throw error;

    return (data ?? []).map((t) => ({
      ...(t as unknown as TrackWithMeta),
      artist_name: artistName ?? undefined,
      cover_url: coverUrl,
    }));
  }

  async getTrackCreditsForTracks(trackIds: string[]): Promise<TrackCredit[]> {
    if (!trackIds.length) return [];
    const { data, error } = await this.client
      .from("track_credits")
      .select("*")
      .in("track_id", trackIds)
      .order("display_order");
    if (error) throw error;
    return enrichTrackCreditsWithCreatorIds(this.client, (data ?? []) as TrackCredit[]);
  }

  async getPlaylistTracksForPage(playlistId: string): Promise<ListenerPlaylistTrackRow[]> {
    const { data, error } = await this.client
      .from("playlist_tracks")
      .select("track_id, position, added_at, added_by, track:tracks(id, title, duration_seconds, creator_id, album_id)")
      .eq("playlist_id", playlistId)
      .order("position");
    if (error) throw error;
    return (data ?? []) as unknown as ListenerPlaylistTrackRow[];
  }

  async getRecentlyPlayed(userId: string, limit = 3): Promise<RecentlyPlayedTrack[]> {
    const { data, error } = await this.client
      .from("stream_sessions")
      .select("track_id, started_at, tracks!inner(id, title, creator_id, duration_seconds, albums(cover_path))")
      .eq("user_id", userId)
      .eq("is_valid_listen", true)
      .order("started_at", { ascending: false })
      .limit(Math.max(limit * 4, 12));

    if (error) throw error;

    const seen = new Set<string>();
    const rows: RecentlyPlayedTrack[] = [];

    for (const session of data ?? []) {
      const raw = session as unknown as {
        track_id: string;
        tracks: {
          id: string;
          title: string;
          creator_id: string;
          duration_seconds: number | null;
          albums: { cover_path: string | null } | null;
        };
      };
      if (seen.has(raw.track_id)) continue;
      seen.add(raw.track_id);
      rows.push({
        trackId: raw.track_id,
        title: raw.tracks.title,
        artistName: "",
        coverPath: raw.tracks.albums?.cover_path ?? null,
        creatorId: raw.tracks.creator_id,
        durationSeconds: raw.tracks.duration_seconds,
      });
      if (rows.length >= limit) break;
    }

    if (rows.length === 0) return [];

    const creatorIds = [...new Set(rows.map((row) => row.creatorId))];
    const { data: profiles } = await this.client
      .from("artist_profiles")
      .select("creator_id, stage_name")
      .in("creator_id", creatorIds);

    const nameByCreator = new Map(
      (profiles ?? []).map((p) => [p.creator_id as string, p.stage_name as string]),
    );

    return rows.map((row) => ({
      ...row,
      artistName: nameByCreator.get(row.creatorId) ?? "Artiste",
    }));
  }

  async getSidebarCounts(userId: string): Promise<{ favoritesCount: number; downloadsCount: number }> {
    const [likesRes, favoritesRes] = await Promise.all([
      this.client
        .from("likes")
        .select("track_id", { count: "exact", head: true })
        .eq("user_id", userId),
      this.client
        .from("favorites")
        .select("entity_id", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("entity_type", "track"),
    ]);

    if (likesRes.error) throw likesRes.error;
    if (favoritesRes.error) throw favoritesRes.error;

    return {
      favoritesCount: Math.max(likesRes.count ?? 0, favoritesRes.count ?? 0),
      downloadsCount: 0,
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

  async getTrackReactionCounts(trackId: string): Promise<{ emoji: string; count: number }[]> {
    const { data, error } = await this.client
      .from("track_reaction_counts")
      .select("emoji, count")
      .eq("track_id", trackId);
    if (error) throw error;
    return (data ?? []).map((row) => ({
      emoji: String((row as { emoji: string }).emoji),
      count: Number((row as { count: number | null }).count ?? 0),
    }));
  }

  async getLiveListenerCount(trackId: string): Promise<number> {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    const { count, error } = await this.client
      .from("stream_sessions")
      .select("id", { count: "exact", head: true })
      .eq("track_id", trackId)
      .gte("last_heartbeat_at", fiveMinutesAgo)
      .is("completed_at", null);
    if (error) throw error;
    return count ?? 0;
  }

  async addTrackReaction(trackId: string, emoji: string): Promise<void> {
    const { error } = await this.client.rpc("add_track_reaction", {
      p_track_id: trackId,
      p_emoji: emoji,
    });
    if (error) throw error;
  }

  async getTrackLyrics(trackId: string, language = "fr"): Promise<{ lines: LyricLine[] }> {
    const { data, error } = await this.client
      .from("track_lyrics")
      .select("lines")
      .eq("track_id", trackId)
      .eq("status", "approved")
      .eq("language", language)
      .maybeSingle();
    if (error) throw error;
    if (!data?.lines || !Array.isArray(data.lines)) {
      return { lines: [] };
    }
    const lines = (data.lines as unknown[]).filter(
      (line): line is LyricLine =>
        typeof line === "object" &&
        line !== null &&
        "time" in line &&
        "text" in line &&
        typeof (line as LyricLine).time === "number" &&
        typeof (line as LyricLine).text === "string",
    );
    return { lines };
  }
}
