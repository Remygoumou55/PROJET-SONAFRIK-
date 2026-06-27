import type { DiscoveryTrack, ListenMusicCategory, TrendingTrack } from "@sonafrik/types";

/** Pays Afrique de l'Ouest + hub régional MVP. */
const WEST_AFRICA_COUNTRY_CODES = new Set([
  "GN",
  "SN",
  "CI",
  "ML",
  "BF",
  "NE",
  "TG",
  "BJ",
  "GW",
  "SL",
  "LR",
  "NG",
  "GH",
  "GM",
  "MR",
  "CV",
]);

export interface CreatorGeoProfile {
  countryCode: string | null;
  originRegion: string | null;
}

export function parseListenMusicCategory(value: string | undefined): ListenMusicCategory {
  if (value === "guinee" || value === "afrique" || value === "diaspora") return value;
  return "all";
}

export function matchesListenCategory(
  geo: CreatorGeoProfile | undefined,
  category: ListenMusicCategory,
): boolean {
  if (category === "all") return true;
  const country = (geo?.countryCode ?? "GN").toUpperCase();
  const origin = (geo?.originRegion ?? "").toLowerCase();

  if (category === "guinee") return country === "GN";
  if (category === "afrique") {
    return WEST_AFRICA_COUNTRY_CODES.has(country) && country !== "GN";
  }
  if (category === "diaspora") {
    return (
      origin.includes("diaspora") ||
      (!WEST_AFRICA_COUNTRY_CODES.has(country) && country !== "GN")
    );
  }
  return true;
}

export function filterDiscoveryTracksByCategory(
  tracks: DiscoveryTrack[],
  category: ListenMusicCategory,
  geoByCreator: Map<string, CreatorGeoProfile>,
): DiscoveryTrack[] {
  if (category === "all") return tracks;
  return tracks.filter((track) =>
    matchesListenCategory(geoByCreator.get(track.creator_id), category),
  );
}

export function filterTrendingTracksByCategory(
  tracks: TrendingTrack[],
  category: ListenMusicCategory,
  geoByCreator: Map<string, CreatorGeoProfile>,
): TrendingTrack[] {
  if (category === "all") return tracks;
  return tracks.filter((track) =>
    matchesListenCategory(geoByCreator.get(track.creator_id), category),
  );
}
