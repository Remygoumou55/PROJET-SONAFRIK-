import { SRTSP_DOMAIN_EVENTS } from "../registry/domain-events";
import type { SrtspEvent } from "../types";

/** Effet attendu — Workspace Super Admin Hub Phase 3.9. */
export interface AdminHubEventEffect {
  event: string;
  source: string;
  expectedUiEffect: string;
  listens: boolean;
}

/** Alias LDSE admin → SRTSP forward-compat (registry inchangé). */
export const ADMIN_HUB_EXTENDED_EVENTS = [
  "admin.fraud.updated",
  "admin.catalog.updated",
  "admin.user.updated",
  "admin.withdrawal.updated",
  "admin.rights.updated",
  "admin.analytics.refreshed",
  "wallet.transaction.completed",
  "withdrawal.approved",
  "withdrawal.rejected",
  "payment.completed",
] as const;

/** Snapshot & supervision globale. */
export const ADMIN_HUB_SNAPSHOT_EVENTS = [
  SRTSP_DOMAIN_EVENTS.ADMIN_SNAPSHOT_INVALIDATE,
  ...ADMIN_HUB_EXTENDED_EVENTS,
] as const;

/** Publications & modération catalogue. */
export const ADMIN_HUB_PUBLICATION_EVENTS = [
  SRTSP_DOMAIN_EVENTS.PUBLICATION_SUBMITTED,
  SRTSP_DOMAIN_EVENTS.PUBLICATION_APPROVED,
  SRTSP_DOMAIN_EVENTS.PUBLICATION_REJECTED,
  SRTSP_DOMAIN_EVENTS.PUBLICATION_DELETED,
  SRTSP_DOMAIN_EVENTS.PUBLICATION_CANCELLED,
] as const;

/** Catalogue public / pending queue. */
export const ADMIN_HUB_CATALOG_EVENTS = [
  SRTSP_DOMAIN_EVENTS.TRACK_CREATED,
  SRTSP_DOMAIN_EVENTS.TRACK_UPDATED,
  SRTSP_DOMAIN_EVENTS.TRACK_DELETED,
  SRTSP_DOMAIN_EVENTS.TRACK_PUBLISHED,
  SRTSP_DOMAIN_EVENTS.ALBUM_PUBLISHED,
  SRTSP_DOMAIN_EVENTS.CATALOG_INVALIDATE,
] as const;

/** Wallet & retraits. */
export const ADMIN_HUB_WALLET_EVENTS = [
  SRTSP_DOMAIN_EVENTS.WALLET_UPDATED,
  SRTSP_DOMAIN_EVENTS.WITHDRAWAL_UPDATED,
  SRTSP_DOMAIN_EVENTS.ROYALTY_GENERATED,
] as const;

/** Identité artiste (supervision). */
export const ADMIN_HUB_IDENTITY_EVENTS = [
  SRTSP_DOMAIN_EVENTS.ARTIST_UPDATED,
  "artist.profile.updated",
  "artist.avatar.updated",
  "artist.verification.updated",
  "artist.badges.updated",
  "identity.profile.updated",
  "profile.invalidate",
] as const;

/** Streaming supervision (Phase 3.9 — read-only, Session Engine LOCKED). */
export const ADMIN_HUB_STREAMING_EVENTS = [
  SRTSP_DOMAIN_EVENTS.STREAMING_STARTED,
  SRTSP_DOMAIN_EVENTS.STREAMING_PAUSED,
  SRTSP_DOMAIN_EVENTS.STREAMING_ENDED,
] as const;

/** Notifications système. */
export const ADMIN_HUB_NOTIFICATION_EVENTS = [SRTSP_DOMAIN_EVENTS.NOTIFICATION_CREATED] as const;

/** Analytics agrégés. */
export const ADMIN_HUB_ANALYTICS_EVENTS = [SRTSP_DOMAIN_EVENTS.ANALYTICS_INVALIDATE] as const;

/** Événements actifs — Super Admin Hub. */
export const ADMIN_HUB_SRTSP_EVENTS = [
  ...ADMIN_HUB_SNAPSHOT_EVENTS,
  ...ADMIN_HUB_PUBLICATION_EVENTS,
  ...ADMIN_HUB_CATALOG_EVENTS,
  ...ADMIN_HUB_WALLET_EVENTS,
  ...ADMIN_HUB_IDENTITY_EVENTS,
  ...ADMIN_HUB_STREAMING_EVENTS,
  ...ADMIN_HUB_NOTIFICATION_EVENTS,
  ...ADMIN_HUB_ANALYTICS_EVENTS,
] as const;

export type AdminHubSrtspEvent = (typeof ADMIN_HUB_SRTSP_EVENTS)[number];

/** Préparation — documenté, pas de consommation active Phase 3.9. */
export const ADMIN_HUB_PREPARED_EVENTS = ["stream.play.recorded", "royalty.adjusted"] as const;

/** Événements ignorés (bruit wizard). */
export const ADMIN_HUB_IGNORED_EVENTS = [
  SRTSP_DOMAIN_EVENTS.PUBLICATION_DRAFT_CREATED,
  SRTSP_DOMAIN_EVENTS.PUBLICATION_DRAFT_UPDATED,
  SRTSP_DOMAIN_EVENTS.PUBLICATION_AUDIO_UPLOADED,
  SRTSP_DOMAIN_EVENTS.PUBLICATION_COVER_UPLOADED,
  SRTSP_DOMAIN_EVENTS.PUBLICATION_METADATA_COMPLETED,
] as const;

export const ADMIN_HUB_EVENT_EFFECTS: AdminHubEventEffect[] = [
  {
    event: SRTSP_DOMAIN_EVENTS.ADMIN_SNAPSHOT_INVALIDATE,
    source: "admin",
    expectedUiEffect: "Snapshot cockpit + badges sidebar",
    listens: true,
  },
  {
    event: SRTSP_DOMAIN_EVENTS.PUBLICATION_SUBMITTED,
    source: "publication",
    expectedUiEffect: "File modération catalogue",
    listens: true,
  },
  {
    event: SRTSP_DOMAIN_EVENTS.WITHDRAWAL_UPDATED,
    source: "wallet",
    expectedUiEffect: "Queue retraits admin",
    listens: true,
  },
  {
    event: SRTSP_DOMAIN_EVENTS.STREAMING_STARTED,
    source: "streaming",
    expectedUiEffect: "Analytics live + fraude",
    listens: true,
  },
  {
    event: SRTSP_DOMAIN_EVENTS.ARTIST_UPDATED,
    source: "creator",
    expectedUiEffect: "Liste artistes + vérifications",
    listens: true,
  },
  {
    event: SRTSP_DOMAIN_EVENTS.PUBLICATION_AUDIO_UPLOADED,
    source: "publication",
    expectedUiEffect: "Ignoré — wizard upload",
    listens: false,
  },
];

function includesEvent(list: readonly string[], name: string): boolean {
  return list.includes(name);
}

/** Snapshot global — tous événements supervision. */
export function shouldRefreshAdminSnapshot(event: SrtspEvent): boolean {
  return includesEvent(ADMIN_HUB_SRTSP_EVENTS, event.name);
}

export function shouldRefreshAdminCatalog(event: SrtspEvent): boolean {
  return (
    includesEvent(ADMIN_HUB_PUBLICATION_EVENTS, event.name) ||
    includesEvent(ADMIN_HUB_CATALOG_EVENTS, event.name) ||
    event.name === "admin.catalog.updated"
  );
}

export function shouldRefreshAdminWallet(event: SrtspEvent): boolean {
  return (
    includesEvent(ADMIN_HUB_WALLET_EVENTS, event.name) ||
    event.name === "admin.withdrawal.updated" ||
    event.name === "withdrawal.approved" ||
    event.name === "withdrawal.rejected" ||
    event.name === "payment.completed"
  );
}

export function shouldRefreshAdminUsers(event: SrtspEvent): boolean {
  return (
    event.name === "admin.user.updated" ||
    includesEvent(ADMIN_HUB_IDENTITY_EVENTS, event.name) ||
    event.name === SRTSP_DOMAIN_EVENTS.NOTIFICATION_CREATED
  );
}

export function shouldRefreshAdminFraud(event: SrtspEvent): boolean {
  return (
    event.name === "admin.fraud.updated" ||
    includesEvent(ADMIN_HUB_STREAMING_EVENTS, event.name) ||
    event.name === SRTSP_DOMAIN_EVENTS.ADMIN_SNAPSHOT_INVALIDATE
  );
}

export function shouldRefreshAdminAnalytics(event: SrtspEvent): boolean {
  return (
    includesEvent(ADMIN_HUB_ANALYTICS_EVENTS, event.name) ||
    includesEvent(ADMIN_HUB_STREAMING_EVENTS, event.name) ||
    event.name === "admin.analytics.refreshed" ||
    event.name === SRTSP_DOMAIN_EVENTS.ADMIN_SNAPSHOT_INVALIDATE
  );
}

/** Filtre unifié Super Admin — supervision globale. */
export function shouldRefreshAdminHub(event: SrtspEvent): boolean {
  return shouldRefreshAdminSnapshot(event);
}

export function getAdminHubInvalidateEvents(): AdminHubSrtspEvent[] {
  return [...ADMIN_HUB_SRTSP_EVENTS];
}

export function isAdminHubIgnoredEvent(eventName: string): boolean {
  return includesEvent(ADMIN_HUB_IGNORED_EVENTS, eventName);
}

export function isAdminHubPreparedEvent(eventName: string): boolean {
  return includesEvent(ADMIN_HUB_PREPARED_EVENTS, eventName);
}
