import { describe, expect, it, vi } from "vitest";
import type { SonafrikSupabaseClient } from "@sonafrik/database";
import { ListenerArtistRepository } from "./listener.artist.repository";

function mockChain(result: { data: unknown; error: unknown; count?: number }) {
  const chain: any = {};
  for (const m of ["select", "eq", "is", "order", "in", "gte"]) {
    chain[m] = vi.fn(() => chain);
  }
  chain.limit = vi.fn(() => chain);
  chain.maybeSingle = vi.fn(() => chain);
  chain.then = (resolve: (v: any) => void) => resolve(result);
  return chain;
}

function createMockClient(overrides: Partial<SonafrikSupabaseClient> = {}): SonafrikSupabaseClient {
  const chain = mockChain({ data: [], error: null });
  const from = vi.fn().mockReturnValue(chain);
  const rpc = vi.fn();
  return { from, rpc, ...overrides } as unknown as SonafrikSupabaseClient;
}

describe("ListenerArtistRepository", () => {
  it("getPublicArtistProfile retourne le profil via RPC", async () => {
    const client = createMockClient({
      rpc: vi.fn().mockResolvedValue({
        data: {
          creator_id: "c1",
          stage_name: "Artist",
          bio: "Bio",
          genres: ["rap"],
          cover_path: "cover.jpg",
          banner_path: "banner.jpg",
          verified: true,
        },
        error: null,
      }),
    });
    const repo = new ListenerArtistRepository(client);
    const result = await repo.getPublicArtistProfile("c1");
    expect(result).not.toBeNull();
    expect(result?.stage_name).toBe("Artist");
    expect(result?.verified).toBe(true);
  });

  it("getPublicArtistProfile fallback sur artist_profiles si le RPC ne retourne rien", async () => {
    const chain = mockChain({
      data: {
        creator_id: "c1",
        stage_name: "Artist 2",
        bio: null,
        genres: [],
        cover_path: null,
        banner_path: null,
        verified: false,
        is_public: true,
      },
      error: null,
    });
    const from = vi.fn().mockImplementation((table: string) =>
      table === "artist_profiles" ? chain : mockChain({ data: [], error: null }),
    );
    const client = createMockClient({ from, rpc: vi.fn().mockResolvedValue({ data: null, error: null }) });
    const repo = new ListenerArtistRepository(client);
    const result = await repo.getPublicArtistProfile("c1");
    expect(result).not.toBeNull();
    expect(result?.stage_name).toBe("Artist 2");
  });

  it("getPublishedAlbumsForArtist mappe les albums", async () => {
    const chain = mockChain({
      data: [
        { id: "a1", title: "Album", release_type: "album", cover_path: "cover.jpg", release_date: "2026-08-01" },
      ],
      error: null,
    });
    const client = createMockClient({ from: vi.fn().mockImplementation((table: string) =>
      table === "albums" ? chain : mockChain({ data: [], error: null }),
    ) });
    const repo = new ListenerArtistRepository(client);
    const result = await repo.getPublishedAlbumsForArtist("c1");
    expect(result).toHaveLength(1);
    expect(result[0]?.title).toBe("Album");
  });

  it("getPublishedTracksForArtist mappe les morceaux avec cover d'album", async () => {
    const chain = mockChain({
      data: [
        { id: "t1", title: "Track", duration_seconds: 180, track_number: 1, creator_id: "c1", publication_status: "published", album_id: "a1" },
      ],
      error: null,
    });
    const client = createMockClient({ from: vi.fn().mockImplementation((table: string) =>
      table === "tracks" ? chain : mockChain({ data: [], error: null }),
    ) });
    const repo = new ListenerArtistRepository(client);
    const result = await repo.getPublishedTracksForArtist("c1", "Artist", new Map([["a1", "cover.jpg"]]));
    expect(result).toHaveLength(1);
    expect(result[0]?.cover_url).toBe("cover.jpg");
    expect(result[0]?.artist_name).toBe("Artist");
  });

  it("getArtistPublicStats calcule followers et streams", async () => {
    const followChain = mockChain({ data: [], error: null, count: 42 });
    const tracksChain = mockChain({
      data: [
        { play_count: 10 },
        { play_count: 20 },
      ],
      error: null,
    });
    const from = vi.fn().mockImplementation((table: string) =>
      table === "follows" ? followChain : tracksChain,
    );
    const client = createMockClient({ from });
    const repo = new ListenerArtistRepository(client);
    const result = await repo.getArtistPublicStats("c1");
    expect(result.follower_count).toBe(42);
    expect(result.track_count).toBe(2);
    expect(result.total_streams).toBe(30);
  });

  it("getCreatorGeoMap retourne une map par owner_id", async () => {
    const creatorsChain = mockChain({
      data: [{ id: "c1", owner_id: "u1" }],
      error: null,
    });
    const profilesChain = mockChain({
      data: [{ id: "u1", country_code: "GN", origin_region: "Conakry" }],
      error: null,
    });
    const from = vi.fn().mockImplementation((table: string) =>
      table === "creators" ? creatorsChain : profilesChain,
    );
    const client = createMockClient({ from });
    const repo = new ListenerArtistRepository(client);
    const result = await repo.getCreatorGeoMap(["c1"]);
    expect(result.get("c1")?.countryCode).toBe("GN");
  });

  it("filterDiscoveryByCategory filtre via geoMap", async () => {
    const creatorsChain = mockChain({
      data: [{ id: "c1", owner_id: "u1" }],
      error: null,
    });
    const profilesChain = mockChain({
      data: [{ id: "u1", country_code: "GN", origin_region: "Conakry" }],
      error: null,
    });
    const from = vi.fn().mockImplementation((table: string) =>
      table === "creators" ? creatorsChain : profilesChain,
    );
    const client = createMockClient({ from });
    const repo = new ListenerArtistRepository(client);
    const tracks = [
      { creator_id: "c1", track_id: "t1", title: "Track", is_from_guinea: false },
    ] as unknown as Parameters<ListenerArtistRepository["filterDiscoveryByCategory"]>[0];
    const result = await repo.filterDiscoveryByCategory(tracks, "guinea");
    expect(result).toHaveLength(1);
  });
});
