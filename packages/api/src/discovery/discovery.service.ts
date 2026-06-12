import type { SonafrikSupabaseClient } from "@sonafrik/database";
import type {
  DiscoveryAlbum,
  DiscoveryArtist,
  DiscoveryTrack,
  NewReleasesResult,
} from "@sonafrik/types";
import { DiscoveryError } from "./errors";
import { DiscoveryRepository } from "./discovery.repository";
import {
  discoveryFeedSchema,
  newReleasesSchema,
  suggestedArtistsSchema,
  suggestedAlbumsSchema,
  type DiscoveryFeedInput,
  type NewReleasesInput,
  type SuggestedArtistsInput,
  type SuggestedAlbumsInput,
} from "./schemas";

export class DiscoveryService {
  private readonly repository: DiscoveryRepository;

  constructor(private readonly client: SonafrikSupabaseClient) {
    this.repository = new DiscoveryRepository(client);
  }

  async getDiscoveryFeed(input: DiscoveryFeedInput): Promise<DiscoveryTrack[]> {
    const parsed = discoveryFeedSchema.safeParse(input);
    if (!parsed.success) throw new DiscoveryError("discovery_feed_failed");
    try {
      return await this.repository.getDiscoveryFeed(parsed.data.limit);
    } catch {
      throw new DiscoveryError("discovery_feed_failed");
    }
  }

  async getNewReleases(input: NewReleasesInput): Promise<NewReleasesResult> {
    const parsed = newReleasesSchema.safeParse(input);
    if (!parsed.success) throw new DiscoveryError("new_releases_failed");
    try {
      return await this.repository.getNewReleases(
        parsed.data.type,
        parsed.data.days,
        parsed.data.limit,
      );
    } catch {
      throw new DiscoveryError("new_releases_failed");
    }
  }

  async getSuggestedArtists(input: SuggestedArtistsInput): Promise<DiscoveryArtist[]> {
    const parsed = suggestedArtistsSchema.safeParse(input);
    if (!parsed.success) throw new DiscoveryError("suggested_artists_failed");
    try {
      return await this.repository.getSuggestedArtists(parsed.data.limit);
    } catch {
      throw new DiscoveryError("suggested_artists_failed");
    }
  }

  async getSuggestedAlbums(input: SuggestedAlbumsInput): Promise<DiscoveryAlbum[]> {
    const parsed = suggestedAlbumsSchema.safeParse(input);
    if (!parsed.success) throw new DiscoveryError("suggested_albums_failed");
    try {
      return await this.repository.getSuggestedAlbums(parsed.data.limit);
    } catch {
      throw new DiscoveryError("suggested_albums_failed");
    }
  }
}

export function createDiscoveryService(client: SonafrikSupabaseClient): DiscoveryService {
  return new DiscoveryService(client);
}
