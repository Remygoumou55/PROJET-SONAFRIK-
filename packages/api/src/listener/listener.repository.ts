import type { SonafrikSupabaseClient } from "@sonafrik/database";
import { ListenerArtistRepository } from "./listener.artist.repository";
import { ListenerDiscoveryRepository } from "./listener.discovery.repository";
import { ListenerTrackRepository } from "./listener.track.repository";

/**
 * Facade auditeur — délègue aux 3 repositories métier : artiste, track/album, discovery/homepage.
 * L'API publique est inchangée, donc `listener.service.ts` n'est pas modifié.
 */
export class ListenerRepository {
  private readonly artist: ListenerArtistRepository;
  private readonly track: ListenerTrackRepository;
  private readonly discovery: ListenerDiscoveryRepository;

  constructor(client: SonafrikSupabaseClient) {
    this.artist = new ListenerArtistRepository(client);
    this.track = new ListenerTrackRepository(client);
    this.discovery = new ListenerDiscoveryRepository(client);
  }

  // ── Discovery / Homepage ────────────────────────────────────────────────────

  getLatestPublishedTracks = (...args: Parameters<ListenerDiscoveryRepository["getLatestPublishedTracks"]>) =>
    this.discovery.getLatestPublishedTracks(...args);

  getTopGuineaTracks = (...args: Parameters<ListenerDiscoveryRepository["getTopGuineaTracks"]>) =>
    this.discovery.getTopGuineaTracks(...args);

  getHomepageCurated = (...args: Parameters<ListenerDiscoveryRepository["getHomepageCurated"]>) =>
    this.discovery.getHomepageCurated(...args);

  getDiscoverModeTracks = (...args: Parameters<ListenerDiscoveryRepository["getDiscoverModeTracks"]>) =>
    this.discovery.getDiscoverModeTracks(...args);

  getTrendingArtistsMixed = (...args: Parameters<ListenerDiscoveryRepository["getTrendingArtistsMixed"]>) =>
    this.discovery.getTrendingArtistsMixed(...args);

  getHeroFeaturedAlbums = (...args: Parameters<ListenerDiscoveryRepository["getHeroFeaturedAlbums"]>) =>
    this.discovery.getHeroFeaturedAlbums(...args);

  getRecommendedTracks = (...args: Parameters<ListenerDiscoveryRepository["getRecommendedTracks"]>) =>
    this.discovery.getRecommendedTracks(...args);

  // ── Track / Album ───────────────────────────────────────────────────────────

  getTrackListenCounts = (...args: Parameters<ListenerTrackRepository["getTrackListenCounts"]>) =>
    this.track.getTrackListenCounts(...args);

  getPublishedAlbumMeta = (...args: Parameters<ListenerTrackRepository["getPublishedAlbumMeta"]>) =>
    this.track.getPublishedAlbumMeta(...args);

  getPublishedAlbumDetail = (...args: Parameters<ListenerTrackRepository["getPublishedAlbumDetail"]>) =>
    this.track.getPublishedAlbumDetail(...args);

  getPublishedAlbumTracks = (...args: Parameters<ListenerTrackRepository["getPublishedAlbumTracks"]>) =>
    this.track.getPublishedAlbumTracks(...args);

  getPublishedTrackById = (...args: Parameters<ListenerTrackRepository["getPublishedTrackById"]>) =>
    this.track.getPublishedTrackById(...args);

  getTrackCreditsForTracks = (...args: Parameters<ListenerTrackRepository["getTrackCreditsForTracks"]>) =>
    this.track.getTrackCreditsForTracks(...args);

  getPlaylistTracksForPage = (...args: Parameters<ListenerTrackRepository["getPlaylistTracksForPage"]>) =>
    this.track.getPlaylistTracksForPage(...args);

  getRecentlyPlayed = (...args: Parameters<ListenerTrackRepository["getRecentlyPlayed"]>) =>
    this.track.getRecentlyPlayed(...args);

  getSidebarCounts = (...args: Parameters<ListenerTrackRepository["getSidebarCounts"]>) =>
    this.track.getSidebarCounts(...args);

  getTrackReactionCounts = (...args: Parameters<ListenerTrackRepository["getTrackReactionCounts"]>) =>
    this.track.getTrackReactionCounts(...args);

  getLiveListenerCount = (...args: Parameters<ListenerTrackRepository["getLiveListenerCount"]>) =>
    this.track.getLiveListenerCount(...args);

  addTrackReaction = (...args: Parameters<ListenerTrackRepository["addTrackReaction"]>) =>
    this.track.addTrackReaction(...args);

  getTrackLyrics = (...args: Parameters<ListenerTrackRepository["getTrackLyrics"]>) =>
    this.track.getTrackLyrics(...args);

  // ── Artist Profile / Catalog / Geo ──────────────────────────────────────────

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

  getPublishedTracksForArtistSorted = (
    ...args: Parameters<ListenerArtistRepository["getPublishedTracksForArtistSorted"]>
  ) => this.artist.getPublishedTracksForArtistSorted(...args);

  getCreatorGeoMap = (...args: Parameters<ListenerArtistRepository["getCreatorGeoMap"]>) =>
    this.artist.getCreatorGeoMap(...args);

  filterDiscoveryByCategory = (...args: Parameters<ListenerArtistRepository["filterDiscoveryByCategory"]>) =>
    this.artist.filterDiscoveryByCategory(...args);

  filterTrendingByCategory = (...args: Parameters<ListenerArtistRepository["filterTrendingByCategory"]>) =>
    this.artist.filterTrendingByCategory(...args);
}
