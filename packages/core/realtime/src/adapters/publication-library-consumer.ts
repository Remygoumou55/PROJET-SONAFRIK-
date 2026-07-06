import { SRTSP_DOMAIN_EVENTS } from "../registry/domain-events";
import type { SrtspEvent } from "../types";

/** Effet attendu côté Mes publications — Phase 3.2 SSOT. */
export interface PublicationLibraryEventEffect {
  event: string;
  source: string;
  expectedUiEffect: string;
}

/** Événements consommés par Mes publications — invalidation liste. */
export const PUBLICATION_LIBRARY_SRTSP_EVENTS = [
  SRTSP_DOMAIN_EVENTS.PUBLICATION_DRAFT_CREATED,
  SRTSP_DOMAIN_EVENTS.PUBLICATION_DRAFT_UPDATED,
  SRTSP_DOMAIN_EVENTS.PUBLICATION_AUDIO_UPLOADED,
  SRTSP_DOMAIN_EVENTS.PUBLICATION_COVER_UPLOADED,
  SRTSP_DOMAIN_EVENTS.PUBLICATION_METADATA_COMPLETED,
  SRTSP_DOMAIN_EVENTS.PUBLICATION_SUBMITTED,
  SRTSP_DOMAIN_EVENTS.PUBLICATION_CANCELLED,
  SRTSP_DOMAIN_EVENTS.PUBLICATION_DELETED,
  SRTSP_DOMAIN_EVENTS.PUBLICATION_APPROVED,
  SRTSP_DOMAIN_EVENTS.PUBLICATION_REJECTED,
  SRTSP_DOMAIN_EVENTS.CATALOG_INVALIDATE,
  SRTSP_DOMAIN_EVENTS.TRACK_UPDATED,
  SRTSP_DOMAIN_EVENTS.TRACK_DELETED,
] as const;

export type PublicationLibrarySrtspEvent = (typeof PUBLICATION_LIBRARY_SRTSP_EVENTS)[number];

/** Cartographie consommation — documentation + tests. */
export const PUBLICATION_LIBRARY_EVENT_EFFECTS: PublicationLibraryEventEffect[] = [
  {
    event: SRTSP_DOMAIN_EVENTS.PUBLICATION_DRAFT_CREATED,
    source: "publication",
    expectedUiEffect: "Nouveau brouillon visible (refresh liste)",
  },
  {
    event: SRTSP_DOMAIN_EVENTS.PUBLICATION_DRAFT_UPDATED,
    source: "publication",
    expectedUiEffect: "Métadonnées / brouillon mis à jour",
  },
  {
    event: SRTSP_DOMAIN_EVENTS.PUBLICATION_AUDIO_UPLOADED,
    source: "publication",
    expectedUiEffect: "Fichiers audio reflétés",
  },
  {
    event: SRTSP_DOMAIN_EVENTS.PUBLICATION_COVER_UPLOADED,
    source: "publication",
    expectedUiEffect: "Pochette reflétée",
  },
  {
    event: SRTSP_DOMAIN_EVENTS.PUBLICATION_METADATA_COMPLETED,
    source: "publication",
    expectedUiEffect: "Métadonnées complétées",
  },
  {
    event: SRTSP_DOMAIN_EVENTS.PUBLICATION_SUBMITTED,
    source: "publication",
    expectedUiEffect: "Statut → En revue (pending_review)",
  },
  {
    event: SRTSP_DOMAIN_EVENTS.PUBLICATION_APPROVED,
    source: "publication",
    expectedUiEffect: "Statut → Publié",
  },
  {
    event: SRTSP_DOMAIN_EVENTS.PUBLICATION_REJECTED,
    source: "publication",
    expectedUiEffect: "Statut → Rejeté",
  },
  {
    event: SRTSP_DOMAIN_EVENTS.PUBLICATION_CANCELLED,
    source: "publication",
    expectedUiEffect: "Brouillon retiré / liste cohérente",
  },
  {
    event: SRTSP_DOMAIN_EVENTS.PUBLICATION_DELETED,
    source: "publication",
    expectedUiEffect: "Entrée supprimée de la liste",
  },
  {
    event: SRTSP_DOMAIN_EVENTS.CATALOG_INVALIDATE,
    source: "catalog",
    expectedUiEffect: "Invalidation cache catalogue créateur",
  },
  {
    event: SRTSP_DOMAIN_EVENTS.TRACK_UPDATED,
    source: "catalog",
    expectedUiEffect: "Mise à jour track existante",
  },
  {
    event: SRTSP_DOMAIN_EVENTS.TRACK_DELETED,
    source: "catalog",
    expectedUiEffect: "Track retirée de la liste",
  },
];

function payloadCreatorId(event: SrtspEvent): string | undefined {
  const p = event.payload;
  if (typeof p.creatorId === "string") return p.creatorId;
  return undefined;
}

/** Filtre consommateur — ignore événements d'autres créateurs. */
export function shouldRefreshPublicationLibrary(event: SrtspEvent, creatorId: string): boolean {
  const eventCreator = payloadCreatorId(event);
  if (eventCreator && eventCreator !== creatorId) return false;
  return (PUBLICATION_LIBRARY_SRTSP_EVENTS as readonly string[]).includes(event.name);
}

export function getPublicationLibraryInvalidateEvents(): PublicationLibrarySrtspEvent[] {
  return [...PUBLICATION_LIBRARY_SRTSP_EVENTS];
}
