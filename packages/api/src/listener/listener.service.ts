import type { SonafrikSupabaseClient } from "@sonafrik/database";
import type { ListenMusicCategory } from "@sonafrik/types";
import { AdminConfigRepository } from "../admin/admin.config.repository";
import { ListenerRepository } from "./listener.repository";
import type {
  ListenerAlbumDetail,
  ListenerAlbumMeta,
  ListenerArtistProfile,
  ListenerArtistRelease,
  ListenerHomepageCurated,
  ListenerPlaylistTrackRow,
} from "./types";

export class ListenerService {
  private readonly repository: ListenerRepository;
  private readonly featureFlags: AdminConfigRepository;

  constructor(client: SonafrikSupabaseClient) {
    this.repository = new ListenerRepository(client);
    this.featureFlags = new AdminConfigRepository(client);
  }

  getHomepageCurated(limit?: number): Promise<ListenerHomepageCurated> {
    return this.repository.getHomepageCurated(limit);
  }

  getLatestPublishedTracks(limit?: number) {
    return this.repository.getLatestPublishedTracks(limit);
  }

  getTopGuineaTracks(limit?: number) {
    return this.repository.getTopGuineaTracks(limit);
  }

  filterDiscoveryByCategory(tracks: Parameters<ListenerRepository["filterDiscoveryByCategory"]>[0], category: ListenMusicCategory) {
    return this.repository.filterDiscoveryByCategory(tracks, category);
  }

  filterTrendingByCategory(tracks: Parameters<ListenerRepository["filterTrendingByCategory"]>[0], category: ListenMusicCategory) {
    return this.repository.filterTrendingByCategory(tracks, category);
  }

  getCreatorGeoMap(creatorIds: string[]) {
    return this.repository.getCreatorGeoMap(creatorIds);
  }

  getRecentlyPlayed(userId: string, limit?: number) {
    return this.repository.getRecentlyPlayed(userId, limit);
  }

  getSidebarCounts(userId: string) {
    return this.repository.getSidebarCounts(userId);
  }

  getPublishedAlbumMeta(albumId: string): Promise<ListenerAlbumMeta | null> {
    return this.repository.getPublishedAlbumMeta(albumId);
  }

  getPublishedAlbumDetail(albumId: string): Promise<ListenerAlbumDetail | null> {
    return this.repository.getPublishedAlbumDetail(albumId);
  }

  getPublishedAlbumTracks(
    albumId: string,
    artistName: string | null,
    coverUrl: string | null,
  ) {
    return this.repository.getPublishedAlbumTracks(albumId, artistName, coverUrl);
  }

  getTrackCreditsForTracks(trackIds: string[]) {
    return this.repository.getTrackCreditsForTracks(trackIds);
  }

  getPublicArtistProfile(creatorId: string): Promise<ListenerArtistProfile | null> {
    return this.repository.getPublicArtistProfile(creatorId);
  }

  getPublishedAlbumsForArtist(creatorId: string, limit?: number): Promise<ListenerArtistRelease[]> {
    return this.repository.getPublishedAlbumsForArtist(creatorId, limit);
  }

  getPublishedTracksForArtist(
    creatorId: string,
    artistName: string,
    albumCovers: Map<string, string | null>,
    limit?: number,
  ) {
    return this.repository.getPublishedTracksForArtist(creatorId, artistName, albumCovers, limit);
  }

  getPlaylistTracksForPage(playlistId: string): Promise<ListenerPlaylistTrackRow[]> {
    return this.repository.getPlaylistTracksForPage(playlistId);
  }

  isFeatureEnabled(name: string): Promise<boolean> {
    return this.featureFlags.isFeatureEnabled(name);
  }
}

export function createListenerService(client: SonafrikSupabaseClient): ListenerService {
  return new ListenerService(client);
}

export type { ListenerHomepageCurated, ListenerAlbumDetail, ListenerArtistProfile } from "./types";
