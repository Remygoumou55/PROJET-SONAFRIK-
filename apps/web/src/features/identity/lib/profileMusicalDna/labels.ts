import type { DnaSegmentCategory, DnaVisualizationKind } from "./types";

export const DNA_CATEGORY_LABELS: Record<DnaSegmentCategory, string> = {
  genre: "Genres",
  language: "Langues",
  region: "Régions",
  style: "Styles",
  influence: "Influences",
};

export const DNA_VISUALIZATION_LABELS: Record<DnaVisualizationKind, string> = {
  bar: "Barres",
  ring: "Anneau",
  stack: "Empilement",
  radial: "Radial",
};

/** Langues nationales guinéennes — extensible Afrique de l'Ouest. */
export const GUINEAN_NATIONAL_LANGUAGE_CODES = new Set(["ss", "ff", "man"]);

export const SONAFRIK_ROOT_COUNTRY_CODES = new Set(["GN"]);

/** Régions guinéennes courantes — extensible via registre pays. */
export const GUINEAN_REGION_KEYWORDS = [
  "conakry",
  "kindia",
  "boké",
  "boke",
  "labé",
  "labe",
  "mamou",
  "faranah",
  "kankan",
  "nzérékoré",
  "nzerekore",
] as const;

export function getDnaCategoryLabel(category: DnaSegmentCategory): string {
  return DNA_CATEGORY_LABELS[category];
}
