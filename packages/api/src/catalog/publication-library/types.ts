import type { PublicationStatus } from "@sonafrik/types";

/** Champs recherchables — MVP : title uniquement ; extensible sans changer l'UI. */
export type PublicationSearchField =
  | "title"
  | "album"
  | "genre"
  | "language"
  | "isrc"
  | "status"
  | "date"
  | "featuring";

export const DEFAULT_PUBLICATION_SEARCH_FIELDS: readonly PublicationSearchField[] = ["title"];

/** Tri catalogue entier (serveur) — pas limité à la page courante. */
export type PublicationLibrarySort = "updated_desc" | "updated_asc" | "title_asc" | "title_desc";

export const DEFAULT_PUBLICATION_SORT: PublicationLibrarySort = "updated_desc";

export interface PublicationLibraryQuery {
  search?: string;
  searchFields?: PublicationSearchField[];
  status?: PublicationStatus | "all";
  sort?: PublicationLibrarySort;
  limit?: number;
  offset?: number;
}
