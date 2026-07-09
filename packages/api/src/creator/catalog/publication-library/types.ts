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

export type PublicationLibrarySort =
  | "updated_desc"
  | "updated_asc"
  | "title_asc"
  | "title_desc"
  | "streams_desc"
  | "revenue_desc";

export type PublicationLibraryStatusFilter =
  | "all"
  | "draft"
  | "pending_review"
  | "validation"
  | "scheduled"
  | "published"
  | "rejected"
  | "archived";

export interface PublicationTrackInsight {
  track_id: string;
  streams: number;
  revenue_gnf: number | null;
  last_activity_at: string | null;
}

export const DEFAULT_PUBLICATION_SORT: PublicationLibrarySort = "updated_desc";

export interface PublicationLibraryQuery {
  search?: string;
  searchFields?: PublicationSearchField[];
  status?: PublicationLibraryStatusFilter;
  sort?: PublicationLibrarySort;
  limit?: number;
  offset?: number;
}
