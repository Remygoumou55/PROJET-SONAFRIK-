import { SRTSP_DOMAIN_EVENTS } from "../registry/domain-events";
import type { SrtspEvent } from "../types";

/** Effet attendu — Analytics Créateur Phase 3.5. */
export interface CreatorAnalyticsEventEffect {
  event: string;
  source: string;
  expectedUiEffect: string;
  listens: boolean;
}

/**
 * Événements actifs — invalidation Analytics uniquement.
 * Exclus : brouillons wizard, upload progress, metadata form local.
 */
export const CREATOR_ANALYTICS_SRTSP_EVENTS = [
  SRTSP_DOMAIN_EVENTS.PUBLICATION_APPROVED,
  SRTSP_DOMAIN_EVENTS.PUBLICATION_DELETED,
  SRTSP_DOMAIN_EVENTS.TRACK_UPDATED,
  SRTSP_DOMAIN_EVENTS.TRACK_DELETED,
  SRTSP_DOMAIN_EVENTS.ANALYTICS_INVALIDATE,
] as const;

export type CreatorAnalyticsSrtspEvent = (typeof CREATOR_ANALYTICS_SRTSP_EVENTS)[number];

/** Préparation Phase wallet/streaming — documenté, pas de consommation active. */
export const CREATOR_ANALYTICS_PREPARED_EVENTS = [
  "stream.play.recorded",
  SRTSP_DOMAIN_EVENTS.WALLET_UPDATED,
  SRTSP_DOMAIN_EVENTS.ROYALTY_GENERATED,
] as const;

/** Événements explicitement ignorés par Analytics (documentation). */
export const CREATOR_ANALYTICS_IGNORED_EVENTS = [
  SRTSP_DOMAIN_EVENTS.PUBLICATION_DRAFT_CREATED,
  SRTSP_DOMAIN_EVENTS.PUBLICATION_DRAFT_UPDATED,
  SRTSP_DOMAIN_EVENTS.PUBLICATION_AUDIO_UPLOADED,
  SRTSP_DOMAIN_EVENTS.PUBLICATION_COVER_UPLOADED,
  SRTSP_DOMAIN_EVENTS.PUBLICATION_METADATA_COMPLETED,
] as const;

export const CREATOR_ANALYTICS_EVENT_EFFECTS: CreatorAnalyticsEventEffect[] = [
  {
    event: SRTSP_DOMAIN_EVENTS.PUBLICATION_APPROVED,
    source: "publication",
    expectedUiEffect: "KPIs + top tracks actualisés après publication",
    listens: true,
  },
  {
    event: SRTSP_DOMAIN_EVENTS.PUBLICATION_DELETED,
    source: "publication",
    expectedUiEffect: "Graphiques et classements recalculés",
    listens: true,
  },
  {
    event: SRTSP_DOMAIN_EVENTS.TRACK_UPDATED,
    source: "catalog",
    expectedUiEffect: "Statistiques morceau actualisées",
    listens: true,
  },
  {
    event: SRTSP_DOMAIN_EVENTS.TRACK_DELETED,
    source: "catalog",
    expectedUiEffect: "Top tracks / timeline cohérents",
    listens: true,
  },
  {
    event: SRTSP_DOMAIN_EVENTS.ANALYTICS_INVALIDATE,
    source: "creator",
    expectedUiEffect: "Refresh ciblé cache Analytics",
    listens: true,
  },
  {
    event: SRTSP_DOMAIN_EVENTS.WALLET_UPDATED,
    source: "wallet",
    expectedUiEffect: "Préparation — non consommé Phase 3.5",
    listens: false,
  },
  {
    event: SRTSP_DOMAIN_EVENTS.PUBLICATION_AUDIO_UPLOADED,
    source: "publication",
    expectedUiEffect: "Ignoré — upload intermédiaire wizard",
    listens: false,
  },
];

export interface CreatorAnalyticsConsumerScope {
  creatorId: string;
}

function payloadCreatorId(event: SrtspEvent): string | undefined {
  const p = event.payload;
  if (typeof p.creatorId === "string") return p.creatorId;
  return undefined;
}

/** Filtre consommateur Analytics — événements ciblés + scope créateur. */
export function shouldRefreshCreatorAnalytics(
  event: SrtspEvent,
  scope: CreatorAnalyticsConsumerScope,
): boolean {
  if (!(CREATOR_ANALYTICS_SRTSP_EVENTS as readonly string[]).includes(event.name)) {
    return false;
  }

  const eventCreator = payloadCreatorId(event);
  if (eventCreator && eventCreator !== scope.creatorId) return false;

  return true;
}

export function getCreatorAnalyticsInvalidateEvents(): CreatorAnalyticsSrtspEvent[] {
  return [...CREATOR_ANALYTICS_SRTSP_EVENTS];
}

export function isAnalyticsIgnoredEvent(eventName: string): boolean {
  return (CREATOR_ANALYTICS_IGNORED_EVENTS as readonly string[]).includes(eventName);
}

export function isAnalyticsPreparedEvent(eventName: string): boolean {
  return (CREATOR_ANALYTICS_PREPARED_EVENTS as readonly string[]).includes(eventName);
}
