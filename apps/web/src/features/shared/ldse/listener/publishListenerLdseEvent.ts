import { ldseEventBus } from "../event-bus";
import { invalidateLdseQuery } from "../useLdseQuery";
import { LISTENER_LDSE_EVENTS, LISTENER_LDSE_KEYS } from "./listener-ldse-config";

/** Résolution des clés à invalider par type d'événement.
 * queue jamais invalidé — clé orpheline (scaffold v1, pas encore branché). */
const EVENT_KEY_MAP: Partial<
  Record<
    (typeof LISTENER_LDSE_EVENTS)[keyof typeof LISTENER_LDSE_EVENTS],
    (userId: string) => string[]
  >
> = {
  [LISTENER_LDSE_EVENTS.favoriteToggled]: (userId) => [
    LISTENER_LDSE_KEYS.sidebar(userId),
    LISTENER_LDSE_KEYS.libraryCounts(userId),
    LISTENER_LDSE_KEYS.libraryFull(userId),
  ],
  [LISTENER_LDSE_EVENTS.playlistUpdated]: (userId) => [
    LISTENER_LDSE_KEYS.playlists(userId),
  ],
  [LISTENER_LDSE_EVENTS.libraryInvalidate]: (userId) => [
    LISTENER_LDSE_KEYS.libraryCounts(userId),
    LISTENER_LDSE_KEYS.libraryFull(userId),
  ],
  [LISTENER_LDSE_EVENTS.sidebarInvalidate]: (userId) => [
    LISTENER_LDSE_KEYS.sidebar(userId),
  ],
  // playbackStarted : broadcast only — aucune clé cache à invalider
};

const ALL_LISTENER_KEYS = (userId: string): string[] => [
  LISTENER_LDSE_KEYS.sidebar(userId),
  LISTENER_LDSE_KEYS.libraryCounts(userId),
  LISTENER_LDSE_KEYS.libraryFull(userId),
  LISTENER_LDSE_KEYS.playlists(userId),
];

export function publishListenerLdseEvent(
  type: (typeof LISTENER_LDSE_EVENTS)[keyof typeof LISTENER_LDSE_EVENTS],
  userId: string,
  payload?: Record<string, unknown>,
): void {
  ldseEventBus.publish(type, { userId, ...payload });
  const resolveKeys = EVENT_KEY_MAP[type] ?? ALL_LISTENER_KEYS;
  for (const key of resolveKeys(userId)) {
    invalidateLdseQuery(key);
  }
}
