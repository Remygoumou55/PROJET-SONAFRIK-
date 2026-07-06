import type { PublicationLibraryQuery, PublicationLibrarySort, PublicationSearchField } from "./types";
import { DEFAULT_PUBLICATION_SEARCH_FIELDS, DEFAULT_PUBLICATION_SORT } from "./types";

const SORT_ALIASES: Record<string, PublicationLibrarySort> = {
  updated: "updated_desc",
  updated_desc: "updated_desc",
  updated_asc: "updated_asc",
  title: "title_asc",
  title_asc: "title_asc",
  title_desc: "title_desc",
};

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
  const status =
    statusRaw === "all" ||
    statusRaw === "draft" ||
    statusRaw === "pending_review" ||
    statusRaw === "published" ||
    statusRaw === "rejected" ||
    statusRaw === "archived"
      ? statusRaw
      : "all";

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
} {
  switch (sort) {
    case "title_asc":
      return { column: "title", ascending: true };
    case "title_desc":
      return { column: "title", ascending: false };
    case "updated_asc":
      return { column: "updated_at", ascending: true };
    case "updated_desc":
    default:
      return { column: "updated_at", ascending: false };
  }
}
