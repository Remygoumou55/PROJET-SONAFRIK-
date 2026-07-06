import { SRTSP_DOMAIN_EVENTS } from "../registry/domain-events";
import type { SrtspEvent } from "../types";

/** Effet attendu — Artist Profile Hub Phase 3.7. */
export interface ArtistProfileHubEventEffect {
  event: string;
  source: string;
  expectedUiEffect: string;
  listens: boolean;
}

/** Alias forward-compat — registry inchangé. */
export const ARTIST_PROFILE_HUB_EXTENDED_EVENTS = [
  "artist.profile.updated",
  "artist.avatar.updated",
  "artist.cover.updated",
  "artist.social.updated",
  "artist.verification.updated",
  "artist.badges.updated",
  "artist.level.updated",
  "artist.statistics.updated",
  "profile.invalidate",
  "identity.profile.updated",
  "identity.invalidate",
] as const;

/** Événements actifs — Hub identitaire Artiste. */
export const ARTIST_PROFILE_HUB_SRTSP_EVENTS = [
  SRTSP_DOMAIN_EVENTS.ARTIST_UPDATED,
  ...ARTIST_PROFILE_HUB_EXTENDED_EVENTS,
] as const;

export type ArtistProfileHubSrtspEvent = (typeof ARTIST_PROFILE_HUB_SRTSP_EVENTS)[number];

/** Préparation — documenté, pas de consommation active Phase 3.7. */
export const ARTIST_PROFILE_HUB_PREPARED_EVENTS = [
  SRTSP_DOMAIN_EVENTS.WALLET_UPDATED,
  SRTSP_DOMAIN_EVENTS.ANALYTICS_INVALIDATE,
  SRTSP_DOMAIN_EVENTS.ROYALTY_GENERATED,
  "royalty.adjusted",
  "analytics.updated",
  "stream.play.recorded",
] as const;

/** Événements ignorés (bruit publication / wizard). */
export const ARTIST_PROFILE_HUB_IGNORED_EVENTS = [
  SRTSP_DOMAIN_EVENTS.PUBLICATION_DRAFT_CREATED,
  SRTSP_DOMAIN_EVENTS.PUBLICATION_DRAFT_UPDATED,
  SRTSP_DOMAIN_EVENTS.PUBLICATION_AUDIO_UPLOADED,
  SRTSP_DOMAIN_EVENTS.PUBLICATION_COVER_UPLOADED,
  SRTSP_DOMAIN_EVENTS.PUBLICATION_METADATA_COMPLETED,
] as const;

export const ARTIST_PROFILE_HUB_EVENT_EFFECTS: ArtistProfileHubEventEffect[] = [
  {
    event: SRTSP_DOMAIN_EVENTS.ARTIST_UPDATED,
    source: "creator",
    expectedUiEffect: "Hero / profil / identité synchronisés",
    listens: true,
  },
  {
    event: "artist.avatar.updated",
    source: "creator",
    expectedUiEffect: "Avatar mis à jour sans F5",
    listens: true,
  },
  {
    event: "artist.verification.updated",
    source: "creator",
    expectedUiEffect: "Badge vérification actualisé",
    listens: true,
  },
  {
    event: "profile.invalidate",
    source: "identity",
    expectedUiEffect: "Refresh ciblé cache profil",
    listens: true,
  },
  {
    event: SRTSP_DOMAIN_EVENTS.WALLET_UPDATED,
    source: "wallet",
    expectedUiEffect: "Préparation — non consommé Phase 3.7",
    listens: false,
  },
  {
    event: SRTSP_DOMAIN_EVENTS.PUBLICATION_AUDIO_UPLOADED,
    source: "publication",
    expectedUiEffect: "Ignoré — upload wizard",
    listens: false,
  },
];

export interface ArtistProfileHubConsumerScope {
  creatorId: string;
  userId?: string;
}

function payloadCreatorId(event: SrtspEvent): string | undefined {
  const p = event.payload;
  if (typeof p.creatorId === "string") return p.creatorId;
  return undefined;
}

function payloadUserId(event: SrtspEvent): string | undefined {
  const p = event.payload;
  if (typeof p.userId === "string") return p.userId;
  return undefined;
}

/** Filtre consommateur Artist Profile Hub — scope créateur / utilisateur. */
export function shouldRefreshArtistProfileHub(
  event: SrtspEvent,
  scope: ArtistProfileHubConsumerScope,
): boolean {
  if (!(ARTIST_PROFILE_HUB_SRTSP_EVENTS as readonly string[]).includes(event.name)) {
    return false;
  }

  const eventCreator = payloadCreatorId(event);
  if (eventCreator && eventCreator !== scope.creatorId) return false;

  const eventUser = payloadUserId(event);
  if (eventUser && scope.userId && eventUser !== scope.userId) return false;

  return true;
}

export function getArtistProfileHubInvalidateEvents(): ArtistProfileHubSrtspEvent[] {
  return [...ARTIST_PROFILE_HUB_SRTSP_EVENTS];
}

export function isArtistProfileHubIgnoredEvent(eventName: string): boolean {
  return (ARTIST_PROFILE_HUB_IGNORED_EVENTS as readonly string[]).includes(eventName);
}

export function isArtistProfileHubPreparedEvent(eventName: string): boolean {
  return (ARTIST_PROFILE_HUB_PREPARED_EVENTS as readonly string[]).includes(eventName);
}
