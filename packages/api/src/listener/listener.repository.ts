import type { SonafrikSupabaseClient } from "@sonafrik/database";
import type { TrackCredit, TrackWithMeta } from "@sonafrik/types";
import type {
  ListenerAlbumDetail,
  ListenerAlbumMeta,
  ListenerArtistProfile,
  ListenerArtistRelease,
  ListenerHomepageCurated,
  ListenerPlaylistTrackRow,
} from "./types";

export class ListenerRepository {
  constructor(private readonly client: SonafrikSupabaseClient) {}

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
      .select("title, artist_profiles(stage_name)")
      .eq("id", albumId)
      .maybeSingle();
    if (error) throw error;
    if (!data) return null;
    const row = data as unknown as { title: string; artist_profiles: { stage_name: string } | null };
    return { title: row.title, artistName: row.artist_profiles?.stage_name ?? null };
  }

  async getPublishedAlbumDetail(albumId: string): Promise<ListenerAlbumDetail | null> {
    const { data, error } = await this.client
      .from("albums")
      .select("id, title, description, cover_path, release_type, release_date, creator_id, artist_profiles(stage_name, creator_id)")
      .eq("id", albumId)
      .eq("publication_status", "published")
      .is("deleted_at", null)
      .maybeSingle();
    if (error) throw error;
    if (!data) return null;

    const raw = data as unknown as Record<string, unknown>;
    const ap = raw.artist_profiles as { stage_name?: string; creator_id?: string } | null;
    return {
      id: String(raw.id ?? ""),
      title: String(raw.title ?? ""),
      description: (raw.description as string | null) ?? null,
      cover_url: (raw.cover_path as string | null) ?? null,
      release_type: String(raw.release_type ?? "album"),
      release_date: (raw.release_date as string | null) ?? null,
      creator_id: String(raw.creator_id ?? ""),
      artist_name: ap?.stage_name ?? null,
      artist_creator_id: ap?.creator_id ?? String(raw.creator_id ?? ""),
    };
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
    return (data ?? []) as TrackCredit[];
  }

  async getPublicArtistProfile(creatorId: string): Promise<ListenerArtistProfile | null> {
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

  async getPlaylistTracksForPage(playlistId: string): Promise<ListenerPlaylistTrackRow[]> {
    const { data, error } = await this.client
      .from("playlist_tracks")
      .select("track_id, position, added_at, added_by, track:tracks(id, title, duration_seconds, creator_id, album_id)")
      .eq("playlist_id", playlistId)
      .order("position");
    if (error) throw error;
    return (data ?? []) as unknown as ListenerPlaylistTrackRow[];
  }
}
