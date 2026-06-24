import type { SonafrikSupabaseClient } from "@sonafrik/database";
import type {
  DiscoveryAlbum,
  DiscoveryArtist,
  DiscoveryTrack,
  NewReleasesResult,
} from "@sonafrik/types";

export class DiscoveryRepository {
  constructor(private readonly client: SonafrikSupabaseClient) {}

  async getDiscoveryFeed(limit: number): Promise<DiscoveryTrack[]> {
    const { data, error } = await this.client.rpc("get_discovery_feed", {
      p_limit: limit,
    });
    if (error) throw error;
    return (data as unknown as DiscoveryTrack[]) ?? [];
  }

  async getNewReleases(type: string, days: number, limit: number): Promise<NewReleasesResult> {
    const { data, error } = await this.client.rpc("get_new_releases", {
      p_type: type,
      p_days: days,
      p_limit: limit,
    });
    if (error) throw error;
    const result = data as unknown as NewReleasesResult;
    return {
      tracks: result?.tracks ?? [],
      albums: result?.albums ?? [],
      artists: result?.artists ?? [],
    };
  }

  async getSuggestedArtists(limit: number): Promise<DiscoveryArtist[]> {
    const { data, error } = await this.client.rpc("get_suggested_artists", {
      p_limit: limit,
    });
    if (error) throw error;
    return (data as unknown as DiscoveryArtist[]) ?? [];
  }

  async getSuggestedAlbums(limit: number): Promise<DiscoveryAlbum[]> {
    const { data, error } = await this.client.rpc("get_suggested_albums", {
      p_limit: limit,
    });
    if (error) throw error;
    return (data as unknown as DiscoveryAlbum[]) ?? [];
  }
}
