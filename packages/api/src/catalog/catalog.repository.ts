import type { SonafrikSupabaseClient } from "@sonafrik/database";
import type { Json } from "@sonafrik/database/types";
import type { Album, Genre, Track, TrackAppearance, TrackCredit, TrackCreditRole, TrackFile } from "@sonafrik/types";
import type { TrackCreditItem } from "./schemas";

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
      .order("created_at", { ascending: false })
      .limit(200);

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

    const { data, error } = await query.limit(500);
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

  async getTrackCredits(trackId: string): Promise<TrackCredit[]> {
    const { data, error } = await this.client
      .from("track_credits")
      .select("*")
      .eq("track_id", trackId)
      .order("display_order");

    if (error) throw error;
    return (data ?? []) as TrackCredit[];
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
        ? this.client.from("albums").select("id, cover_url").in("id", albumIds)
        : { data: [], error: null },
      mainCreatorIds.length
        ? this.client.from("artist_profiles").select("creator_id, stage_name").in("creator_id", mainCreatorIds)
        : { data: [], error: null },
    ]);

    const coverByAlbumId = new Map(
      ((albumsRes.data ?? []) as unknown as Array<{ id: string; cover_url: string | null }>).map(
        (a) => [a.id, a.cover_url],
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

  buildSlug(title: string, suffix: string): string {
    const base = slugify(title);
    return `${base || "release"}-${suffix.slice(0, 8)}`;
  }
}
