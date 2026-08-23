import { describe, expect, it, vi } from "vitest";
import type { SonafrikSupabaseClient } from "@sonafrik/database";
import { ListenerDiscoveryRepository } from "./listener.discovery.repository";

function mockChain(result: { data: unknown; error: unknown }) {
  const chain: {
    select: ReturnType<typeof vi.fn>;
    eq: ReturnType<typeof vi.fn>;
    is: ReturnType<typeof vi.fn>;
    order: ReturnType<typeof vi.fn>;
    limit: ReturnType<typeof vi.fn>;
    maybeSingle: ReturnType<typeof vi.fn>;
    gte: ReturnType<typeof vi.fn>;
    in: ReturnType<typeof vi.fn>;
  } = {
    select: vi.fn(() => chain),
    eq: vi.fn(() => chain),
    is: vi.fn(() => chain),
    order: vi.fn(() => chain),
    gte: vi.fn(() => chain),
    in: vi.fn(() => chain),
    limit: vi.fn(() => Promise.resolve(result)),
    maybeSingle: vi.fn(() => Promise.resolve(result)),
  };
  return chain;
}

function createMockClient(overrides: Partial<SonafrikSupabaseClient> = {}): SonafrikSupabaseClient {
  const rpc = vi.fn();
  const chain = mockChain({ data: [], error: null });
  const from = vi.fn().mockReturnValue(chain);
  return { rpc, from, ...overrides } as unknown as SonafrikSupabaseClient;
}

const sampleDiscoveryTrack = {
  track_id: "t1",
  title: "Track One",
  slug: "track-one",
  duration_seconds: 180,
  artist_name: "Artist",
  creator_id: "c1",
  album_id: "a1",
  album_title: "Album",
  cover_path: "cover.jpg",
  stream_count: 42,
};

const sampleTrendingTrack = {
  track_id: "t1",
  title: "Track One",
  slug: "track-one",
  duration_seconds: 180,
  artist_name: "Artist",
  creator_id: "c1",
  album_id: "a1",
  album_title: "Album",
  cover_path: "cover.jpg",
  listen_count: 100,
  unique_listeners: 50,
  trending_score: 10,
};

describe("ListenerDiscoveryRepository", () => {
  it("getLatestPublishedTracks extrait les pistes du payload RPC", async () => {
    const client = createMockClient({
      rpc: vi.fn().mockResolvedValue({
        data: { tracks: [sampleDiscoveryTrack] },
        error: null,
      }),
    });
    const repo = new ListenerDiscoveryRepository(client);
    const result = await repo.getLatestPublishedTracks(10);
    expect(client.rpc).toHaveBeenCalledWith("get_new_releases", {
      p_type: "track",
      p_days: 3650,
      p_limit: 10,
    });
    expect(result).toHaveLength(1);
    expect(result[0]?.track_id).toBe("t1");
  });

  it("getLatestPublishedTracks retourne un tableau vide si le payload est null", async () => {
    const client = createMockClient({
      rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
    });
    const repo = new ListenerDiscoveryRepository(client);
    const result = await repo.getLatestPublishedTracks();
    expect(result).toEqual([]);
  });

  it("getTopGuineaTracks retourne les tracks et le period quand le RPC en fournit", async () => {
    const client = createMockClient({
      rpc: vi.fn().mockResolvedValue({
        data: {
          period: "7d",
          period_label: "Cette semaine",
          tracks: [sampleTrendingTrack],
        },
        error: null,
      }),
    });
    const repo = new ListenerDiscoveryRepository(client);
    const result = await repo.getTopGuineaTracks(10);
    expect(result.period).toBe("7d");
    expect(result.periodLabel).toBe("Cette semaine");
    expect(result.tracks).toHaveLength(1);
    expect(result.tracks[0]?.listen_count).toBe(100);
  });

  it("getTopGuineaTracks tombe en fallback nouveautés quand le RPC retourne un feed vide", async () => {
    const rpc = vi
      .fn()
      .mockResolvedValueOnce({
        data: { period: "all", period_label: "Toutes périodes", tracks: [] },
        error: null,
      })
      .mockResolvedValueOnce({
        data: { tracks: [sampleDiscoveryTrack] },
        error: null,
      });
    const client = createMockClient({ rpc });
    const repo = new ListenerDiscoveryRepository(client);
    const result = await repo.getTopGuineaTracks(10);
    expect(result.periodLabel).toBe("Nouveautés");
    expect(result.tracks[0]?.listen_count).toBe(42);
  });

  it("getHomepageCurated aggrège playlists, artistes et genres", async () => {
    const chain = mockChain({ data: [], error: null });
    const from = vi.fn().mockReturnValue(chain);
    const client = createMockClient({ from });
    const repo = new ListenerDiscoveryRepository(client);

    // On remplace .limit() par une résolution différente selon la table
    chain.limit
      .mockResolvedValueOnce({
        data: [{ id: "p1", title: "Playlist", track_count: 5 }],
        error: null,
      })
      .mockResolvedValueOnce({
        data: [{ creator_id: "c1", stage_name: "Artist", genres: ["rap"] }],
        error: null,
      })
      .mockResolvedValueOnce({
        data: [{ id: "g1", name: "Rap" }],
        error: null,
      });

    const result = await repo.getHomepageCurated(8);
    expect(from).toHaveBeenCalledWith("playlists");
    expect(from).toHaveBeenCalledWith("artist_profiles");
    expect(from).toHaveBeenCalledWith("genres");
    expect(result.playlists).toHaveLength(1);
    expect(result.artists).toHaveLength(1);
    expect(result.genres).toHaveLength(1);
  });

  it("getDiscoverModeTracks filtre les morceaux déjà écoutés", async () => {
    const from = vi.fn();
    const sessionsChain = mockChain({
      data: [{ track_id: "t1" }],
      error: null,
    });
    const newReleasesChain = mockChain({
      data: null,
      error: null,
    });
    from
      .mockReturnValueOnce(sessionsChain)
      .mockReturnValueOnce(newReleasesChain);
    const rpc = vi.fn().mockResolvedValue({
      data: {
        tracks: [
          { ...sampleDiscoveryTrack, track_id: "t1" },
          { ...sampleDiscoveryTrack, track_id: "t2", title: "Track Two" },
        ],
      },
      error: null,
    });
    const client = createMockClient({ rpc, from });
    const repo = new ListenerDiscoveryRepository(client);
    const result = await repo.getDiscoverModeTracks("u1", 20);
    expect(from).toHaveBeenCalledWith("stream_sessions");
    expect(rpc).toHaveBeenCalledWith("get_new_releases", {
      p_type: "track",
      p_days: 90,
      p_limit: 60,
    });
    expect(result).toHaveLength(1);
    expect(result[0]?.track_id).toBe("t2");
  });

  it("getTrendingArtistsMixed mappe les champs du RPC", async () => {
    const client = createMockClient({
      rpc: vi.fn().mockResolvedValue({
        data: [
          {
            creator_id: "c1",
            stage_name: "Artist",
            slug: "artist",
            cover_path: "cover.jpg",
            verified: true,
            listen_count: 1000,
            genre_primary: "rap",
            bio_short: "Bio",
            first_track_id: "t1",
            first_track_slug: "track-one",
          },
        ],
        error: null,
      }),
    });
    const repo = new ListenerDiscoveryRepository(client);
    const result = await repo.getTrendingArtistsMixed(20);
    expect(result).toHaveLength(1);
    expect(result[0]?.content_type).toBe("artist");
    expect(result[0]?.verified).toBe(true);
    expect(result[0]?.listen_count).toBe(1000);
  });

  it("getHeroFeaturedAlbums mappe les champs du RPC", async () => {
    const client = createMockClient({
      rpc: vi.fn().mockResolvedValue({
        data: [
          {
            album_id: "a1",
            album_title: "Album",
            release_type: "album",
            release_date: "2026-08-01",
            cover_path: "cover.jpg",
            creator_id: "c1",
            stage_name: "Artist",
            artist_slug: "artist",
            genre_primary: "rap",
            verified: false,
            bio_short: "Bio",
          },
        ],
        error: null,
      }),
    });
    const repo = new ListenerDiscoveryRepository(client);
    const result = await repo.getHeroFeaturedAlbums(30, 6);
    expect(client.rpc).toHaveBeenCalledWith("get_hero_featured_albums", {
      p_days: 30,
      p_limit: 6,
    });
    expect(result).toHaveLength(1);
    expect(result[0]?.content_type).toBe("album");
    expect(result[0]?.album_title).toBe("Album");
  });

  it("getRecommendedTracks mappe les champs du RPC", async () => {
    const client = createMockClient({
      rpc: vi.fn().mockResolvedValue({
        data: [
          {
            track_id: "t1",
            title: "Track",
            slug: "track",
            duration_seconds: 180,
            artist_name: "Artist",
            creator_id: "c1",
            album_id: "a1",
            album_title: "Album",
            cover_path: "cover.jpg",
            recommendation_score: 99,
            reason: "trending",
          },
        ],
        error: null,
      }),
    });
    const repo = new ListenerDiscoveryRepository(client);
    const result = await repo.getRecommendedTracks(20);
    expect(client.rpc).toHaveBeenCalledWith("get_recommended_tracks_mvp", {
      p_limit: 20,
    });
    expect(result).toHaveLength(1);
    expect(result[0]?.recommendation_score).toBe(99);
    expect(result[0]?.reason).toBe("trending");
  });

  it("propage les erreurs Supabase", async () => {
    const client = createMockClient({
      rpc: vi.fn().mockResolvedValue({ data: null, error: { message: "boom" } }),
    });
    const repo = new ListenerDiscoveryRepository(client);
    await expect(repo.getLatestPublishedTracks()).rejects.toEqual({ message: "boom" });
  });
});
