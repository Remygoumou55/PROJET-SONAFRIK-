import type { SonafrikSupabaseClient } from "@sonafrik/database";
import type { DiscoveryTrack, ListenMusicCategory, RecentlyPlayedTrack, TrackCredit, TrackListenCounts, TrackWithMeta, TrendingTrack } from "@sonafrik/types";
import {
  type CreatorGeoProfile,
  filterDiscoveryTracksByCategory,
  filterTrendingTracksByCategory,
} from "./category-filter";
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

  async getTopGuineaTracks(limit = 10): Promise<TrendingTrack[]> {
    const windows = ["7d", "30d"] as const;
    for (const window of windows) {
      const { data, error } = await this.client.rpc("get_trending_tracks", {
        p_window: window,
        p_limit: limit,
      });
      if (error) throw error;
      const tracks = (data as unknown as TrendingTrack[] | null) ?? [];
      if (tracks.length > 0) return tracks;
    }

    const latest = await this.getLatestPublishedTracks(limit);
    return latest.map((track) => ({
      track_id: track.track_id,
      title: track.title,
      slug: track.slug,
      duration_seconds: track.duration_seconds,
      artist_name: track.artist_name,
      creator_id: track.creator_id,
      album_id: track.album_id,
      album_title: track.album_title,
      cover_path: track.cover_path,
      listen_count: track.stream_count,
      unique_listeners: 0,
      trending_score: 0,
    }));
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
}
