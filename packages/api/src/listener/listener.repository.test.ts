import { describe, expect, it, vi } from "vitest";
import type { SonafrikSupabaseClient } from "@sonafrik/database";
import { ListenerRepository } from "./listener.repository";
import { ListenerDiscoveryRepository } from "./listener.discovery.repository";
import { ListenerTrackRepository } from "./listener.track.repository";
import { ListenerArtistRepository } from "./listener.artist.repository";

describe("ListenerRepository", () => {
  it("délègue getLatestPublishedTracks à discovery", async () => {
    const client = {} as SonafrikSupabaseClient;
    const repo = new ListenerRepository(client);
    const typedRepo = repo as unknown as { discovery: ListenerDiscoveryRepository };
    typedRepo.discovery.getLatestPublishedTracks = vi.fn().mockResolvedValue([{ track_id: "t1" }]);
    const result = await repo.getLatestPublishedTracks(10);
    expect(typedRepo.discovery.getLatestPublishedTracks).toHaveBeenCalledWith(10);
    expect(result).toHaveLength(1);
  });

  it("délègue getTrackListenCounts à track", async () => {
    const client = {} as SonafrikSupabaseClient;
    const repo = new ListenerRepository(client);
    const typedRepo = repo as unknown as { track: ListenerTrackRepository };
    typedRepo.track.getTrackListenCounts = vi.fn().mockResolvedValue({ track_id: "t1", all_time: 10 });
    const result = await repo.getTrackListenCounts("t1");
    expect(typedRepo.track.getTrackListenCounts).toHaveBeenCalledWith("t1");
    expect(result.all_time).toBe(10);
  });

  it("délègue getPublicArtistProfile à artist", async () => {
    const client = {} as SonafrikSupabaseClient;
    const repo = new ListenerRepository(client);
    const typedRepo = repo as unknown as { artist: ListenerArtistRepository };
    typedRepo.artist.getPublicArtistProfile = vi.fn().mockResolvedValue({ creator_id: "c1", stage_name: "Artist" });
    const result = await repo.getPublicArtistProfile("c1");
    expect(typedRepo.artist.getPublicArtistProfile).toHaveBeenCalledWith("c1");
    expect(result?.stage_name).toBe("Artist");
  });
});
