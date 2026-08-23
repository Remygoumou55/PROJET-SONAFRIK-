import { describe, expect, it, vi } from "vitest";
import type { SonafrikSupabaseClient } from "@sonafrik/database";
import { ListenerTrackRepository } from "./listener.track.repository";

function mockChain(result: { data: unknown; error: unknown; count?: number }) {
  const chain: Record<string, (...args: unknown[]) => unknown> = {};
  for (const m of ["select", "eq", "is", "order", "in", "gte"]) {
    chain[m] = () => chain as unknown;
  }
  chain.limit = () => chain as unknown;
  chain.maybeSingle = () => chain as unknown;
  chain.then = (resolve: unknown) => {
    (resolve as (value: unknown) => void)(result);
    return undefined as unknown;
  };
  return chain as unknown;
}

function createMockClient(overrides: Partial<SonafrikSupabaseClient> = {}): SonafrikSupabaseClient {
  const chain = mockChain({ data: [], error: null });
  const from = vi.fn().mockReturnValue(chain);
  const rpc = vi.fn();
  return { from, rpc, ...overrides } as unknown as SonafrikSupabaseClient;
}

describe("ListenerTrackRepository", () => {
  it("getTrackListenCounts extrait les compteurs du RPC", async () => {
    const client = createMockClient({
      rpc: vi.fn().mockResolvedValue({
        data: {
          track_id: "t1",
          all_time: 100,
          window_7d: 10,
          window_30d: 30,
          unique_listeners_all_time: 5,
        },
        error: null,
      }),
    });
    const repo = new ListenerTrackRepository(client);
    const result = await repo.getTrackListenCounts("t1");
    expect(result.all_time).toBe(100);
    expect(result.window_7d).toBe(10);
    expect(result.unique_listeners_all_time).toBe(5);
  });

  it("getPublishedAlbumMeta retourne null si l'album n'existe pas", async () => {
    const chain = mockChain({ data: null, error: null });
    const client = createMockClient({ from: vi.fn().mockReturnValue(chain) });
    const repo = new ListenerTrackRepository(client);
    const result = await repo.getPublishedAlbumMeta("a1");
    expect(result).toBeNull();
  });

  it("getPublishedAlbumDetail mappe les champs", async () => {
    const chain = mockChain({
      data: {
        id: "a1",
        title: "Album",
        description: "Desc",
        cover_path: "cover.jpg",
        release_type: "album",
        release_date: "2026-08-01",
        creator_id: "c1",
      },
      error: null,
    });
    const artistChain = mockChain({ data: [], error: null });
    const from = vi.fn().mockImplementation((table: string) =>
      table === "albums" ? chain : artistChain,
    );
    const client = createMockClient({ from });
    const repo = new ListenerTrackRepository(client);
    const result = await repo.getPublishedAlbumDetail("a1");
    expect(result).not.toBeNull();
    expect(result?.title).toBe("Album");
    expect(result?.artist_name).toBeNull();
  });

  it("getPublishedTrackById retourne null si le track n'existe pas", async () => {
    const chain = mockChain({ data: null, error: null });
    const client = createMockClient({ from: vi.fn().mockReturnValue(chain) });
    const repo = new ListenerTrackRepository(client);
    const result = await repo.getPublishedTrackById("t1");
    expect(result).toBeNull();
  });

  it("getPublishedAlbumTracks mappe les pistes avec cover et artiste", async () => {
    const chain = mockChain({
      data: [
        { id: "t1", title: "Track", duration_seconds: 180, track_number: 1, creator_id: "c1", publication_status: "published" },
      ],
      error: null,
    });
    const client = createMockClient({ from: vi.fn().mockReturnValue(chain) });
    const repo = new ListenerTrackRepository(client);
    const result = await repo.getPublishedAlbumTracks("a1", "Artist", "cover.jpg");
    expect(result).toHaveLength(1);
    expect(result[0]?.cover_url).toBe("cover.jpg");
    expect(result[0]?.artist_name).toBe("Artist");
  });

  it("getPlaylistTracksForPage retourne les tracks", async () => {
    const chain = mockChain({
      data: [
        {
          track_id: "t1",
          position: 1,
          added_at: "2026-08-01",
          added_by: "u1",
          track: { id: "t1", title: "Track", duration_seconds: 180, creator_id: "c1", album_id: "a1" },
        },
      ],
      error: null,
    });
    const client = createMockClient({ from: vi.fn().mockReturnValue(chain) });
    const repo = new ListenerTrackRepository(client);
    const result = await repo.getPlaylistTracksForPage("p1");
    expect(result).toHaveLength(1);
    expect(result[0]?.track?.title).toBe("Track");
  });

  it("getTrackLyrics retourne un tableau vide si le morceau n'a pas de paroles", async () => {
    const chain = mockChain({ data: null, error: null });
    const client = createMockClient({ from: vi.fn().mockReturnValue(chain) });
    const repo = new ListenerTrackRepository(client);
    const result = await repo.getTrackLyrics("t1");
    expect(result.lines).toEqual([]);
  });

  it("addTrackReaction appelle le RPC", async () => {
    const rpc = vi.fn().mockResolvedValue({ data: null, error: null });
    const client = createMockClient({ rpc });
    const repo = new ListenerTrackRepository(client);
    await repo.addTrackReaction("t1", "🔥");
    expect(rpc).toHaveBeenCalledWith("add_track_reaction", { p_track_id: "t1", p_emoji: "🔥" });
  });
});
