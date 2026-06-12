export type DiscoveryErrorCode =
  | "unauthorized"
  | "discovery_feed_failed"
  | "new_releases_failed"
  | "suggested_artists_failed"
  | "suggested_albums_failed"
  | "unknown";

export class DiscoveryError extends Error {
  constructor(public readonly code: DiscoveryErrorCode) {
    super(code);
    this.name = "DiscoveryError";
  }
}
