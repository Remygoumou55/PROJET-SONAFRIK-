import type { SonafrikSupabaseClient } from "@sonafrik/database";
import type {
  DiscoveryArtist,
  DiscoveryTrack,
  NewReleasesResult,
} from "@sonafrik/types";

export class DiscoveryRepository {
  constructor(private readonly client: SonafrikSupabaseClient) {}

  async getDiscoveryFeed(limit: number): Promise<DiscoveryTrack[]> {
    const { data, error } = await this.client.rpc("get_discovery_feed" as never, {
      p_limit: limit,
    } as never);
    if (error) throw error;
    return (data as DiscoveryTrack[]) ?? [];
  }

  async getNewReleases(type: string, days: number, limit: number): Promise<NewReleasesResult> {
    const { data, error } = await this.client.rpc("get_new_releases" as never, {
      p_type: type,
      p_days: days,
      p_limit: limit,
    } as never);
    if (error) throw error;
    const result = data as NewReleasesResult;
    return {
      tracks: result?.tracks ?? [],
      albums: result?.albums ?? [],
      artists: result?.artists ?? [],
    };
  }

  async getSuggestedArtists(limit: number): Promise<DiscoveryArtist[]> {
    const { data, error } = await this.client.rpc("get_suggested_artists" as never, {
      p_limit: limit,
    } as never);
    if (error) throw error;
    return (data as DiscoveryArtist[]) ?? [];
  }

  async getSuggestedAlbums(limit: number): Promise<import("@sonafrik/types").DiscoveryAlbum[]> {
    const { data, error } = await this.client.rpc("get_suggested_albums" as never, {
      p_limit: limit,
    } as never);
    if (error) throw error;
    return (data as import("@sonafrik/types").DiscoveryAlbum[]) ?? [];
  }
}
