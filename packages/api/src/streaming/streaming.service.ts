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
import { createSocialService } from "../social/social.service";
import { StreamingError } from "./errors";
import { mapFunctionInvokeError } from "./invoke-errors";
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
  private readonly social: ReturnType<typeof createSocialService>;

  constructor(private readonly client: SonafrikSupabaseClient) {
    this.repository = new StreamingRepository(client);
    this.social = createSocialService(client);
  }

  private async requireUserId(): Promise<string> {
    if ((process.env.BYPASS_AUTH === "true" && process.env.VERCEL !== "1") || process.env.NEXT_PUBLIC_LOCAL_AUDIT_MODE === "true") {
      const {
        data: { user },
      } = await this.client.auth.getUser();
      if (user) return user.id;
      return "dev-mock-id";
    }
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

    if (error || !data?.sessionId) {
      throw new StreamingError(mapFunctionInvokeError("start", error));
    }

    try {
      await this.repository.logAudit("streaming.session.started", "tracks", parsed.data.trackId);
    } catch {
      // audit non bloquant
    }

    return data as StreamStartResult;
  }

  async sendHeartbeat(input: StreamHeartbeatInput): Promise<void> {
    const parsed = streamHeartbeatSchema.safeParse(input);
    if (!parsed.success) throw new StreamingError("invalid_session");

    await this.requireUserId();

    // Timeout 5s : évite l'accumulation de requêtes pendantes si le réseau est lent
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5_000);

    try {
      // Route via l'Edge Function stream-progress pour activer l'anti-fraude
      // et enregistrer les events heartbeat dans stream_events.
      const { error } = await this.client.functions.invoke("stream-progress", {
        body: {
          sessionId: parsed.data.sessionId,
          positionSeconds: parsed.data.positionSeconds,
        },
        signal: controller.signal,
      });

      if (error) throw new StreamingError(mapFunctionInvokeError("progress", error));
    } finally {
      clearTimeout(timer);
    }
  }

  /** Real Listen V7.2 — retourne true si l'écoute est valide (≥90%). Ne throw jamais (idempotent). */
  async completeStream(input: CompleteStreamInput): Promise<boolean> {
    const parsed = completeStreamSchema.safeParse(input);
    if (!parsed.success) return false;

    try {
      await this.requireUserId();
    } catch {
      return false;
    }

    const { data, error } = await this.client.functions.invoke("stream-complete", {
      body: {
        sessionId: parsed.data.sessionId,
        positionSeconds: Math.round(parsed.data.positionSeconds),
        totalDurationSeconds: Math.round(parsed.data.totalDurationSeconds),
      },
    });

    if (!error && data != null) {
      const payload = typeof data === "string" ? (JSON.parse(data) as Record<string, unknown>) : data;
      return Boolean(payload.isValidListen ?? payload.is_valid_listen ?? false);
    }

    const session = await this.repository.getSession(parsed.data.sessionId).catch(() => null);
    if (session?.completed_at != null) {
      return session.is_valid_listen ?? false;
    }

    return false;
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

  // Favorites — délégués au domaine social (source unique)
  // ---------------------------------------------------------------------------

  async toggleFavorite(input: ToggleFavoriteInput): Promise<boolean> {
    try {
      return await this.social.toggleFavorite(input);
    } catch {
      throw new StreamingError("favorite_toggle_failed");
    }
  }

  async isFavorited(entityType: Favorite["entity_type"], entityId: string): Promise<boolean> {
    return this.social.isFavorited({ entityType, entityId });
  }

  async getUserFavorites(): Promise<Favorite[]> {
    return this.social.getUserFavorites();
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
  // Search V2 — multi-type avec scoring de pertinence
  // ---------------------------------------------------------------------------

  async search(input: SearchInput): Promise<SearchResult> {
    const parsed = searchSchema.safeParse(input);
    if (!parsed.success) throw new StreamingError("search_failed");

    await this.requireUserId();

    const { query, limit, type, includeBeats } = parsed.data;

    const safe = async <T>(run: () => Promise<T>, fallback: T): Promise<T> => {
      try {
        return await run();
      } catch (err) {
        if (process.env.NODE_ENV === "development") {
          console.warn("[streaming.search]", err);
        }
        return fallback;
      }
    };

    try {
      const perType = Math.max(5, Math.ceil(limit / 3));

      const [tracks, artists, albums, playlists, beats] = await Promise.all([
        type === "all" || type === "tracks"
          ? safe(() => this.repository.searchTracks(query, limit), [])
          : Promise.resolve([]),
        type === "all" || type === "artists"
          ? safe(() => this.repository.searchArtists(query, type === "all" ? perType : limit), [])
          : Promise.resolve([]),
        type === "all" || type === "albums"
          ? safe(() => this.repository.searchAlbums(query, type === "all" ? perType : limit), [])
          : Promise.resolve([]),
        type === "all" || type === "playlists"
          ? safe(() => this.repository.searchPlaylists(query, type === "all" ? perType : limit), [])
          : Promise.resolve([]),
        type === "all" || type === "beats"
          ? includeBeats
            ? safe(() => this.repository.searchBeats(query, type === "all" ? perType : limit), [])
            : Promise.resolve([])
          : Promise.resolve([]),
      ]);

      return {
        tracks,
        artists,
        albums,
        playlists,
        beats,
        total: tracks.length + artists.length + albums.length + playlists.length + beats.length,
        query,
        type,
      };
    } catch {
      throw new StreamingError("search_failed");
    }
  }

  // ---------------------------------------------------------------------------
  // Library
  // ---------------------------------------------------------------------------

  async getLibrary(): Promise<LibraryItem[]> {
    const favorites = await this.social.getUserFavorites();
    return favorites.map((fav) => ({
      entity_type: fav.entity_type,
      entity_id: fav.entity_id,
      created_at: fav.created_at,
    }));
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
