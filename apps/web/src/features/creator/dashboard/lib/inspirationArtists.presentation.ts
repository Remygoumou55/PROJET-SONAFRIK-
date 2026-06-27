import type { CreatorInspirationArtist } from "@sonafrik/types";

const INVALID_NAME_PATTERNS = ["test", "s12b", "seed"];

export function isValidInspirationArtist(artist: CreatorInspirationArtist): boolean {
  const name = artist.stageName?.trim() ?? "";
  if (name.length <= 1) return false;

  const lower = name.toLowerCase();
  return !INVALID_NAME_PATTERNS.some((pattern) => lower.includes(pattern));
}

export function filterValidInspirationArtists(
  artists: CreatorInspirationArtist[],
): CreatorInspirationArtist[] {
  return artists.filter(isValidInspirationArtist);
}
