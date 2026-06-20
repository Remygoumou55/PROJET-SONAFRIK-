import type { SonafrikSupabaseClient } from "@sonafrik/database";
import type { Json } from "@sonafrik/database/types";
import type {
  AlbumWithMeta,
  ArtistResult,
  BeatSearchResult,
  Favorite,
  LibraryItem,
  PlaybackPosition,
  Playlist,
  PlaylistSearchResult,
  PlaylistTrack,
  StreamAnalytics,
  StreamEventType,
  StreamSession,
  StreamingPlatform,
  TrackWithMeta,
} from "@sonafrik/types";

// Scoring de pertinence : 0 = exact, 1 = préfixe, 2 = contenu (tri ASC = plus pertinent en premier)
function relevanceScore(name: string, query: string): number {
  const n = name.toLowerCase();
  if (n === query) return 0;
  if (n.startsWith(query)) return 1;
  return 2;
}

export class StreamingRepository {
  constructor(private readonly client: SonafrikSupabaseClient) {}

  // ---------------------------------------------------------------------------
  // Stream Sessions
  // ---------------------------------------------------------------------------

  async startSession(
    userId: string,
    trackId: string,
    platform: StreamingPlatform,
    qualityKbps?: number | null,
    deviceId?: string | null,
    totalDurationSeconds?: number,
  ): Promise<string> {
    const { data, error } = await this.client.rpc("start_stream_session", {
      p_track_id: trackId,
      p_platform: platform,
      p_quality_kbps: qualityKbps ?? null,
      p_device_id: deviceId ?? null,
      p_total_duration_seconds: totalDurationSeconds ?? 0,
    });
    if (error) throw error;
    return data as string;
  }

  async heartbeat(sessionId: string, positionSeconds: number): Promise<void> {
    const { error } = await this.client.rpc("update_stream_heartbeat", {
      p_session_id: sessionId,
      p_position_seconds: positionSeconds,
    });
    if (error) throw error;
  }

  async completeSession(
    sessionId: string,
    positionSeconds: number,
    totalDurationSeconds: number,
  ): Promise<boolean> {
    const { data, error } = await this.client.rpc("complete_stream_session", {
      p_session_id: sessionId,
      p_position_seconds: positionSeconds,
      p_total_duration_seconds: totalDurationSeconds,
    });
    if (error) throw error;
    return data as boolean;
  }

  async getSession(sessionId: string): Promise<StreamSession | null> {
    const { data, error } = await this.client
      .from("stream_sessions")
      .select("*")
      .eq("id", sessionId)
      .maybeSingle();
    if (error) throw error;
    if (!data) return null;
    return {
      ...(data as StreamSession),
      fraud_flags: (data.fraud_flags as string[]) ?? [],
    };
  }

  // ---------------------------------------------------------------------------
  // Stream Events
  // ---------------------------------------------------------------------------

  async recordEvent(
    sessionId: string,
    userId: string,
    trackId: string,
    eventType: StreamEventType,
    positionSeconds: number,
    metadata?: Record<string, unknown>,
  ): Promise<void> {
    const { error } = await this.client.from("stream_events").insert({
      session_id: sessionId,
      user_id: userId,
      track_id: trackId,
      event_type: eventType,
      position_seconds: positionSeconds,
      metadata: (metadata ?? {}) as Json,
    });
    if (error) throw error;
  }

  // ---------------------------------------------------------------------------
  // Playlists
  // ---------------------------------------------------------------------------

  async listPlaylists(userId: string): Promise<Playlist[]> {
    const { data, error } = await this.client
      .from("playlists")
      .select("*")
      .eq("user_id", userId)
      .is("deleted_at", null)
      .order("updated_at", { ascending: false });
    if (error) throw error;
    return (data ?? []) as Playlist[];
  }

  async getPlaylist(playlistId: string): Promise<Playlist | null> {
    const { data, error } = await this.client
      .from("playlists")
      .select("*")
      .eq("id", playlistId)
      .is("deleted_at", null)
      .maybeSingle();
    if (error) throw error;
    return data as Playlist | null;
  }

  async createPlaylist(
    userId: string,
    title: string,
    description?: string | null,
    isPublic?: boolean,
  ): Promise<Playlist> {
    const { data, error } = await this.client
      .from("playlists")
      .insert({
        user_id: userId,
        title,
        description: description ?? null,
        is_public: isPublic ?? false,
      })
      .select("*")
      .single();
    if (error) throw error;
    return data as Playlist;
  }

  async updatePlaylist(
    playlistId: string,
    updates: { title?: string; description?: string | null; is_public?: boolean },
  ): Promise<Playlist> {
    const { data, error } = await this.client
      .from("playlists")
      .update(updates)
      .eq("id", playlistId)
      .select("*")
      .single();
    if (error) throw error;
    return data as Playlist;
  }

  async deletePlaylist(playlistId: string): Promise<void> {
    const { error } = await this.client
      .from("playlists")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", playlistId);
    if (error) throw error;
  }

  async getPlaylistTracks(playlistId: string): Promise<PlaylistTrack[]> {
    const { data, error } = await this.client
      .from("playlist_tracks")
      .select("*")
      .eq("playlist_id", playlistId)
      .order("position");
    if (error) throw error;
    return (data ?? []) as PlaylistTrack[];
  }

  async addTrackToPlaylist(playlistId: string, trackId: string, userId: string): Promise<void> {
    const { data: existing } = await this.client
      .from("playlist_tracks")
      .select("position")
      .eq("playlist_id", playlistId)
      .order("position", { ascending: false })
      .limit(1)
      .maybeSingle();

    const nextPosition = existing ? (existing.position as number) + 1 : 0;

    const { error } = await this.client.from("playlist_tracks").insert({
      playlist_id: playlistId,
      track_id: trackId,
      position: nextPosition,
      added_by: userId,
    });
    if (error) throw error;
  }

  async removeTrackFromPlaylist(playlistId: string, trackId: string): Promise<void> {
    const { error } = await this.client
      .from("playlist_tracks")
      .delete()
      .eq("playlist_id", playlistId)
      .eq("track_id", trackId);
    if (error) throw error;
  }

  // ---------------------------------------------------------------------------
  // Favorites
  // ---------------------------------------------------------------------------

  async toggleFavorite(
    userId: string,
    entityType: Favorite["entity_type"],
    entityId: string,
  ): Promise<boolean> {
    const { data, error } = await this.client.rpc("toggle_favorite", {
      p_entity_type: entityType,
      p_entity_id: entityId,
    });
    if (error) throw error;
    return data as boolean;
  }

  async isFavorited(entityType: Favorite["entity_type"], entityId: string): Promise<boolean> {
    const { data, error } = await this.client.rpc("is_favorited", {
      p_entity_type: entityType,
      p_entity_id: entityId,
    });
    if (error) throw error;
    return data as boolean;
  }

  async getUserFavorites(userId: string): Promise<Favorite[]> {
    const { data, error } = await this.client
      .from("favorites")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []) as Favorite[];
  }

  // ---------------------------------------------------------------------------
  // Playback Positions
  // ---------------------------------------------------------------------------

  async savePosition(trackId: string, positionSeconds: number): Promise<void> {
    const { error } = await this.client.rpc("save_playback_position", {
      p_track_id: trackId,
      p_position_seconds: positionSeconds,
    });
    if (error) throw error;
  }

  async getPosition(trackId: string): Promise<number> {
    const { data, error } = await this.client.rpc("get_playback_position", {
      p_track_id: trackId,
    });
    if (error) throw error;
    return (data as number) ?? 0;
  }

  async getAllPositions(userId: string): Promise<PlaybackPosition[]> {
    const { data, error } = await this.client
      .from("playback_positions")
      .select("*")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false });
    if (error) throw error;
    return (data ?? []) as PlaybackPosition[];
  }

  // ---------------------------------------------------------------------------
  // Search
  // ---------------------------------------------------------------------------

  async searchTracks(query: string, limit: number): Promise<TrackWithMeta[]> {
    const { data, error } = await this.client
      .from("tracks")
      .select("*")
      .eq("publication_status", "published")
      .is("deleted_at", null)
      .ilike("title", `%${query}%`)
      .limit(limit)
      .order("created_at", { ascending: false });
    if (error) throw error;
    const rows = (data ?? []) as TrackWithMeta[];
    const q = query.toLowerCase();
    return rows
      .map((row) => ({ ...row, metadata: (row.metadata as Record<string, unknown>) ?? {} }))
      .sort((a, b) => relevanceScore(a.title, q) - relevanceScore(b.title, q));
  }

  async searchArtists(query: string, limit: number): Promise<ArtistResult[]> {
    const { data, error } = await this.client
      .from("artist_profiles")
      .select("creator_id, stage_name, slug, bio, genres, cover_path, verified")
      .ilike("stage_name", `%${query}%`)
      .limit(limit)
      .order("created_at", { ascending: false });
    if (error) throw error;
    const rows = (data ?? []) as ArtistResult[];
    const q = query.toLowerCase();
    return rows.sort((a, b) => relevanceScore(a.stage_name, q) - relevanceScore(b.stage_name, q));
  }

  async searchAlbums(query: string, limit: number): Promise<AlbumWithMeta[]> {
    const { data, error } = await this.client
      .from("albums")
      .select("*")
      .eq("publication_status", "published")
      .is("deleted_at", null)
      .ilike("title", `%${query}%`)
      .limit(limit)
      .order("created_at", { ascending: false });
    if (error) throw error;
    const rows = (data ?? []) as AlbumWithMeta[];
    const q = query.toLowerCase();
    return rows
      .map((row) => ({ ...row, metadata: (row.metadata as Record<string, unknown>) ?? {} }))
      .sort((a, b) => relevanceScore(a.title, q) - relevanceScore(b.title, q));
  }

  async searchPlaylists(query: string, limit: number): Promise<PlaylistSearchResult[]> {
    const { data, error } = await this.client
      .from("playlists")
      .select("id, title, description, cover_path, track_count, is_public")
      .eq("is_public", true)
      .is("deleted_at", null)
      .ilike("title", `%${query}%`)
      .limit(limit)
      .order("track_count", { ascending: false });
    if (error) throw error;
    const rows = (data ?? []) as PlaylistSearchResult[];
    const q = query.toLowerCase();
    return rows.sort((a, b) => relevanceScore(a.title, q) - relevanceScore(b.title, q));
  }

  async searchBeats(query: string, limit: number): Promise<BeatSearchResult[]> {
    const { data, error } = await this.client
      .from("beats" as never)
      .select("id, creator_id, title, slug, genre, cover_path, price_gnf, bpm, license_type")
      .eq("publication_status" as never, "published")
      .is("deleted_at" as never, null)
      .ilike("title" as never, `%${query}%`)
      .limit(limit)
      .order("created_at" as never, { ascending: false });
    if (error) throw error;
    const rows = (data ?? []) as unknown as BeatSearchResult[];
    const q = query.toLowerCase();
    return rows.sort((a, b) => relevanceScore(a.title, q) - relevanceScore(b.title, q));
  }

  // ---------------------------------------------------------------------------
  // Library
  // ---------------------------------------------------------------------------

  async getUserLibrary(userId: string): Promise<LibraryItem[]> {
    const favorites = await this.getUserFavorites(userId);
    return favorites.map((fav) => ({
      entity_type: fav.entity_type,
      entity_id: fav.entity_id,
      created_at: fav.created_at,
    }));
  }

  // ---------------------------------------------------------------------------
  // Analytics
  // ---------------------------------------------------------------------------

  async getStreamAnalytics(creatorId: string, periodDays: number): Promise<StreamAnalytics> {
    const since = new Date(Date.now() - periodDays * 24 * 3600 * 1000).toISOString();

    // Récupérer uniquement les tracks de ce créateur avec leur titre
    const { data: creatorTracks } = await this.client
      .from("tracks")
      .select("id, title")
      .eq("creator_id", creatorId)
      .eq("publication_status", "published")
      .is("deleted_at", null);

    const trackIds = (creatorTracks ?? []).map((t) => t.id as string);
    const titleMap: Record<string, string> = {};
    for (const t of creatorTracks ?? []) {
      titleMap[t.id as string] = t.title as string;
    }

    if (trackIds.length === 0) {
      return {
        creator_id: creatorId,
        period_days: periodDays,
        total_streams: 0,
        valid_streams: 0,
        unique_listeners: 0,
        total_listened_seconds: 0,
        top_tracks: [],
        streams_by_platform: { web: 0, ios: 0, android: 0 },
      };
    }

    const { data, error } = await this.client
      .from("stream_sessions")
      .select("platform, total_listened_seconds, user_id, track_id")
      .in("track_id", trackIds)
      .eq("is_valid_listen", true)
      .gte("started_at", since);

    if (error) throw error;

    const rows = data ?? [];
    const total_streams = rows.length;
    const valid_streams = rows.length;
    const unique_listeners = new Set(rows.map((r) => r.user_id)).size;
    const total_listened_seconds = rows.reduce(
      (acc, r) => acc + ((r.total_listened_seconds as number) ?? 0),
      0,
    );

    const streamsByPlatform = { web: 0, ios: 0, android: 0 };
    for (const r of rows) {
      const p = r.platform as keyof typeof streamsByPlatform;
      if (p in streamsByPlatform) streamsByPlatform[p]++;
    }

    const trackCounts: Record<string, number> = {};
    for (const r of rows) {
      const tid = r.track_id as string;
      trackCounts[tid] = (trackCounts[tid] ?? 0) + 1;
    }
    const top_tracks = Object.entries(trackCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([track_id, stream_count]) => ({
        track_id,
        title: titleMap[track_id] ?? track_id,
        stream_count,
      }));

    return {
      creator_id: creatorId,
      period_days: periodDays,
      total_streams,
      valid_streams,
      unique_listeners,
      total_listened_seconds,
      top_tracks,
      streams_by_platform: streamsByPlatform,
    };
  }

  // ---------------------------------------------------------------------------
  // Permissions
  // ---------------------------------------------------------------------------

  async hasStreamingPermission(): Promise<boolean> {
    const { data, error } = await this.client.rpc("has_streaming_permission");
    if (error) return true; // fallback permissif en dev
    return data as boolean;
  }

  async logAudit(action: string, entityType?: string, entityId?: string): Promise<void> {
    const { error } = await this.client.rpc("log_audit_event_authenticated", {
      p_action: action,
      p_entity_type: entityType,
      p_entity_id: entityId,
      p_metadata: {} as Json,
    });
    if (error) throw error;
  }
}
