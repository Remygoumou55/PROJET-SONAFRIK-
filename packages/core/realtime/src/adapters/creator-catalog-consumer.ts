import { SRTSP_DOMAIN_EVENTS } from "../registry/domain-events";
import type { SrtspEvent } from "../types";

/** Effet attendu — Catalogue Artiste Hub Phase 3.4. */
export interface CreatorCatalogEventEffect {
  event: string;
  source: string;
  expectedUiEffect: string;
  listens: boolean;
}

/**
 * Événements utiles au Catalogue Hub uniquement.
 * Exclus : brouillons wizard intermédiaires, upload progress, metadata form local.
 */
export const CREATOR_CATALOG_SRTSP_EVENTS = [
  SRTSP_DOMAIN_EVENTS.PUBLICATION_SUBMITTED,
  SRTSP_DOMAIN_EVENTS.PUBLICATION_APPROVED,
  SRTSP_DOMAIN_EVENTS.PUBLICATION_REJECTED,
  SRTSP_DOMAIN_EVENTS.PUBLICATION_DELETED,
  SRTSP_DOMAIN_EVENTS.PUBLICATION_CANCELLED,
  SRTSP_DOMAIN_EVENTS.TRACK_CREATED,
  SRTSP_DOMAIN_EVENTS.TRACK_UPDATED,
  SRTSP_DOMAIN_EVENTS.TRACK_DELETED,
  SRTSP_DOMAIN_EVENTS.TRACK_PUBLISHED,
  SRTSP_DOMAIN_EVENTS.ALBUM_PUBLISHED,
  SRTSP_DOMAIN_EVENTS.CATALOG_INVALIDATE,
  SRTSP_DOMAIN_EVENTS.ARTIST_UPDATED,
] as const;

export type CreatorCatalogSrtspEvent = (typeof CREATOR_CATALOG_SRTSP_EVENTS)[number];

/** Événements explicitement ignorés par le Catalogue Hub (documentation). */
export const CREATOR_CATALOG_IGNORED_EVENTS = [
  SRTSP_DOMAIN_EVENTS.PUBLICATION_DRAFT_CREATED,
  SRTSP_DOMAIN_EVENTS.PUBLICATION_DRAFT_UPDATED,
  SRTSP_DOMAIN_EVENTS.PUBLICATION_AUDIO_UPLOADED,
  SRTSP_DOMAIN_EVENTS.PUBLICATION_COVER_UPLOADED,
  SRTSP_DOMAIN_EVENTS.PUBLICATION_METADATA_COMPLETED,
] as const;

export const CREATOR_CATALOG_EVENT_EFFECTS: CreatorCatalogEventEffect[] = [
  {
    event: SRTSP_DOMAIN_EVENTS.PUBLICATION_SUBMITTED,
    source: "publication",
    expectedUiEffect: "Statut en revue + KPIs catalogue",
    listens: true,
  },
  {
    event: SRTSP_DOMAIN_EVENTS.PUBLICATION_APPROVED,
    source: "publication",
    expectedUiEffect: "Morceau publié visible dans le catalogue",
    listens: true,
  },
  {
    event: SRTSP_DOMAIN_EVENTS.PUBLICATION_REJECTED,
    source: "publication",
    expectedUiEffect: "Statut rejeté + compteurs cohérents",
    listens: true,
  },
  {
    event: SRTSP_DOMAIN_EVENTS.PUBLICATION_DELETED,
    source: "publication",
    expectedUiEffect: "Entrée retirée du catalogue",
    listens: true,
  },
  {
    event: SRTSP_DOMAIN_EVENTS.TRACK_CREATED,
    source: "catalog",
    expectedUiEffect: "Nouveau morceau dans le hub",
    listens: true,
  },
  {
    event: SRTSP_DOMAIN_EVENTS.TRACK_UPDATED,
    source: "catalog",
    expectedUiEffect: "Métadonnées morceau actualisées",
    listens: true,
  },
  {
    event: SRTSP_DOMAIN_EVENTS.TRACK_DELETED,
    source: "catalog",
    expectedUiEffect: "Morceau retiré",
    listens: true,
  },
  {
    event: SRTSP_DOMAIN_EVENTS.ALBUM_PUBLISHED,
    source: "catalog",
    expectedUiEffect: "Sortie / statut album actualisé",
    listens: true,
  },
  {
    event: SRTSP_DOMAIN_EVENTS.CATALOG_INVALIDATE,
    source: "catalog",
    expectedUiEffect: "Invalidation cache ciblée hub",
    listens: true,
  },
  {
    event: SRTSP_DOMAIN_EVENTS.ARTIST_UPDATED,
    source: "creator",
    expectedUiEffect: "Nom artiste cohérent (préparation hub)",
    listens: true,
  },
  {
    event: SRTSP_DOMAIN_EVENTS.PUBLICATION_DRAFT_CREATED,
    source: "publication",
    expectedUiEffect: "Ignoré — pas d'impact KPI hub sans submit",
    listens: false,
  },
  {
    event: SRTSP_DOMAIN_EVENTS.PUBLICATION_AUDIO_UPLOADED,
    source: "publication",
    expectedUiEffect: "Ignoré — upload intermédiaire wizard",
    listens: false,
  },
];

export interface CreatorCatalogConsumerScope {
  creatorId: string;
}

function payloadCreatorId(event: SrtspEvent): string | undefined {
  const p = event.payload;
  if (typeof p.creatorId === "string") return p.creatorId;
  return undefined;
}

/** Filtre consommateur Catalogue Hub — événements ciblés + scope créateur. */
export function shouldRefreshCreatorCatalog(
  event: SrtspEvent,
  scope: CreatorCatalogConsumerScope,
): boolean {
  if (!(CREATOR_CATALOG_SRTSP_EVENTS as readonly string[]).includes(event.name)) {
    return false;
  }

  const eventCreator = payloadCreatorId(event);
  if (eventCreator && eventCreator !== scope.creatorId) return false;

  return true;
}

export function getCreatorCatalogInvalidateEvents(): CreatorCatalogSrtspEvent[] {
  return [...CREATOR_CATALOG_SRTSP_EVENTS];
}

export function isCatalogIgnoredEvent(eventName: string): boolean {
  return (CREATOR_CATALOG_IGNORED_EVENTS as readonly string[]).includes(eventName);
}
