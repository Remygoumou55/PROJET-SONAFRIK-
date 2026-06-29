import { ldseEventBus } from "../event-bus";
import { invalidateLdseQuery } from "../useLdseQuery";
import { LISTENER_LDSE_EVENTS, LISTENER_LDSE_KEYS } from "./listener-ldse-config";

export function publishListenerLdseEvent(
  type: (typeof LISTENER_LDSE_EVENTS)[keyof typeof LISTENER_LDSE_EVENTS],
  userId: string,
  payload?: Record<string, unknown>,
): void {
  ldseEventBus.publish(type, { userId, ...payload });
  invalidateLdseQuery(LISTENER_LDSE_KEYS.sidebar(userId));
  invalidateLdseQuery(LISTENER_LDSE_KEYS.libraryCounts(userId));
  invalidateLdseQuery(LISTENER_LDSE_KEYS.libraryFull(userId));
  invalidateLdseQuery(LISTENER_LDSE_KEYS.playlists(userId));
}
