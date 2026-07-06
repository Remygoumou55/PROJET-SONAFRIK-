import { ldseEventBus } from "../event-bus";
import { invalidateLdseQuery } from "../useLdseQuery";
import { IDENTITY_LDSE_EVENTS, IDENTITY_LDSE_KEYS } from "./identity-ldse-config";

export function publishIdentityLdseEvent(
  type: (typeof IDENTITY_LDSE_EVENTS)[keyof typeof IDENTITY_LDSE_EVENTS],
  userId: string,
  payload?: Record<string, unknown>,
): void {
  ldseEventBus.publish(type, { userId, ...payload });
  // Émet invalidate uniquement si ce n'est pas déjà l'événement courant (évite double-trigger).
  if (type !== IDENTITY_LDSE_EVENTS.invalidate) {
    ldseEventBus.publish(IDENTITY_LDSE_EVENTS.invalidate, { userId, ...payload });
  }
  invalidateLdseQuery(IDENTITY_LDSE_KEYS.profileSummary(userId));
  // sessions intentionnellement non invalidées — clé stable par design (auth tokens).
}
