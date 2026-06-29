import { ldseEventBus } from "../event-bus";
import { invalidateLdseQuery } from "../useLdseQuery";
import { SOCIAL_LDSE_EVENTS, SOCIAL_LDSE_KEYS } from "./social-ldse-config";

export function publishSocialLdseEvent(
  type: (typeof SOCIAL_LDSE_EVENTS)[keyof typeof SOCIAL_LDSE_EVENTS],
  payload: Record<string, unknown>,
): void {
  ldseEventBus.publish(type, payload);
  if (typeof payload.trackId === "string") {
    invalidateLdseQuery(SOCIAL_LDSE_KEYS.like(payload.trackId));
  }
  if (typeof payload.entityType === "string" && typeof payload.entityId === "string") {
    invalidateLdseQuery(SOCIAL_LDSE_KEYS.follow(payload.entityType, payload.entityId));
  }
}
