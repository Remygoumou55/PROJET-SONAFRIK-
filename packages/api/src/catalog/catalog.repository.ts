import type { SonafrikSupabaseClient } from "@sonafrik/database";
import type { Json } from "@sonafrik/database/types";
import type { Album, Genre, Track, TrackFile } from "@sonafrik/types";

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

  async getGenres(): Promise<Genre[]> {
    const { data, error } = await this.client
      .from("genres")
      .select("*")
      .eq("is_active", true)
      .is("deleted_at", null)
      .order("sort_order");

    if (error) throw error;
    return (data ?? []) as Genre[];
  }

  async listAlbums(creatorId: string): Promise<Album[]> {
    const { data, error } = await this.client
      .from("albums")
      .select("*")
      .eq("creator_id", creatorId)
      .is("deleted_at", null)
      .order("created_at", { ascending: false });

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

  async listTracks(creatorId: string, albumId?: string): Promise<Track[]> {
    let query = this.client
      .from("tracks")
      .select("*")
      .eq("creator_id", creatorId)
      .is("deleted_at", null)
      .order("track_number");

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

  buildSlug(title: string, suffix: string): string {
    const base = slugify(title);
    return `${base || "release"}-${suffix.slice(0, 8)}`;
  }
}
