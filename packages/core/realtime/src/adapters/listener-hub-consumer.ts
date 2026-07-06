import { SRTSP_DOMAIN_EVENTS } from "../registry/domain-events";
import type { SrtspEvent } from "../types";

/** Effet attendu — Workspace Auditeur Hub Phase 3.8. */
export interface ListenerHubEventEffect {
  event: string;
  source: string;
  expectedUiEffect: string;
  listens: boolean;
}

/** Catalogue public — accueil · recherche · bibliothèque · profil artiste. */
export const LISTENER_HUB_CATALOG_EVENTS = [
  SRTSP_DOMAIN_EVENTS.TRACK_PUBLISHED,
  SRTSP_DOMAIN_EVENTS.TRACK_UPDATED,
  SRTSP_DOMAIN_EVENTS.TRACK_DELETED,
  SRTSP_DOMAIN_EVENTS.TRACK_CREATED,
  SRTSP_DOMAIN_EVENTS.ALBUM_PUBLISHED,
  SRTSP_DOMAIN_EVENTS.PUBLICATION_APPROVED,
  SRTSP_DOMAIN_EVENTS.CATALOG_INVALIDATE,
] as const;

/** Bibliothèque auditeur — favoris · playlists. */
export const LISTENER_HUB_LIBRARY_EVENTS = [
  SRTSP_DOMAIN_EVENTS.FAVORITE_TOGGLED,
  SRTSP_DOMAIN_EVENTS.PLAYLIST_UPDATED,
] as const;

/** Identité publique artiste — alias forward-compat (registry inchangé). */
export const LISTENER_HUB_ARTIST_IDENTITY_EVENTS = [
  SRTSP_DOMAIN_EVENTS.ARTIST_UPDATED,
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

/** Notifications auditeur. */
export const LISTENER_HUB_NOTIFICATION_EVENTS = [
  SRTSP_DOMAIN_EVENTS.NOTIFICATION_CREATED,
] as const;

/** Social — followers profil public. */
export const LISTENER_HUB_SOCIAL_EVENTS = [SRTSP_DOMAIN_EVENTS.FOLLOW_TOGGLED] as const;

/** Événements actifs — Workspace Auditeur Hub. */
export const LISTENER_HUB_SRTSP_EVENTS = [
  ...LISTENER_HUB_CATALOG_EVENTS,
  ...LISTENER_HUB_LIBRARY_EVENTS,
  ...LISTENER_HUB_ARTIST_IDENTITY_EVENTS,
  ...LISTENER_HUB_NOTIFICATION_EVENTS,
  ...LISTENER_HUB_SOCIAL_EVENTS,
] as const;

export type ListenerHubSrtspEvent = (typeof LISTENER_HUB_SRTSP_EVENTS)[number];

/** Préparation — documenté, pas de consommation active Phase 3.8. */
export const LISTENER_HUB_PREPARED_EVENTS = [
  SRTSP_DOMAIN_EVENTS.STREAMING_STARTED,
  SRTSP_DOMAIN_EVENTS.STREAMING_PAUSED,
  SRTSP_DOMAIN_EVENTS.STREAMING_ENDED,
  "stream.play.recorded",
  SRTSP_DOMAIN_EVENTS.ROYALTY_GENERATED,
] as const;

/** Événements ignorés (bruit publication / wizard). */
export const LISTENER_HUB_IGNORED_EVENTS = [
  SRTSP_DOMAIN_EVENTS.PUBLICATION_DRAFT_CREATED,
  SRTSP_DOMAIN_EVENTS.PUBLICATION_DRAFT_UPDATED,
  SRTSP_DOMAIN_EVENTS.PUBLICATION_AUDIO_UPLOADED,
  SRTSP_DOMAIN_EVENTS.PUBLICATION_COVER_UPLOADED,
  SRTSP_DOMAIN_EVENTS.PUBLICATION_METADATA_COMPLETED,
] as const;

export const LISTENER_HUB_EVENT_EFFECTS: ListenerHubEventEffect[] = [
  {
    event: SRTSP_DOMAIN_EVENTS.TRACK_PUBLISHED,
    source: "publication",
    expectedUiEffect: "Nouveau morceau visible accueil · recherche · bibliothèque",
    listens: true,
  },
  {
    event: SRTSP_DOMAIN_EVENTS.ARTIST_UPDATED,
    source: "creator",
    expectedUiEffect: "Profil public artiste synchronisé",
    listens: true,
  },
  {
    event: "artist.avatar.updated",
    source: "creator",
    expectedUiEffect: "Avatar artiste mis à jour sans F5",
    listens: true,
  },
  {
    event: SRTSP_DOMAIN_EVENTS.FAVORITE_TOGGLED,
    source: "listener",
    expectedUiEffect: "Bibliothèque + sidebar favoris",
    listens: true,
  },
  {
    event: SRTSP_DOMAIN_EVENTS.PLAYLIST_UPDATED,
    source: "listener",
    expectedUiEffect: "Playlists bibliothèque + sidebar",
    listens: true,
  },
  {
    event: SRTSP_DOMAIN_EVENTS.NOTIFICATION_CREATED,
    source: "notifications",
    expectedUiEffect: "Liste notifications + badge",
    listens: true,
  },
  {
    event: SRTSP_DOMAIN_EVENTS.FOLLOW_TOGGLED,
    source: "social",
    expectedUiEffect: "Followers profil public artiste",
    listens: true,
  },
  {
    event: SRTSP_DOMAIN_EVENTS.STREAMING_STARTED,
    source: "streaming",
    expectedUiEffect: "Préparation — historique récent (Session Engine LOCKED)",
    listens: false,
  },
  {
    event: SRTSP_DOMAIN_EVENTS.PUBLICATION_AUDIO_UPLOADED,
    source: "publication",
    expectedUiEffect: "Ignoré — upload wizard",
    listens: false,
  },
];

export interface ListenerHubConsumerScope {
  userId?: string;
  creatorId?: string;
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

function matchesCreatorScope(event: SrtspEvent, creatorId?: string): boolean {
  const eventCreator = payloadCreatorId(event);
  if (creatorId && eventCreator && eventCreator !== creatorId) return false;
  return true;
}

function matchesUserScope(event: SrtspEvent, userId?: string): boolean {
  const eventUser = payloadUserId(event);
  if (userId && eventUser && eventUser !== userId) return false;
  return true;
}

/** Catalogue / discovery — scope créateur optionnel. */
export function shouldRefreshListenerCatalog(
  event: SrtspEvent,
  scope: ListenerHubConsumerScope = {},
): boolean {
  if (!(LISTENER_HUB_CATALOG_EVENTS as readonly string[]).includes(event.name)) {
    return false;
  }
  return matchesCreatorScope(event, scope.creatorId);
}

/** Bibliothèque — scope utilisateur obligatoire. */
export function shouldRefreshListenerLibrary(
  event: SrtspEvent,
  scope: ListenerHubConsumerScope,
): boolean {
  if (!(LISTENER_HUB_LIBRARY_EVENTS as readonly string[]).includes(event.name)) {
    return false;
  }
  if (!scope.userId) return false;
  return matchesUserScope(event, scope.userId);
}

/** Identité publique artiste — scope créateur obligatoire. */
export function shouldRefreshListenerArtistIdentity(
  event: SrtspEvent,
  scope: ListenerHubConsumerScope,
): boolean {
  if (!(LISTENER_HUB_ARTIST_IDENTITY_EVENTS as readonly string[]).includes(event.name)) {
    return false;
  }
  if (!scope.creatorId) return false;
  return matchesCreatorScope(event, scope.creatorId);
}

/** Notifications — scope utilisateur obligatoire. */
export function shouldRefreshListenerNotifications(
  event: SrtspEvent,
  scope: ListenerHubConsumerScope,
): boolean {
  if (!(LISTENER_HUB_NOTIFICATION_EVENTS as readonly string[]).includes(event.name)) {
    return false;
  }
  if (!scope.userId) return false;
  return matchesUserScope(event, scope.userId);
}

/** Social — scope créateur ou utilisateur. */
export function shouldRefreshListenerSocial(
  event: SrtspEvent,
  scope: ListenerHubConsumerScope,
): boolean {
  if (!(LISTENER_HUB_SOCIAL_EVENTS as readonly string[]).includes(event.name)) {
    return false;
  }
  if (scope.creatorId && !matchesCreatorScope(event, scope.creatorId)) return false;
  if (scope.userId && !matchesUserScope(event, scope.userId)) return false;
  return true;
}

/** Accueil / discovery — catalogue + identité artiste (sans scope strict). */
export function shouldRefreshListenerDiscovery(event: SrtspEvent): boolean {
  return (
    shouldRefreshListenerCatalog(event) ||
    (LISTENER_HUB_ARTIST_IDENTITY_EVENTS as readonly string[]).includes(event.name)
  );
}

/** Filtre unifié — union des sous-filtres selon scope fourni. */
export function shouldRefreshListenerHub(
  event: SrtspEvent,
  scope: ListenerHubConsumerScope,
): boolean {
  if (!(LISTENER_HUB_SRTSP_EVENTS as readonly string[]).includes(event.name)) {
    return false;
  }

  if (shouldRefreshListenerCatalog(event, scope)) return true;
  if (scope.userId && shouldRefreshListenerLibrary(event, scope)) return true;
  if (scope.creatorId && shouldRefreshListenerArtistIdentity(event, scope)) return true;
  if (scope.userId && shouldRefreshListenerNotifications(event, scope)) return true;
  if (shouldRefreshListenerSocial(event, scope)) return true;

  return false;
}

export function getListenerHubInvalidateEvents(): ListenerHubSrtspEvent[] {
  return [...LISTENER_HUB_SRTSP_EVENTS];
}

export function isListenerHubIgnoredEvent(eventName: string): boolean {
  return (LISTENER_HUB_IGNORED_EVENTS as readonly string[]).includes(eventName);
}

export function isListenerHubPreparedEvent(eventName: string): boolean {
  return (LISTENER_HUB_PREPARED_EVENTS as readonly string[]).includes(eventName);
}
