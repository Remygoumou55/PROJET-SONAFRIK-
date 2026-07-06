import type { SonafrikSupabaseClient } from "@sonafrik/database";
import { ListenerArtistRepository } from "./listener.artist.repository";
import { ListenerTrackRepository } from "./listener.track.repository";

/**
 * Thin facade — delegates to ListenerArtistRepository and ListenerTrackRepository.
 * Public API unchanged so listener.service.ts requires no modification.
 */
export class ListenerRepository {
  private readonly artist: ListenerArtistRepository;
  private readonly track: ListenerTrackRepository;

  constructor(client: SonafrikSupabaseClient) {
    this.artist = new ListenerArtistRepository(client);
    this.track = new ListenerTrackRepository(client);
  }

  // ── Track / Album / Discovery ─────────────────────────────────────────────

  getLatestPublishedTracks = (...args: Parameters<ListenerTrackRepository["getLatestPublishedTracks"]>) =>
    this.track.getLatestPublishedTracks(...args);

  getTopGuineaTracks = (...args: Parameters<ListenerTrackRepository["getTopGuineaTracks"]>) =>
    this.track.getTopGuineaTracks(...args);

  getTrackListenCounts = (...args: Parameters<ListenerTrackRepository["getTrackListenCounts"]>) =>
    this.track.getTrackListenCounts(...args);

  getHomepageCurated = (...args: Parameters<ListenerTrackRepository["getHomepageCurated"]>) =>
    this.track.getHomepageCurated(...args);

  getPublishedAlbumMeta = (...args: Parameters<ListenerTrackRepository["getPublishedAlbumMeta"]>) =>
    this.track.getPublishedAlbumMeta(...args);

  getPublishedAlbumDetail = (...args: Parameters<ListenerTrackRepository["getPublishedAlbumDetail"]>) =>
    this.track.getPublishedAlbumDetail(...args);

  getPublishedAlbumTracks = (...args: Parameters<ListenerTrackRepository["getPublishedAlbumTracks"]>) =>
    this.track.getPublishedAlbumTracks(...args);

  getTrackCreditsForTracks = (...args: Parameters<ListenerTrackRepository["getTrackCreditsForTracks"]>) =>
    this.track.getTrackCreditsForTracks(...args);

  getPlaylistTracksForPage = (...args: Parameters<ListenerTrackRepository["getPlaylistTracksForPage"]>) =>
    this.track.getPlaylistTracksForPage(...args);

  getRecentlyPlayed = (...args: Parameters<ListenerTrackRepository["getRecentlyPlayed"]>) =>
    this.track.getRecentlyPlayed(...args);

  getSidebarCounts = (...args: Parameters<ListenerTrackRepository["getSidebarCounts"]>) =>
    this.track.getSidebarCounts(...args);

  getDiscoverModeTracks = (...args: Parameters<ListenerTrackRepository["getDiscoverModeTracks"]>) =>
    this.track.getDiscoverModeTracks(...args);

  getTrackReactionCounts = (...args: Parameters<ListenerTrackRepository["getTrackReactionCounts"]>) =>
    this.track.getTrackReactionCounts(...args);

  getLiveListenerCount = (...args: Parameters<ListenerTrackRepository["getLiveListenerCount"]>) =>
    this.track.getLiveListenerCount(...args);

  addTrackReaction = (...args: Parameters<ListenerTrackRepository["addTrackReaction"]>) =>
    this.track.addTrackReaction(...args);

  getTrackLyrics = (...args: Parameters<ListenerTrackRepository["getTrackLyrics"]>) =>
    this.track.getTrackLyrics(...args);

  // ── Artist Profile / Catalog / Geo ────────────────────────────────────────

  getPublicArtistProfile = (...args: Parameters<ListenerArtistRepository["getPublicArtistProfile"]>) =>
    this.artist.getPublicArtistProfile(...args);

  getPublishedAlbumsForArtist = (...args: Parameters<ListenerArtistRepository["getPublishedAlbumsForArtist"]>) =>
    this.artist.getPublishedAlbumsForArtist(...args);

  getPublishedTracksForArtist = (...args: Parameters<ListenerArtistRepository["getPublishedTracksForArtist"]>) =>
    this.artist.getPublishedTracksForArtist(...args);

  getArtistPublicStats = (...args: Parameters<ListenerArtistRepository["getArtistPublicStats"]>) =>
    this.artist.getArtistPublicStats(...args);

  getPinnedTracksForArtist = (...args: Parameters<ListenerArtistRepository["getPinnedTracksForArtist"]>) =>
    this.artist.getPinnedTracksForArtist(...args);

  getPublishedTracksForArtistSorted = (...args: Parameters<ListenerArtistRepository["getPublishedTracksForArtistSorted"]>) =>
    this.artist.getPublishedTracksForArtistSorted(...args);

  getCreatorGeoMap = (...args: Parameters<ListenerArtistRepository["getCreatorGeoMap"]>) =>
    this.artist.getCreatorGeoMap(...args);

  filterDiscoveryByCategory = (...args: Parameters<ListenerArtistRepository["filterDiscoveryByCategory"]>) =>
    this.artist.filterDiscoveryByCategory(...args);

  filterTrendingByCategory = (...args: Parameters<ListenerArtistRepository["filterTrendingByCategory"]>) =>
    this.artist.filterTrendingByCategory(...args);
}
