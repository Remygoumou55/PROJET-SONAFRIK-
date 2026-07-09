import type { PublicationLibraryStatusFilter } from "@sonafrik/api/publication-library";

export type PublicationsStatusFilter = PublicationLibraryStatusFilter;

export const PUBLICATIONS_STATUS_FILTERS: { value: PublicationsStatusFilter; label: string }[] = [
  { value: "all", label: "Tous" },
  { value: "published", label: "Publiés" },
  { value: "pending_review", label: "En revue" },
  { value: "validation", label: "Validation" },
  { value: "draft", label: "Brouillons" },
  { value: "scheduled", label: "Planifiés" },
  { value: "rejected", label: "Refusés" },
  { value: "archived", label: "Archivés" },
];

export const PUBLICATIONS_SORT_OPTIONS = [
  { value: "updated", label: "Plus récent" },
  { value: "oldest", label: "Plus ancien" },
  { value: "streams", label: "Plus écouté" },
  { value: "revenue", label: "Plus rentable" },
  { value: "alpha", label: "Ordre alphabétique" },
] as const;

export type PublicationsSortUi = (typeof PUBLICATIONS_SORT_OPTIONS)[number]["value"];

/** Seuil virtualisation — préparation scale (non activé MVP, PAGE_SIZE < seuil). */
export const PUBLICATIONS_VIRTUALIZATION_THRESHOLD = 200;
