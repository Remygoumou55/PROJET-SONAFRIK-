import type {
  AlbumMetadata,
  ArtistMetadata,
  ReleaseMetadata,
  TrackMetadata,
} from "@sonafrik/types";

/** Format metadata for display or export — Phase 2+ */
export interface MetadataFormatter {
  formatTrack(metadata: TrackMetadata): string;
  formatAlbum(metadata: AlbumMetadata): string;
  formatRelease(metadata: ReleaseMetadata): string;
  formatArtist(metadata: ArtistMetadata): string;
}

/** Normalize incoming metadata payloads — Phase 2+ */
export interface MetadataNormalizer {
  normalizeTrack(input: Readonly<Record<string, unknown>>): Partial<TrackMetadata>;
  normalizeAlbum(input: Readonly<Record<string, unknown>>): Partial<AlbumMetadata>;
}

/** Parse external metadata formats (DDEX, CSV imports) — Phase 3+ */
export interface MetadataParser {
  parse(input: string, format: "json" | "csv"): Readonly<Record<string, unknown>>;
}

/** Stable hashing for fingerprint and dedup keys — Phase 3+ */
export interface MetadataHasher {
  hash(value: string): string;
}

/** Structural comparison for versioning — Phase 2+ */
export interface MetadataComparator {
  diff(
    before: Readonly<Record<string, unknown>>,
    after: Readonly<Record<string, unknown>>,
  ): readonly string[];
}
