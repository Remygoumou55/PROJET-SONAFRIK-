import type { SonafrikSupabaseClient } from "@sonafrik/database";
import type { Json } from "@sonafrik/database/types";
import type { Album, Genre, Track, TrackAppearance, TrackCredit, TrackCreditRole, TrackFile } from "@sonafrik/types";
import { enrichTrackCreditsWithCreatorIds } from "../../common/profile-creator.helpers";
import type { TrackCreditItem } from "./schemas";
import { COVER_SOURCE_METADATA_KEY, type CoverSource, type CoverStatus } from "./artwork";
import {
  applyPublicationSearchFilter,
  type PublicationLibrarySort,
  type PublicationLibraryStatusFilter,
  type PublicationSearchField,
  type PublicationTrackInsight,
  publicationSortToOrder,
  resolvePublicationStatusDbFilter,
} from "./publication-library";

function applyPublicationStatusFilter<
  T extends {
    eq: (col: string, val: string) => T;
    not: (col: string, op: string, val: null) => T;
    filter: (col: string, op: string, val: string) => T;
  },
>(query: T, status?: PublicationLibraryStatusFilter | string): T {
  const resolved = resolvePublicationStatusDbFilter(
    (status ?? "all") as PublicationLibraryStatusFilter,
  );
  if (resolved === "all") return query;
  if (resolved === "validation") {
    return query
      .eq("publication_status", "pending_review")
      .not("submitted_at", "is", null);
  }
  if (resolved === "scheduled") {
    return query
      .eq("publication_status", "draft")
      .not("metadata->scheduled_publish_at", "is", null);
  }
  return query.eq("publication_status", resolved);
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export class CatalogRepository {
  constructor(private readonly client: SonafrikSupabaseClient) {}

  async ensureCreatorId(): Promise<string> {
    const { data, error } = await this.client.rpc("ensure_creator_for_current_user");
    if (error) throw error;
    return data as string;
  }

  async getArtistStageName(creatorId: string): Promise<string> {
    const { data, error } = await this.client
      .from("artist_profiles")
      .select("stage_name")
      .eq("creator_id", creatorId)
      .maybeSingle();

    if (error) throw error;
    const name = (data as { stage_name?: string | null } | null)?.stage_name?.trim();
    return name && name.length > 0 ? name : "Artiste";
  }

  async getGenres(): Promise<Genre[]> {
    const { data, error } = await this.client
      .from("genres")
      .select(
        "id, name, slug, description, sort_order, is_active, created_at, updated_at, deleted_at",
      )
      .eq("is_active", true)
      .is("deleted_at", null)
      .order("sort_order");

    if (error) throw error;
    return (data ?? []) as Genre[];
  }

  /** Agrégats catalogue — head count uniquement (évite listAlbums + listTracks complets). */
  async getCatalogContextAggregates(creatorId: string): Promise<{
    albumsCount: number;
    singlesCount: number;
    tracksCount: number;
    pendingReview: number;
    publishedCount: number;
  }> {
    const albumsBase = () =>
      this.client
        .from("albums")
        .select("id", { count: "exact", head: true })
        .eq("creator_id", creatorId)
        .is("deleted_at", null);

    const tracksBase = () =>
      this.client
        .from("tracks")
        .select("id", { count: "exact", head: true })
        .eq("creator_id", creatorId)
        .is("deleted_at", null);

    const [
      albumsEpRes,
      singlesRes,
      tracksRes,
      pendingAlbumsRes,
      pendingTracksRes,
      publishedAlbumsRes,
      publishedTracksRes,
    ] = await Promise.all([
      albumsBase().in("release_type", ["album", "ep"]),
      albumsBase().eq("release_type", "single"),
      tracksBase(),
      albumsBase().eq("publication_status", "pending_review"),
      tracksBase().eq("publication_status", "pending_review"),
      albumsBase().eq("publication_status", "published"),
      tracksBase().eq("publication_status", "published"),
    ]);

    for (const res of [
      albumsEpRes,
      singlesRes,
      tracksRes,
      pendingAlbumsRes,
      pendingTracksRes,
      publishedAlbumsRes,
      publishedTracksRes,
    ]) {
      if (res.error) throw res.error;
    }

    return {
      albumsCount: albumsEpRes.count ?? 0,
      singlesCount: singlesRes.count ?? 0,
      tracksCount: tracksRes.count ?? 0,
      pendingReview: (pendingAlbumsRes.count ?? 0) + (pendingTracksRes.count ?? 0),
      publishedCount: (publishedAlbumsRes.count ?? 0) + (publishedTracksRes.count ?? 0),
    };
  }

  async listAlbums(creatorId: string, limit = 50, offset = 0): Promise<Album[]> {
    const { data, error } = await this.client
      .from("albums")
      .select("*")
      .eq("creator_id", creatorId)
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;
    return (data ?? []).map((row) => ({
      ...(row as Album),
      metadata: (row.metadata as Record<string, unknown>) ?? {},
    }));
  }

  async listAlbumsByIds(albumIds: string[]): Promise<Album[]> {
    if (albumIds.length === 0) return [];
    const { data, error } = await this.client
      .from("albums")
      .select("*")
      .in("id", albumIds)
      .is("deleted_at", null);

    if (error) throw error;
    return (data ?? []).map((row) => ({
      ...(row as Album),
      metadata: (row.metadata as Record<string, unknown>) ?? {},
    }));
  }

  async getAlbum(albumId: string): Promise<Album | null> {
    const { data, error } = await this.client
      .from("albums")
      .select("*")
      .eq("id", albumId)
      .is("deleted_at", null)
      .maybeSingle();

    if (error) throw error;
    if (!data) return null;
    return { ...(data as Album), metadata: (data.metadata as Record<string, unknown>) ?? {} };
  }

  async createAlbum(
    creatorId: string,
    userId: string,
    input: {
      title: string;
      slug: string;
      release_type: Album["release_type"];
      upc?: string | null;
      description?: string | null;
      release_date?: string | null;
    },
  ): Promise<Album> {
    const { data, error } = await this.client
      .from("albums")
      .insert({
        creator_id: creatorId,
        title: input.title,
        slug: input.slug,
        release_type: input.release_type,
        upc: input.upc ?? null,
        description: input.description ?? null,
        release_date: input.release_date ?? null,
        created_by: userId,
        updated_by: userId,
      })
      .select("*")
      .single();

    if (error) throw error;
    return { ...(data as Album), metadata: {} };
  }

  async updateAlbum(
    albumId: string,
    userId: string,
    updates: Partial<{
      title: string;
      release_type: Album["release_type"];
      upc: string | null;
      description: string | null;
      release_date: string | null;
    }>,
  ): Promise<Album> {
    const { data, error } = await this.client
      .from("albums")
      .update({ ...updates, updated_by: userId })
      .eq("id", albumId)
      .select("*")
      .single();

    if (error) throw error;
    return {
      ...(data as Album),
      metadata: (data.metadata as Record<string, unknown>) ?? {},
    };
  }

  async setAlbumGenres(albumId: string, genreIds: string[]): Promise<void> {
    await this.client.from("album_genres").delete().eq("album_id", albumId);
    if (!genreIds.length) return;
    await this.client.from("album_genres").insert(
      genreIds.map((genre_id) => ({ album_id: albumId, genre_id })),
    );
  }

  async countCreatorTracks(
    creatorId: string,
    options?: {
      search?: string;
      status?: string;
      searchFields?: PublicationSearchField[];
    },
  ): Promise<number> {
    let query = this.client
      .from("tracks")
      .select("id", { count: "exact", head: true })
      .eq("creator_id", creatorId)
      .is("deleted_at", null);

    query = applyPublicationSearchFilter(
      query,
      options?.search,
      options?.searchFields ?? ["title"],
    );
    if (options?.status && options.status !== "all") {
      query = applyPublicationStatusFilter(query, options.status);
    }

    const { count, error } = await query;
    if (error) throw error;
    return count ?? 0;
  }

  async listCreatorTracksPaginated(
    creatorId: string,
    limit: number,
    offset: number,
    options?: {
      search?: string;
      status?: string;
      sort?: PublicationLibrarySort;
      searchFields?: PublicationSearchField[];
    },
  ): Promise<Track[]> {
    const { column, ascending } = publicationSortToOrder(options?.sort ?? "updated_desc");

    let query = this.client
      .from("tracks")
      .select("*")
      .eq("creator_id", creatorId)
      .is("deleted_at", null);

    query = applyPublicationSearchFilter(
      query,
      options?.search,
      options?.searchFields ?? ["title"],
    );
    if (options?.status && options.status !== "all") {
      query = applyPublicationStatusFilter(query, options.status);
    }

    query = query.order(column, { ascending }).range(offset, offset + limit - 1);

    const { data, error } = await query;
    if (error) throw error;
    return (data ?? []).map((row) => ({
      ...(row as Track),
      metadata: (row.metadata as Record<string, unknown>) ?? {},
    }));
  }

  async getPublicationInsightsBatch(trackIds: string[]): Promise<PublicationTrackInsight[]> {
    if (trackIds.length === 0) return [];

    // B3 perf : 1 requête agrégée pour N tracks (remplace le N+1 historique).
    const { data, error } = await this.client.rpc("get_publication_insights_batch", {
      p_track_ids: trackIds,
    });

    if (!error && Array.isArray(data)) {
      const byId = new Map(
        (data as { track_id: string; streams: number; last_activity_at: string | null }[]).map(
          (row) => [row.track_id, row],
        ),
      );
      return trackIds.map((trackId) => {
        const row = byId.get(trackId);
        return {
          track_id: trackId,
          streams: Number(row?.streams ?? 0),
          revenue_gnf: null,
          last_activity_at: row?.last_activity_at ?? null,
        } satisfies PublicationTrackInsight;
      });
    }

    // Fallback tolérant si le RPC batch est indisponible (déploiement DB en retard).
    return this.getPublicationInsightsBatchFallback(trackIds);
  }

  private async getPublicationInsightsBatchFallback(
    trackIds: string[],
  ): Promise<PublicationTrackInsight[]> {
    const results = await Promise.all(
      trackIds.map(async (trackId) => {
        try {
          const [countsRes, sessionsRes] = await Promise.all([
            this.client.rpc("get_track_listen_counts", { p_track_id: trackId }),
            this.client
              .from("stream_sessions")
              .select("started_at")
              .eq("track_id", trackId)
              .eq("is_valid_listen", true)
              .order("started_at", { ascending: false })
              .limit(1)
              .maybeSingle(),
          ]);

          const row = countsRes.data as Record<string, unknown> | null;
          const session = sessionsRes.data as { started_at: string } | null;

          return {
            track_id: trackId,
            streams: Number(row?.all_time ?? 0),
            revenue_gnf: null,
            last_activity_at: session?.started_at ?? null,
          } satisfies PublicationTrackInsight;
        } catch {
          return {
            track_id: trackId,
            streams: 0,
            revenue_gnf: null,
            last_activity_at: null,
          } satisfies PublicationTrackInsight;
        }
      }),
    );

    return results;
  }

  async listTracks(creatorId: string, albumId?: string, limit = 100, offset = 0): Promise<Track[]> {
    let query = this.client
      .from("tracks")
      .select("*")
      .eq("creator_id", creatorId)
      .is("deleted_at", null)
      .order("track_number")
      .range(offset, offset + limit - 1);

    if (albumId) query = query.eq("album_id", albumId);

    const { data, error } = await query;
    if (error) throw error;
    return (data ?? []).map((row) => ({
      ...(row as Track),
      metadata: (row.metadata as Record<string, unknown>) ?? {},
    }));
  }

  async getTrack(trackId: string): Promise<Track | null> {
    const { data, error } = await this.client
      .from("tracks")
      .select("*")
      .eq("id", trackId)
      .is("deleted_at", null)
      .maybeSingle();

    if (error) throw error;
    if (!data) return null;
    return { ...(data as Track), metadata: (data.metadata as Record<string, unknown>) ?? {} };
  }

  async createTrack(
    creatorId: string,
    userId: string,
    input: {
      title: string;
      slug: string;
      album_id?: string | null;
      track_number?: number;
      isrc?: string | null;
      duration_seconds?: number | null;
      explicit?: boolean;
      language?: string;
      bpm?: number | null;
      musical_key?: string | null;
    },
  ): Promise<Track> {
    const { data, error } = await this.client
      .from("tracks")
      .insert({
        creator_id: creatorId,
        ...input,
        created_by: userId,
        updated_by: userId,
      })
      .select("*")
      .single();

    if (error) throw error;
    return { ...(data as Track), metadata: {} };
  }

  async updateTrack(
    trackId: string,
    userId: string,
    updates: Partial<{
      title: string;
      album_id: string | null;
      track_number: number;
      isrc: string | null;
      duration_seconds: number | null;
      explicit: boolean;
      language: string;
      bpm: number | null;
      musical_key: string | null;
    }>,
  ): Promise<Track> {
    const { data, error } = await this.client
      .from("tracks")
      .update({ ...updates, updated_by: userId })
      .eq("id", trackId)
      .select("*")
      .single();

    if (error) throw error;
    return {
      ...(data as Track),
      metadata: (data.metadata as Record<string, unknown>) ?? {},
    };
  }

  async getTrackGenreIds(trackId: string): Promise<string[]> {
    const { data, error } = await this.client
      .from("track_genres")
      .select("genre_id")
      .eq("track_id", trackId);

    if (error) throw error;
    return (data ?? []).map((row) => row.genre_id as string);
  }

  async setTrackGenres(trackId: string, genreIds: string[]): Promise<void> {
    await this.client.from("track_genres").delete().eq("track_id", trackId);
    if (!genreIds.length) return;
    await this.client.from("track_genres").insert(
      genreIds.map((genre_id) => ({ track_id: trackId, genre_id })),
    );
  }

  async getTrackFiles(trackId: string): Promise<TrackFile[]> {
    const { data, error } = await this.client
      .from("track_files")
      .select("*")
      .eq("track_id", trackId);

    if (error) throw error;
    return (data ?? []) as TrackFile[];
  }

  async submitAlbum(albumId: string): Promise<void> {
    const { error } = await this.client.rpc("submit_album_for_review", { p_album_id: albumId });
    if (error) throw error;
  }

  async submitTrack(trackId: string): Promise<void> {
    const { error } = await this.client.rpc("submit_track_for_review", { p_track_id: trackId });
    if (error) throw error;
  }

  async patchAlbumCoverArtworkState(
    albumId: string,
    userId: string,
    input: { source: CoverSource; status: CoverStatus },
  ): Promise<Album> {
    const existing = await this.getAlbum(albumId);
    if (!existing) throw new Error("Album introuvable.");

    const metadata = {
      ...(existing.metadata ?? {}),
      [COVER_SOURCE_METADATA_KEY]: input.source,
    };

    const { data, error } = await this.client
      .from("albums")
      .update({
        metadata: metadata as Json,
        cover_status: input.status,
        updated_by: userId,
      })
      .eq("id", albumId)
      .select("*")
      .single();

    if (error) throw error;
    return {
      ...(data as Album),
      metadata: (data.metadata as Record<string, unknown>) ?? {},
    };
  }

  async patchAlbumMetadata(
    albumId: string,
    userId: string,
    patch: Record<string, unknown>,
  ): Promise<Album> {
    const existing = await this.getAlbum(albumId);
    if (!existing) throw new Error("Album introuvable.");

    const metadata = {
      ...(existing.metadata ?? {}),
      ...patch,
    };

    const { data, error } = await this.client
      .from("albums")
      .update({ metadata: metadata as Json, updated_by: userId })
      .eq("id", albumId)
      .select("*")
      .single();

    if (error) throw error;
    return {
      ...(data as Album),
      metadata: (data.metadata as Record<string, unknown>) ?? {},
    };
  }

  async patchTrackMetadata(
    trackId: string,
    userId: string,
    patch: Record<string, unknown>,
  ): Promise<Track> {
    const existing = await this.getTrack(trackId);
    if (!existing) throw new Error("Morceau introuvable.");

    const metadata = {
      ...(existing.metadata ?? {}),
      ...patch,
    };

    const { data, error } = await this.client
      .from("tracks")
      .update({ metadata: metadata as Json, updated_by: userId })
      .eq("id", trackId)
      .select("*")
      .single();

    if (error) throw error;
    return {
      ...(data as Track),
      metadata: (data.metadata as Record<string, unknown>) ?? {},
    };
  }

  async upsertTrackLyricsPending(input: {
    trackId: string;
    userId: string;
    language: string;
    lines: import("@sonafrik/types").LyricLine[];
  }): Promise<void> {
    const payload = {
      lines: input.lines as unknown as Json,
      updated_at: new Date().toISOString(),
    };

    const { data: existing, error: readError } = await this.client
      .from("track_lyrics")
      .select("id")
      .eq("track_id", input.trackId)
      .eq("language", input.language)
      .maybeSingle();

    if (readError) throw readError;

    if (existing?.id) {
      const { error } = await this.client
        .from("track_lyrics")
        .update(payload)
        .eq("id", existing.id);
      if (error) throw error;
      return;
    }

    const { error } = await this.client.from("track_lyrics").insert({
      track_id: input.trackId,
      language: input.language,
      lines: input.lines as unknown as Json,
      submitted_by: input.userId,
      status: "pending",
    });
    if (error) throw error;
  }

  async getTrackLyricsPending(
    trackId: string,
    language: string,
  ): Promise<import("@sonafrik/types").LyricLine[]> {
    const { data, error } = await this.client
      .from("track_lyrics")
      .select("lines")
      .eq("track_id", trackId)
      .eq("language", language)
      .eq("status", "pending")
      .maybeSingle();

    if (error) throw error;
    if (!data?.lines || !Array.isArray(data.lines)) return [];

    return (data.lines as unknown[]).filter(
      (line): line is import("@sonafrik/types").LyricLine =>
        typeof line === "object" &&
        line !== null &&
        "time" in line &&
        "text" in line &&
        typeof (line as import("@sonafrik/types").LyricLine).time === "number" &&
        typeof (line as import("@sonafrik/types").LyricLine).text === "string",
    );
  }

  async deleteTrackLyricsPending(trackId: string, language: string): Promise<void> {
    const { error } = await this.client
      .from("track_lyrics")
      .delete()
      .eq("track_id", trackId)
      .eq("language", language)
      .eq("status", "pending");
    if (error) throw error;
  }

  async logAudit(
    action: string,
    entityType?: string,
    entityId?: string,
    metadata?: Record<string, unknown>,
  ): Promise<void> {
    const { error } = await this.client.rpc("log_audit_event_authenticated", {
      p_action: action,
      p_entity_type: entityType,
      p_entity_id: entityId,
      p_metadata: (metadata ?? {}) as Json,
    });
    if (error) throw error;
  }

  async getTrackCredits(trackId: string): Promise<TrackCredit[]> {
    const { data, error } = await this.client
      .from("track_credits")
      .select("*")
      .eq("track_id", trackId)
      .order("display_order");

    if (error) throw error;
    return enrichTrackCreditsWithCreatorIds(this.client, (data ?? []) as TrackCredit[]);
  }

  async setTrackCredits(trackId: string, credits: TrackCreditItem[]): Promise<void> {
    await this.client.from("track_credits").delete().eq("track_id", trackId);
    if (!credits.length) return;
    const { error } = await this.client.from("track_credits").insert(
      credits.map((c, i) => ({
        track_id:               trackId,
        contributor_name:       c.contributorName,
        role:                   c.role,
        display_order:          c.displayOrder ?? i,
        contributor_profile_id: c.contributorProfileId ?? null,
      })),
    );
    if (error) throw error;
  }

  async getTracksFeaturingCreator(creatorId: string): Promise<TrackAppearance[]> {
    type CreditWithTrack = {
      role: string;
      track_id: string;
      tracks: {
        id: string;
        title: string;
        album_id: string | null;
        creator_id: string;
        publication_status: string;
      };
    };

    // Join tracks!inner : 2 round-trips (crédits+tracks → covers+noms) au lieu de 3
    const rawResult = await this.client
      .from("track_credits")
      .select("role, track_id, tracks!inner(id, title, album_id, creator_id, publication_status)")
      .eq("contributor_profile_id", creatorId)
      .neq("role", "artiste_principal")
      .limit(20);

    if (rawResult.error) throw rawResult.error;

    const credits = (rawResult.data ?? []) as unknown as CreditWithTrack[];
    if (!credits.length) return [];

    // Publiés uniquement + pas l'artiste principal du morceau (évite les doublons)
    const filtered = credits.filter(
      (c) =>
        c.tracks.publication_status === "published" &&
        c.tracks.creator_id !== creatorId,
    );
    if (!filtered.length) return [];

    const albumIds = [...new Set(filtered.flatMap((c) => (c.tracks.album_id ? [c.tracks.album_id] : [])))];
    const mainCreatorIds = [...new Set(filtered.map((c) => c.tracks.creator_id))];

    const [albumsRes, profilesRes] = await Promise.all([
      albumIds.length
        ? this.client.from("albums").select("id, cover_path").in("id", albumIds)
        : { data: [], error: null },
      mainCreatorIds.length
        ? this.client.from("artist_profiles").select("creator_id, stage_name").in("creator_id", mainCreatorIds)
        : { data: [], error: null },
    ]);

    const coverByAlbumId = new Map(
      ((albumsRes.data ?? []) as unknown as Array<{ id: string; cover_path: string | null }>).map(
        (a) => [a.id, a.cover_path],
      ),
    );
    const nameByCreatorId = new Map(
      ((profilesRes.data ?? []) as unknown as Array<{ creator_id: string; stage_name: string }>).map(
        (p) => [p.creator_id, p.stage_name],
      ),
    );

    return filtered.map((c) => ({
      trackId: c.tracks.id,
      trackTitle: c.tracks.title,
      albumId: c.tracks.album_id,
      coverUrl: c.tracks.album_id ? (coverByAlbumId.get(c.tracks.album_id) ?? null) : null,
      mainArtistName: nameByCreatorId.get(c.tracks.creator_id) ?? "",
      mainArtistCreatorId: c.tracks.creator_id,
      creditRole: c.role as TrackCreditRole,
    }));
  }

  async softDeleteTrack(trackId: string, userId: string): Promise<void> {
    const { data, error } = await this.client
      .from("tracks")
      .update({ deleted_at: new Date().toISOString(), updated_by: userId })
      .eq("id", trackId)
      .in("publication_status", ["draft", "rejected"])
      .select("id")
      .maybeSingle();

    if (error) throw error;
    if (!data) throw new Error("Impossible de supprimer ce morceau.");
  }

  async softDeleteAlbum(albumId: string, userId: string): Promise<void> {
    const { data, error } = await this.client
      .from("albums")
      .update({ deleted_at: new Date().toISOString(), updated_by: userId })
      .eq("id", albumId)
      .in("publication_status", ["draft", "rejected"])
      .select("id")
      .maybeSingle();

    if (error) throw error;
    if (!data) throw new Error("Impossible de supprimer cette sortie.");

    await this.client
      .from("tracks")
      .update({ deleted_at: new Date().toISOString(), updated_by: userId })
      .eq("album_id", albumId)
      .in("publication_status", ["draft", "rejected"]);
  }

  buildSlug(title: string, suffix: string): string {
    const base = slugify(title);
    return `${base || "release"}-${suffix.slice(0, 8)}-${Date.now().toString(36)}`;
  }
}
