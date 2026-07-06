import { SRTSP_DOMAIN_EVENTS } from "../registry/domain-events";
import type { SrtspEvent } from "../types";

/** Effet attendu — Dashboard Artiste Phase 3.3. */
export interface CreatorDashboardEventEffect {
  event: string;
  source: string;
  expectedUiEffect: string;
  listens: boolean;
}

/**
 * Événements utiles au Dashboard uniquement.
 * Exclus : draft.created, audio/cover/metadata wizard, progress locaux.
 */
export const CREATOR_DASHBOARD_SRTSP_EVENTS = [
  SRTSP_DOMAIN_EVENTS.PUBLICATION_SUBMITTED,
  SRTSP_DOMAIN_EVENTS.PUBLICATION_APPROVED,
  SRTSP_DOMAIN_EVENTS.PUBLICATION_REJECTED,
  SRTSP_DOMAIN_EVENTS.PUBLICATION_DELETED,
  SRTSP_DOMAIN_EVENTS.PUBLICATION_CANCELLED,
  SRTSP_DOMAIN_EVENTS.TRACK_PUBLISHED,
  SRTSP_DOMAIN_EVENTS.TRACK_UPDATED,
  SRTSP_DOMAIN_EVENTS.TRACK_DELETED,
  SRTSP_DOMAIN_EVENTS.CATALOG_INVALIDATE,
  SRTSP_DOMAIN_EVENTS.ARTIST_UPDATED,
  SRTSP_DOMAIN_EVENTS.WALLET_UPDATED,
  SRTSP_DOMAIN_EVENTS.ANALYTICS_INVALIDATE,
] as const;

export type CreatorDashboardSrtspEvent = (typeof CREATOR_DASHBOARD_SRTSP_EVENTS)[number];

/** Événements explicitement ignorés par le Dashboard (documentation). */
export const CREATOR_DASHBOARD_IGNORED_EVENTS = [
  SRTSP_DOMAIN_EVENTS.PUBLICATION_DRAFT_CREATED,
  SRTSP_DOMAIN_EVENTS.PUBLICATION_DRAFT_UPDATED,
  SRTSP_DOMAIN_EVENTS.PUBLICATION_AUDIO_UPLOADED,
  SRTSP_DOMAIN_EVENTS.PUBLICATION_COVER_UPLOADED,
  SRTSP_DOMAIN_EVENTS.PUBLICATION_METADATA_COMPLETED,
] as const;

export const CREATOR_DASHBOARD_EVENT_EFFECTS: CreatorDashboardEventEffect[] = [
  {
    event: SRTSP_DOMAIN_EVENTS.PUBLICATION_SUBMITTED,
    source: "publication",
    expectedUiEffect: 'Compteur "En revue" + activité récente',
    listens: true,
  },
  {
    event: SRTSP_DOMAIN_EVENTS.PUBLICATION_APPROVED,
    source: "publication",
    expectedUiEffect: 'Compteur "Publications" / statut publié',
    listens: true,
  },
  {
    event: SRTSP_DOMAIN_EVENTS.PUBLICATION_REJECTED,
    source: "publication",
    expectedUiEffect: 'Compteur "En revue" diminue',
    listens: true,
  },
  {
    event: SRTSP_DOMAIN_EVENTS.PUBLICATION_DELETED,
    source: "publication",
    expectedUiEffect: "KPIs catalogue + activité actualisés",
    listens: true,
  },
  {
    event: SRTSP_DOMAIN_EVENTS.PUBLICATION_CANCELLED,
    source: "publication",
    expectedUiEffect: "Résumé catalogue cohérent",
    listens: true,
  },
  {
    event: SRTSP_DOMAIN_EVENTS.TRACK_PUBLISHED,
    source: "publication",
    expectedUiEffect: "Morceaux publiés + hero stats",
    listens: true,
  },
  {
    event: SRTSP_DOMAIN_EVENTS.ARTIST_UPDATED,
    source: "creator",
    expectedUiEffect: "Hero / profil artiste",
    listens: true,
  },
  {
    event: SRTSP_DOMAIN_EVENTS.WALLET_UPDATED,
    source: "wallet",
    expectedUiEffect: "Carte wallet (préparation Phase wallet)",
    listens: true,
  },
  {
    event: SRTSP_DOMAIN_EVENTS.ANALYTICS_INVALIDATE,
    source: "creator",
    expectedUiEffect: "KPIs streams / revenus (préparation)",
    listens: true,
  },
  {
    event: SRTSP_DOMAIN_EVENTS.PUBLICATION_DRAFT_CREATED,
    source: "publication",
    expectedUiEffect: "Ignoré — pas d'impact KPI dashboard",
    listens: false,
  },
  {
    event: SRTSP_DOMAIN_EVENTS.PUBLICATION_AUDIO_UPLOADED,
    source: "publication",
    expectedUiEffect: "Ignoré — upload intermédiaire",
    listens: false,
  },
];

export interface CreatorDashboardConsumerScope {
  creatorId: string;
  userId?: string;
}

function payloadCreatorId(event: SrtspEvent): string | undefined {
  const p = event.payload;
  if (typeof p.creatorId === "string") return p.creatorId;
  return undefined;
}

/** Filtre consommateur Dashboard — événements ciblés + scope créateur. */
export function shouldRefreshCreatorDashboard(
  event: SrtspEvent,
  scope: CreatorDashboardConsumerScope,
): boolean {
  if (!(CREATOR_DASHBOARD_SRTSP_EVENTS as readonly string[]).includes(event.name)) {
    return false;
  }

  const eventCreator = payloadCreatorId(event);
  if (eventCreator && eventCreator !== scope.creatorId) return false;

  if (event.name === SRTSP_DOMAIN_EVENTS.WALLET_UPDATED && scope.userId) {
    const userId = event.payload.userId;
    if (typeof userId === "string" && userId !== scope.userId) return false;
  }

  if (event.name === SRTSP_DOMAIN_EVENTS.ARTIST_UPDATED && eventCreator && eventCreator !== scope.creatorId) {
    return false;
  }

  return true;
}

export function getCreatorDashboardInvalidateEvents(): CreatorDashboardSrtspEvent[] {
  return [...CREATOR_DASHBOARD_SRTSP_EVENTS];
}

export function isDashboardIgnoredEvent(eventName: string): boolean {
  return (CREATOR_DASHBOARD_IGNORED_EVENTS as readonly string[]).includes(eventName);
}
