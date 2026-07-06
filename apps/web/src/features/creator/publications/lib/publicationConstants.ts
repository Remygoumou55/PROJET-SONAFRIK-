import type { PublicationStatus } from "@sonafrik/types";

export type PublicationsStatusFilter = "all" | PublicationStatus;

export const PUBLICATIONS_STATUS_FILTERS: { value: PublicationsStatusFilter; label: string }[] = [
  { value: "all", label: "Tous" },
  { value: "draft", label: "Brouillon" },
  { value: "pending_review", label: "En revue" },
  { value: "published", label: "Publié" },
  { value: "rejected", label: "Rejeté" },
];

/** Seuil virtualisation — préparation scale (non activé MVP, PAGE_SIZE < seuil). */
export const PUBLICATIONS_VIRTUALIZATION_THRESHOLD = 200;
