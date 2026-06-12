import type { SonafrikSupabaseClient } from "@sonafrik/database";
import type {
  Favorite,
  LibraryItem,
  PlaybackPosition,
  Playlist,
  PlaylistTrack,
  SearchResult,
  StreamAnalytics,
  StreamSession,
  StreamStartResult,
} from "@sonafrik/types";
import { StreamingError } from "./errors";
import { StreamingRepository } from "./streaming.repository";
import {
  addTrackToPlaylistSchema,
  analyticsSchema,
  completeStreamSchema,
  createPlaylistSchema,
  savePositionSchema,
  searchSchema,
  startStreamSchema,
  streamHeartbeatSchema,
  toggleFavoriteSchema,
  updatePlaylistSchema,
  type AddTrackToPlaylistInput,
  type AnalyticsInput,
  type CompleteStreamInput,
  type CreatePlaylistInput,
  type SavePositionInput,
  type SearchInput,
  type StartStreamInput,
  type StreamHeartbeatInput,
  type ToggleFavoriteInput,
  type UpdatePlaylistInput,
} from "./schemas";

export class StreamingService {
  private readonly repository: StreamingRepository;

  constructor(private readonly client: SonafrikSupabaseClient) {
    this.repository = new StreamingRepository(client);
  }

  private async requireUserId(): Promise<string> {
    const {
      data: { user },
    } = await this.client.auth.getUser();
    if (!user) throw new StreamingError("unauthorized");
    return user.id;
  }

  // ---------------------------------------------------------------------------
  // Streaming Engine + Real Listen V7.2
  // ---------------------------------------------------------------------------

  async startStream(input: StartStreamInput): Promise<StreamStartResult> {
    const parsed = startStreamSchema.safeParse(input);
    if (!parsed.success) throw new StreamingError("track_not_found");

    await this.requireUserId();

    const { data, error } = await this.client.functions.invoke("stream-start", {
      body: {
        trackId: parsed.data.trackId,
        platform: parsed.data.platform,
        qualityKbps: parsed.data.qualityKbps,
        deviceId: parsed.data.deviceId,
      },
    });

    if (error || !data?.sessionId) throw new StreamingError("stream_start_failed");

    try {
      await this.repository.logAudit("streaming.session.started", "tracks", parsed.data.trackId);
    } catch {
      // audit non bloquant
    }

    return data as StreamStartResult;
  }

  async sendHeartbeat(input: StreamHeartbeatInput): Promise<void> {
    const parsed = streamHeartbeatSchema.safeParse(input);
    if (!parsed.success) throw new StreamingError("session_not_found");

    await this.requireUserId();

    // Route via l'Edge Function stream-progress pour activer l'anti-fraude
    // et enregistrer les events heartbeat dans stream_events.
    const { error } = await this.client.functions.invoke("stream-progress", {
      body: {
        sessionId: parsed.data.sessionId,
        positionSeconds: parsed.data.positionSeconds,
      },
    });

    if (error) throw new StreamingError("session_not_found");
  }

  /** Real Listen V7.2 — retourne true si l'écoute est valide (≥90%) */
  async completeStream(input: CompleteStreamInput): Promise<boolean> {
    const parsed = completeStreamSchema.safeParse(input);
    if (!parsed.success) throw new StreamingError("session_not_found");

    await this.requireUserId();

    const { data, error } = await this.client.functions.invoke("stream-complete", {
      body: {
        sessionId: parsed.data.sessionId,
        positionSeconds: parsed.data.positionSeconds,
        totalDurationSeconds: parsed.data.totalDurationSeconds,
      },
    });

    if (error) throw new StreamingError("session_not_found");
    return (data?.isValidListen as boolean) ?? false;
  }

  async getSession(sessionId: string): Promise<StreamSession> {
    await this.requireUserId();
    const session = await this.repository.getSession(sessionId);
    if (!session) throw new StreamingError("session_not_found");
    return session;
  }

  // ---------------------------------------------------------------------------
  // Playlists
  // ---------------------------------------------------------------------------

  async listPlaylists(): Promise<Playlist[]> {
    const userId = await this.requireUserId();
    return this.repository.listPlaylists(userId);
  }

  async getPlaylist(playlistId: string): Promise<Playlist> {
    await this.requireUserId();
    const playlist = await this.repository.getPlaylist(playlistId);
    if (!playlist) throw new StreamingError("playlist_not_found");
    return playlist;
  }

  async createPlaylist(input: CreatePlaylistInput): Promise<Playlist> {
    const parsed = createPlaylistSchema.safeParse(input);
    if (!parsed.success) throw new StreamingError("playlist_create_failed");

    const userId = await this.requireUserId();
    const playlist = await this.repository.createPlaylist(
      userId,
      parsed.data.title,
      parsed.data.description,
      parsed.data.isPublic,
    );

    await this.repository.logAudit("streaming.playlist.created", "playlists", playlist.id).catch(() => {});
    return playlist;
  }

  async updatePlaylist(playlistId: string, input: UpdatePlaylistInput): Promise<Playlist> {
    const parsed = updatePlaylistSchema.safeParse(input);
    if (!parsed.success) throw new StreamingError("playlist_not_found");

    await this.requireUserId();
    return this.repository.updatePlaylist(playlistId, {
      title: parsed.data.title,
      description: parsed.data.description,
      is_public: parsed.data.isPublic,
    });
  }

  async deletePlaylist(playlistId: string): Promise<void> {
    await this.requireUserId();
    await this.repository.deletePlaylist(playlistId);
    await this.repository.logAudit("streaming.playlist.deleted", "playlists", playlistId).catch(() => {});
  }

  async getPlaylistTracks(playlistId: string): Promise<PlaylistTrack[]> {
    await this.requireUserId();
    return this.repository.getPlaylistTracks(playlistId);
  }

  async addTrackToPlaylist(input: AddTrackToPlaylistInput): Promise<void> {
    const parsed = addTrackToPlaylistSchema.safeParse(input);
    if (!parsed.success) throw new StreamingError("playlist_not_found");

    const userId = await this.requireUserId();
    await this.repository.addTrackToPlaylist(parsed.data.playlistId, parsed.data.trackId, userId);
  }

  async removeTrackFromPlaylist(playlistId: string, trackId: string): Promise<void> {
    await this.requireUserId();
    await this.repository.removeTrackFromPlaylist(playlistId, trackId);
  }

  // ---------------------------------------------------------------------------
  // Favorites
  // ---------------------------------------------------------------------------

  async toggleFavorite(input: ToggleFavoriteInput): Promise<boolean> {
    const parsed = toggleFavoriteSchema.safeParse(input);
    if (!parsed.success) throw new StreamingError("favorite_toggle_failed");

    const userId = await this.requireUserId();
    try {
      return await this.repository.toggleFavorite(userId, parsed.data.entityType, parsed.data.entityId);
    } catch {
      throw new StreamingError("favorite_toggle_failed");
    }
  }

  async isFavorited(entityType: Favorite["entity_type"], entityId: string): Promise<boolean> {
    await this.requireUserId();
    return this.repository.isFavorited(entityType, entityId);
  }

  async getUserFavorites(): Promise<Favorite[]> {
    const userId = await this.requireUserId();
    return this.repository.getUserFavorites(userId);
  }

  // ---------------------------------------------------------------------------
  // Playback Positions
  // ---------------------------------------------------------------------------

  async savePosition(input: SavePositionInput): Promise<void> {
    const parsed = savePositionSchema.safeParse(input);
    if (!parsed.success) return;
    await this.requireUserId();
    await this.repository.savePosition(parsed.data.trackId, parsed.data.positionSeconds);
  }

  async getPosition(trackId: string): Promise<number> {
    await this.requireUserId();
    return this.repository.getPosition(trackId);
  }

  async getAllPositions(): Promise<PlaybackPosition[]> {
    const userId = await this.requireUserId();
    return this.repository.getAllPositions(userId);
  }

  // ---------------------------------------------------------------------------
  // Search V1
  // ---------------------------------------------------------------------------

  async search(input: SearchInput): Promise<SearchResult> {
    const parsed = searchSchema.safeParse(input);
    if (!parsed.success) throw new StreamingError("search_failed");

    await this.requireUserId();

    try {
      const [tracks, albums] = await Promise.all([
        this.repository.searchTracks(parsed.data.query, parsed.data.limit),
        this.repository.searchAlbums(parsed.data.query, parsed.data.limit),
      ]);

      return {
        tracks,
        albums,
        total: tracks.length + albums.length,
        query: parsed.data.query,
      };
    } catch {
      throw new StreamingError("search_failed");
    }
  }

  // ---------------------------------------------------------------------------
  // Library
  // ---------------------------------------------------------------------------

  async getLibrary(): Promise<LibraryItem[]> {
    const userId = await this.requireUserId();
    return this.repository.getUserLibrary(userId);
  }

  // ---------------------------------------------------------------------------
  // Analytics V1
  // ---------------------------------------------------------------------------

  async getAnalytics(input: AnalyticsInput): Promise<StreamAnalytics> {
    const parsed = analyticsSchema.safeParse(input);
    if (!parsed.success) throw new StreamingError("analytics_failed");

    await this.requireUserId();

    try {
      return await this.repository.getStreamAnalytics(parsed.data.creatorId, parsed.data.periodDays);
    } catch {
      throw new StreamingError("analytics_failed");
    }
  }

  // ---------------------------------------------------------------------------
  // Permissions
  // ---------------------------------------------------------------------------

  async hasStreamingPermission(): Promise<boolean> {
    return this.repository.hasStreamingPermission();
  }
}

export function createStreamingService(client: SonafrikSupabaseClient): StreamingService {
  return new StreamingService(client);
}
