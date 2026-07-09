import type {
  PublicationLibraryQuery,
  PublicationLibrarySort,
  PublicationLibraryStatusFilter,
  PublicationSearchField,
} from "./types";
import { DEFAULT_PUBLICATION_SEARCH_FIELDS, DEFAULT_PUBLICATION_SORT } from "./types";

import type { PublicationStatus } from "@sonafrik/types";
import { PUBLICATION_STATUS_LABELS } from "@sonafrik/types/catalog";

const SORT_ALIASES: Record<string, PublicationLibrarySort> = {
  updated: "updated_desc",
  updated_desc: "updated_desc",
  updated_asc: "updated_asc",
  oldest: "updated_asc",
  title: "title_asc",
  title_asc: "title_asc",
  title_desc: "title_desc",
  alpha: "title_asc",
  streams: "streams_desc",
  streams_desc: "streams_desc",
  revenue: "revenue_desc",
  revenue_desc: "revenue_desc",
};

const STATUS_ALIASES: Record<string, PublicationLibraryStatusFilter> = {
  all: "all",
  draft: "draft",
  brouillon: "draft",
  pending_review: "pending_review",
  review: "pending_review",
  validation: "validation",
  scheduled: "scheduled",
  planifie: "scheduled",
  published: "published",
  publie: "published",
  rejected: "rejected",
  refuse: "rejected",
  archived: "archived",
  archive: "archived",
};

export function normalizePublicationStatusFilter(
  raw?: string | null,
): PublicationLibraryStatusFilter {
  if (!raw?.trim()) return "all";
  const key = raw.trim().toLowerCase();
  return STATUS_ALIASES[key] ?? "all";
}

export function resolvePublicationStatusDbFilter(
  status: PublicationLibraryStatusFilter,
): PublicationStatus | "all" | "validation" | "scheduled" {
  if (status === "validation" || status === "scheduled") return status;
  if (status === "all") return "all";
  return status;
}

export function publicationStatusMatchesSearch(
  status: PublicationStatus,
  term: string,
): boolean {
  const label = PUBLICATION_STATUS_LABELS[status].toLowerCase();
  const normalized = term.trim().toLowerCase();
  return label.includes(normalized) || status.includes(normalized);
}

export function normalizePublicationSort(raw?: string | null): PublicationLibrarySort {
  if (!raw?.trim()) return DEFAULT_PUBLICATION_SORT;
  return SORT_ALIASES[raw.trim()] ?? DEFAULT_PUBLICATION_SORT;
}

export function resolvePublicationSearchFields(
  fields?: PublicationSearchField[],
): PublicationSearchField[] {
  if (!fields?.length) return [...DEFAULT_PUBLICATION_SEARCH_FIELDS];
  return fields;
}

export function parsePublicationLibraryQuery(input: {
  q?: string | null;
  status?: string | null;
  sort?: string | null;
  page?: number;
  pageSize?: number;
  searchFields?: PublicationSearchField[];
}): PublicationLibraryQuery {
  const page = Math.max(1, input.page ?? 1);
  const pageSize = input.pageSize ?? 50;
  const statusRaw = input.status?.trim() || "all";
  const status = normalizePublicationStatusFilter(statusRaw);

  return {
    search: input.q?.trim() || undefined,
    searchFields: resolvePublicationSearchFields(input.searchFields),
    status,
    sort: normalizePublicationSort(input.sort),
    limit: pageSize,
    offset: (page - 1) * pageSize,
  };
}

/** Applique le filtre recherche — MVP title ; structure prête pour OR multi-champs. */
export function applyPublicationSearchFilter<T extends { ilike: (col: string, pattern: string) => T }>(
  query: T,
  search: string | undefined,
  searchFields: PublicationSearchField[],
): T {
  const term = search?.trim();
  if (!term) return query;

  const fields = resolvePublicationSearchFields(searchFields);
  if (fields.length === 1 && fields[0] === "title") {
    return query.ilike("title", `%${term}%`);
  }

  // Phase 2 : or(...) sur album.title, genres, isrc, etc.
  return query.ilike("title", `%${term}%`);
}

export function publicationSortToOrder(sort: PublicationLibrarySort): {
  column: "updated_at" | "title";
  ascending: boolean;
  clientSide?: "streams" | "revenue";
} {
  switch (sort) {
    case "title_asc":
      return { column: "title", ascending: true };
    case "title_desc":
      return { column: "title", ascending: false };
    case "updated_asc":
      return { column: "updated_at", ascending: true };
    case "streams_desc":
      return { column: "updated_at", ascending: false, clientSide: "streams" };
    case "revenue_desc":
      return { column: "updated_at", ascending: false, clientSide: "revenue" };
    case "updated_desc":
    default:
      return { column: "updated_at", ascending: false };
  }
}
